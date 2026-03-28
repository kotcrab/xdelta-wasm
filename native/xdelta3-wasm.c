#include "xdelta3.h"
#include <emscripten.h>
#include <inttypes.h>
#include <stdio.h>
#include <sys/stat.h>

// Cache

// #define CACHE_STATS

#define CACHE_NOT_FOUND ((usize_t) - 1)

typedef struct {
  uint32_t valid;
  xoff_t key;
  usize_t size; // actually used size, not necessarily actual allocated size of data
  uint8_t* data;
  uint64_t lastUsed;
} CacheEntry;

typedef struct {
  CacheEntry* entries;
  usize_t entriesSize;
  uint64_t step;
#ifdef CACHE_STATS
  uint64_t statsHits;
  uint64_t statsMisses;
  uint32_t statsLogStepInterval;
  uint64_t statsLogAtStep;
#endif
} Cache;

void cache_init(Cache* cache, usize_t entriesSize, usize_t dataSize) {
  cache->entries = malloc(sizeof(CacheEntry) * entriesSize);
  cache->entriesSize = entriesSize;
  cache->step = 0;
#ifdef CACHE_STATS
  cache->statsHits = 0;
  cache->statsMisses = 0;
  cache->statsLogStepInterval = 1000;
  cache->statsLogAtStep = cache->statsLogStepInterval;
#endif

  for (usize_t i = 0; i < entriesSize; i++) {
    cache->entries[i].valid = 0;
    cache->entries[i].key = 0;
    cache->entries[i].size = 0;
    cache->entries[i].data = malloc(dataSize);
    cache->entries[i].lastUsed = 0;
  }
}

void cache_free(Cache* cache) {
  for (usize_t i = 0; i < cache->entriesSize; i++) {
    free(cache->entries[i].data);
  }
  free(cache->entries);
}

#ifdef CACHE_STATS
void cache_stats_log(Cache* cache) {
  if (cache->step >= cache->statsLogAtStep) {
    printf("Cache: step: %" PRIu64 ", hits: %" PRIu64 ", misses: %" PRIu64 "\n", cache->step, cache->statsHits,
           cache->statsMisses);
    cache->statsLogAtStep += cache->statsLogStepInterval;
  }
}
#endif

usize_t cache_find(Cache* cache, xoff_t key, usize_t size) {
  for (usize_t i = 0; i < cache->entriesSize; i++) {
    if (cache->entries[i].valid && cache->entries[i].key == key && cache->entries[i].size == size) {
      return i;
    }
  }
  return CACHE_NOT_FOUND;
}

usize_t cache_find_lru(Cache* cache) {
  uint64_t minLastUsed = (uint64_t)-1;
  usize_t idx = 0;

  for (usize_t i = 0; i < cache->entriesSize; i++) {
    if (!cache->entries[i].valid) {
      return i;
    }
    if (cache->entries[i].lastUsed < minLastUsed) {
      minLastUsed = cache->entries[i].lastUsed;
      idx = i;
    }
  }
  return idx;
}

CacheEntry* cache_get(Cache* cache, xoff_t key, usize_t size) {
  usize_t idx = cache_find(cache, key, size);
  if (idx != CACHE_NOT_FOUND) {
    cache->step++;
    cache->entries[idx].lastUsed = cache->step;
#ifdef CACHE_STATS
    cache->statsHits++;
    cache_stats_log(cache);
#endif
    return &cache->entries[idx];
  } else {
#ifdef CACHE_STATS
    cache->statsMisses++;
    cache_stats_log(cache);
#endif
    return NULL;
  }
}

CacheEntry* cache_put_start(Cache* cache, xoff_t key) {
  usize_t idx = cache_find_lru(cache);
  cache->step++;
  cache->entries[idx].valid = 1;
  cache->entries[idx].key = key;
  cache->entries[idx].lastUsed = cache->step;
  return &cache->entries[idx];
}

void cache_put_finish(CacheEntry* entry, usize_t size) {
  entry->size = size;
}

// Main

usize_t readSource(void* buffer, xoff_t offset, usize_t size) {
  return EM_ASM_INT({ return Module.readSource($0, $1, $2); }, buffer, offset, size);
}

void readSourceCached(Cache* cache, xd3_source* source) {
  xoff_t offset = source->blksize * source->getblkno;
  usize_t size = source->blksize;

  CacheEntry* entry = cache_get(cache, offset, size);
  if (!entry) {
    entry = cache_put_start(cache, offset);
    usize_t actualSize = readSource(entry->data, offset, size);
    cache_put_finish(entry, actualSize);
    // printf("Cache miss: %" PRIu64 "\n", offset);
  } else {
    // printf("Cache hit: %" PRIu64 "\n", offset);
  }

  source->curblk = entry->data;
  source->onblk = entry->size;
  source->curblkno = source->getblkno;
}

usize_t readPatch(void* buffer, xoff_t offset, usize_t size) {
  return EM_ASM_INT({ return Module.readPatch($0, $1, $2); }, buffer, offset, size);
}

void writeOutput(void* buffer, usize_t size) {
  // printf("Write out: %u\n", size);
  EM_ASM({Module.outputFile($0, $1)}, buffer, size);
}

void reportError(const char* buffer) {
  EM_ASM({Module.reportError($0)}, buffer);
}

int processData(int bufferSize, int cacheSize, int disableChecksum) {
  if (bufferSize < XD3_ALLOCSIZE) {
    bufferSize = XD3_ALLOCSIZE;
  }

  int ret;
  xd3_config config;
  xd3_stream stream;
  xd3_source source;

  if (disableChecksum) {
    xd3_init_config(&config, XD3_ADLER32 | XD3_ADLER32_NOVER);
  } else {
    xd3_init_config(&config, XD3_ADLER32);
  }

  memset(&stream, 0, sizeof(stream));
  memset(&source, 0, sizeof(source));
  xd3_config_stream(&stream, &config);

  // Init input
  Cache sourceCache;
  cache_init(&sourceCache, cacheSize, bufferSize);
  source.blksize = bufferSize;
  source.getblkno = 0;
  readSourceCached(&sourceCache, &source);

  xd3_set_source(&stream, &source);

  void* patchBuffer = malloc(bufferSize);

  // Main loop
  xoff_t patchPos = 0;
  usize_t patchRead;
  do {
    patchRead = readPatch(patchBuffer, patchPos, bufferSize);
    patchPos += patchRead;
    if (patchRead < bufferSize) {
      xd3_set_flags(&stream, XD3_FLUSH | stream.flags);
    }
    xd3_avail_input(&stream, patchBuffer, patchRead);

  process:
    ret = xd3_decode_input(&stream);

    switch (ret) {
    case XD3_INPUT: {
      continue;
    }

    case XD3_OUTPUT: {
      writeOutput(stream.next_out, stream.avail_out);
      xd3_consume_output(&stream);
      goto process;
    }

    case XD3_GETSRCBLK: {
      readSourceCached(&sourceCache, &source);
      goto process;
    }

    case XD3_GOTHEADER: {
      goto process;
    }

    case XD3_WINSTART: {
      goto process;
    }

    case XD3_WINFINISH: {
      goto process;
    }

    default: {
      reportError(stream.msg);
      fprintf(stderr, "Error: Xdelta message: %s\n", stream.msg);

      cache_free(&sourceCache);
      free(patchBuffer);
      xd3_close_stream(&stream);
      xd3_free_stream(&stream);
      return ret;
    }
    }

  } while (patchRead == bufferSize);

  cache_free(&sourceCache);
  free(patchBuffer);
  xd3_close_stream(&stream);
  xd3_free_stream(&stream);
  return 0;
};

int main(int argc, char* argv[]) {
  int bufferSize = atoi(argv[1]);
  int cacheSize = atoi(argv[2]);
  int disableChecksum = strcmp(argv[3], "true") == 0;
  printf("In main(), bufferSize=%d, cacheSize=%d, disableChecksum=%d\n", bufferSize, cacheSize, disableChecksum);
  int ret = processData(bufferSize, cacheSize, disableChecksum);
  if (ret) {
    fprintf(stderr, "Decode error: %d\n", ret);
    return ret;
  }
  printf("Decode OK!\n");
  return 0;
}

#include "xdelta3.h"
#include <emscripten.h>
#include <stdio.h>
#include <sys/stat.h>

size_t readSource(void* buffer, size_t offset, size_t size) {
  return EM_ASM_INT({ return Module.readSource($0, $1, $2); }, buffer, offset, size);
}

size_t readPatch(void* buffer, size_t offset, size_t size) {
  return EM_ASM_INT({ return Module.readPatch($0, $1, $2); }, buffer, offset, size);
}

void writeOutput(void* buffer, size_t size) {
  EM_ASM({Module.outputFile($0, $1)}, buffer, size);
}

void reportError(const char* buffer) {
  EM_ASM({Module.reportError($0)}, buffer);
}

int processData(int bufferSize) {
  if (bufferSize < XD3_ALLOCSIZE) {
    bufferSize = XD3_ALLOCSIZE;
  }

  int ret;
  xd3_config config;
  xd3_stream stream;
  xd3_source source;

  xd3_init_config(&config, XD3_ADLER32);
  memset(&stream, 0, sizeof(stream));
  memset(&source, 0, sizeof(source));
  xd3_config_stream(&stream, &config);

  // Init input
  source.blksize = bufferSize;
  source.curblk = malloc(source.blksize);
  source.onblk = readSource((void*)source.curblk, 0, source.blksize);
  source.curblkno = 0;
  xd3_set_source(&stream, &source);

  void* inputBuffer = malloc(bufferSize);

  // Main loop
  size_t patchPos = 0;
  size_t patchRead;
  do {
    patchRead = readPatch(inputBuffer, patchPos, bufferSize);
    patchPos += patchRead;
    if (patchRead < bufferSize) {
      xd3_set_flags(&stream, XD3_FLUSH | stream.flags);
    }
    xd3_avail_input(&stream, inputBuffer, patchRead);

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
      source.onblk = readSource((void*)source.curblk, source.blksize * source.getblkno, source.blksize);
      source.curblkno = source.getblkno;
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
      return ret;
    }
    }

  } while (patchRead == bufferSize);

  free(inputBuffer);
  free((void*)source.curblk);
  xd3_close_stream(&stream);
  xd3_free_stream(&stream);

  return 0;
};

int main(int argc, char* argv[]) {
  int bufferSize = atoi(argv[1]);
  printf("In main(), bufferSize=%d\n", bufferSize);
  int ret = processData(bufferSize);
  if (ret) {
    fprintf(stderr, "Decode error: %d\n", ret);
    return ret;
  }
  printf("Decode OK!\n");
  return 0;
}

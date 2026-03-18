import createXdelta3Module from './xdelta3.js'
import {LRUCache} from './lru-cache.js'

// 4 MiB chunks reduce overhead from many small Blob slices, FileReaderSync reads,
// HEAP8 copies, and JS↔WASM boundary crossings, which is critical for performance on mobile.
const bufferSize = 4 * 1024 * 1024

const state = {
  sourceFile: undefined,
  sourceCache: undefined,
  patchFile: undefined,
}

const lruCacheOptions = {
  max: 64
}

let module = undefined
let errorMessage = undefined

// Returns the current underlying ArrayBuffer of the WASM heap.
// wasmMemory.buffer is always up-to-date even after ALLOW_MEMORY_GROWTH resizes.
// Falls back to module.HEAP8.buffer for compatibility with older builds that do
// not export wasmMemory.
function getMemoryBuffer() {
  return module.wasmMemory ? module.wasmMemory.buffer : module.HEAP8.buffer
}

// eslint-disable-next-line no-undef
const reader = new FileReaderSync()

function readSource(buffer, offset, size) {
  return readFile(state.sourceFile, buffer, offset, size, state.sourceCache)
}

function readPatch(buffer, offset, size) {
  return readFile(state.patchFile, buffer, offset, size, null)
}

function readFile(file, buffer, offset, size, cache) {
  if (cache && size === bufferSize) {
    const cached = cache.get(offset)
    if (cached) {
      // Use getMemoryBuffer(): always returns the live buffer, even after ALLOW_MEMORY_GROWTH resizes
      new Int8Array(getMemoryBuffer()).set(cached.data, buffer)
      return cached.read
    }
  }
  const end = Math.min(file.size, offset + size)
  const blob = file.slice(offset, end)
  const read = end - offset
  // console.log("read: " + file.name + " offset: " + offset + " size: " + size);
  const data = reader.readAsArrayBuffer(blob)
  const dataArray = new Uint8Array(data)
  if (cache && size === bufferSize) {
    cache.set(offset, {read: read, data: dataArray})
  }
  // Use getMemoryBuffer(): always returns the live buffer, even after ALLOW_MEMORY_GROWTH resizes
  new Int8Array(getMemoryBuffer()).set(dataArray, buffer)
  return read
}

function outputFile(buffer, size) {
  const dataView = new Uint8Array(getMemoryBuffer(), buffer, size)
  const data = new Uint8Array(dataView)
  postMessage({final: false, bytes: data})
}

function reportError(buffer) {
  errorMessage = module.UTF8ToString(buffer)
}

onmessage = async function (event) {
  if (!event.data) {
    return
  }
  const {command, sourceFile, patchFile, disableChecksum} = event.data
  if (command !== "start") {
    return
  }

  state.sourceFile = sourceFile
  state.sourceCache = new LRUCache(lruCacheOptions);
  state.patchFile = patchFile
  try {
    console.log("Loading module")
    module = await createXdelta3Module()
    module.readPatch = readPatch
    module.readSource = readSource
    module.outputFile = outputFile
    module.reportError = reportError
    console.log("Starting module")
    const result = module.callMain([bufferSize.toString(), disableChecksum.toString()])
    if (result !== 0) {
      postMessage({final: true, error: true, errorCode: result, errorMessage: errorMessage})
    } else {
      postMessage({final: true, error: false})
    }
  } catch (e) {
    console.log(e)
    postMessage({final: true, error: true, errorMessage: errorMessage, exceptionMessage: e?.toString()})
  }
}

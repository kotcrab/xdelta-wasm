import createXdelta3Module from './xdelta3.js'
import {LRUCache} from './lru-cache.js'

const bufferSize = 64 * 1024

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
      module.HEAP8.set(cached.data, buffer)
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
  module.HEAP8.set(dataArray, buffer)
  return read
}

function outputFile(buffer, size) {
  const dataView = new Uint8Array(module.HEAP8.buffer, buffer, size)
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
  const {command, sourceFile, patchFile} = event.data
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
    const result = module.callMain([bufferSize.toString()])
    if (result !== 0) {
      postMessage({final: true, error: true, errorCode: result, errorMessage: errorMessage})
    } else {
      postMessage({final: true, error: false})
    }
  } catch (e) {
    console.log(e)
    postMessage({final: true, error: true, errorMessage: errorMessage})
  }
}

import createXdelta3Module from './xdelta3.js'

const bufferSize = 4 * 1024 * 1024
const cacheSize = 32

let module = undefined
const state = {
  sourceFile: undefined,
  patchFile: undefined,
  errorMessage: undefined,
}

// eslint-disable-next-line no-undef
const reader = new FileReaderSync()

function readSource(buffer, offset, size) {
  return readFile(state.sourceFile, buffer, Number(offset), size)
}

function readPatch(buffer, offset, size) {
  return readFile(state.patchFile, buffer, Number(offset), size)
}

function readFile(file, buffer, offset, size) {
  const end = Math.min(file.size, offset + size)
  const blob = file.slice(offset, end)
  const read = end - offset
  const data = reader.readAsArrayBuffer(blob)
  module.HEAP8.set(new Uint8Array(data), buffer)
  return read
}

function outputFile(buffer, size) {
  const dataView = new Uint8Array(module.HEAP8.buffer, buffer, size)
  const data = new Uint8Array(dataView)
  postMessage({final: false, bytes: data})
}

function reportError(buffer) {
  state.errorMessage = module.UTF8ToString(buffer)
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
  state.patchFile = patchFile
  try {
    console.log("Loading module")
    module = await createXdelta3Module()
    module.readPatch = readPatch
    module.readSource = readSource
    module.outputFile = outputFile
    module.reportError = reportError
    console.log("Starting module")
    const result = module.callMain([bufferSize.toString(), cacheSize.toString(), disableChecksum.toString()])
    if (result !== 0) {
      postMessage({final: true, error: true, errorCode: result, errorMessage: state.errorMessage})
    } else {
      postMessage({final: true, error: false})
    }
  } catch (e) {
    console.error(e)
    postMessage({final: true, error: true, errorMessage: state.errorMessage})
  }
  module = undefined
}

// eslint-disable-next-line no-restricted-globals
self.importScripts("./xdelta3.js")

const state = {
  sourceFile: undefined,
  patchFile: undefined,
}

let module = undefined
let errorMessage = undefined

// eslint-disable-next-line no-undef,no-unused-vars
const reader = new FileReaderSync()

// eslint-disable-next-line no-unused-vars
function readSource(buffer, offset, size) {
  return readFile(state.sourceFile, buffer, offset, size)
}

// eslint-disable-next-line no-unused-vars
function readPatch(buffer, offset, size) {
  return readFile(state.patchFile, buffer, offset, size)
}

function readFile(file, buffer, offset, size) {
  const end = Math.min(file.size, offset + size)
  const blob = file.slice(offset, end)
  const read = end - offset
  const data = reader.readAsArrayBuffer(blob)
  module.HEAP8.set(new Uint8Array(data), buffer)
  return read
}

// eslint-disable-next-line no-unused-vars
function outputFile(buffer, size) {
  const dataView = new Uint8Array(module.HEAP8.buffer, buffer, size)
  const data = new Uint8Array(dataView)
  postMessage({final: false, bytes: data})
}

// eslint-disable-next-line no-unused-vars
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
  state.patchFile = patchFile
  try {
    console.log("Loading module")
    // eslint-disable-next-line no-undef
    module = await createXdelta3Module()
    console.log("Starting module")
    const result = module.callMain([])
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

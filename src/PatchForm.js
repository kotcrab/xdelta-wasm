import React, {useState} from "react"
import {Box, Button, Flex, FormControl, FormLabel, Heading} from "@chakra-ui/react"
import ModalForm from "./ModalForm"
import FilePicker from "./FilePicker"
import ErrorMessage from "./ErrorMessage"
import streamSaver from 'streamsaver'
import * as ponyfill from 'web-streams-polyfill/ponyfill'

export default function PatchForm() {
  const [sourceFile, setSourceFile] = useState(null)
  const [patchFile, setPatchFile] = useState(null)
  const [sourceInvalid, setSourceInvalid] = useState(false)
  const [patchInvalid, setPatchInvalid] = useState(false)
  const [running, setRunning] = useState(false)
  const [errorMessage, setErrorMessage] = useState(null)
  const [extraErrorMessage, setExtraErrorMessage] = useState(null)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSourceInvalid(!sourceFile)
    setPatchInvalid(!patchFile)
    if (!sourceFile || !patchFile) {
      return
    }
    setRunning(true)
    setErrorMessage(null)
    setExtraErrorMessage(null)
    const worker = new Worker('./xdelta3.worker.js')
    window.xdelta3Worker = worker

    streamSaver.WritableStream = ponyfill.WritableStream
    streamSaver.mitm = 'mitm.html'
    let fileStream = null
    let writer = null

    const lastDot = sourceFile.name.lastIndexOf(".")
    let patchedName;
    if (lastDot === -1) {
      patchedName = `${sourceFile.name}-patched`
    } else {
      patchedName = `${sourceFile.name.substring(0, lastDot)}-patched.${sourceFile.name.substring(lastDot + 1)}`
    }

    worker.onmessage = function (e) {
      if (!e.data) {
        return
      }
      const {final} = e.data
      if (!final) {
        if (!fileStream && !writer) {
          fileStream = streamSaver.createWriteStream(patchedName)
          writer = fileStream.getWriter()
        }
        writer.write(e.data.bytes)
        return
      }
      console.log("Got final worker command")
      if (e.data.error) {
        setErrorMessage("Error occurred while patching")
        if (e.data.errorMessage) {
          setExtraErrorMessage(`Details: ${e.data.errorMessage} (code ${e.data.errorCode || "unknown"})`)
        }
        if (fileStream) {
          fileStream.abort()
        }
        if (writer) {
          writer.abort()
        }
      } else {
        writer.close()
      }
      setRunning(false)
    }
    await worker.postMessage({command: "start", sourceFile: sourceFile, patchFile: patchFile})
  }

  return (
    <ModalForm>
      <Flex width="full" align="center" justifyContent="center">
        <Box p={8} maxWidth="500px" borderWidth={1} borderRadius={8} boxShadow="lg">
          <Box textAlign="center">
            <Heading>Xdelta patcher</Heading>
          </Box>
          <Box my={4} textAlign="left">
            <form onSubmit={handleSubmit}>
              {errorMessage && <ErrorMessage message={errorMessage} extraMessage={extraErrorMessage}/>}
              <FormControl isRequired isInvalid={sourceInvalid}>
                <FormLabel>Source file</FormLabel>
                <FilePicker onChange={file => setSourceFile(file)} isReadOnly={running}/>
              </FormControl>
              <FormControl isRequired mt={6} isInvalid={patchInvalid}>
                <FormLabel>Patch file</FormLabel>
                <FilePicker onChange={file => setPatchFile(file)} isReadOnly={running}/>
              </FormControl>
              <Button type="submit" width="full" colorScheme='blue' mt={6} isLoading={running}>
                Apply Patch
              </Button>
            </form>
          </Box>
        </Box>
      </Flex>
    </ModalForm>
  )
}

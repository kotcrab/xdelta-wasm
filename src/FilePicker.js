import React, {useRef} from "react"
import {Icon, Input, InputGroup, InputLeftElement} from "@chakra-ui/react"
import {FiFile} from "react-icons/fi"

export default function FilePicker({onChange, isReadOnly}) {
  const fileInputRef = useRef()
  const inputRef = useRef()

  function handleChange(e) {
    if (e.target.files.length === 0) {
      inputRef.current.value = ''
      onChange(null)
      return
    }
    const file = e.target.files[0]
    inputRef.current.value = file.name
    onChange(file)
  }

  return (
    <InputGroup>
      <InputLeftElement pointerEvents="none" children={<Icon as={FiFile}/>}/>
      <input type='file' ref={fileInputRef} style={{display: 'none'}} onChange={handleChange}/>
      <Input placeholder="Select file" readOnly ref={inputRef} onClick={() => !isReadOnly && fileInputRef.current.click()}/>
    </InputGroup>
  )
}

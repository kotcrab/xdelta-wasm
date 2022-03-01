import React from 'react'
import {ChakraProvider, theme,} from '@chakra-ui/react'
import PatchForm from "./PatchForm"

function App() {
  return (
    <ChakraProvider theme={theme}>
      <PatchForm/>
    </ChakraProvider>
  )
}

export default App

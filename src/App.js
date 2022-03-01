import React from 'react'
import {ChakraProvider} from '@chakra-ui/react'
import PatchForm from "./PatchForm"
import theme from "./theme";

function App() {
  return (
    <ChakraProvider theme={theme}>
      <PatchForm/>
    </ChakraProvider>
  )
}

export default App

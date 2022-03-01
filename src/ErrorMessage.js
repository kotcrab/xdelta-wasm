import React from "react"
import {Alert, AlertDescription, AlertIcon, Box, Text} from "@chakra-ui/react"

export default function ErrorMessage({message, extraMessage}) {
  return (
    <Box my={4}>
      <Alert status="error" borderRadius={4}>
        <AlertIcon/>
        <AlertDescription>
          <Text>{message}</Text>
          {extraMessage ? <Text>{extraMessage}</Text> : null}
        </AlertDescription>
      </Alert>
    </Box>
  )
}

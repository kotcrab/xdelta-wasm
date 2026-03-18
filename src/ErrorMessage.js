import React from "react"
import {Alert, AlertDescription, AlertIcon, Box, IconButton, Text, Tooltip, useClipboard} from "@chakra-ui/react"
import {CopyIcon, CheckIcon} from "@chakra-ui/icons"

export default function ErrorMessage({message, extraMessage}) {
  const fullText = [message, extraMessage].filter(Boolean).join('\n')
  const {hasCopied, onCopy} = useClipboard(fullText)

  return (
    <Box my={4}>
      <Alert status="error" borderRadius={4}>
        <AlertIcon/>
        <AlertDescription flex="1">
          <Text>{message}</Text>
          {extraMessage ? <Text whiteSpace="pre-wrap">{extraMessage}</Text> : null}
        </AlertDescription>
        <Tooltip label={hasCopied ? "Copied!" : "Copy error"} closeOnClick={false}>
          <IconButton
            aria-label="Copy error message"
            icon={hasCopied ? <CheckIcon/> : <CopyIcon/>}
            size="sm"
            variant="ghost"
            onClick={onCopy}
            ml={2}
            flexShrink={0}
          />
        </Tooltip>
      </Alert>
    </Box>
  )
}

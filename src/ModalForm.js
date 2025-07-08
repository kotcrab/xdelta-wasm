import React from "react"
import ColorModeSwitcher from "./ColorModeSwitcher"
import {Box, Flex, HStack, Icon, Link, Spacer, Text, VStack} from "@chakra-ui/react"
import {FaGithub, FaLock} from "react-icons/all"

export default function ModalForm({children}) {
  return (
    <Flex minH="100svh" direction="column" p={3}>
      <Box alignSelf="flex-end">
        <ColorModeSwitcher/>
      </Box>
      <Spacer/>
      {children}
      <Spacer/>
      <VStack alignSelf="center">
        <HStack>
          <Icon as={FaLock}/>
          <Text>Files are fully processed on your device</Text>
        </HStack>
        <Link href='https://github.com/kotcrab/xdelta-wasm' isExternal>
          <Icon as={FaGithub} mx="2px"/> Source code
        </Link>
      </VStack>
    </Flex>
  )
}

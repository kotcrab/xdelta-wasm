import React from "react"
import ColorModeSwitcher from "./ColorModeSwitcher"
import {Box, Flex, Icon, Link, Spacer, Text, VStack} from "@chakra-ui/react"
import {FaGithub} from "react-icons/all"

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
        <Text align="center">This app runs client-side, no files are actually uploaded or downloaded.</Text>
        <Link href='https://github.com/kotcrab/xdelta-wasm' isExternal>
          <Icon as={FaGithub} mx="2px"/> Source code
        </Link>
      </VStack>
    </Flex>
  )
}

import React from "react"
import ColorModeSwitcher from "./ColorModeSwitcher"
import {Box, Flex, Icon, Link, Spacer} from "@chakra-ui/react"
import {FaGithub} from "react-icons/all"

export default function ModalForm({children}) {
  return (
    <Flex minH="100vh" direction="column" p={3}>
      <Box alignSelf="flex-end">
        <ColorModeSwitcher/>
      </Box>
      <Spacer/>
      {children}
      <Spacer/>
      <Box alignSelf="center">
        <Link href='https://github.com/kotcrab/xdelta-wasm' isExternal>
          <Icon as={FaGithub} mx="2px"/> Source code
        </Link>
      </Box>
    </Flex>
  )
}

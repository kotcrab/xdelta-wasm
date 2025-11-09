import React from "react"
import ColorModeSwitcher from "./ColorModeSwitcher"
import {Flex, HStack, Icon, IconButton, Link, Spacer, Text, VStack} from "@chakra-ui/react"
import {FaGithub, FaLock} from "react-icons/all"
import {SettingsIcon} from "@chakra-ui/icons";

export default function ModalForm({onOpenSettings, children}) {
  return (
    <Flex minH="100svh" direction="column" p={3}>
      <Flex width="full" justifyContent="space-between">
        <IconButton
          size="md"
          fontSize="lg"
          aria-label={`Open settings`}
          variant="ghost"
          color="current"
          marginLeft="2"
          onClick={onOpenSettings}
          icon={<SettingsIcon/>}
        />
        <ColorModeSwitcher/>
      </Flex>
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

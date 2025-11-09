import React from 'react'
import {IconButton, useColorMode, useColorModeValue} from '@chakra-ui/react'
import {MoonIcon, SunIcon} from "@chakra-ui/icons";

export default function ColorModeSwitcher(props) {
  const {toggleColorMode} = useColorMode()
  const text = useColorModeValue('dark', 'light')
  const SwitchIcon = useColorModeValue(SunIcon, MoonIcon)

  return (
    <IconButton
      size="md"
      fontSize="lg"
      aria-label={`Switch to ${text} mode`}
      variant="ghost"
      color="current"
      marginLeft="2"
      onClick={toggleColorMode}
      icon={<SwitchIcon/>}
      {...props}
    />
  )
}

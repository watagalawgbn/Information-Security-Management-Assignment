import React from 'react'
import { Box } from '@mui/material';
import Navbar from '../../components/common/Navbar';
import Header from '../../components/common/Header';

function MenuSettings() {
  return (
    <Box display="flex">
      <Navbar />
      <Box flexGrow={1}>
        <Header />
        <h1>Menu Settings</h1>
      </Box>
    </Box>
  )
}

export default MenuSettings

import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Box, CssBaseline, useTheme, useMediaQuery, Typography } from '@mui/material'
import Sidebar from './Sidebar'
import Navbar from './Navbar'
import UserMenu from './UserMenu'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from '../config/firebase'

const drawerWidth = 240

export default function Layout() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [mobileOpen, setMobileOpen] = useState(false)
  const [user] = useAuthState(auth)

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <CssBaseline />
      
      {/* Header */}
      <Box
        component="header"
        sx={{
          position: 'fixed',
          width: '100%',
          height: '64px',
          bgcolor: 'background.paper',
          borderBottom: 1,
          borderColor: 'divider',
          zIndex: theme.zIndex.drawer + 1,
          display: 'flex',
          alignItems: 'center',
          px: 3,
          justifyContent: 'space-between'
        }}
      >
        <Typography 
          variant="h6" 
          component="div"
          sx={{ 
            fontWeight: 'bold',
            background: 'linear-gradient(45deg, #1976d2 30%, #9c27b0 90%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          NextManager
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {!isMobile && (
            <Typography variant="body2" color="text.secondary">
              {user?.email}
            </Typography>
          )}
          <UserMenu 
            photoURL={user?.photoURL}
            displayName={user?.displayName}
            email={user?.email}
          />
        </Box>
      </Box>

      {/* Navbar */}
      <Navbar 
        drawerWidth={drawerWidth} 
        onDrawerToggle={handleDrawerToggle}
      />

      {/* Sidebar */}
      <Sidebar
        drawerWidth={drawerWidth}
        mobileOpen={mobileOpen}
        onDrawerToggle={handleDrawerToggle}
        variant={isMobile ? 'temporary' : 'permanent'}
      />

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: {
            xs: 1,
            sm: 2,
            md: 3
          },
          width: {
            xs: '100%',
            sm: `calc(100% - ${drawerWidth}px)`
          },
          marginTop: '64px',
          minHeight: 'calc(100vh - 64px)',
          backgroundColor: theme.palette.background.default,
          overflow: 'auto'
        }}
      >
        <Outlet />
      </Box>
    </Box>
  )
}

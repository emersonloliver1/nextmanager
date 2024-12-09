import { AppBar, IconButton, Toolbar, useTheme } from '@mui/material'
import { Menu as MenuIcon } from '@mui/icons-material'

interface NavbarProps {
  drawerWidth: number
  onDrawerToggle: () => void
}

export default function Navbar({ drawerWidth, onDrawerToggle }: NavbarProps) {
  const theme = useTheme()

  return (
    <AppBar
      position="fixed"
      sx={{
        width: { sm: `calc(100% - ${drawerWidth}px)` },
        ml: { sm: `${drawerWidth}px` },
        backgroundColor: 'transparent',
        color: 'text.primary',
        boxShadow: 'none',
        top: 0,
        zIndex: theme.zIndex.drawer - 1,
      }}
    >
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={onDrawerToggle}
          sx={{ mr: 2, display: { sm: 'none' } }}
        >
          <MenuIcon />
        </IconButton>
      </Toolbar>
    </AppBar>
  )
} 
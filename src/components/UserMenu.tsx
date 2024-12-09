import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Menu, MenuItem, IconButton, Avatar } from '@mui/material'
import { signOut } from 'firebase/auth'
import { auth } from '../config/firebase'

interface UserMenuProps {
  photoURL?: string | null
  displayName?: string | null
  email?: string | null
}

export default function UserMenu({ photoURL, displayName, email }: UserMenuProps) {
  const navigate = useNavigate()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleLogout = async () => {
    try {
      await signOut(auth)
      navigate('/login')
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    }
  }

  return (
    <>
      <IconButton
        size="small"
        aria-label="conta do usuário"
        aria-controls="menu-appbar"
        aria-haspopup="true"
        onClick={handleMenu}
        sx={{ p: 0 }}
      >
        <Avatar 
          src={photoURL || undefined}
          alt={displayName || email || 'Usuário'}
          sx={{ width: 32, height: 32 }}
        >
          {!photoURL && ((displayName?.charAt(0) || email?.charAt(0))?.toUpperCase() || 'U')}
        </Avatar>
      </IconButton>
      
      <Menu
        id="menu-appbar"
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        keepMounted
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        open={Boolean(anchorEl)}
        onClose={handleClose}
      >
        <MenuItem onClick={() => {
          handleClose()
          navigate('/dashboard/settings')
        }}>
          Configurações
        </MenuItem>
        <MenuItem onClick={() => {
          handleClose()
          handleLogout()
        }}>
          Sair
        </MenuItem>
      </Menu>
    </>
  )
} 
import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  IconButton,
} from '@mui/material'
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Inventory as InventoryIcon,
  LocalShipping as LocalShippingIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  Menu as MenuIcon,
} from '@mui/icons-material'
import AccountBalanceIcon from '@mui/icons-material/AccountBalance'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'
import ShowChartIcon from '@mui/icons-material/ShowChart'
import ReceiptIcon from '@mui/icons-material/Receipt'

interface MenuItem {
  icon: JSX.Element
  text: string
  path?: string
  children?: MenuItem[]
}

const menuItems: MenuItem[] = [
  {
    icon: <DashboardIcon />,
    text: 'Dashboard',
    path: '/dashboard'
  },
  {
    icon: <PeopleIcon />,
    text: 'Clientes',
    path: '/dashboard/clientes'
  },
  {
    icon: <InventoryIcon />,
    text: 'Produtos',
    path: '/dashboard/produtos'
  },
  {
    icon: <LocalShippingIcon />,
    text: 'Fornecedores',
    path: '/dashboard/fornecedores'
  },
  {
    icon: <InventoryIcon />,
    text: 'Estoque',
    path: '/dashboard/estoque'
  },
  // Menu Financeiro
  {
    icon: <AccountBalanceIcon />,
    text: 'Financeiro',
    children: [
      {
        icon: <ReceiptIcon />,
        text: 'Visão Geral',
        path: '/dashboard/financeiro/visao-geral'
      },
      {
        icon: <TrendingDownIcon />,
        text: 'Contas a Pagar',
        path: '/dashboard/financeiro/contas-pagar'
      },
      {
        icon: <TrendingUpIcon />,
        text: 'Contas a Receber',
        path: '/dashboard/financeiro/contas-receber'
      },
      {
        icon: <ShowChartIcon />,
        text: 'Fluxo de Caixa',
        path: '/dashboard/financeiro/fluxo-caixa'
      }
    ]
  }
]

interface SidebarProps {
  open: boolean
  onClose: () => void
  drawerWidth: number
}

export default function Sidebar({ open, onClose, drawerWidth }: SidebarProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const [openSubMenus, setOpenSubMenus] = useState<{ [key: string]: boolean }>({})

  const handleClick = (item: MenuItem) => {
    if (item.children) {
      setOpenSubMenus(prev => ({
        ...prev,
        [item.text]: !prev[item.text]
      }))
    } else if (item.path) {
      navigate(item.path)
      onClose()
    }
  }

  const renderMenuItem = (item: MenuItem) => {
    const isSelected = item.path === location.pathname
    const hasChildren = item.children && item.children.length > 0
    const isOpen = openSubMenus[item.text]

    return (
      <Box key={item.text}>
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => handleClick(item)}
            selected={isSelected}
            sx={{
              '&.Mui-selected': {
                backgroundColor: 'primary.main',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'primary.dark',
                },
                '& .MuiListItemIcon-root': {
                  color: 'white',
                },
              },
            }}
          >
            <ListItemIcon sx={{ color: isSelected ? 'white' : 'inherit' }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.text} />
            {hasChildren && (
              isOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />
            )}
          </ListItemButton>
        </ListItem>
        {hasChildren && (
          <Collapse in={isOpen} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.children.map(child => (
                <ListItemButton
                  key={child.text}
                  onClick={() => handleClick(child)}
                  selected={child.path === location.pathname}
                  sx={{
                    pl: 4,
                    '&.Mui-selected': {
                      backgroundColor: 'primary.main',
                      color: 'white',
                      '&:hover': {
                        backgroundColor: 'primary.dark',
                      },
                      '& .MuiListItemIcon-root': {
                        color: 'white',
                      },
                    },
                  }}
                >
                  <ListItemIcon sx={{ 
                    color: child.path === location.pathname ? 'white' : 'inherit'
                  }}>
                    {child.icon}
                  </ListItemIcon>
                  <ListItemText primary={child.text} />
                </ListItemButton>
              ))}
            </List>
          </Collapse>
        )}
      </Box>
    )
  }

  return (
    <Drawer
      variant="temporary"
      anchor="left"
      open={open}
      onClose={onClose}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
        },
      }}
    >
      <Box sx={{ overflow: 'auto' }}>
        <List>
          {menuItems.map(item => renderMenuItem(item))}
        </List>
      </Box>
    </Drawer>
  )
} 
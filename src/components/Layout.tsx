import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  Box,
  Drawer,
  Typography,
  List,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Divider,
  Avatar,
  IconButton,
  Collapse,
} from '@mui/material'
import DashboardIcon from '@mui/icons-material/Dashboard'
import PeopleIcon from '@mui/icons-material/People'
import InventoryIcon from '@mui/icons-material/Inventory'
import PointOfSaleIcon from '@mui/icons-material/PointOfSale'
import BarChartIcon from '@mui/icons-material/BarChart'
import SettingsIcon from '@mui/icons-material/Settings'
import LogoutIcon from '@mui/icons-material/Logout'
import MenuIcon from '@mui/icons-material/Menu'
import WorkIcon from '@mui/icons-material/Work'
import LocalShippingIcon from '@mui/icons-material/LocalShipping'
import AccountBalanceIcon from '@mui/icons-material/AccountBalance'
import AssignmentIcon from '@mui/icons-material/Assignment'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import SupportAgentIcon from '@mui/icons-material/SupportAgent'
import CampaignIcon from '@mui/icons-material/Campaign'
import DescriptionIcon from '@mui/icons-material/Description'
import StorageIcon from '@mui/icons-material/Storage'
import GroupWorkIcon from '@mui/icons-material/GroupWork'
import TimelineIcon from '@mui/icons-material/Timeline'
import ExpandLess from '@mui/icons-material/ExpandLess'
import ExpandMore from '@mui/icons-material/ExpandMore'
import { signOut } from 'firebase/auth'
import { auth } from '../config/firebase'

const drawerWidth = 280

interface MenuItem {
  text: string
  icon?: React.ReactNode
  path?: string
  children?: MenuItem[]
}

const menuItems: MenuItem[] = [
  { 
    text: 'Dashboard', 
    icon: <DashboardIcon />, 
    path: '/dashboard' 
  },
  {
    text: 'CRM',
    icon: <PeopleIcon />,
    children: [
      { text: 'Clientes', icon: <PeopleIcon />, path: '/dashboard/customers' },
      { text: 'Oportunidades', icon: <WorkIcon />, path: '/dashboard/opportunities' },
      { text: 'Campanhas', icon: <CampaignIcon />, path: '/dashboard/campaigns' },
      { text: 'Atendimento', icon: <SupportAgentIcon />, path: '/dashboard/support' },
    ]
  },
  {
    text: 'Vendas',
    icon: <PointOfSaleIcon />,
    children: [
      { text: 'Pedidos', icon: <PointOfSaleIcon />, path: '/dashboard/sales' },
      { text: 'PDV', icon: <PointOfSaleIcon />, path: '/dashboard/pos' },
      { text: 'Orçamentos', icon: <DescriptionIcon />, path: '/dashboard/quotes' },
    ]
  },
  {
    text: 'Produtos & Estoque',
    icon: <InventoryIcon />,
    children: [
      { text: 'Produtos', icon: <InventoryIcon />, path: '/dashboard/products' },
      { text: 'Estoque', icon: <StorageIcon />, path: '/dashboard/inventory' },
      { text: 'Fornecedores', icon: <LocalShippingIcon />, path: '/dashboard/suppliers' },
    ]
  },
  {
    text: 'Financeiro',
    icon: <AccountBalanceIcon />,
    children: [
      { text: 'Visão Geral', icon: <AccountBalanceIcon />, path: '/dashboard/financial' },
      { text: 'Contas a Pagar', icon: <DescriptionIcon />, path: '/dashboard/payables' },
      { text: 'Contas a Receber', icon: <DescriptionIcon />, path: '/dashboard/receivables' },
      { text: 'Fluxo de Caixa', icon: <TimelineIcon />, path: '/dashboard/cash-flow' },
    ]
  },
  {
    text: 'Gestão',
    icon: <GroupWorkIcon />,
    children: [
      { text: 'Projetos', icon: <GroupWorkIcon />, path: '/dashboard/projects' },
      { text: 'Tarefas', icon: <AssignmentIcon />, path: '/dashboard/tasks' },
      { text: 'Agenda', icon: <CalendarMonthIcon />, path: '/dashboard/calendar' },
    ]
  },
  {
    text: 'Relatórios',
    icon: <BarChartIcon />,
    children: [
      { text: 'Relatórios', icon: <BarChartIcon />, path: '/dashboard/reports' },
      { text: 'Analytics', icon: <TimelineIcon />, path: '/dashboard/analytics' },
    ]
  },
  { 
    text: 'Configurações', 
    icon: <SettingsIcon />, 
    path: '/dashboard/settings' 
  },
]

// Detecta se está rodando no Electron
const isElectron = 'electron' in window

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [openMenus, setOpenMenus] = useState<{ [key: string]: boolean }>({})
  const navigate = useNavigate()
  const location = useLocation()

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  const handleLogout = async () => {
    try {
      await signOut(auth)
      navigate('/login')
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    }
  }

  const handleMenuClick = (item: MenuItem) => {
    if (item.children) {
      setOpenMenus(prev => ({
        ...prev,
        [item.text]: !prev[item.text]
      }))
    } else if (item.path) {
      navigate(item.path)
    }
  }

  const renderMenuItem = (item: MenuItem, depth = 0) => {
    const hasChildren = item.children && item.children.length > 0
    const isSelected = item.path === location.pathname
    const isOpen = openMenus[item.text]

    return (
      <>
        <ListItemButton
          onClick={() => handleMenuClick(item)}
          selected={isSelected}
          sx={{
            pl: 2 + depth * 2,
            py: 1,
            '&.Mui-selected': {
              bgcolor: 'primary.light',
              color: 'primary.main',
              '& .MuiListItemIcon-root': {
                color: 'primary.main',
              },
            },
          }}
        >
          {item.icon && (
            <ListItemIcon sx={{ minWidth: 40 }}>
              {item.icon}
            </ListItemIcon>
          )}
          <ListItemText 
            primary={item.text}
            primaryTypographyProps={{
              fontSize: '0.875rem',
              fontWeight: isSelected ? 'medium' : 'regular',
            }}
          />
          {hasChildren && (isOpen ? <ExpandLess /> : <ExpandMore />)}
        </ListItemButton>
        {hasChildren && (
          <Collapse in={isOpen} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.children.map((child, index) => (
                <Box key={child.text || index}>
                  {renderMenuItem(child, depth + 1)}
                </Box>
              ))}
            </List>
          </Collapse>
        )}
      </>
    )
  }

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box
        sx={{
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          px: 3,
          borderBottom: '1px solid',
          borderColor: 'grey.200',
        }}
      >
        <Typography variant="h6" color="primary" fontWeight="bold">
          NextManager
        </Typography>
      </Box>

      <Box sx={{ p: 2 }}>
        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            bgcolor: 'grey.100',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Avatar
            sx={{
              bgcolor: 'primary.main',
              color: 'white',
              width: 40,
              height: 40,
            }}
          >
            A
          </Avatar>
          <Box>
            <Typography variant="subtitle2" fontWeight="medium">
              Administrador
            </Typography>
            <Typography variant="body2" color="text.secondary">
              admin@nextmanager.com
            </Typography>
          </Box>
        </Box>
      </Box>

      <List sx={{ flex: 1, px: 2 }}>
        {menuItems.map((item, index) => (
          <Box key={item.text || index}>
            {renderMenuItem(item)}
          </Box>
        ))}
      </List>

      <Divider sx={{ mx: 2, mb: 2 }} />
      
      <Box sx={{ p: 2 }}>
        <ListItemButton
          onClick={handleLogout}
          sx={{
            borderRadius: 2,
            '&:hover': {
              bgcolor: 'error.light',
              color: 'error.main',
              '& .MuiListItemIcon-root': {
                color: 'error.main',
              },
            },
          }}
        >
          <ListItemIcon>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary="Sair" />
        </ListItemButton>
      </Box>
    </Box>
  )

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        bgcolor: 'background.default',
      }}
    >
      {/* Barra superior apenas para Electron */}
      {isElectron && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            height: '32px',
            bgcolor: 'primary.main',
            zIndex: 1300,
            WebkitAppRegion: 'drag',
          }}
        />
      )}

      {/* Container principal ajustado para web/desktop */}
      <Box
        sx={{
          display: 'flex',
          width: '100%',
          mt: isElectron ? '32px' : 0,
        }}
      >
        <Box
          component="nav"
          sx={{
            width: { sm: drawerWidth },
            flexShrink: { sm: 0 },
          }}
        >
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{
              keepMounted: true,
            }}
            sx={{
              display: { xs: 'block', sm: 'none' },
              '& .MuiDrawer-paper': {
                boxSizing: 'border-box',
                width: drawerWidth,
                borderRight: '1px solid',
                borderColor: 'grey.200',
                mt: isElectron ? '32px' : 0,
              },
            }}
          >
            {drawer}
          </Drawer>
          <Drawer
            variant="permanent"
            sx={{
              display: { xs: 'none', sm: 'block' },
              '& .MuiDrawer-paper': {
                boxSizing: 'border-box',
                width: drawerWidth,
                borderRight: '1px solid',
                borderColor: 'grey.200',
                boxShadow: 'none',
                mt: isElectron ? '32px' : 0,
              },
            }}
            open
          >
            {drawer}
          </Drawer>
        </Box>

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            width: { sm: `calc(100% - ${drawerWidth}px)` },
          }}
        >
          {/* Barra de título */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              mb: 3,
              height: '64px',
            }}
          >
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { sm: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
          </Box>

          {/* Conteúdo principal */}
          <Outlet />
        </Box>
      </Box>
    </Box>
  )
}

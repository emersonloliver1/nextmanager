import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuthState } from 'react-firebase-hooks/auth'
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
  Tooltip,
} from '@mui/material'
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Inventory as InventoryIcon,
  PointOfSale as PointOfSaleIcon,
  BarChart as BarChartIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Menu as MenuIcon,
  Work as WorkIcon,
  LocalShipping as LocalShippingIcon,
  AccountBalance as AccountBalanceIcon,
  Assignment as AssignmentIcon,
  CalendarMonth as CalendarMonthIcon,
  SupportAgent as SupportAgentIcon,
  Campaign as CampaignIcon,
  Description as DescriptionIcon,
  Storage as StorageIcon,
  GroupWork as GroupWorkIcon,
  Timeline as TimelineIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  ShowChart as ShowChartIcon,
  Receipt as ReceiptIcon,
  ExpandLess,
  ExpandMore
} from '@mui/icons-material'
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
      { text: 'Clientes', icon: <PeopleIcon />, path: '/dashboard/clientes' },
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
      { text: 'Produtos', icon: <InventoryIcon />, path: '/dashboard/produtos' },
      { text: 'Estoque', icon: <StorageIcon />, path: '/dashboard/estoque' },
      { text: 'Fornecedores', icon: <LocalShippingIcon />, path: '/dashboard/fornecedores' },
    ]
  },
  {
    text: 'Financeiro',
    icon: <AccountBalanceIcon />,
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
  }
]

export default function Layout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [user] = useAuthState(auth)
  const [open, setOpen] = useState<{ [key: string]: boolean }>({})
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    // Inicializar o estado de expansão dos menus
    const initialOpen = menuItems.reduce((acc, item) => {
      if (item.children) {
        acc[item.text] = item.children.some(child => location.pathname === child.path)
      }
      return acc
    }, {} as { [key: string]: boolean })
    setOpen(initialOpen)
  }, [location.pathname])

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

  const handleClick = (item: MenuItem) => {
    if (item.children) {
      setOpen(prev => ({ ...prev, [item.text]: !prev[item.text] }))
    } else if (item.path) {
      navigate(item.path)
      setMobileOpen(false)
    }
  }

  const renderMenuItem = (item: MenuItem) => {
    const isSelected = item.path === location.pathname
    const hasChildren = item.children && item.children.length > 0
    const isOpen = open[item.text]

    return (
      <div key={item.text}>
        <ListItemButton
          onClick={() => handleClick(item)}
          selected={isSelected || (hasChildren && item.children?.some(child => child.path === location.pathname))}
          sx={{
            borderRadius: 1,
            mx: 1,
            mb: 0.5,
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
          {item.icon && (
            <ListItemIcon sx={{ minWidth: 40 }}>
              {item.icon}
            </ListItemIcon>
          )}
          <ListItemText primary={item.text} />
          {hasChildren && (isOpen ? <ExpandLess /> : <ExpandMore />)}
        </ListItemButton>

        {hasChildren && (
          <Collapse in={isOpen} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.children?.map(child => (
                <ListItemButton
                  key={child.text}
                  onClick={() => handleClick(child)}
                  selected={child.path === location.pathname}
                  sx={{
                    pl: 4,
                    borderRadius: 1,
                    mx: 1,
                    mb: 0.5,
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
                  {child.icon && (
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      {child.icon}
                    </ListItemIcon>
                  )}
                  <ListItemText primary={child.text} />
                </ListItemButton>
              ))}
            </List>
          </Collapse>
        )}
      </div>
    )
  }

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo */}
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography 
          variant="h5" 
          sx={{ 
            fontWeight: 'bold',
            background: 'linear-gradient(45deg, #1976d2 30%, #9c27b0 90%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          NextManager
        </Typography>
      </Box>

      <Divider sx={{ mb: 2 }} />

      {/* Informações do Usuário */}
      <Box sx={{ px: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          <Avatar 
            sx={{ width: 48, height: 48 }}
            src={user?.photoURL || undefined}
            alt={user?.displayName || 'Usuário'}
          >
            {!user?.photoURL && (user?.displayName?.charAt(0) || user?.email?.charAt(0).toUpperCase() || 'U')}
          </Avatar>
          <Box>
            <Tooltip title={user?.displayName || user?.email || ''}>
              <Typography variant="subtitle1" noWrap sx={{ maxWidth: 180 }}>
                {user?.displayName || 'Usuário'}
              </Typography>
            </Tooltip>
            <Tooltip title={user?.email || ''}>
              <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 180 }}>
                {user?.email}
              </Typography>
            </Tooltip>
          </Box>
        </Box>
      </Box>

      <Divider sx={{ mb: 2 }} />

      {/* Menu Items */}
      <List sx={{ flex: 1, overflowY: 'auto' }}>
        {menuItems.map(renderMenuItem)}
      </List>

      <Divider />

      {/* Settings and Logout */}
      <List>
        <ListItemButton
          onClick={() => navigate('/dashboard/settings')}
          selected={location.pathname === '/dashboard/settings'}
          sx={{
            borderRadius: 1,
            mx: 1,
            mb: 0.5,
          }}
        >
          <ListItemIcon>
            <SettingsIcon />
          </ListItemIcon>
          <ListItemText primary="Configurações" />
        </ListItemButton>

        <ListItemButton
          onClick={handleLogout}
          sx={{
            borderRadius: 1,
            mx: 1,
            mb: 0.5,
          }}
        >
          <ListItemIcon>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary="Sair" />
        </ListItemButton>
      </List>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Mobile Menu Button */}
      <Box
        component="nav"
        sx={{
          position: 'fixed',
          top: 16,
          left: 16,
          zIndex: 1200,
          display: { sm: 'none' },
        }}
      >
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={handleDrawerToggle}
          sx={{
            bgcolor: 'background.paper',
            boxShadow: 1,
            '&:hover': {
              bgcolor: 'background.paper',
            },
          }}
        >
          <MenuIcon />
        </IconButton>
      </Box>

      {/* Mobile Drawer */}
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
          },
        }}
      >
        {drawer}
      </Drawer>

      {/* Desktop Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
          },
        }}
        open
      >
        {drawer}
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          bgcolor: 'background.default',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <Box sx={{ flex: 1, width: '100%', maxWidth: 1200, mx: 'auto' }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  )
}

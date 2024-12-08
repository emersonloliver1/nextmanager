import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuthState } from 'react-firebase-hooks/auth'
import {
  Drawer,
  List,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Collapse,
  Box,
  useTheme,
  useMediaQuery,
} from '@mui/material'
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Inventory as InventoryIcon,
  PointOfSale as PointOfSaleIcon,
  BarChart as BarChartIcon,
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
  ExpandMore,
  Assignment as ProjectsIcon,
  Task as TasksIcon,
  Event as CalendarIcon,
  Info as InfoIcon,
} from '@mui/icons-material'
import { auth } from '../config/firebase'

interface MenuItem {
  text: string
  icon?: React.ReactNode
  path?: string
  children?: MenuItem[]
}

interface SidebarProps {
  drawerWidth: number
  mobileOpen: boolean
  onDrawerToggle: () => void
  variant: 'permanent' | 'persistent' | 'temporary'
}

const menuItems: MenuItem[] = [
  { 
    text: 'Dashboard', 
    icon: <DashboardIcon />, 
    path: '/dashboard' 
  },
  {
    text: 'Vendas',
    icon: <PointOfSaleIcon />,
    children: [
      { text: 'Histórico', icon: <PointOfSaleIcon />, path: '/dashboard/sales' },
      { text: 'PDV', icon: <PointOfSaleIcon />, path: '/dashboard/pos' },
      { text: 'Orçamentos', icon: <DescriptionIcon />, path: '/dashboard/quotes' },
      { text: 'Oportunidades', icon: <TrendingUpIcon />, path: '/dashboard/opportunities' },
    ]
  },
  {
    text: 'Produtos',
    icon: <InventoryIcon />,
    children: [
      { text: 'Catálogo', icon: <StorageIcon />, path: '/dashboard/produtos' },
      { text: 'Estoque', icon: <InventoryIcon />, path: '/dashboard/estoque' },
      { text: 'Fornecedores', icon: <LocalShippingIcon />, path: '/dashboard/fornecedores' },
    ]
  },
  {
    text: 'Clientes',
    icon: <PeopleIcon />,
    path: '/dashboard/clientes'
  },
  {
    text: 'Gestão',
    icon: <GroupWorkIcon />,
    children: [
      { text: 'Projetos', icon: <ProjectsIcon />, path: '/dashboard/gestao/projetos' },
      { text: 'Tarefas', icon: <TasksIcon />, path: '/dashboard/gestao/tarefas' },
      { text: 'Calendário', icon: <CalendarIcon />, path: '/dashboard/gestao/calendario' },
    ]
  },
  {
    text: 'Financeiro',
    icon: <AccountBalanceIcon />,
    children: [
      {
        icon: <ReceiptIcon />,
        text: 'Visão Geral',
        path: '/dashboard/financeiro'
      },
      {
        icon: <TrendingDownIcon />,
        text: 'Contas a Pagar',
        path: '/dashboard/financeiro/contas-a-pagar'
      },
      {
        icon: <TrendingUpIcon />,
        text: 'Contas a Receber',
        path: '/dashboard/financeiro/contas-a-receber'
      },
      {
        icon: <ShowChartIcon />,
        text: 'Fluxo de Caixa',
        path: '/dashboard/financeiro/fluxo-de-caixa'
      }
    ]
  },
  {
    text: 'Manual do Usuário',
    icon: <InfoIcon />,
    path: '/dashboard/about/manual'
  }
]

export default function Sidebar({ drawerWidth, mobileOpen, onDrawerToggle, variant }: SidebarProps) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const location = useLocation()
  const navigate = useNavigate()
  const [user] = useAuthState(auth)
  const [open, setOpen] = useState<{ [key: string]: boolean }>({})

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

  const handleClick = (item: MenuItem) => {
    if (item.children) {
      setOpen(prev => ({ ...prev, [item.text]: !prev[item.text] }))
    } else if (item.path) {
      navigate(item.path)
      if (isMobile) {
        onDrawerToggle()
      }
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
            minHeight: 48,
            px: 2.5,
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
            <ListItemIcon
              sx={{
                minWidth: 0,
                mr: 3,
                justifyContent: 'center',
              }}
            >
              {item.icon}
            </ListItemIcon>
          )}
          <ListItemText 
            primary={item.text} 
            primaryTypographyProps={{
              fontSize: 14,
              fontWeight: isSelected ? 'bold' : 'normal',
            }}
          />
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
                    minHeight: 48,
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
                  {child.icon && (
                    <ListItemIcon
                      sx={{
                        minWidth: 0,
                        mr: 3,
                        justifyContent: 'center',
                      }}
                    >
                      {child.icon}
                    </ListItemIcon>
                  )}
                  <ListItemText 
                    primary={child.text} 
                    primaryTypographyProps={{
                      fontSize: 14,
                      fontWeight: child.path === location.pathname ? 'bold' : 'normal',
                    }}
                  />
                </ListItemButton>
              ))}
            </List>
          </Collapse>
        )}
      </div>
    )
  }

  const drawer = (
    <Box sx={{ overflow: 'auto' }}>
      <List>
        {menuItems.map(renderMenuItem)}
      </List>
    </Box>
  )

  return (
    <Box
      component="nav"
      sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
    >
      <Drawer
        variant={variant}
        open={variant === 'temporary' ? mobileOpen : true}
        onClose={onDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            border: 'none',
            boxShadow: theme.shadows[1],
            backgroundColor: theme.palette.background.paper,
            marginTop: '64px',
            height: 'calc(100% - 64px)',
          },
        }}
      >
        {drawer}
      </Drawer>
    </Box>
  )
} 
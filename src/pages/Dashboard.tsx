import { useState, useEffect } from 'react'
import { Box, Grid, Paper, Typography, useTheme } from '@mui/material'
import AttachMoneyIcon from '@mui/icons-material/AttachMoney'
import PeopleIcon from '@mui/icons-material/People'
import InventoryIcon from '@mui/icons-material/Inventory'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import { collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore'
import { db } from '../config/firebase'

interface StatCardProps {
  title: string
  value: string
  icon: React.ReactNode
  color: string
  percentageChange?: string | null
}

function StatCard({ title, value, icon, color, percentageChange }: StatCardProps) {
  return (
    <Paper
      sx={{
        p: 3,
        borderRadius: 3,
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          right: 0,
          width: '100px',
          height: '100%',
          background: `linear-gradient(to right, transparent, ${color}15)`,
          transform: 'skewX(-15deg)',
          transformOrigin: 'top right',
        },
      }}
    >
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        <Typography color="text.secondary" gutterBottom>
          {title}
        </Typography>
        <Typography variant="h4" component="div" gutterBottom>
          {value}
        </Typography>
        {percentageChange && (
          <Typography 
            variant="body2" 
            color={percentageChange.startsWith('-') ? 'error.main' : 'success.main'}
            sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
          >
            {percentageChange}
          </Typography>
        )}
      </Box>
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          right: 20,
          transform: 'translateY(-50%)',
          color: color,
          opacity: 0.8,
        }}
      >
        {icon}
      </Box>
    </Paper>
  )
}

export default function Dashboard() {
  const theme = useTheme()
  const [loading, setLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState({
    monthlyRevenue: 0,
    activeCustomers: 0,
    productsInStock: 0,
    totalProfit: 0,
    revenueChange: null,
    customersChange: null,
    productsChange: null,
    profitChange: null
  })

  // Função para calcular a variação percentual
  const calculatePercentageChange = (current: number, previous: number): string => {
    if (previous === 0) return '+100%'
    const change = ((current - previous) / previous) * 100
    return `${change > 0 ? '+' : ''}${change.toFixed(1)}%`
  }

  // Função para formatar valores monetários
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        
        // Datas para filtros
        const now = new Date()
        const firstDayCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const firstDayPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const lastDayPreviousMonth = new Date(now.getFullYear(), now.getMonth(), 0)

        // Buscar oportunidades fechadas (vendas)
        const opportunitiesRef = collection(db, 'opportunities')
        
        // Vendas do mês atual
        const currentMonthQuery = query(
          opportunitiesRef,
          where('stage', '==', 'closed-won'),
          where('closedAt', '>=', firstDayCurrentMonth),
          where('closedAt', '<=', now)
        )
        const currentMonthSnapshot = await getDocs(currentMonthQuery)
        const currentMonthRevenue = currentMonthSnapshot.docs.reduce(
          (total, doc) => total + (doc.data().value || 0), 
          0
        )

        // Vendas do mês anterior
        const previousMonthQuery = query(
          opportunitiesRef,
          where('stage', '==', 'closed-won'),
          where('closedAt', '>=', firstDayPreviousMonth),
          where('closedAt', '<=', lastDayPreviousMonth)
        )
        const previousMonthSnapshot = await getDocs(previousMonthQuery)
        const previousMonthRevenue = previousMonthSnapshot.docs.reduce(
          (total, doc) => total + (doc.data().value || 0), 
          0
        )

        // Buscar clientes ativos
        const customersRef = collection(db, 'customers')
        const activeCustomersQuery = query(
          customersRef,
          where('status', '==', 'active')
        )
        const activeCustomersSnapshot = await getDocs(activeCustomersQuery)
        const currentActiveCustomers = activeCustomersSnapshot.size

        // Clientes ativos do mês anterior
        const previousActiveCustomersQuery = query(
          customersRef,
          where('status', '==', 'active'),
          where('createdAt', '<=', lastDayPreviousMonth)
        )
        const previousActiveCustomersSnapshot = await getDocs(previousActiveCustomersQuery)
        const previousActiveCustomers = previousActiveCustomersSnapshot.size

        // Buscar produtos em estoque
        const productsRef = collection(db, 'products')
        const productsSnapshot = await getDocs(productsRef)
        const currentProductsInStock = productsSnapshot.docs.reduce(
          (total, doc) => total + (doc.data().stockQuantity || 0),
          0
        )

        // Calcular lucro (30% das vendas para exemplo)
        const currentProfit = currentMonthRevenue * 0.3
        const previousProfit = previousMonthRevenue * 0.3

        // Calcular variações percentuais
        const revenueChange = calculatePercentageChange(currentMonthRevenue, previousMonthRevenue)
        const customersChange = calculatePercentageChange(currentActiveCustomers, previousActiveCustomers)
        const profitChange = calculatePercentageChange(currentProfit, previousProfit)

        setDashboardData({
          monthlyRevenue: currentMonthRevenue,
          activeCustomers: currentActiveCustomers,
          productsInStock: currentProductsInStock,
          totalProfit: currentProfit,
          revenueChange,
          customersChange,
          productsChange: null, // Implementar quando tivermos histórico de estoque
          profitChange
        })

      } catch (error) {
        console.error('Erro ao buscar dados do dashboard:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  return (
    <Box>
      <Typography 
        variant="h4" 
        sx={{ 
          mb: 4,
          fontSize: '1.75rem',
          fontWeight: 600,
        }}
      >
        Dashboard
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Vendas do Mês"
            value={loading ? '...' : formatCurrency(dashboardData.monthlyRevenue)}
            icon={<AttachMoneyIcon sx={{ fontSize: 32 }} />}
            color={theme.palette.primary.main}
            percentageChange={dashboardData.revenueChange}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Clientes Ativos"
            value={loading ? '...' : dashboardData.activeCustomers.toString()}
            icon={<PeopleIcon sx={{ fontSize: 32 }} />}
            color={theme.palette.secondary.main}
            percentageChange={dashboardData.customersChange}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Produtos em Estoque"
            value={loading ? '...' : dashboardData.productsInStock.toString()}
            icon={<InventoryIcon sx={{ fontSize: 32 }} />}
            color={theme.palette.success.main}
            percentageChange={dashboardData.productsChange}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Lucro Total"
            value={loading ? '...' : formatCurrency(dashboardData.totalProfit)}
            icon={<TrendingUpIcon sx={{ fontSize: 32 }} />}
            color={theme.palette.info.main}
            percentageChange={dashboardData.profitChange}
          />
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper
            sx={{
              p: 3,
              height: '400px',
              borderRadius: 3,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Typography variant="h6" sx={{ mb: 3 }}>
              Vendas dos Últimos 6 Meses
            </Typography>
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Gráfico de vendas será implementado aqui
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper
            sx={{
              p: 3,
              height: '400px',
              borderRadius: 3,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Typography variant="h6" sx={{ mb: 3 }}>
              Produtos Mais Vendidos
            </Typography>
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Lista de produtos será implementada aqui
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}

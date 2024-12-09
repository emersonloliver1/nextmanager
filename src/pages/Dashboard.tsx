import { useState, useEffect } from 'react'
import { Box, Grid, Paper, Typography, useTheme } from '@mui/material'
import AttachMoneyIcon from '@mui/icons-material/AttachMoney'
import PeopleIcon from '@mui/icons-material/People'
import InventoryIcon from '@mui/icons-material/Inventory'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import { collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore'
import { db } from '../config/firebase'
import { BarChart } from '@mui/x-charts'

interface StatCardProps {
  title: string
  value: string
  icon: React.ReactNode
  color: string
  percentageChange?: string | null
}

interface SaleItem {
  productId: string
  quantity: number
  salePrice: number
  costPrice: number
}

interface Sale {
  items: SaleItem[]
  createdAt: Timestamp
  total: number
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
    revenueChange: '',
    customersChange: '',
    productsChange: null as string | null,
    profitChange: '',
    monthlySales: [] as { month: string; total: number }[],
    topProducts: [] as { name: string; quantity: number }[]
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
        const sixMonthsAgo = new Date(now)
        sixMonthsAgo.setMonth(now.getMonth() - 6)

        // Buscar vendas dos últimos 6 meses
        const salesRef = collection(db, 'sales')
        const salesQuery = query(
          salesRef,
          where('createdAt', '>=', Timestamp.fromDate(sixMonthsAgo)),
          orderBy('createdAt', 'desc')
        )
        const salesSnapshot = await getDocs(salesQuery)
        const sales = salesSnapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        })) as Sale[]

        // Calcular vendas e lucro do mês atual
        const currentMonthSales = sales.filter(sale => 
          sale.createdAt.toDate() >= firstDayCurrentMonth &&
          sale.createdAt.toDate() <= now
        )

        const currentMonthRevenue = currentMonthSales.reduce((total, sale) => total + sale.total, 0)
        
        // Calcular lucro (valor de venda - valor de custo)
        const currentMonthProfit = currentMonthSales.reduce((total, sale) => {
          return total + sale.items.reduce((itemProfit, item) => {
            return itemProfit + (item.quantity * (item.salePrice - item.costPrice))
          }, 0)
        }, 0)

        // Calcular vendas e lucro do mês anterior
        const previousMonthSales = sales.filter(sale => 
          sale.createdAt.toDate() >= firstDayPreviousMonth &&
          sale.createdAt.toDate() <= lastDayPreviousMonth
        )

        const previousMonthRevenue = previousMonthSales.reduce((total, sale) => total + sale.total, 0)
        const previousMonthProfit = previousMonthSales.reduce((total, sale) => {
          return total + sale.items.reduce((itemProfit, item) => {
            return itemProfit + (item.quantity * (item.salePrice - item.costPrice))
          }, 0)
        }, 0)

        // Agrupar vendas por mês
        const salesByMonth = sales.reduce((acc, sale) => {
          const date = sale.createdAt.toDate()
          const monthKey = date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
          
          if (!acc[monthKey]) {
            acc[monthKey] = { month: monthKey, total: 0 }
          }
          acc[monthKey].total += sale.total
          return acc
        }, {} as Record<string, { month: string; total: number }>)

        const monthlySales = Object.values(salesByMonth).sort((a, b) => 
          new Date(a.month).getTime() - new Date(b.month).getTime()
        )

        // Calcular produtos mais vendidos
        const productSales = new Map<string, { name: string; quantity: number }>()
        
        for (const sale of sales) {
          for (const item of sale.items) {
            const productId = item.productId
            const productRef = collection(db, 'products')
            const productDoc = await getDocs(query(productRef, where('id', '==', productId)))
            const productName = productDoc.docs[0]?.data()?.name || 'Produto Desconhecido'
            
            if (!productSales.has(productId)) {
              productSales.set(productId, { name: productName, quantity: 0 })
            }
            const current = productSales.get(productId)!
            current.quantity += item.quantity
            productSales.set(productId, current)
          }
        }

        const topProducts = Array.from(productSales.values())
          .sort((a, b) => b.quantity - a.quantity)
          .slice(0, 5)

        // Buscar clientes ativos
        const customersRef = collection(db, 'customers')
        const activeCustomersQuery = query(
          customersRef,
          where('status', '==', 'active')
        )
        const activeCustomersSnapshot = await getDocs(activeCustomersQuery)
        const currentActiveCustomers = activeCustomersSnapshot.size

        // Buscar produtos em estoque
        const productsRef = collection(db, 'products')
        const productsSnapshot = await getDocs(productsRef)
        const currentProductsInStock = productsSnapshot.docs.reduce(
          (total, doc) => {
            const productData = doc.data()
            return total + (productData.stockQuantity || 0)
          },
          0
        )

        // Calcular variações percentuais
        const revenueChange = calculatePercentageChange(currentMonthRevenue, previousMonthRevenue)
        const profitChange = calculatePercentageChange(currentMonthProfit, previousMonthProfit)

        setDashboardData({
          monthlyRevenue: currentMonthRevenue,
          activeCustomers: currentActiveCustomers,
          productsInStock: currentProductsInStock,
          totalProfit: currentMonthProfit,
          revenueChange,
          customersChange: '0%',
          productsChange: null,
          profitChange,
          monthlySales,
          topProducts
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
            {dashboardData.monthlySales.length > 0 ? (
              <Box sx={{ flex: 1, width: '100%' }}>
                <BarChart
                  dataset={dashboardData.monthlySales}
                  series={[{
                    dataKey: 'total',
                    label: 'Vendas',
                    valueFormatter: (value) => formatCurrency(value),
                  }]}
                  xAxis={[{
                    dataKey: 'month',
                    scaleType: 'band',
                  }]}
                  height={300}
                />
              </Box>
            ) : (
              <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Nenhuma venda registrada no período
                </Typography>
              </Box>
            )}
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
            {dashboardData.topProducts.length > 0 ? (
              <Box sx={{ flex: 1, overflow: 'auto' }}>
                {dashboardData.topProducts.map((product, index) => (
                  <Box
                    key={product.name}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mb: 2,
                      p: 2,
                      borderRadius: 1,
                      bgcolor: `${theme.palette.primary.main}${(5 - index) * 2}0`,
                    }}
                  >
                    <Typography variant="body1" sx={{ color: 'white' }}>
                      {product.name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'white' }}>
                      {product.quantity} unidades
                    </Typography>
                  </Box>
                ))}
              </Box>
            ) : (
              <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Nenhum produto vendido no período
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}

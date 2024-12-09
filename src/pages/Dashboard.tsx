import { useState, useEffect } from 'react'
import { 
  Box, 
  Grid, 
  Paper, 
  Typography, 
  useTheme,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  LinearProgress,
  Tooltip
} from '@mui/material'
import AttachMoneyIcon from '@mui/icons-material/AttachMoney'
import PeopleIcon from '@mui/icons-material/People'
import InventoryIcon from '@mui/icons-material/Inventory'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import { collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore'
import { db } from '../config/firebase'
import { BarChart } from '@mui/x-charts'
import { ProductCategory } from '../types/product'

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
  id?: string
  items: SaleItem[]
  createdAt: Timestamp
  total: number
}

interface Product {
  id?: string
  name: string
  description: string
  sku: string
  barcode?: string
  price: number
  cost: number
  category?: string
  supplier?: string
  unit: string
  minStock: number
  maxStock: number
  currentStock: number
  status: 'active' | 'inactive'
  createdAt?: string
  updatedAt?: string
}

interface TopProduct {
  id: string
  name: string
  quantity: number
  revenue: number
  profit: number
  averagePrice: number
  lastSale?: Date
  category?: string
}

interface MonthlySale {
  month: string;
  value: number;
}

interface DatasetType {
  [key: string]: string | number;
  month: string;
  value: number;
}

interface DashboardData {
  monthlyRevenue: number
  activeCustomers: number
  productsInStock: number
  totalProfit: number
  revenueChange: string
  customersChange: string
  productsChange: string | null
  profitChange: string
  monthlySales: MonthlySale[]
  topProducts: TopProduct[]
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
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    monthlyRevenue: 0,
    activeCustomers: 0,
    productsInStock: 0,
    totalProfit: 0,
    revenueChange: '',
    customersChange: '',
    productsChange: null,
    profitChange: '',
    monthlySales: [],
    topProducts: []
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

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Buscar categorias primeiro
      const categoriesRef = collection(db, 'categories')
      const categoriesSnapshot = await getDocs(categoriesRef)
      const categoriesData = categoriesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ProductCategory[]
      setCategories(categoriesData)

      // Datas para filtros
      const now = new Date()
      const firstDayCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const firstDayPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const lastDayPreviousMonth = new Date(now.getFullYear(), now.getMonth(), 0)
      const sixMonthsAgo = new Date(now)
      sixMonthsAgo.setMonth(now.getMonth() - 5)
      sixMonthsAgo.setDate(1)

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
      const currentMonthSales = sales.filter(sale => {
        const saleDate = sale.createdAt.toDate()
        return saleDate >= firstDayCurrentMonth && saleDate <= now
      })

      const currentMonthRevenue = currentMonthSales.reduce((total, sale) => {
        return total + (sale.total || 0)
      }, 0)
      
      // Calcular lucro (valor de venda - valor de custo)
      const currentMonthProfit = currentMonthSales.reduce((total, sale) => {
        return total + sale.items.reduce((itemProfit, item) => {
          const saleValue = (item.quantity || 0) * (item.salePrice || 0)
          const costValue = (item.quantity || 0) * (item.costPrice || 0)
          return itemProfit + (saleValue - costValue)
        }, 0)
      }, 0)

      // Calcular vendas e lucro do mês anterior
      const previousMonthSales = sales.filter(sale => {
        const saleDate = sale.createdAt.toDate()
        return saleDate >= firstDayPreviousMonth && saleDate <= lastDayPreviousMonth
      })

      const previousMonthRevenue = previousMonthSales.reduce((total, sale) => {
        return total + (sale.total || 0)
      }, 0)

      const previousMonthProfit = previousMonthSales.reduce((total, sale) => {
        return total + sale.items.reduce((itemProfit, item) => {
          const saleValue = (item.quantity || 0) * (item.salePrice || 0)
          const costValue = (item.quantity || 0) * (item.costPrice || 0)
          return itemProfit + (saleValue - costValue)
        }, 0)
      }, 0)

      // Agrupar vendas por mês
      const months = []
      for (let i = 0; i < 6; i++) {
        const date = new Date(now)
        date.setMonth(date.getMonth() - i)
        const monthKey = date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
        months.unshift(monthKey)
      }

      const salesByMonth: Record<string, MonthlySale> = months.reduce((acc, month) => {
        acc[month] = { month, value: 0 }
        return acc
      }, {} as Record<string, MonthlySale>)

      // Preencher os valores de vendas
      sales.forEach(sale => {
        const date = sale.createdAt.toDate()
        const monthKey = date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
        if (salesByMonth[monthKey]) {
          salesByMonth[monthKey].value += (sale.total || 0)
        }
      })

      const monthlySales: MonthlySale[] = Object.values(salesByMonth).map(sale => ({
        month: sale.month,
        value: Number(sale.value.toFixed(2))
      }))

      // Buscar produtos e calcular estoque total
      const productsRef = collection(db, 'products')
      const productsSnapshot = await getDocs(productsRef)
      const products = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[]

      const currentProductsInStock = products.reduce(
        (total, product) => total + (product.currentStock || 0),
        0
      )

      // Calcular valor total em estoque
      const totalStockValue = products.reduce(
        (total, product) => total + ((product.currentStock || 0) * (product.price || 0)),
        0
      )

      // Calcular custo total em estoque
      const totalStockCost = products.reduce(
        (total, product) => total + ((product.currentStock || 0) * (product.cost || 0)),
        0
      )

      // Calcular produtos mais vendidos com informações detalhadas
      const productSales = new Map<string, TopProduct>()
      
      for (const sale of sales) {
        if (!sale.items) continue

        for (const item of sale.items) {
          if (!item.productId || !item.quantity || !item.salePrice || !item.costPrice) continue

          const productId = item.productId
          const product = products.find(p => p.id === productId)
          
          if (!product) continue

          const revenue = item.quantity * item.salePrice
          const profit = item.quantity * (item.salePrice - item.costPrice)
          const saleDate = sale.createdAt.toDate()
          
          if (!productSales.has(productId)) {
            productSales.set(productId, {
              id: productId,
              name: product.name,
              quantity: 0,
              revenue: 0,
              profit: 0,
              averagePrice: 0,
              category: product.category,
              lastSale: saleDate
            })
          }

          const current = productSales.get(productId)!
          current.quantity += item.quantity
          current.revenue += revenue
          current.profit += profit
          current.averagePrice = current.revenue / current.quantity
          
          if (!current.lastSale || saleDate > current.lastSale) {
            current.lastSale = saleDate
          }
        }
      }

      const topProducts = Array.from(productSales.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5)
        .map(product => ({
          ...product,
          revenue: Number(product.revenue.toFixed(2)),
          profit: Number(product.profit.toFixed(2)),
          averagePrice: Number(product.averagePrice.toFixed(2))
        }))

      // Buscar clientes ativos
      const customersRef = collection(db, 'customers')
      const activeCustomersQuery = query(
        customersRef,
        where('status', '==', 'active')
      )
      const activeCustomersSnapshot = await getDocs(activeCustomersQuery)
      const currentActiveCustomers = activeCustomersSnapshot.size

      // Calcular variações percentuais
      const revenueChange = calculatePercentageChange(currentMonthRevenue, previousMonthRevenue)
      const profitChange = calculatePercentageChange(currentMonthProfit, previousMonthProfit)

      setDashboardData({
        monthlyRevenue: Number(currentMonthRevenue.toFixed(2)),
        activeCustomers: currentActiveCustomers,
        productsInStock: currentProductsInStock,
        totalProfit: Number(currentMonthProfit.toFixed(2)),
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

  useEffect(() => {
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
                  dataset={dashboardData.monthlySales as any[]}
                  series={[{
                    dataKey: 'value',
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
              <TableContainer sx={{ flex: 1, overflow: 'auto' }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Produto</TableCell>
                      <TableCell align="right">Qtd.</TableCell>
                      <TableCell align="right">Receita</TableCell>
                      <TableCell align="right">Lucro</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {dashboardData.topProducts.map((product, index) => {
                      const maxRevenue = dashboardData.topProducts[0].revenue
                      const progress = (product.revenue / maxRevenue) * 100
                      const category = categories.find(c => c.id === product.category)

                      return (
                        <TableRow key={product.id}>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" noWrap>
                                {product.name}
                              </Typography>
                              {product.category && (
                                <Typography variant="caption" color="text.secondary" display="block">
                                  {category?.name || product.category}
                                </Typography>
                              )}
                              <LinearProgress
                                variant="determinate"
                                value={progress}
                                sx={{
                                  mt: 0.5,
                                  height: 4,
                                  borderRadius: 1,
                                  bgcolor: `${theme.palette.primary.main}15`,
                                  '& .MuiLinearProgress-bar': {
                                    bgcolor: theme.palette.primary.main
                                  }
                                }}
                              />
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            <Tooltip title={`Preço Médio: ${formatCurrency(product.averagePrice)}`}>
                              <Typography variant="body2">
                                {product.quantity}
                              </Typography>
                            </Tooltip>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" color="primary">
                              {formatCurrency(product.revenue)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography 
                              variant="body2" 
                              color={product.profit >= 0 ? 'success.main' : 'error.main'}
                            >
                              {formatCurrency(product.profit)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
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

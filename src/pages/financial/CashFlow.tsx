import { useState, useEffect } from 'react'
import {
  Box,
  Grid,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  CircularProgress,
  Card,
  CardContent,
  Divider,
} from '@mui/material'
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AccountBalance as AccountBalanceIcon,
} from '@mui/icons-material'
import { collection, query, getDocs, where, orderBy } from 'firebase/firestore'
import { db } from '../../config/firebase'
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
  ChartData,
  ChartOptions
} from 'chart.js'
import { Line, Bar } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
)

interface Transaction {
  id: string
  type: 'revenue' | 'expense'
  description: string
  amount: number
  date: string
  category: string
  status: 'paid' | 'pending' | 'overdue'
  createdAt: string
  updatedAt: string
}

interface CashFlowSummary {
  totalRevenue: number
  totalExpenses: number
  balance: number
  revenueByCategory: { [key: string]: number }
  expensesByCategory: { [key: string]: number }
  dailyBalance: { [key: string]: number }
}

export default function CashFlow() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<'current' | 'previous' | 'last3'>('current')
  const [summary, setSummary] = useState<CashFlowSummary>({
    totalRevenue: 0,
    totalExpenses: 0,
    balance: 0,
    revenueByCategory: {},
    expensesByCategory: {},
    dailyBalance: {}
  })

  useEffect(() => {
    fetchTransactions()
  }, [period])

  const fetchTransactions = async () => {
    try {
      setLoading(true)
      const now = new Date()
      let startDate: Date
      let endDate: Date

      switch (period) {
        case 'current':
          startDate = startOfMonth(now)
          endDate = endOfMonth(now)
          break
        case 'previous':
          startDate = startOfMonth(subMonths(now, 1))
          endDate = endOfMonth(subMonths(now, 1))
          break
        case 'last3':
          startDate = startOfMonth(subMonths(now, 2))
          endDate = endOfMonth(now)
          break
        default:
          startDate = startOfMonth(now)
          endDate = endOfMonth(now)
      }

      const transactionsRef = collection(db, 'transactions')
      const q = query(
        transactionsRef,
        where('date', '>=', startDate.toISOString()),
        where('date', '<=', endDate.toISOString()),
        orderBy('date', 'asc')
      )

      const querySnapshot = await getDocs(q)
      const transactionsData = querySnapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          date: data.date,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        }
      }) as Transaction[]

      setTransactions(transactionsData)
      calculateSummary(transactionsData)
    } catch (error) {
      console.error('Erro ao carregar transações:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateSummary = (transactionsData: Transaction[]) => {
    const summary: CashFlowSummary = {
      totalRevenue: 0,
      totalExpenses: 0,
      balance: 0,
      revenueByCategory: {},
      expensesByCategory: {},
      dailyBalance: {}
    }

    const now = new Date()
    let startDate: Date
    let endDate: Date

    switch (period) {
      case 'current':
        startDate = startOfMonth(now)
        endDate = endOfMonth(now)
        break
      case 'previous':
        startDate = startOfMonth(subMonths(now, 1))
        endDate = endOfMonth(subMonths(now, 1))
        break
      case 'last3':
        startDate = startOfMonth(subMonths(now, 2))
        endDate = endOfMonth(now)
        break
      default:
        startDate = startOfMonth(now)
        endDate = endOfMonth(now)
    }

    let currentDate = startDate
    while (currentDate <= endDate) {
      const dateKey = format(currentDate, 'dd/MM/yyyy')
      summary.dailyBalance[dateKey] = 0
      currentDate = new Date(currentDate.setDate(currentDate.getDate() + 1))
    }

    let runningBalance = 0
    transactionsData.forEach(transaction => {
      const amount = transaction.amount
      const date = format(new Date(transaction.date), 'dd/MM/yyyy')

      if (transaction.type === 'revenue') {
        summary.totalRevenue += amount
        summary.revenueByCategory[transaction.category] = (summary.revenueByCategory[transaction.category] || 0) + amount
        runningBalance += amount
      } else {
        summary.totalExpenses += amount
        summary.expensesByCategory[transaction.category] = (summary.expensesByCategory[transaction.category] || 0) + amount
        runningBalance -= amount
      }
      
      summary.dailyBalance[date] = runningBalance
    })

    let lastBalance = 0
    Object.keys(summary.dailyBalance).sort().forEach(date => {
      if (summary.dailyBalance[date] === 0) {
        summary.dailyBalance[date] = lastBalance
      } else {
        lastBalance = summary.dailyBalance[date]
      }
    })

    summary.balance = summary.totalRevenue - summary.totalExpenses
    setSummary(summary)
  }

  const chartData: ChartData<'line'> = {
    labels: Object.keys(summary.dailyBalance),
    datasets: [
      {
        label: 'Saldo Diário',
        data: Object.values(summary.dailyBalance),
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      }
    ]
  }

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Saldo Diário'
      }
    }
  }

  const barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Categorias'
      }
    }
  }

  const categoryChartData: ChartData<'bar'> = {
    labels: [...Object.keys(summary.revenueByCategory), ...Object.keys(summary.expensesByCategory)],
    datasets: [
      {
        label: 'Receitas',
        data: Object.values(summary.revenueByCategory),
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
      },
      {
        label: 'Despesas',
        data: Object.values(summary.expensesByCategory),
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      }
    ]
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 4 }}>
        Fluxo de Caixa
      </Typography>

      <Box sx={{ mb: 4 }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Período</InputLabel>
          <Select
            value={period}
            onChange={(e) => setPeriod(e.target.value as typeof period)}
            label="Período"
          >
            <MenuItem value="current">Mês Atual</MenuItem>
            <MenuItem value="previous">Mês Anterior</MenuItem>
            <MenuItem value="last3">Últimos 3 Meses</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingUpIcon color="success" sx={{ mr: 1 }} />
                <Typography variant="h6">Receitas</Typography>
              </Box>
              <Typography variant="h4" color="success.main">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(summary.totalRevenue)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingDownIcon color="error" sx={{ mr: 1 }} />
                <Typography variant="h6">Despesas</Typography>
              </Box>
              <Typography variant="h4" color="error.main">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(summary.totalExpenses)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AccountBalanceIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Saldo</Typography>
              </Box>
              <Typography
                variant="h4"
                color={summary.balance >= 0 ? 'success.main' : 'error.main'}
              >
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(summary.balance)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Evolução do Saldo
            </Typography>
            <Line data={chartData} options={chartOptions} />
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Receitas e Despesas por Categoria
            </Typography>
            <Bar
              data={categoryChartData}
              options={barChartOptions}
            />
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Data</TableCell>
                    <TableCell>Descrição</TableCell>
                    <TableCell>Categoria</TableCell>
                    <TableCell>Tipo</TableCell>
                    <TableCell>Valor</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        {format(new Date(transaction.date), 'dd/MM/yyyy')}
                      </TableCell>
                      <TableCell>{transaction.description}</TableCell>
                      <TableCell>{transaction.category}</TableCell>
                      <TableCell>
                        <Chip
                          label={transaction.type === 'revenue' ? 'Receita' : 'Despesa'}
                          color={transaction.type === 'revenue' ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(transaction.amount)}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={transaction.status}
                          color={
                            transaction.status === 'paid' ? 'success' :
                            transaction.status === 'pending' ? 'warning' : 'error'
                          }
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
} 
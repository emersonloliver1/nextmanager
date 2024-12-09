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
import { collection, query, getDocs, where, orderBy, Timestamp } from 'firebase/firestore'
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
  date: Date
  category: string
  status: string
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
  const [period, setPeriod] = useState('current')
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [summary, setSummary] = useState<CashFlowSummary>({
    totalRevenue: 0,
    totalExpenses: 0,
    balance: 0,
    revenueByCategory: {},
    expensesByCategory: {},
    dailyBalance: {}
  })

  // Função para formatar valores monetários
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  useEffect(() => {
    loadTransactions()
  }, [period])

  const loadTransactions = async () => {
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
        case 'last':
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

      const transactionsRef = collection(db, 'financial_transactions')
      const q = query(
        transactionsRef,
        where('date', '>=', Timestamp.fromDate(startDate)),
        where('date', '<=', Timestamp.fromDate(endDate)),
        orderBy('date', 'desc')
      )
      const querySnapshot = await getDocs(q)
      
      const transactionsList = querySnapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          date: data.date.toDate(),
        }
      }) as Transaction[]

      setTransactions(transactionsList)

      // Calcular resumo
      const summary = calculateSummary(transactionsList)
      setSummary(summary)
    } catch (error) {
      console.error('Erro ao carregar transações:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateSummary = (transactions: Transaction[]): CashFlowSummary => {
    const summary: CashFlowSummary = {
      totalRevenue: 0,
      totalExpenses: 0,
      balance: 0,
      revenueByCategory: {},
      expensesByCategory: {},
      dailyBalance: {}
    }

    transactions.forEach(transaction => {
      const amount = transaction.amount || 0
      const date = format(transaction.date, 'yyyy-MM-dd')
      const category = transaction.category || 'others'

      if (transaction.type === 'revenue') {
        summary.totalRevenue += amount
        summary.revenueByCategory[category] = (summary.revenueByCategory[category] || 0) + amount
        summary.dailyBalance[date] = (summary.dailyBalance[date] || 0) + amount
      } else {
        summary.totalExpenses += amount
        summary.expensesByCategory[category] = (summary.expensesByCategory[category] || 0) + amount
        summary.dailyBalance[date] = (summary.dailyBalance[date] || 0) - amount
      }
    })

    summary.balance = summary.totalRevenue - summary.totalExpenses

    return summary
  }

  // Dados para o gráfico de linha (Saldo Diário)
  const lineChartData = {
    labels: Object.keys(summary.dailyBalance).map(date => 
      format(new Date(date), 'dd/MM', { locale: ptBR })
    ),
    datasets: [
      {
        label: 'Saldo Diário',
        data: Object.values(summary.dailyBalance),
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
        fill: false,
      },
    ],
  }

  // Dados para o gráfico de barras (Receitas x Despesas por Categoria)
  const barChartData = {
    labels: [...new Set([
      ...Object.keys(summary.revenueByCategory),
      ...Object.keys(summary.expensesByCategory)
    ])],
    datasets: [
      {
        label: 'Receitas',
        data: Object.values(summary.revenueByCategory),
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        borderColor: 'rgb(75, 192, 192)',
        borderWidth: 1,
      },
      {
        label: 'Despesas',
        data: Object.values(summary.expensesByCategory),
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        borderColor: 'rgb(255, 99, 132)',
        borderWidth: 1,
      },
    ],
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4, fontSize: '1.75rem', fontWeight: 600 }}>
        Fluxo de Caixa
      </Typography>

      {/* Filtro de Período */}
      <Paper sx={{ mb: 3, p: 2 }}>
        <FormControl size="small">
          <InputLabel>Período</InputLabel>
          <Select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            label="Período"
          >
            <MenuItem value="current">Mês Atual</MenuItem>
            <MenuItem value="last">Mês Anterior</MenuItem>
            <MenuItem value="last3">Últimos 3 Meses</MenuItem>
          </Select>
        </FormControl>
      </Paper>

      {loading ? (
        <Box display="flex" justifyContent="center" p={3}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Cards de Resumo */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={2}>
                    <AccountBalanceIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h6">Saldo</Typography>
                  </Box>
                  <Typography variant="h4" color={summary.balance >= 0 ? 'success.main' : 'error.main'}>
                    {formatCurrency(summary.balance)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={2}>
                    <TrendingUpIcon sx={{ mr: 1, color: 'success.main' }} />
                    <Typography variant="h6">Receitas</Typography>
                  </Box>
                  <Typography variant="h4" color="success.main">
                    {formatCurrency(summary.totalRevenue)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={2}>
                    <TrendingDownIcon sx={{ mr: 1, color: 'error.main' }} />
                    <Typography variant="h6">Despesas</Typography>
                  </Box>
                  <Typography variant="h4" color="error.main">
                    {formatCurrency(summary.totalExpenses)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Gráficos */}
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Saldo Diário
                </Typography>
                <Box height={300}>
                  <Line
                    data={lineChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'top' as const,
                        },
                      },
                    }}
                  />
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Receitas x Despesas por Categoria
                </Typography>
                <Box height={300}>
                  <Bar
                    data={barChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'top' as const,
                        },
                      },
                    }}
                  />
                </Box>
              </Paper>
            </Grid>
          </Grid>

          {/* Tabela de Transações */}
          <Paper sx={{ mt: 3 }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Data</TableCell>
                    <TableCell>Descrição</TableCell>
                    <TableCell>Categoria</TableCell>
                    <TableCell>Tipo</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Valor</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        {format(transaction.date, 'dd/MM/yyyy')}
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
                        <Chip
                          label={transaction.status}
                          color={
                            transaction.status === 'paid' ? 'success' :
                            transaction.status === 'pending' ? 'warning' : 'error'
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right" sx={{
                        color: transaction.type === 'revenue' ? 'success.main' : 'error.main'
                      }}>
                        {formatCurrency(transaction.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </>
      )}
    </Box>
  )
} 
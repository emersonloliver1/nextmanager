import { useState, useEffect } from 'react'
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CircularProgress,
} from '@mui/material'
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AccountBalance as AccountBalanceIcon,
} from '@mui/icons-material'
import { collection, query, getDocs, where } from 'firebase/firestore'
import { db } from '../../config/firebase'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

interface FinancialData {
  currentRevenue: number
  previousRevenue: number
  currentExpenses: number
  previousExpenses: number
  currentBalance: number
  previousBalance: number
  revenueGrowth: number
  expensesGrowth: number
  balanceGrowth: number
}

export default function FinancialOverview() {
  const [loading, setLoading] = useState(true)
  const [financialData, setFinancialData] = useState<FinancialData>({
    currentRevenue: 0,
    previousRevenue: 0,
    currentExpenses: 0,
    previousExpenses: 0,
    currentBalance: 0,
    previousBalance: 0,
    revenueGrowth: 0,
    expensesGrowth: 0,
    balanceGrowth: 0
  })

  useEffect(() => {
    fetchFinancialData()
  }, [])

  const fetchFinancialData = async () => {
    try {
      setLoading(true)
      
      // Datas para filtros
      const now = new Date()
      const firstDayCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const firstDayPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const lastDayPreviousMonth = new Date(now.getFullYear(), now.getMonth(), 0)

      // Buscar receitas
      const revenueRef = collection(db, 'transactions')
      const currentMonthRevenueQuery = query(
        revenueRef,
        where('type', '==', 'revenue'),
        where('date', '>=', firstDayCurrentMonth.toISOString()),
        where('date', '<=', now.toISOString())
      )
      const previousMonthRevenueQuery = query(
        revenueRef,
        where('type', '==', 'revenue'),
        where('date', '>=', firstDayPreviousMonth.toISOString()),
        where('date', '<=', lastDayPreviousMonth.toISOString())
      )

      const [currentRevenueSnapshot, previousRevenueSnapshot] = await Promise.all([
        getDocs(currentMonthRevenueQuery),
        getDocs(previousMonthRevenueQuery)
      ])

      const currentRevenue = currentRevenueSnapshot.docs.reduce(
        (total, doc) => total + (doc.data().amount || 0),
        0
      )
      const previousRevenue = previousRevenueSnapshot.docs.reduce(
        (total, doc) => total + (doc.data().amount || 0),
        0
      )

      // Buscar despesas
      const expensesRef = collection(db, 'transactions')
      const currentMonthExpensesQuery = query(
        expensesRef,
        where('type', '==', 'expense'),
        where('date', '>=', firstDayCurrentMonth.toISOString()),
        where('date', '<=', now.toISOString())
      )
      const previousMonthExpensesQuery = query(
        expensesRef,
        where('type', '==', 'expense'),
        where('date', '>=', firstDayPreviousMonth.toISOString()),
        where('date', '<=', lastDayPreviousMonth.toISOString())
      )

      const [currentExpensesSnapshot, previousExpensesSnapshot] = await Promise.all([
        getDocs(currentMonthExpensesQuery),
        getDocs(previousMonthExpensesQuery)
      ])

      const currentExpenses = currentExpensesSnapshot.docs.reduce(
        (total, doc) => total + (doc.data().amount || 0),
        0
      )
      const previousExpenses = previousExpensesSnapshot.docs.reduce(
        (total, doc) => total + (doc.data().amount || 0),
        0
      )

      // Calcular saldos e crescimentos
      const currentBalance = currentRevenue - currentExpenses
      const previousBalance = previousRevenue - previousExpenses

      const revenueGrowth = previousRevenue === 0 ? 100 : ((currentRevenue - previousRevenue) / previousRevenue) * 100
      const expensesGrowth = previousExpenses === 0 ? 100 : ((currentExpenses - previousExpenses) / previousExpenses) * 100
      const balanceGrowth = previousBalance === 0 ? 100 : ((currentBalance - previousBalance) / previousBalance) * 100

      setFinancialData({
        currentRevenue,
        previousRevenue,
        currentExpenses,
        previousExpenses,
        currentBalance,
        previousBalance,
        revenueGrowth,
        expensesGrowth,
        balanceGrowth
      })
    } catch (error) {
      console.error('Erro ao carregar dados financeiros:', error)
    } finally {
      setLoading(false)
    }
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
        Visão Geral Financeira
      </Typography>

      <Grid container spacing={3}>
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
                }).format(financialData.currentRevenue)}
              </Typography>
              <Typography variant="body2" color={financialData.revenueGrowth >= 0 ? 'success.main' : 'error.main'}>
                {financialData.revenueGrowth >= 0 ? '+' : ''}{financialData.revenueGrowth.toFixed(1)}% em relação ao mês anterior
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
                }).format(financialData.currentExpenses)}
              </Typography>
              <Typography variant="body2" color={financialData.expensesGrowth <= 0 ? 'success.main' : 'error.main'}>
                {financialData.expensesGrowth >= 0 ? '+' : ''}{financialData.expensesGrowth.toFixed(1)}% em relação ao mês anterior
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
              <Typography variant="h4" color={financialData.currentBalance >= 0 ? 'success.main' : 'error.main'}>
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(financialData.currentBalance)}
              </Typography>
              <Typography variant="body2" color={financialData.balanceGrowth >= 0 ? 'success.main' : 'error.main'}>
                {financialData.balanceGrowth >= 0 ? '+' : ''}{financialData.balanceGrowth.toFixed(1)}% em relação ao mês anterior
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Evolução Financeira
            </Typography>
            <Line
              data={{
                labels: ['Mês Anterior', 'Mês Atual'],
                datasets: [
                  {
                    label: 'Receitas',
                    data: [financialData.previousRevenue, financialData.currentRevenue],
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.1,
                  },
                  {
                    label: 'Despesas',
                    data: [financialData.previousExpenses, financialData.currentExpenses],
                    borderColor: 'rgb(255, 99, 132)',
                    tension: 0.1,
                  },
                  {
                    label: 'Saldo',
                    data: [financialData.previousBalance, financialData.currentBalance],
                    borderColor: 'rgb(54, 162, 235)',
                    tension: 0.1,
                  }
                ]
              }}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'top' as const,
                  },
                  title: {
                    display: true,
                    text: 'Comparativo Mensal'
                  }
                }
              }}
            />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
} 
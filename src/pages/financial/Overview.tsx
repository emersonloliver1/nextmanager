import { useState, useEffect } from 'react'
import {
  Box,
  Grid,
  Paper,
  Typography,
  useTheme,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  CircularProgress,
} from '@mui/material'
import {
  AccountBalance as AccountBalanceIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Payment as PaymentIcon,
  Receipt as ReceiptIcon,
} from '@mui/icons-material'
import { collection, query, getDocs, where, orderBy, Timestamp } from 'firebase/firestore'
import { db } from '../../config/firebase'

interface FinancialSummary {
  totalRevenue: number
  totalExpenses: number
  accountsReceivable: number
  accountsPayable: number
  cashBalance: number
  revenueChange: string
  expensesChange: string
}

export default function FinancialOverview() {
  const theme = useTheme()
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<FinancialSummary>({
    totalRevenue: 0,
    totalExpenses: 0,
    accountsReceivable: 0,
    accountsPayable: 0,
    cashBalance: 0,
    revenueChange: '',
    expensesChange: ''
  })

  // Função para formatar valores monetários
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  // Função para calcular a variação percentual
  const calculatePercentageChange = (current: number, previous: number): string => {
    if (previous === 0) return '+100%'
    const change = ((current - previous) / previous) * 100
    return `${change > 0 ? '+' : ''}${change.toFixed(1)}%`
  }

  useEffect(() => {
    const fetchFinancialData = async () => {
      try {
        setLoading(true)
        
        // Datas para filtros
        const now = new Date()
        const firstDayCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const firstDayPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const lastDayPreviousMonth = new Date(now.getFullYear(), now.getMonth(), 0)

        // Buscar receitas
        const revenueRef = collection(db, 'financial_transactions')
        const currentMonthRevenueQuery = query(
          revenueRef,
          where('type', '==', 'revenue'),
          where('date', '>=', Timestamp.fromDate(firstDayCurrentMonth)),
          where('date', '<=', Timestamp.fromDate(now))
        )
        const previousMonthRevenueQuery = query(
          revenueRef,
          where('type', '==', 'revenue'),
          where('date', '>=', Timestamp.fromDate(firstDayPreviousMonth)),
          where('date', '<=', Timestamp.fromDate(lastDayPreviousMonth))
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
        const expensesRef = collection(db, 'financial_transactions')
        const currentMonthExpensesQuery = query(
          expensesRef,
          where('type', '==', 'expense'),
          where('date', '>=', Timestamp.fromDate(firstDayCurrentMonth)),
          where('date', '<=', Timestamp.fromDate(now))
        )
        const previousMonthExpensesQuery = query(
          expensesRef,
          where('type', '==', 'expense'),
          where('date', '>=', Timestamp.fromDate(firstDayPreviousMonth)),
          where('date', '<=', Timestamp.fromDate(lastDayPreviousMonth))
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

        // Buscar contas a receber
        const accountsReceivableQuery = query(
          revenueRef,
          where('status', '==', 'pending'),
          orderBy('dueDate', 'asc')
        )
        const accountsReceivableSnapshot = await getDocs(accountsReceivableQuery)
        const totalReceivable = accountsReceivableSnapshot.docs.reduce(
          (total, doc) => total + (doc.data().amount || 0),
          0
        )

        // Buscar contas a pagar
        const accountsPayableQuery = query(
          expensesRef,
          where('status', '==', 'pending'),
          orderBy('dueDate', 'asc')
        )
        const accountsPayableSnapshot = await getDocs(accountsPayableQuery)
        const totalPayable = accountsPayableSnapshot.docs.reduce(
          (total, doc) => total + (doc.data().amount || 0),
          0
        )

        // Calcular saldo em caixa
        const cashBalance = currentRevenue - currentExpenses

        setSummary({
          totalRevenue: currentRevenue,
          totalExpenses: currentExpenses,
          accountsReceivable: totalReceivable,
          accountsPayable: totalPayable,
          cashBalance: cashBalance,
          revenueChange: calculatePercentageChange(currentRevenue, previousRevenue),
          expensesChange: calculatePercentageChange(currentExpenses, previousExpenses)
        })

      } catch (error) {
        console.error('Erro ao carregar dados financeiros:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchFinancialData()
  }, [])

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4, fontSize: '1.75rem', fontWeight: 600 }}>
        Visão Geral Financeira
      </Typography>

      <Grid container spacing={3}>
        {/* Saldo em Caixa */}
        <Grid item xs={12} md={6}>
          <Paper
            sx={{
              p: 3,
              height: '100%',
              background: theme.palette.primary.main,
              color: 'white',
            }}
          >
            <Box display="flex" alignItems="center" mb={2}>
              <AccountBalanceIcon sx={{ mr: 1 }} />
              <Typography variant="h6">Saldo em Caixa</Typography>
            </Box>
            <Typography variant="h4" component="div" gutterBottom>
              {formatCurrency(summary.cashBalance)}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="rgba(255,255,255,0.7)">
                  Entradas
                </Typography>
                <Typography variant="h6">
                  {formatCurrency(summary.totalRevenue)}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="rgba(255,255,255,0.7)">
                  Saídas
                </Typography>
                <Typography variant="h6">
                  {formatCurrency(summary.totalExpenses)}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Contas */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Contas
            </Typography>
            <List>
              <ListItem>
                <ListItemText 
                  primary="A Receber" 
                  secondary={`Vencimento próximo: ${formatCurrency(summary.accountsReceivable)}`}
                />
                <ListItemSecondaryAction>
                  <Typography color="success.main">
                    {formatCurrency(summary.accountsReceivable)}
                  </Typography>
                </ListItemSecondaryAction>
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText 
                  primary="A Pagar" 
                  secondary={`Vencimento próximo: ${formatCurrency(summary.accountsPayable)}`}
                />
                <ListItemSecondaryAction>
                  <Typography color="error.main">
                    {formatCurrency(summary.accountsPayable)}
                  </Typography>
                </ListItemSecondaryAction>
              </ListItem>
            </List>
          </Paper>
        </Grid>

        {/* Receitas */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box display="flex" alignItems="center" mb={2}>
              <TrendingUpIcon sx={{ mr: 1, color: 'success.main' }} />
              <Typography variant="h6">Receitas do Mês</Typography>
            </Box>
            <Typography variant="h4" gutterBottom color="success.main">
              {formatCurrency(summary.totalRevenue)}
            </Typography>
            <Typography variant="body2" color={summary.revenueChange.startsWith('+') ? 'success.main' : 'error.main'}>
              {summary.revenueChange} em relação ao mês anterior
            </Typography>
          </Paper>
        </Grid>

        {/* Despesas */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box display="flex" alignItems="center" mb={2}>
              <TrendingDownIcon sx={{ mr: 1, color: 'error.main' }} />
              <Typography variant="h6">Despesas do Mês</Typography>
            </Box>
            <Typography variant="h4" gutterBottom color="error.main">
              {formatCurrency(summary.totalExpenses)}
            </Typography>
            <Typography variant="body2" color={summary.expensesChange.startsWith('-') ? 'success.main' : 'error.main'}>
              {summary.expensesChange} em relação ao mês anterior
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
} 
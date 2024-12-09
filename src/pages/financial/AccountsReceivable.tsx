import { useState, useEffect } from 'react'
import {
  Box,
  Button,
  Grid,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  CircularProgress,
  InputAdornment,
  Snackbar,
  Alert,
  Autocomplete,
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  AttachMoney as MoneyIcon,
  Event as EventIcon,
  Description as DescriptionIcon,
  Search as SearchIcon,
} from '@mui/icons-material'
import { collection, query, getDocs, addDoc, updateDoc, deleteDoc, doc, orderBy, where, serverTimestamp } from 'firebase/firestore'
import { db } from '../../config/firebase'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { ptBR } from 'date-fns/locale'

interface Customer {
  id: string
  name: string
  document: string
}

interface Invoice {
  id: string
  description: string
  amount: number
  dueDate: Date
  customerId: string
  customerName: string
  status: 'pending' | 'paid' | 'overdue'
  paymentMethod?: string
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export default function AccountsReceivable() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | Invoice['status']>('all')
  const [formData, setFormData] = useState<Partial<Invoice>>({
    status: 'pending',
  })
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<{
    open: boolean
    message: string
    type: 'success' | 'error'
  }>({
    open: false,
    message: '',
    type: 'success'
  })

  // Função para formatar valores monetários
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  // Carregar contas a receber e clientes
  useEffect(() => {
    loadInvoices()
    loadCustomers()
  }, [])

  const loadInvoices = async () => {
    try {
      setLoading(true)
      const invoicesRef = collection(db, 'financial_transactions')
      const q = query(
        invoicesRef,
        where('type', '==', 'revenue'),
        orderBy('dueDate', 'desc')
      )
      const querySnapshot = await getDocs(q)
      
      const invoicesList = querySnapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          dueDate: data.dueDate.toDate(),
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        }
      }) as Invoice[]

      setInvoices(invoicesList)
    } catch (error) {
      console.error('Erro ao carregar contas:', error)
      setFeedback({
        open: true,
        message: 'Erro ao carregar contas. Tente novamente.',
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  const loadCustomers = async () => {
    try {
      const customersRef = collection(db, 'customers')
      const q = query(customersRef, where('status', '==', 'active'))
      const querySnapshot = await getDocs(q)
      
      const customersList = querySnapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          name: data.name,
          document: data.document,
        }
      })

      setCustomers(customersList)
    } catch (error) {
      console.error('Erro ao carregar clientes:', error)
    }
  }

  // Função para salvar conta
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.description?.trim() || !formData.amount || !formData.dueDate || !selectedCustomer) {
      setFeedback({
        open: true,
        message: 'Preencha todos os campos obrigatórios',
        type: 'error'
      })
      return
    }

    try {
      setSaving(true)
      const invoicesRef = collection(db, 'financial_transactions')
      
      const invoiceData = {
        description: formData.description.trim(),
        amount: formData.amount,
        dueDate: formData.dueDate,
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.name,
        status: formData.status || 'pending',
        paymentMethod: formData.paymentMethod || '',
        notes: formData.notes || '',
        type: 'revenue',
      }

      if (formData.id) {
        // Atualizar conta existente
        const docRef = doc(db, 'financial_transactions', formData.id)
        await updateDoc(docRef, {
          ...invoiceData,
          updatedAt: serverTimestamp()
        })
        setFeedback({
          open: true,
          message: 'Conta atualizada com sucesso!',
          type: 'success'
        })
      } else {
        // Criar nova conta
        await addDoc(invoicesRef, {
          ...invoiceData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        })
        setFeedback({
          open: true,
          message: 'Conta cadastrada com sucesso!',
          type: 'success'
        })
      }

      await loadInvoices()
      resetForm()
      setOpenDialog(false)
    } catch (error) {
      console.error('Erro ao salvar conta:', error)
      setFeedback({
        open: true,
        message: 'Erro ao salvar conta. Tente novamente.',
        type: 'error'
      })
    } finally {
      setSaving(false)
    }
  }

  // Função para excluir conta
  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta conta?')) return

    try {
      await deleteDoc(doc(db, 'financial_transactions', id))
      await loadInvoices()
      setFeedback({
        open: true,
        message: 'Conta excluída com sucesso!',
        type: 'success'
      })
    } catch (error) {
      console.error('Erro ao excluir conta:', error)
      setFeedback({
        open: true,
        message: 'Erro ao excluir conta. Tente novamente.',
        type: 'error'
      })
    }
  }

  // Função para resetar formulário
  const resetForm = () => {
    setFormData({
      status: 'pending',
    })
    setSelectedCustomer(null)
  }

  // Filtrar contas
  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = 
      invoice.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4, fontSize: '1.75rem', fontWeight: 600 }}>
        Contas a Receber
      </Typography>

      {/* Filtros e Ações */}
      <Paper sx={{ mb: 3, p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              label="Buscar conta"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                label="Status"
              >
                <MenuItem value="all">Todos</MenuItem>
                <MenuItem value="pending">Pendente</MenuItem>
                <MenuItem value="paid">Pago</MenuItem>
                <MenuItem value="overdue">Vencido</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={5} sx={{ textAlign: 'right' }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                resetForm()
                setOpenDialog(true)
              }}
            >
              Nova Conta
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabela de Contas */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Descrição</TableCell>
              <TableCell>Cliente</TableCell>
              <TableCell>Valor</TableCell>
              <TableCell>Vencimento</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Forma de Pagamento</TableCell>
              <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : filteredInvoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography variant="body2" color="text.secondary">
                    Nenhuma conta encontrada
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredInvoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell>{invoice.description}</TableCell>
                  <TableCell>{invoice.customerName}</TableCell>
                  <TableCell>{formatCurrency(invoice.amount)}</TableCell>
                  <TableCell>
                    {invoice.dueDate.toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={
                        invoice.status === 'pending' ? 'Pendente' :
                        invoice.status === 'paid' ? 'Pago' : 'Vencido'
                      }
                      color={
                        invoice.status === 'pending' ? 'warning' :
                        invoice.status === 'paid' ? 'success' : 'error'
                      }
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{invoice.paymentMethod || '-'}</TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => {
                        setFormData(invoice)
                        setSelectedCustomer(customers.find(c => c.id === invoice.customerId) || null)
                        setOpenDialog(true)
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(invoice.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Modal de Cadastro/Edição */}
      <Dialog
        open={openDialog}
        onClose={() => {
          if (!saving) {
            resetForm()
            setOpenDialog(false)
          }
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {formData.id ? 'Editar Conta' : 'Nova Conta'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Autocomplete
                options={customers}
                getOptionLabel={(option) => `${option.name} (${option.document})`}
                value={selectedCustomer}
                onChange={(_, newValue) => setSelectedCustomer(newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Cliente"
                    required
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descrição"
                value={formData.description || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Valor"
                type="number"
                value={formData.amount || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: Number(e.target.value) }))}
                required
                InputProps={{
                  startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
                <DatePicker
                  label="Data de Vencimento"
                  value={formData.dueDate || null}
                  onChange={(newValue) => setFormData(prev => ({ ...prev, dueDate: newValue }))}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true,
                    },
                  }}
                />
              </LocalizationProvider>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status || 'pending'}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as Invoice['status'] }))}
                  label="Status"
                >
                  <MenuItem value="pending">Pendente</MenuItem>
                  <MenuItem value="paid">Pago</MenuItem>
                  <MenuItem value="overdue">Vencido</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Forma de Pagamento</InputLabel>
                <Select
                  value={formData.paymentMethod || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                  label="Forma de Pagamento"
                >
                  <MenuItem value="credit">Cartão de Crédito</MenuItem>
                  <MenuItem value="debit">Cartão de Débito</MenuItem>
                  <MenuItem value="cash">Dinheiro</MenuItem>
                  <MenuItem value="pix">PIX</MenuItem>
                  <MenuItem value="transfer">Transferência</MenuItem>
                  <MenuItem value="boleto">Boleto</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Observações"
                value={formData.notes || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              resetForm()
              setOpenDialog(false)
            }}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={20} /> : undefined}
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Feedback */}
      <Snackbar
        open={feedback.open}
        autoHideDuration={6000}
        onClose={() => setFeedback(prev => ({ ...prev, open: false }))}
      >
        <Alert
          onClose={() => setFeedback(prev => ({ ...prev, open: false }))}
          severity={feedback.type}
          sx={{ width: '100%' }}
        >
          {feedback.message}
        </Alert>
      </Snackbar>
    </Box>
  )
} 
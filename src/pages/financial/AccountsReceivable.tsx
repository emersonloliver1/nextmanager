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
import { collection, query, getDocs, addDoc, updateDoc, deleteDoc, doc, orderBy, where } from 'firebase/firestore'
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
  createdAt: string
  updatedAt: string
}

export default function AccountsReceivable() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | Invoice['status']>('all')
  const [formData, setFormData] = useState<Partial<Invoice>>({
    description: '',
    amount: 0,
    dueDate: new Date(),
    customerId: '',
    customerName: '',
    status: 'pending',
    paymentMethod: '',
    notes: ''
  })
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  })

  useEffect(() => {
    fetchInvoices()
    fetchCustomers()
  }, [])

  const fetchInvoices = async () => {
    try {
      setLoading(true)
      const invoicesRef = collection(db, 'invoices')
      const q = query(invoicesRef, orderBy('dueDate', 'desc'))
      const querySnapshot = await getDocs(q)
      const invoicesData = querySnapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          dueDate: new Date(data.dueDate),
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        }
      }) as Invoice[]
      setInvoices(invoicesData)
    } catch (error) {
      console.error('Erro ao carregar faturas:', error)
      setSnackbar({
        open: true,
        message: 'Erro ao carregar faturas',
        severity: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchCustomers = async () => {
    try {
      const customersRef = collection(db, 'customers')
      const q = query(customersRef, where('status', '==', 'active'))
      const querySnapshot = await getDocs(q)
      const customersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Customer[]
      setCustomers(customersData)
    } catch (error) {
      console.error('Erro ao carregar clientes:', error)
    }
  }

  const handleSubmit = async () => {
    try {
      setLoading(true)
      const invoiceData = {
        ...formData,
        dueDate: formData.dueDate?.toISOString(),
        createdAt: selectedInvoice?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      if (selectedInvoice?.id) {
        await updateDoc(doc(db, 'invoices', selectedInvoice.id), invoiceData)
      } else {
        await addDoc(collection(db, 'invoices'), invoiceData)
      }

      await fetchInvoices()
      handleCloseDialog()
      setSnackbar({
        open: true,
        message: selectedInvoice ? 'Fatura atualizada com sucesso' : 'Fatura adicionada com sucesso',
        severity: 'success'
      })
    } catch (error) {
      console.error('Erro ao salvar fatura:', error)
      setSnackbar({
        open: true,
        message: 'Erro ao salvar fatura',
        severity: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (invoice: Invoice) => {
    try {
      setLoading(true)
      await deleteDoc(doc(db, 'invoices', invoice.id))
      await fetchInvoices()
      setSnackbar({
        open: true,
        message: 'Fatura excluída com sucesso',
        severity: 'success'
      })
    } catch (error) {
      console.error('Erro ao excluir fatura:', error)
      setSnackbar({
        open: true,
        message: 'Erro ao excluir fatura',
        severity: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    setFormData({
      ...invoice,
      dueDate: new Date(invoice.dueDate)
    })
    setOpenDialog(true)
  }

  const handleAdd = () => {
    setSelectedInvoice(null)
    setFormData({
      description: '',
      amount: 0,
      dueDate: new Date(),
      customerId: '',
      customerName: '',
      status: 'pending',
      paymentMethod: '',
      notes: ''
    })
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setSelectedInvoice(null)
    setFormData({
      description: '',
      amount: 0,
      dueDate: new Date(),
      customerId: '',
      customerName: '',
      status: 'pending',
      paymentMethod: '',
      notes: ''
    })
  }

  const handleCustomerChange = (customer: Customer | null) => {
    setFormData({
      ...formData,
      customerId: customer?.id || '',
      customerName: customer?.name || ''
    })
  }

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter
    return matchesSearch && matchesStatus
  })

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
        Contas a Receber
      </Typography>

      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            placeholder="Pesquisar faturas..."
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ width: 300 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <FormControl size="small" sx={{ width: 200 }}>
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
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAdd}
        >
          Nova Fatura
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Descrição</TableCell>
              <TableCell>Cliente</TableCell>
              <TableCell>Valor</TableCell>
              <TableCell>Vencimento</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Método de Pagamento</TableCell>
              <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredInvoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell>{invoice.description}</TableCell>
                <TableCell>{invoice.customerName}</TableCell>
                <TableCell>
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(invoice.amount)}
                </TableCell>
                <TableCell>
                  {new Date(invoice.dueDate).toLocaleDateString('pt-BR')}
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
                  <IconButton onClick={() => handleEdit(invoice)} color="primary">
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(invoice)} color="error">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedInvoice ? 'Editar Fatura' : 'Nova Fatura'}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Descrição"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Valor"
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
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
                  value={formData.dueDate}
                  onChange={(newValue) => setFormData({ ...formData, dueDate: newValue })}
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
              <Autocomplete
                options={customers}
                getOptionLabel={(option) => option.name}
                value={customers.find(c => c.id === formData.customerId) || null}
                onChange={(_, newValue) => handleCustomerChange(newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Cliente"
                    required
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as Invoice['status'] })}
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
                <InputLabel>Método de Pagamento</InputLabel>
                <Select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  label="Método de Pagamento"
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
                multiline
                rows={4}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {selectedInvoice ? 'Salvar' : 'Criar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
} 
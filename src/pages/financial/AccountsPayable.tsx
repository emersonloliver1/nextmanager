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

interface Bill {
  id: string
  description: string
  amount: number
  dueDate: Date
  category: string
  status: 'pending' | 'paid' | 'overdue'
  supplier?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export default function AccountsPayable() {
  const [bills, setBills] = useState<Bill[]>([])
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | Bill['status']>('all')
  const [formData, setFormData] = useState<Partial<Bill>>({
    description: '',
    amount: 0,
    dueDate: new Date(),
    category: '',
    status: 'pending',
    supplier: '',
    notes: ''
  })
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  })

  useEffect(() => {
    fetchBills()
  }, [])

  const fetchBills = async () => {
    try {
      setLoading(true)
      const billsRef = collection(db, 'bills')
      const q = query(billsRef, orderBy('dueDate', 'desc'))
      const querySnapshot = await getDocs(q)
      const billsData = querySnapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          dueDate: new Date(data.dueDate),
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        }
      }) as Bill[]
      setBills(billsData)
    } catch (error) {
      console.error('Erro ao carregar contas:', error)
      setSnackbar({
        open: true,
        message: 'Erro ao carregar contas',
        severity: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    try {
      setLoading(true)
      const billData = {
        ...formData,
        dueDate: formData.dueDate?.toISOString(),
        createdAt: selectedBill?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      if (selectedBill?.id) {
        await updateDoc(doc(db, 'bills', selectedBill.id), billData)
      } else {
        await addDoc(collection(db, 'bills'), billData)
      }

      await fetchBills()
      handleCloseDialog()
      setSnackbar({
        open: true,
        message: selectedBill ? 'Conta atualizada com sucesso' : 'Conta adicionada com sucesso',
        severity: 'success'
      })
    } catch (error) {
      console.error('Erro ao salvar conta:', error)
      setSnackbar({
        open: true,
        message: 'Erro ao salvar conta',
        severity: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (bill: Bill) => {
    try {
      setLoading(true)
      await deleteDoc(doc(db, 'bills', bill.id))
      await fetchBills()
      setSnackbar({
        open: true,
        message: 'Conta excluída com sucesso',
        severity: 'success'
      })
    } catch (error) {
      console.error('Erro ao excluir conta:', error)
      setSnackbar({
        open: true,
        message: 'Erro ao excluir conta',
        severity: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (bill: Bill) => {
    setSelectedBill(bill)
    setFormData({
      ...bill,
      dueDate: new Date(bill.dueDate)
    })
    setOpenDialog(true)
  }

  const handleAdd = () => {
    setSelectedBill(null)
    setFormData({
      description: '',
      amount: 0,
      dueDate: new Date(),
      category: '',
      status: 'pending',
      supplier: '',
      notes: ''
    })
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setSelectedBill(null)
    setFormData({
      description: '',
      amount: 0,
      dueDate: new Date(),
      category: '',
      status: 'pending',
      supplier: '',
      notes: ''
    })
  }

  const filteredBills = bills.filter(bill => {
    const matchesSearch = bill.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.supplier?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || bill.status === statusFilter
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
        Contas a Pagar
      </Typography>

      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            placeholder="Pesquisar contas..."
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
          Nova Conta
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Descrição</TableCell>
              <TableCell>Valor</TableCell>
              <TableCell>Vencimento</TableCell>
              <TableCell>Categoria</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Fornecedor</TableCell>
              <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredBills.map((bill) => (
              <TableRow key={bill.id}>
                <TableCell>{bill.description}</TableCell>
                <TableCell>
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(bill.amount)}
                </TableCell>
                <TableCell>
                  {new Date(bill.dueDate).toLocaleDateString('pt-BR')}
                </TableCell>
                <TableCell>{bill.category}</TableCell>
                <TableCell>
                  <Chip
                    label={
                      bill.status === 'pending' ? 'Pendente' :
                      bill.status === 'paid' ? 'Pago' : 'Vencido'
                    }
                    color={
                      bill.status === 'pending' ? 'warning' :
                      bill.status === 'paid' ? 'success' : 'error'
                    }
                    size="small"
                  />
                </TableCell>
                <TableCell>{bill.supplier}</TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => handleEdit(bill)} color="primary">
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(bill)} color="error">
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
          {selectedBill ? 'Editar Conta' : 'Nova Conta'}
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
              <FormControl fullWidth required>
                <InputLabel>Categoria</InputLabel>
                <Select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  label="Categoria"
                >
                  <MenuItem value="utilities">Utilidades</MenuItem>
                  <MenuItem value="supplies">Suprimentos</MenuItem>
                  <MenuItem value="services">Serviços</MenuItem>
                  <MenuItem value="rent">Aluguel</MenuItem>
                  <MenuItem value="payroll">Folha de Pagamento</MenuItem>
                  <MenuItem value="taxes">Impostos</MenuItem>
                  <MenuItem value="others">Outros</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as Bill['status'] })}
                  label="Status"
                >
                  <MenuItem value="pending">Pendente</MenuItem>
                  <MenuItem value="paid">Pago</MenuItem>
                  <MenuItem value="overdue">Vencido</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Fornecedor"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
              />
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
            {selectedBill ? 'Salvar' : 'Criar'}
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
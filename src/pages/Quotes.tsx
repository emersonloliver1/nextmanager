import { useState, useEffect } from 'react'
import {
  Box,
  Button,
  Grid,
  Paper,
  Typography,
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
  IconButton,
  CircularProgress,
  Snackbar,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  InputAdornment,
  Autocomplete,
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ShoppingCart as CartIcon,
  Person as PersonIcon,
  Search as SearchIcon,
  AttachMoney as AttachMoneyIcon,
  Description as DescriptionIcon,
} from '@mui/icons-material'
import { collection, query, getDocs, doc, addDoc, updateDoc, deleteDoc, orderBy, where } from 'firebase/firestore'
import { db } from '../config/firebase'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from '../config/firebase'
import { useNavigate } from 'react-router-dom'

interface Customer {
  id: string
  name: string
  email: string
  phone: string
  type: 'person' | 'company'
  document: string
  status: 'active' | 'inactive'
}

interface Product {
  id: string
  name: string
  price: number
  description?: string
  sku: string
  stock: number
}

interface QuoteItem {
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

interface Quote {
  id: string
  quoteNumber: string
  customerId: string
  customerName: string
  status: 'draft' | 'sent' | 'approved' | 'rejected' | 'expired'
  items: QuoteItem[]
  subtotal: number
  discount: number
  total: number
  validUntil: string
  notes?: string
  createdAt: string
  updatedAt: string
  userId: string
}

export default function Quotes() {
  const [user, authLoading] = useAuthState(auth)
  const navigate = useNavigate()
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | Quote['status']>('all')
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null)
  const [formData, setFormData] = useState<Partial<Quote>>({
    quoteNumber: '',
    customerId: '',
    customerName: '',
    status: 'draft',
    items: [],
    subtotal: 0,
    discount: 0,
    total: 0,
    validUntil: new Date().toISOString(),
    notes: ''
  })
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  })

  useEffect(() => {
    if (!user && !authLoading) {
      navigate('/login')
    } else if (user) {
      fetchQuotes()
      fetchCustomers()
      fetchProducts()
    }
  }, [user, authLoading])

  const fetchQuotes = async () => {
    try {
      setLoading(true)
      const quotesRef = collection(db, 'quotes')
      const q = query(quotesRef, orderBy('createdAt', 'desc'))
      const querySnapshot = await getDocs(q)
      const quotesData = querySnapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          validUntil: data.validUntil,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        }
      }) as Quote[]
      setQuotes(quotesData)
    } catch (error) {
      console.error('Erro ao carregar orçamentos:', error)
      setSnackbar({
        open: true,
        message: 'Erro ao carregar orçamentos',
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

  const fetchProducts = async () => {
    try {
      const productsRef = collection(db, 'products')
      const q = query(productsRef, where('status', '==', 'active'))
      const querySnapshot = await getDocs(q)
      const productsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[]
      setProducts(productsData)
    } catch (error) {
      console.error('Erro ao carregar produtos:', error)
    }
  }

  const handleSubmit = async () => {
    try {
      setLoading(true)
      const quoteData = {
        ...formData,
        userId: user?.uid,
        createdAt: selectedQuote?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      if (selectedQuote?.id) {
        await updateDoc(doc(db, 'quotes', selectedQuote.id), quoteData)
      } else {
        await addDoc(collection(db, 'quotes'), quoteData)
      }

      await fetchQuotes()
      handleCloseDialog()
      setSnackbar({
        open: true,
        message: selectedQuote ? 'Orçamento atualizado com sucesso' : 'Orçamento criado com sucesso',
        severity: 'success'
      })
    } catch (error) {
      console.error('Erro ao salvar orçamento:', error)
      setSnackbar({
        open: true,
        message: 'Erro ao salvar orçamento',
        severity: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (quote: Quote) => {
    try {
      setLoading(true)
      await deleteDoc(doc(db, 'quotes', quote.id))
      await fetchQuotes()
      setSnackbar({
        open: true,
        message: 'Orçamento excluído com sucesso',
        severity: 'success'
      })
    } catch (error) {
      console.error('Erro ao excluir orçamento:', error)
      setSnackbar({
        open: true,
        message: 'Erro ao excluir orçamento',
        severity: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (quote: Quote) => {
    setSelectedQuote(quote)
    setFormData({
      ...quote,
      validUntil: quote.validUntil
    })
    setOpenDialog(true)
  }

  const handleAdd = () => {
    setSelectedQuote(null)
    setFormData({
      quoteNumber: '',
      customerId: '',
      customerName: '',
      status: 'draft',
      items: [],
      subtotal: 0,
      discount: 0,
      total: 0,
      validUntil: new Date().toISOString(),
      notes: ''
    })
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setSelectedQuote(null)
    setFormData({
      quoteNumber: '',
      customerId: '',
      customerName: '',
      status: 'draft',
      items: [],
      subtotal: 0,
      discount: 0,
      total: 0,
      validUntil: new Date().toISOString(),
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

  const handleAddItem = (product: Product | null) => {
    if (!product) return

    const newItem: QuoteItem = {
      productId: product.id,
      productName: product.name,
      quantity: 1,
      unitPrice: product.price,
      totalPrice: product.price
    }

    const updatedItems = [...(formData.items || []), newItem]
    const subtotal = calculateSubtotal(updatedItems)
    const total = subtotal - (formData.discount || 0)

    setFormData({
      ...formData,
      items: updatedItems,
      subtotal,
      total
    })
  }

  const handleRemoveItem = (index: number) => {
    const updatedItems = formData.items?.filter((_, i) => i !== index) || []
    const subtotal = calculateSubtotal(updatedItems)
    const total = subtotal - (formData.discount || 0)

    setFormData({
      ...formData,
      items: updatedItems,
      subtotal,
      total
    })
  }

  const handleUpdateItemQuantity = (index: number, quantity: number) => {
    if (!formData.items) return

    const updatedItems = [...formData.items]
    const item = updatedItems[index]
    item.quantity = quantity
    item.totalPrice = item.unitPrice * quantity

    const subtotal = calculateSubtotal(updatedItems)
    const total = subtotal - (formData.discount || 0)

    setFormData({
      ...formData,
      items: updatedItems,
      subtotal,
      total
    })
  }

  const handleDiscountChange = (discount: number) => {
    const subtotal = formData.subtotal || 0
    const total = subtotal - discount

    setFormData({
      ...formData,
      discount,
      total
    })
  }

  const calculateSubtotal = (items: QuoteItem[]): number => {
    return items.reduce((sum, item) => sum + item.totalPrice, 0)
  }

  const filteredQuotes = quotes.filter(quote => {
    const matchesSearch = quote.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.quoteNumber.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || quote.status === statusFilter
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
        Orçamentos
      </Typography>

      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            placeholder="Pesquisar orçamentos..."
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
              <MenuItem value="draft">Rascunho</MenuItem>
              <MenuItem value="sent">Enviado</MenuItem>
              <MenuItem value="approved">Aprovado</MenuItem>
              <MenuItem value="rejected">Rejeitado</MenuItem>
              <MenuItem value="expired">Expirado</MenuItem>
            </Select>
          </FormControl>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAdd}
        >
          Novo Orçamento
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Número</TableCell>
              <TableCell>Cliente</TableCell>
              <TableCell>Valor Total</TableCell>
              <TableCell>Validade</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredQuotes.map((quote) => (
              <TableRow key={quote.id}>
                <TableCell>{quote.quoteNumber}</TableCell>
                <TableCell>{quote.customerName}</TableCell>
                <TableCell>
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(quote.total)}
                </TableCell>
                <TableCell>
                  {new Date(quote.validUntil).toLocaleDateString('pt-BR')}
                </TableCell>
                <TableCell>
                  <Chip
                    label={
                      quote.status === 'draft' ? 'Rascunho' :
                      quote.status === 'sent' ? 'Enviado' :
                      quote.status === 'approved' ? 'Aprovado' :
                      quote.status === 'rejected' ? 'Rejeitado' : 'Expirado'
                    }
                    color={
                      quote.status === 'draft' ? 'default' :
                      quote.status === 'sent' ? 'primary' :
                      quote.status === 'approved' ? 'success' :
                      quote.status === 'rejected' ? 'error' : 'warning'
                    }
                    size="small"
                  />
                </TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => handleEdit(quote)} color="primary">
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(quote)} color="error">
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
          {selectedQuote ? 'Editar Orçamento' : 'Novo Orçamento'}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Número do Orçamento"
                value={formData.quoteNumber}
                onChange={(e) => setFormData({ ...formData, quoteNumber: e.target.value })}
                required
              />
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

            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ mb: 2 }}>
                Itens do Orçamento
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Autocomplete
                  options={products}
                  getOptionLabel={(option) => option.name}
                  onChange={(_, newValue) => handleAddItem(newValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Adicionar Produto"
                      size="small"
                    />
                  )}
                />
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Produto</TableCell>
                      <TableCell>Quantidade</TableCell>
                      <TableCell>Preço Unit.</TableCell>
                      <TableCell>Total</TableCell>
                      <TableCell align="right">Ações</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {formData.items?.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.productName}</TableCell>
                        <TableCell>
                          <TextField
                            type="number"
                            size="small"
                            value={item.quantity}
                            onChange={(e) => handleUpdateItemQuantity(index, Number(e.target.value))}
                            InputProps={{ inputProps: { min: 1 } }}
                            sx={{ width: 100 }}
                          />
                        </TableCell>
                        <TableCell>
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                          }).format(item.unitPrice)}
                        </TableCell>
                        <TableCell>
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                          }).format(item.totalPrice)}
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            onClick={() => handleRemoveItem(index)}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Validade"
                type="date"
                value={new Date(formData.validUntil || '').toISOString().split('T')[0]}
                onChange={(e) => setFormData({ ...formData, validUntil: new Date(e.target.value).toISOString() })}
                required
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Desconto"
                type="number"
                value={formData.discount}
                onChange={(e) => handleDiscountChange(Number(e.target.value))}
                InputProps={{
                  startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as Quote['status'] })}
                  label="Status"
                >
                  <MenuItem value="draft">Rascunho</MenuItem>
                  <MenuItem value="sent">Enviado</MenuItem>
                  <MenuItem value="approved">Aprovado</MenuItem>
                  <MenuItem value="rejected">Rejeitado</MenuItem>
                  <MenuItem value="expired">Expirado</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Total"
                value={new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(formData.total || 0)}
                InputProps={{
                  readOnly: true,
                  startAdornment: (
                    <InputAdornment position="start">
                      <AttachMoneyIcon />
                    </InputAdornment>
                  ),
                }}
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
            {selectedQuote ? 'Salvar' : 'Criar'}
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
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
  validUntil: Date
  notes?: string
  createdAt: Date
  updatedAt: Date
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
  const [saving, setSaving] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [quantity, setQuantity] = useState<number>(1)
  const [formData, setFormData] = useState<Partial<Quote>>({
    status: 'draft',
    items: [],
    subtotal: 0,
    discount: 0,
    total: 0,
    validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias
  })
  const [feedback, setFeedback] = useState<{
    open: boolean
    message: string
    type: 'success' | 'error'
  }>({
    open: false,
    message: '',
    type: 'success'
  })

  // Verificar autenticação
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login')
    }
  }, [user, authLoading, navigate])

  // Carregar dados
  useEffect(() => {
    if (user) {
      loadQuotes()
      loadCustomers()
      loadProducts()
    }
  }, [user])

  const loadQuotes = async () => {
    if (!user) return

    try {
      setLoading(true)
      const quotesRef = collection(db, 'quotes')
      const q = query(quotesRef, orderBy('createdAt', 'desc'))
      const querySnapshot = await getDocs(q)
      
      const quotesList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        validUntil: doc.data().validUntil?.toDate(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as Quote[]

      setQuotes(quotesList)
    } catch (error) {
      console.error('Erro ao carregar orçamentos:', error)
      setFeedback({
        open: true,
        message: 'Erro ao carregar orçamentos. Tente novamente.',
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
      
      const customersList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Customer[]

      setCustomers(customersList)
    } catch (error) {
      console.error('Erro ao carregar clientes:', error)
    }
  }

  const loadProducts = async () => {
    try {
      const productsRef = collection(db, 'products')
      const querySnapshot = await getDocs(productsRef)
      
      const productsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[]

      setProducts(productsList)
    } catch (error) {
      console.error('Erro ao carregar produtos:', error)
    }
  }

  const handleAddItem = () => {
    if (!selectedProduct || quantity <= 0) return

    const newItem: QuoteItem = {
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      quantity: quantity,
      unitPrice: selectedProduct.price,
      totalPrice: selectedProduct.price * quantity
    }

    const updatedItems = [...(formData.items || []), newItem]
    const subtotal = calculateSubtotal(updatedItems)
    const total = subtotal - (formData.discount || 0)

    setFormData(prev => ({
      ...prev,
      items: updatedItems,
      subtotal,
      total
    }))

    setSelectedProduct(null)
    setQuantity(1)
  }

  const handleRemoveItem = (index: number) => {
    const updatedItems = formData.items?.filter((_, i) => i !== index) || []
    const subtotal = calculateSubtotal(updatedItems)
    const total = subtotal - (formData.discount || 0)

    setFormData(prev => ({
      ...prev,
      items: updatedItems,
      subtotal,
      total
    }))
  }

  const calculateSubtotal = (items: QuoteItem[]): number => {
    return items.reduce((sum, item) => sum + item.totalPrice, 0)
  }

  const handleDiscountChange = (value: number) => {
    const subtotal = formData.subtotal || 0
    const total = subtotal - value

    setFormData(prev => ({
      ...prev,
      discount: value,
      total
    }))
  }

  const generateQuoteNumber = (): string => {
    const date = new Date()
    const year = date.getFullYear().toString().substr(-2)
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    return `ORC${year}${month}${random}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !selectedCustomer) return

    if (!formData.items?.length) {
      setFeedback({
        open: true,
        message: 'Adicione pelo menos um item ao orçamento',
        type: 'error'
      })
      return
    }

    try {
      setSaving(true)
      const quotesRef = collection(db, 'quotes')
      
      const quoteData = {
        quoteNumber: formData.id ? formData.quoteNumber : generateQuoteNumber(),
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.name,
        status: formData.status || 'draft',
        items: formData.items || [],
        subtotal: formData.subtotal || 0,
        discount: formData.discount || 0,
        total: formData.total || 0,
        validUntil: formData.validUntil || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        notes: formData.notes,
        userId: user.uid,
        updatedAt: new Date(),
      }

      if (formData.id) {
        // Atualizar orçamento existente
        const docRef = doc(db, 'quotes', formData.id)
        await updateDoc(docRef, quoteData)
        setFeedback({
          open: true,
          message: 'Orçamento atualizado com sucesso!',
          type: 'success'
        })
      } else {
        // Criar novo orçamento
        await addDoc(quotesRef, {
          ...quoteData,
          createdAt: new Date(),
        })
        setFeedback({
          open: true,
          message: 'Orçamento criado com sucesso!',
          type: 'success'
        })
      }

      await loadQuotes()
      resetForm()
      setOpenDialog(false)
    } catch (error) {
      console.error('Erro ao salvar orçamento:', error)
      setFeedback({
        open: true,
        message: 'Erro ao salvar orçamento. Tente novamente.',
        type: 'error'
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este orçamento?')) {
      try {
        setLoading(true)
        await deleteDoc(doc(db, 'quotes', id))
        setFeedback({
          open: true,
          message: 'Orçamento excluído com sucesso!',
          type: 'success'
        })
        await loadQuotes()
      } catch (error) {
        console.error('Erro ao excluir orçamento:', error)
        setFeedback({
          open: true,
          message: 'Erro ao excluir orçamento. Tente novamente.',
          type: 'error'
        })
      } finally {
        setLoading(false)
      }
    }
  }

  const resetForm = () => {
    setFormData({
      status: 'draft',
      items: [],
      subtotal: 0,
      discount: 0,
      total: 0,
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    })
    setSelectedCustomer(null)
    setSelectedProduct(null)
    setQuantity(1)
  }

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const getStatusColor = (status: Quote['status']): 'default' | 'primary' | 'secondary' | 'success' | 'error' | 'warning' => {
    const colors: { [key in Quote['status']]: 'default' | 'primary' | 'secondary' | 'success' | 'error' | 'warning' } = {
      draft: 'default',
      sent: 'primary',
      approved: 'success',
      rejected: 'error',
      expired: 'warning'
    }
    return colors[status]
  }

  const getStatusLabel = (status: Quote['status']): string => {
    const labels: { [key in Quote['status']]: string } = {
      draft: 'Rascunho',
      sent: 'Enviado',
      approved: 'Aprovado',
      rejected: 'Rejeitado',
      expired: 'Expirado'
    }
    return labels[status]
  }

  const filteredQuotes = quotes.filter(quote => {
    const matchesSearch = searchTerm === '' || 
      quote.quoteNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.customerName.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || quote.status === statusFilter

    return matchesSearch && matchesStatus
  })

  return (
    <Box>
      {/* Cabeçalho */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" sx={{ fontSize: '1.75rem', fontWeight: 600 }}>
          Orçamentos
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            resetForm()
            setOpenDialog(true)
          }}
        >
          Novo Orçamento
        </Button>
      </Box>

      {/* Filtros */}
      <Paper sx={{ mb: 3, p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              size="small"
              label="Buscar orçamento"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                label="Status"
                disabled={loading}
              >
                <MenuItem value="all">Todos</MenuItem>
                <MenuItem value="draft">Rascunho</MenuItem>
                <MenuItem value="sent">Enviado</MenuItem>
                <MenuItem value="approved">Aprovado</MenuItem>
                <MenuItem value="rejected">Rejeitado</MenuItem>
                <MenuItem value="expired">Expirado</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Lista de Orçamentos */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Número</TableCell>
              <TableCell>Cliente</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Validade</TableCell>
              <TableCell>Total</TableCell>
              <TableCell>Data</TableCell>
              <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              [...Array(3)].map((_, index) => (
                <TableRow key={index}>
                  {[...Array(7)].map((_, cellIndex) => (
                    <TableCell key={cellIndex}>
                      <CircularProgress size={20} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : filteredQuotes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Box sx={{ py: 3 }}>
                    <Typography variant="body1" color="text.secondary" gutterBottom>
                      Nenhum orçamento encontrado
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Tente ajustar os filtros ou criar um novo orçamento
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              filteredQuotes.map((quote) => (
                <TableRow key={quote.id}>
                  <TableCell>{quote.quoteNumber}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PersonIcon fontSize="small" />
                      {quote.customerName}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusLabel(quote.status)}
                      color={getStatusColor(quote.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {quote.validUntil.toLocaleDateString()}
                  </TableCell>
                  <TableCell>{formatCurrency(quote.total)}</TableCell>
                  <TableCell>
                    {quote.createdAt.toLocaleDateString()}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => {
                        setFormData(quote)
                        setSelectedCustomer(customers.find(c => c.id === quote.customerId) || null)
                        setOpenDialog(true)
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(quote.id)}
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
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {formData.id ? 'Editar Orçamento' : 'Novo Orçamento'}
        </DialogTitle>
        <DialogContent dividers>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              {/* Cliente */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mb: 2, color: 'text.secondary' }}>
                  Cliente
                </Typography>
                <Autocomplete
                  options={customers}
                  getOptionLabel={(customer) => customer.name}
                  value={selectedCustomer}
                  onChange={(_, newValue) => setSelectedCustomer(newValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Selecione o cliente"
                      required
                      fullWidth
                    />
                  )}
                  renderOption={(props, customer) => (
                    <Box component="li" {...props}>
                      <PersonIcon sx={{ mr: 1 }} />
                      {customer.name}
                    </Box>
                  )}
                />
              </Grid>

              {/* Produtos */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mb: 2, mt: 2, color: 'text.secondary' }}>
                  Produtos
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Autocomplete
                      options={products}
                      getOptionLabel={(product) => product.name}
                      value={selectedProduct}
                      onChange={(_, newValue) => setSelectedProduct(newValue)}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Selecione o produto"
                          fullWidth
                        />
                      )}
                      renderOption={(props, product) => (
                        <Box component="li" {...props}>
                          <CartIcon sx={{ mr: 1 }} />
                          {product.name} - {formatCurrency(product.price)}
                        </Box>
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Quantidade"
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      InputProps={{
                        inputProps: { min: 1 }
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={handleAddItem}
                      disabled={!selectedProduct || quantity <= 0}
                      sx={{ height: '100%' }}
                    >
                      Adicionar
                    </Button>
                  </Grid>
                </Grid>
              </Grid>

              {/* Lista de Itens */}
              {formData.items && formData.items.length > 0 && (
                <Grid item xs={12}>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Produto</TableCell>
                          <TableCell align="right">Quantidade</TableCell>
                          <TableCell align="right">Preço Unit.</TableCell>
                          <TableCell align="right">Total</TableCell>
                          <TableCell align="right">Ações</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {formData.items.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{item.productName}</TableCell>
                            <TableCell align="right">{item.quantity}</TableCell>
                            <TableCell align="right">{formatCurrency(item.unitPrice)}</TableCell>
                            <TableCell align="right">{formatCurrency(item.totalPrice)}</TableCell>
                            <TableCell align="right">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleRemoveItem(index)}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow>
                          <TableCell colSpan={3} align="right">
                            <strong>Subtotal:</strong>
                          </TableCell>
                          <TableCell align="right" colSpan={2}>
                            <strong>{formatCurrency(formData.subtotal || 0)}</strong>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
              )}

              {/* Informações Adicionais */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mb: 2, mt: 2, color: 'text.secondary' }}>
                  Informações Adicionais
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={formData.status || 'draft'}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as Quote['status'] }))}
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
                  label="Validade"
                  type="date"
                  value={formData.validUntil ? new Date(formData.validUntil).toISOString().split('T')[0] : ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, validUntil: new Date(e.target.value) }))}
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
                  value={formData.discount || ''}
                  onChange={(e) => handleDiscountChange(Number(e.target.value))}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Total"
                  value={formatCurrency(formData.total || 0)}
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
                  multiline
                  rows={4}
                  label="Observações"
                  value={formData.notes || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              if (!saving) {
                resetForm()
                setOpenDialog(false)
              }
            }}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={saving}
            startIcon={saving && <CircularProgress size={20} color="inherit" />}
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
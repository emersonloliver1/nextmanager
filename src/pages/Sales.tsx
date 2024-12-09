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
  ShoppingCart as ShoppingCartIcon,
  Person as PersonIcon,
  Search as SearchIcon,
  AttachMoney as AttachMoneyIcon,
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

interface OrderItem {
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

interface Order {
  id: string
  orderNumber: string
  customerId: string
  customerName: string
  status: 'pending' | 'processing' | 'completed' | 'cancelled'
  items: OrderItem[]
  subtotal: number
  discount: number
  total: number
  paymentMethod: 'credit' | 'debit' | 'cash' | 'pix' | 'transfer'
  paymentStatus: 'pending' | 'paid' | 'refunded'
  notes?: string
  createdAt: string
  updatedAt: string
  userId: string
}

export default function Sales() {
  const [user, authLoading] = useAuthState(auth)
  const navigate = useNavigate()
  const [orders, setOrders] = useState<Order[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | Order['status']>('all')
  const [saving, setSaving] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [quantity, setQuantity] = useState<number>(1)
  const [formData, setFormData] = useState<Partial<Order>>({
    status: 'pending',
    paymentMethod: 'pix',
    paymentStatus: 'pending',
    items: [],
    subtotal: 0,
    discount: 0,
    total: 0,
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
      loadOrders()
      loadCustomers()
      loadProducts()
    }
  }, [user])

  const loadOrders = async () => {
    if (!user) return

    try {
      setLoading(true)
      const ordersRef = collection(db, 'orders')
      const q = query(ordersRef, orderBy('createdAt', 'desc'))
      const querySnapshot = await getDocs(q)
      
      const ordersList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as Order[]

      setOrders(ordersList)
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error)
      setFeedback({
        open: true,
        message: 'Erro ao carregar pedidos. Tente novamente.',
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

    const newItem: OrderItem = {
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

  const calculateSubtotal = (items: OrderItem[]): number => {
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

  const generateOrderNumber = (): string => {
    const date = new Date()
    const year = date.getFullYear().toString().substr(-2)
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    return `PED${year}${month}${random}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !selectedCustomer) return

    if (!formData.items?.length) {
      setFeedback({
        open: true,
        message: 'Adicione pelo menos um item ao pedido',
        type: 'error'
      })
      return
    }

    try {
      setSaving(true)
      const ordersRef = collection(db, 'orders')
      
      const orderData = {
        orderNumber: generateOrderNumber(),
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.name,
        status: formData.status || 'pending',
        items: formData.items || [],
        subtotal: formData.subtotal || 0,
        discount: formData.discount || 0,
        total: formData.total || 0,
        paymentMethod: formData.paymentMethod || 'pix',
        paymentStatus: formData.paymentStatus || 'pending',
        notes: formData.notes,
        userId: user.uid,
        updatedAt: new Date(),
      }

      if (formData.id) {
        // Atualizar pedido existente
        const docRef = doc(db, 'orders', formData.id)
        await updateDoc(docRef, orderData)
        setFeedback({
          open: true,
          message: 'Pedido atualizado com sucesso!',
          type: 'success'
        })
      } else {
        // Criar novo pedido
        await addDoc(ordersRef, {
          ...orderData,
          createdAt: new Date(),
        })
        setFeedback({
          open: true,
          message: 'Pedido criado com sucesso!',
          type: 'success'
        })
      }

      await loadOrders()
      resetForm()
      setOpenDialog(false)
    } catch (error) {
      console.error('Erro ao salvar pedido:', error)
      setFeedback({
        open: true,
        message: 'Erro ao salvar pedido. Tente novamente.',
        type: 'error'
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este pedido?')) {
      try {
        setLoading(true)
        await deleteDoc(doc(db, 'orders', id))
        setFeedback({
          open: true,
          message: 'Pedido excluído com sucesso!',
          type: 'success'
        })
        await loadOrders()
      } catch (error) {
        console.error('Erro ao excluir pedido:', error)
        setFeedback({
          open: true,
          message: 'Erro ao excluir pedido. Tente novamente.',
          type: 'error'
        })
      } finally {
        setLoading(false)
      }
    }
  }

  const resetForm = () => {
    setFormData({
      status: 'pending',
      paymentMethod: 'pix',
      paymentStatus: 'pending',
      items: [],
      subtotal: 0,
      discount: 0,
      total: 0,
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

  const getStatusColor = (status: Order['status']): 'default' | 'primary' | 'secondary' | 'success' | 'error' | 'warning' => {
    const colors: { [key in Order['status']]: 'default' | 'primary' | 'secondary' | 'success' | 'error' | 'warning' } = {
      pending: 'warning',
      processing: 'primary',
      completed: 'success',
      cancelled: 'error'
    }
    return colors[status]
  }

  const getStatusLabel = (status: Order['status']): string => {
    const labels: { [key in Order['status']]: string } = {
      pending: 'Pendente',
      processing: 'Em Processamento',
      completed: 'Concluído',
      cancelled: 'Cancelado'
    }
    return labels[status]
  }

  const getPaymentStatusColor = (status: Order['paymentStatus']): 'default' | 'primary' | 'secondary' | 'success' | 'error' | 'warning' => {
    const colors: { [key in Order['paymentStatus']]: 'default' | 'primary' | 'secondary' | 'success' | 'error' | 'warning' } = {
      pending: 'warning',
      paid: 'success',
      refunded: 'error'
    }
    return colors[status]
  }

  const getPaymentStatusLabel = (status: Order['paymentStatus']): string => {
    const labels: { [key in Order['paymentStatus']]: string } = {
      pending: 'Pendente',
      paid: 'Pago',
      refunded: 'Reembolsado'
    }
    return labels[status]
  }

  const getPaymentMethodLabel = (method: Order['paymentMethod']): string => {
    const labels: { [key in Order['paymentMethod']]: string } = {
      credit: 'Cartão de Crédito',
      debit: 'Cartão de Débito',
      cash: 'Dinheiro',
      pix: 'PIX',
      transfer: 'Transferência'
    }
    return labels[method]
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch = searchTerm === '' || 
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter

    return matchesSearch && matchesStatus
  })

  return (
    <Box>
      {/* Cabeçalho */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" sx={{ fontSize: '1.75rem', fontWeight: 600 }}>
          Pedidos
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            resetForm()
            setOpenDialog(true)
          }}
        >
          Novo Pedido
        </Button>
      </Box>

      {/* Filtros */}
      <Paper sx={{ mb: 3, p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              size="small"
              label="Buscar pedido"
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
                <MenuItem value="pending">Pendente</MenuItem>
                <MenuItem value="processing">Em Processamento</MenuItem>
                <MenuItem value="completed">Concluído</MenuItem>
                <MenuItem value="cancelled">Cancelado</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Lista de Pedidos */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Número</TableCell>
              <TableCell>Cliente</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Pagamento</TableCell>
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
            ) : filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Box sx={{ py: 3 }}>
                    <Typography variant="body1" color="text.secondary" gutterBottom>
                      Nenhum pedido encontrado
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Tente ajustar os filtros ou criar um novo pedido
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>{order.orderNumber}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PersonIcon fontSize="small" />
                      {order.customerName}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusLabel(order.status)}
                      color={getStatusColor(order.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Chip
                        label={getPaymentStatusLabel(order.paymentStatus)}
                        color={getPaymentStatusColor(order.paymentStatus)}
                        size="small"
                        sx={{ mr: 1 }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {getPaymentMethodLabel(order.paymentMethod)}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{formatCurrency(order.total)}</TableCell>
                  <TableCell>
                    {order.createdAt.toLocaleDateString()}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => {
                        setFormData(order)
                        setSelectedCustomer(customers.find(c => c.id === order.customerId) || null)
                        setOpenDialog(true)
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(order.id)}
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
          {formData.id ? 'Editar Pedido' : 'Novo Pedido'}
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
                          <ShoppingCartIcon sx={{ mr: 1 }} />
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

              {/* Informações de Pagamento */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mb: 2, mt: 2, color: 'text.secondary' }}>
                  Pagamento
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Forma de Pagamento</InputLabel>
                  <Select
                    value={formData.paymentMethod || 'pix'}
                    onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value as Order['paymentMethod'] }))}
                    label="Forma de Pagamento"
                  >
                    <MenuItem value="credit">Cartão de Crédito</MenuItem>
                    <MenuItem value="debit">Cartão de Débito</MenuItem>
                    <MenuItem value="cash">Dinheiro</MenuItem>
                    <MenuItem value="pix">PIX</MenuItem>
                    <MenuItem value="transfer">Transferência</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Status do Pagamento</InputLabel>
                  <Select
                    value={formData.paymentStatus || 'pending'}
                    onChange={(e) => setFormData(prev => ({ ...prev, paymentStatus: e.target.value as Order['paymentStatus'] }))}
                    label="Status do Pagamento"
                  >
                    <MenuItem value="pending">Pendente</MenuItem>
                    <MenuItem value="paid">Pago</MenuItem>
                    <MenuItem value="refunded">Reembolsado</MenuItem>
                  </Select>
                </FormControl>
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

              {/* Status do Pedido */}
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Status do Pedido</InputLabel>
                  <Select
                    value={formData.status || 'pending'}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as Order['status'] }))}
                    label="Status do Pedido"
                  >
                    <MenuItem value="pending">Pendente</MenuItem>
                    <MenuItem value="processing">Em Processamento</MenuItem>
                    <MenuItem value="completed">Concluído</MenuItem>
                    <MenuItem value="cancelled">Cancelado</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Observações */}
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
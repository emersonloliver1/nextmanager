import { useState, useEffect } from 'react'
import {
  Box,
  Grid,
  Paper,
  Typography,
  TextField,
  Button,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert,
  CircularProgress,
  InputAdornment,
  Autocomplete,
} from '@mui/material'
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Delete as DeleteIcon,
  ShoppingCart as CartIcon,
  Person as PersonIcon,
  Payment as PaymentIcon,
  Receipt as ReceiptIcon,
  Search as SearchIcon,
} from '@mui/icons-material'
import { collection, addDoc, query, getDocs, where } from 'firebase/firestore'
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

interface CartItem {
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

interface Sale {
  id: string
  saleNumber: string
  customerId?: string
  customerName?: string
  items: CartItem[]
  subtotal: number
  discount: number
  total: number
  paymentMethod: 'credit' | 'debit' | 'cash' | 'pix' | 'transfer'
  paymentStatus: 'pending' | 'paid' | 'refunded'
  notes?: string
  createdAt: Date
  userId: string
}

export default function POS() {
  const [user, authLoading] = useAuthState(auth)
  const navigate = useNavigate()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [quantity, setQuantity] = useState<number>(1)
  const [discount, setDiscount] = useState<number>(0)
  const [paymentMethod, setPaymentMethod] = useState<Sale['paymentMethod']>('pix')
  const [notes, setNotes] = useState<string>('')
  const [openPaymentDialog, setOpenPaymentDialog] = useState(false)
  const [processing, setProcessing] = useState(false)
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
      loadCustomers()
      loadProducts()
    }
  }, [user])

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
    } finally {
      setLoading(false)
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

  const handleAddToCart = () => {
    if (!selectedProduct || quantity <= 0) return

    const existingItemIndex = cartItems.findIndex(item => item.productId === selectedProduct.id)

    if (existingItemIndex >= 0) {
      // Atualizar item existente
      const updatedItems = [...cartItems]
      const item = updatedItems[existingItemIndex]
      item.quantity += quantity
      item.totalPrice = item.unitPrice * item.quantity
      setCartItems(updatedItems)
    } else {
      // Adicionar novo item
      const newItem: CartItem = {
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        quantity: quantity,
        unitPrice: selectedProduct.price,
        totalPrice: selectedProduct.price * quantity
      }
      setCartItems([...cartItems, newItem])
    }

    setSelectedProduct(null)
    setQuantity(1)
  }

  const handleUpdateQuantity = (index: number, increment: boolean) => {
    const updatedItems = [...cartItems]
    const item = updatedItems[index]
    
    if (increment) {
      item.quantity += 1
    } else if (item.quantity > 1) {
      item.quantity -= 1
    }
    
    item.totalPrice = item.unitPrice * item.quantity
    setCartItems(updatedItems)
  }

  const handleRemoveItem = (index: number) => {
    setCartItems(cartItems.filter((_, i) => i !== index))
  }

  const calculateSubtotal = (): number => {
    return cartItems.reduce((sum, item) => sum + item.totalPrice, 0)
  }

  const calculateTotal = (): number => {
    return calculateSubtotal() - discount
  }

  const generateSaleNumber = (): string => {
    const date = new Date()
    const year = date.getFullYear().toString().substr(-2)
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    return `VDA${year}${month}${random}`
  }

  const handleFinalizeSale = async () => {
    if (cartItems.length === 0) {
      setFeedback({
        open: true,
        message: 'Adicione pelo menos um item ao carrinho',
        type: 'error'
      })
      return
    }

    try {
      setProcessing(true)
      const salesRef = collection(db, 'sales')
      
      const saleData: Omit<Sale, 'id'> = {
        saleNumber: generateSaleNumber(),
        customerId: selectedCustomer?.id,
        customerName: selectedCustomer?.name,
        items: cartItems,
        subtotal: calculateSubtotal(),
        discount: discount,
        total: calculateTotal(),
        paymentMethod: paymentMethod,
        paymentStatus: 'paid',
        notes: notes,
        createdAt: new Date(),
        userId: user!.uid,
      }

      await addDoc(salesRef, saleData)

      setFeedback({
        open: true,
        message: 'Venda realizada com sucesso!',
        type: 'success'
      })

      // Limpar carrinho
      setCartItems([])
      setSelectedCustomer(null)
      setDiscount(0)
      setNotes('')
      setOpenPaymentDialog(false)
    } catch (error) {
      console.error('Erro ao finalizar venda:', error)
      setFeedback({
        open: true,
        message: 'Erro ao finalizar venda. Tente novamente.',
        type: 'error'
      })
    } finally {
      setProcessing(false)
    }
  }

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  return (
    <Box>
      {/* Cabeçalho */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontSize: '1.75rem', fontWeight: 600 }}>
          PDV
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Área de Produtos */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="subtitle1" sx={{ mb: 2 }}>
                  Cliente (Opcional)
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
                      fullWidth
                      size="small"
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
              
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle1" sx={{ mb: 2 }}>
                  Adicionar Produtos
                </Typography>
              </Grid>

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
                      size="small"
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
                  size="small"
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
                  variant="contained"
                  onClick={handleAddToCart}
                  disabled={!selectedProduct || quantity <= 0}
                  sx={{ height: '100%' }}
                >
                  Adicionar
                </Button>
              </Grid>
            </Grid>
          </Paper>

          {/* Lista de Itens */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Itens do Carrinho
            </Typography>
            
            <List>
              {cartItems.length === 0 ? (
                <ListItem>
                  <ListItemText
                    primary="Carrinho vazio"
                    secondary="Adicione produtos ao carrinho"
                  />
                </ListItem>
              ) : (
                cartItems.map((item, index) => (
                  <ListItem
                    key={index}
                    secondaryAction={
                      <IconButton
                        edge="end"
                        color="error"
                        onClick={() => handleRemoveItem(index)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    }
                  >
                    <ListItemText
                      primary={item.productName}
                      secondary={`${formatCurrency(item.unitPrice)} x ${item.quantity} = ${formatCurrency(item.totalPrice)}`}
                    />
                    <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleUpdateQuantity(index, false)}
                      >
                        <RemoveIcon />
                      </IconButton>
                      <Typography sx={{ mx: 1 }}>
                        {item.quantity}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => handleUpdateQuantity(index, true)}
                      >
                        <AddIcon />
                      </IconButton>
                    </Box>
                  </ListItem>
                ))
              )}
            </List>
          </Paper>
        </Grid>

        {/* Resumo e Pagamento */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, position: 'sticky', top: 20 }}>
            <Typography variant="h6" gutterBottom>
              Resumo da Venda
            </Typography>

            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body1">Subtotal:</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body1" align="right">
                    {formatCurrency(calculateSubtotal())}
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Desconto"
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                    }}
                  />
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="h6">Total:</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="h6" align="right">
                    {formatCurrency(calculateTotal())}
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    startIcon={<PaymentIcon />}
                    onClick={() => setOpenPaymentDialog(true)}
                    disabled={cartItems.length === 0}
                  >
                    Finalizar Venda
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Modal de Pagamento */}
      <Dialog
        open={openPaymentDialog}
        onClose={() => !processing && setOpenPaymentDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Finalizar Venda</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Forma de Pagamento</InputLabel>
                <Select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as Sale['paymentMethod'])}
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

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Observações"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Resumo
                </Typography>
                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <Typography variant="body2">Subtotal:</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" align="right">
                      {formatCurrency(calculateSubtotal())}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2">Desconto:</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" align="right">
                      {formatCurrency(discount)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2">Total:</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" align="right">
                      {formatCurrency(calculateTotal())}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setOpenPaymentDialog(false)}
            disabled={processing}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleFinalizeSale}
            disabled={processing}
            startIcon={processing ? <CircularProgress size={20} /> : <ReceiptIcon />}
          >
            {processing ? 'Processando...' : 'Confirmar Pagamento'}
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
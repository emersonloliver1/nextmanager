import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from '../config/firebase'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Tabs,
  Tab,
  CircularProgress,
  InputAdornment,
  Skeleton,
  Snackbar,
  Alert,
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  Search as SearchIcon,
} from '@mui/icons-material'
import { collection, query, getDocs, doc, addDoc, updateDoc, deleteDoc, orderBy, serverTimestamp, Timestamp } from 'firebase/firestore'
import { db } from '../config/firebase'
import { IMaskInput } from 'react-imask'
import { formatCPF, formatCNPJ, isValidCPF, isValidCNPJ } from '@brazilian-utils/brazilian-utils'
import axios from 'axios'

interface Customer {
  id: string
  code: string
  name: string
  type: 'person' | 'company'
  document: string
  phone: string
  email: string
  status: 'active' | 'inactive'
  category: 'regular' | 'vip' | 'new'
  notes?: string
  address: {
    cep: string
    logradouro: string
    bairro: string
    cidade: string
    uf: string
    complemento?: string
    numero: string
  }
  createdAt: Date
  updatedAt: Date
}

const TextMaskCustom = IMaskInput

export default function Customers() {
  const [user, authLoading] = useAuthState(auth)
  const navigate = useNavigate()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [currentTab, setCurrentTab] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'regular' | 'vip' | 'new'>('all')
  const [formData, setFormData] = useState<Partial<Customer>>({
    type: 'person',
    status: 'active',
    category: 'regular',
    address: {
      cep: '',
      logradouro: '',
      bairro: '',
      cidade: '',
      uf: '',
      complemento: '',
      numero: '',
    }
  })
  const [documentError, setDocumentError] = useState('')
  const [loadingCep, setLoadingCep] = useState(false)
  const [cepError, setCepError] = useState('')
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

  // Verificar autenticação
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login')
    }
  }, [user, authLoading, navigate])

  // Carregar clientes ao montar o componente
  useEffect(() => {
    loadCustomers()
  }, [])

  // Função para carregar clientes
  const loadCustomers = async () => {
    if (!user) {
      console.error('Usuário não autenticado')
      navigate('/login')
      return
    }

    try {
      setLoading(true)
      const customersRef = collection(db, 'customers')
      const q = query(customersRef, orderBy('createdAt', 'desc'))
      const querySnapshot = await getDocs(q)
      
      const customersList = querySnapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        }
      }) as Customer[]

      setCustomers(customersList)
    } catch (error) {
      console.error('Erro ao carregar clientes:', error)
      if (error instanceof Error && error.message.includes('permission-denied')) {
        setFeedback({
          open: true,
          message: 'Você não tem permissão para acessar os clientes.',
          type: 'error'
        })
      } else {
        setFeedback({
          open: true,
          message: 'Erro ao carregar clientes. Tente novamente.',
          type: 'error'
        })
      }
    } finally {
      setLoading(false)
    }
  }

  // Função para salvar cliente
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Iniciando salvamento do cliente...')

    if (!user) {
      console.error('Usuário não autenticado')
      navigate('/login')
      return
    }
    
    // Validações básicas
    if (!formData.name?.trim()) {
      console.error('Nome é obrigatório')
      setFeedback({
        open: true,
        message: 'Nome é obrigatório',
        type: 'error'
      })
      return
    }

    if (!validateDocument(formData.document || '', formData.type || 'person')) {
      console.error('Documento inválido')
      return
    }

    try {
      setSaving(true)
      console.log('Preparando dados para salvar...')
      
      const customerData = {
        name: formData.name?.trim(),
        type: formData.type || 'person',
        document: formData.document || '',
        phone: formData.phone || '',
        email: formData.email || '',
        status: formData.status || 'active',
        category: formData.category || 'regular',
        notes: formData.notes || '',
        address: {
          cep: formData.address?.cep || '',
          logradouro: formData.address?.logradouro || '',
          bairro: formData.address?.bairro || '',
          cidade: formData.address?.cidade || '',
          uf: formData.address?.uf || '',
          complemento: formData.address?.complemento || '',
          numero: formData.address?.numero || '',
        },
        userId: user.uid,
      }

      console.log('Dados preparados:', customerData)

      const customersRef = collection(db, 'customers')
      
      if (formData.id) {
        // Atualizar cliente existente
        console.log('Atualizando cliente existente:', formData.id)
        const docRef = doc(db, 'customers', formData.id)
        await updateDoc(docRef, {
          ...customerData,
          updatedAt: new Date()
        })
        console.log('Cliente atualizado com sucesso')
        setFeedback({
          open: true,
          message: 'Cliente atualizado com sucesso!',
          type: 'success'
        })
      } else {
        // Criar novo cliente
        console.log('Criando novo cliente...')
        const timestamp = Date.now()
        const code = `CLI${String(timestamp).slice(-5)}`
        console.log('Código gerado:', code)
        
        const docRef = await addDoc(customersRef, {
          ...customerData,
          code,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        console.log('Novo cliente criado com sucesso:', docRef.id)
        setFeedback({
          open: true,
          message: 'Cliente cadastrado com sucesso!',
          type: 'success'
        })
      }

      await loadCustomers()
      resetForm()
      setOpenDialog(false)
    } catch (error) {
      console.error('Erro detalhado ao salvar cliente:', error)
      if (error instanceof Error) {
        setFeedback({
          open: true,
          message: `Erro ao salvar cliente: ${error.message}`,
          type: 'error'
        })
      } else {
        setFeedback({
          open: true,
          message: 'Erro ao salvar cliente. Tente novamente.',
          type: 'error'
        })
      }
    } finally {
      setSaving(false)
    }
  }

  // Função para excluir cliente
  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este cliente?')) {
      try {
        setLoading(true)
        await deleteDoc(doc(db, 'customers', id))
        setFeedback({
          open: true,
          message: 'Cliente excluído com sucesso!',
          type: 'success'
        })
        await loadCustomers()
      } catch (error) {
        console.error('Erro ao excluir cliente:', error)
        setFeedback({
          open: true,
          message: 'Erro ao excluir cliente. Tente novamente.',
          type: 'error'
        })
      } finally {
        setLoading(false)
      }
    }
  }

  // Função para validar documento (CPF/CNPJ)
  const validateDocument = (document: string, type: 'person' | 'company'): boolean => {
    if (!document) {
      setDocumentError('Documento é obrigatório')
      return false
    }
    
    const cleanDocument = document.replace(/\D/g, '')
    if (type === 'person') {
      if (!isValidCPF(cleanDocument)) {
        setDocumentError('CPF inválido')
        return false
      }
    } else {
      if (!isValidCNPJ(cleanDocument)) {
        setDocumentError('CNPJ inválido')
        return false
      }
    }
    setDocumentError('')
    return true
  }

  // Função para buscar CEP
  const searchCep = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '')
    if (cleanCep.length !== 8) {
      setCepError('CEP deve ter 8 dígitos')
      return
    }

    setLoadingCep(true)
    setCepError('')

    try {
      const response = await axios.get(`https://viacep.com.br/ws/${cleanCep}/json/`)
      const data = response.data

      if (data.erro) {
        setCepError('CEP não encontrado')
        return
      }

      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          cep: cleanCep.replace(/(\d{5})(\d{3})/, '$1-$2'),
          logradouro: data.logradouro,
          bairro: data.bairro,
          cidade: data.localidade,
          uf: data.uf,
        }
      }))
    } catch (error) {
      setCepError('Erro ao buscar CEP')
    } finally {
      setLoadingCep(false)
    }
  }

  // Função para gerar código do cliente
  const generateCustomerCode = async () => {
    const customersRef = collection(db, 'customers')
    const querySnapshot = await getDocs(customersRef)
    const totalCustomers = querySnapshot.size
    return `CLI${String(totalCustomers + 1).padStart(5, '0')}`
  }

  // Função para resetar formulário
  const resetForm = () => {
    setFormData({
      type: 'person',
      status: 'active',
      category: 'regular',
      address: {
        cep: '',
        logradouro: '',
        bairro: '',
        cidade: '',
        uf: '',
        complemento: '',
        numero: '',
      }
    })
    setDocumentError('')
    setCepError('')
  }

  // Filtrar clientes
  const filteredCustomers = useMemo(() => {
    return customers.filter(customer => {
      const matchesSearch = searchTerm === '' || 
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.document.includes(searchTerm) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus = statusFilter === 'all' || customer.status === statusFilter
      const matchesCategory = categoryFilter === 'all' || customer.category === categoryFilter
      const matchesType = currentTab === 0 || 
        (currentTab === 1 && customer.type === 'person') ||
        (currentTab === 2 && customer.type === 'company') ||
        (currentTab === 3 && customer.category === 'vip')

      return matchesSearch && matchesStatus && matchesCategory && matchesType
    })
  }, [customers, searchTerm, statusFilter, categoryFilter, currentTab])

  return (
    <Box>
      {/* Cabeçalho */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" sx={{ fontSize: '1.75rem', fontWeight: 600 }}>
          Clientes
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            resetForm()
            setOpenDialog(true)
          }}
        >
          Novo Cliente
        </Button>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={currentTab}
          onChange={(_, newValue) => setCurrentTab(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Todos" />
          <Tab label="Pessoa Física" />
          <Tab label="Pessoa Jurídica" />
          <Tab label="VIP" />
        </Tabs>
      </Paper>

      {/* Filtros */}
      <Paper sx={{ mb: 3, p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              label="Buscar cliente"
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
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                label="Status"
                disabled={loading}
              >
                <MenuItem value="all">Todos</MenuItem>
                <MenuItem value="active">Ativos</MenuItem>
                <MenuItem value="inactive">Inativos</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Categoria</InputLabel>
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as typeof categoryFilter)}
                label="Categoria"
                disabled={loading}
              >
                <MenuItem value="all">Todas</MenuItem>
                <MenuItem value="regular">Regular</MenuItem>
                <MenuItem value="vip">VIP</MenuItem>
                <MenuItem value="new">Novo</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabela de Clientes */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Código</TableCell>
              <TableCell>Nome</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Documento</TableCell>
              <TableCell>Telefone</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Cidade/UF</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Categoria</TableCell>
              <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              [...Array(5)].map((_, index) => (
                <TableRow key={index}>
                  {[...Array(10)].map((_, cellIndex) => (
                    <TableCell key={cellIndex}>
                      <Skeleton animation="wave" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : filteredCustomers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} align="center">
                  <Box sx={{ py: 3 }}>
                    <Typography variant="body1" color="text.secondary" gutterBottom>
                      Nenhum cliente encontrado
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Tente ajustar os filtros ou criar um novo cliente
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              filteredCustomers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>{customer.code}</TableCell>
                  <TableCell>{customer.name}</TableCell>
                  <TableCell>
                    {customer.type === 'person' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                  </TableCell>
                  <TableCell>{customer.document}</TableCell>
                  <TableCell>{customer.phone}</TableCell>
                  <TableCell>{customer.email}</TableCell>
                  <TableCell>{`${customer.address.cidade}/${customer.address.uf}`}</TableCell>
                  <TableCell>
                    <Chip 
                      label={customer.status === 'active' ? 'Ativo' : 'Inativo'}
                      color={customer.status === 'active' ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={customer.category === 'vip' ? 'VIP' : customer.category === 'new' ? 'Novo' : 'Regular'}
                      color={customer.category === 'vip' ? 'primary' : customer.category === 'new' ? 'info' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => {
                        setFormData(customer)
                        setOpenDialog(true)
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(customer.id)}
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
          {formData.id ? 'Editar Cliente' : 'Novo Cliente'}
        </DialogTitle>
        <DialogContent dividers>
          <Box 
            component="form" 
            id="customerForm"
            onSubmit={(e) => {
              e.preventDefault()
              handleSubmit(e)
            }}
            noValidate
            sx={{ mt: 2 }}
          >
            <Grid container spacing={2}>
              {/* Informações Básicas */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mb: 2, color: 'text.secondary' }}>
                  Informações Básicas
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Nome"
                  value={formData.name || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Tipo</InputLabel>
                  <Select
                    value={formData.type || 'person'}
                    onChange={(e) => {
                      setFormData(prev => ({
                        ...prev,
                        type: e.target.value as 'person' | 'company',
                        document: ''
                      }))
                      setDocumentError('')
                    }}
                    label="Tipo"
                  >
                    <MenuItem value="person">Pessoa Física</MenuItem>
                    <MenuItem value="company">Pessoa Jurídica</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={formData.type === 'person' ? 'CPF' : 'CNPJ'}
                  value={formData.document || ''}
                  onChange={(e) => {
                    const value = e.target.value
                    const cleanValue = value.replace(/\D/g, '')
                    setFormData(prev => ({
                      ...prev,
                      document: prev.type === 'person' ? formatCPF(cleanValue) : formatCNPJ(cleanValue)
                    }))
                  }}
                  error={!!documentError}
                  helperText={documentError}
                  required
                  InputProps={{
                    inputComponent: TextMaskCustom as any,
                    inputProps: {
                      mask: formData.type === 'person' ? '000.000.000-00' : '00.000.000/0000-00'
                    }
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={formData.status || 'active'}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'active' | 'inactive' }))}
                    label="Status"
                  >
                    <MenuItem value="active">Ativo</MenuItem>
                    <MenuItem value="inactive">Inativo</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Categoria</InputLabel>
                  <Select
                    value={formData.category || 'regular'}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as 'regular' | 'vip' | 'new' }))}
                    label="Categoria"
                  >
                    <MenuItem value="regular">Regular</MenuItem>
                    <MenuItem value="vip">VIP</MenuItem>
                    <MenuItem value="new">Novo</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Telefone"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  required
                  InputProps={{
                    inputComponent: TextMaskCustom as any,
                    inputProps: {
                      mask: '(00) 00000-0000'
                    }
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="E-mail"
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </Grid>

              {/* Endereço */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mb: 2, mt: 2, color: 'text.secondary' }}>
                  Endereço
                </Typography>
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="CEP"
                  value={formData.address?.cep || ''}
                  onChange={(e) => {
                    const value = e.target.value
                    setFormData(prev => ({
                      ...prev,
                      address: { ...prev.address, cep: value }
                    }))
                    if (value.replace(/\D/g, '').length === 8) {
                      searchCep(value)
                    }
                  }}
                  error={!!cepError}
                  helperText={cepError}
                  required
                  InputProps={{
                    inputComponent: TextMaskCustom as any,
                    inputProps: {
                      mask: '00000-000'
                    },
                    endAdornment: loadingCep && (
                      <InputAdornment position="end">
                        <CircularProgress size={20} />
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={8}>
                <TextField
                  fullWidth
                  label="Logradouro"
                  value={formData.address?.logradouro || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    address: { ...prev.address, logradouro: e.target.value }
                  }))}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Número"
                  value={formData.address?.numero || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    address: { ...prev.address, numero: e.target.value }
                  }))}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={8}>
                <TextField
                  fullWidth
                  label="Complemento"
                  value={formData.address?.complemento || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    address: { ...prev.address, complemento: e.target.value }
                  }))}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Bairro"
                  value={formData.address?.bairro || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    address: { ...prev.address, bairro: e.target.value }
                  }))}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Cidade"
                  value={formData.address?.cidade || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    address: { ...prev.address, cidade: e.target.value }
                  }))}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={2}>
                <TextField
                  fullWidth
                  label="UF"
                  value={formData.address?.uf || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    address: { ...prev.address, uf: e.target.value.toUpperCase() }
                  }))}
                  inputProps={{ maxLength: 2 }}
                  required
                />
              </Grid>

              {/* Observações */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mb: 2, mt: 2, color: 'text.secondary' }}>
                  Observações
                </Typography>
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
            type="submit"
            form="customerForm"
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
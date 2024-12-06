import { useState, useEffect, useMemo } from 'react'
import {
  Box,
  Button,
  Container,
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
  Stack,
  Divider,
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
  Circle as CircleIcon,
  Search as SearchIcon,
} from '@mui/icons-material'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { collection, query, where, getDocs, getDoc, doc, addDoc, updateDoc, deleteDoc, orderBy } from 'firebase/firestore'
import { db } from '../config/firebase'
import InputMask from 'react-input-mask'
import { formatCPF, formatCNPJ, isValidCPF, isValidCNPJ } from '@brazilian-utils/brazilian-utils'
import axios from 'axios'

interface Address {
  cep: string
  logradouro: string
  bairro: string
  cidade: string
  uf: string
  complemento: string
  numero: string
}

interface Customer {
  id: string
  code: string
  name: string
  type: 'person' | 'company'
  document: string
  phone: string
  email: string
  address: Address
  status: 'active' | 'inactive'
  category: 'regular' | 'vip' | 'new'
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(false)
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
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<{
    open: boolean;
    message: string;
    type: 'success' | 'error';
  }>({
    open: false,
    message: '',
    type: 'success'
  })

  useEffect(() => {
    loadCustomers()
  }, [currentTab])

  const loadCustomers = async () => {
    try {
      setLoading(true)
      const customersRef = collection(db, 'customers')
      
      let q = query(customersRef, orderBy('createdAt', 'desc'))
      
      if (currentTab === 1) {
        q = query(customersRef, where('type', '==', 'person'), orderBy('createdAt', 'desc'))
      } else if (currentTab === 2) {
        q = query(customersRef, where('type', '==', 'company'), orderBy('createdAt', 'desc'))
      } else if (currentTab === 3) {
        q = query(customersRef, where('category', '==', 'vip'), orderBy('createdAt', 'desc'))
      }
      
      const querySnapshot = await getDocs(q)
      const customersList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as Customer[]

      setCustomers(customersList)
    } catch (error) {
      console.error('Erro ao carregar clientes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateDocument(formData.document || '', formData.type || 'person')) {
      return
    }

    try {
      setSaving(true)
      const customersRef = collection(db, 'customers')
      
      const customerData = {
        name: formData.name || '',
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
        createdAt: formData.id ? formData.createdAt : new Date(),
        updatedAt: new Date(),
      }

      if (formData.id) {
        // Atualizar cliente existente
        const docRef = doc(db, 'customers', formData.id)
        await updateDoc(docRef, {
          ...customerData,
          updatedAt: new Date(),
        })
        setFeedback({
          open: true,
          message: 'Cliente atualizado com sucesso!',
          type: 'success'
        })
      } else {
        // Criar novo cliente
        const code = await generateCustomerCode()
        await addDoc(customersRef, {
          ...customerData,
          code,
        })
        setFeedback({
          open: true,
          message: 'Cliente cadastrado com sucesso!',
          type: 'success'
        })
      }

      await loadCustomers()
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
      setOpenDialog(false)
    } catch (error) {
      console.error('Erro ao salvar cliente:', error)
      setFeedback({
        open: true,
        message: 'Erro ao salvar cliente. Tente novamente.',
        type: 'error'
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este cliente?')) {
      try {
        setLoading(true)
        await deleteDoc(doc(db, 'customers', id))
        loadCustomers() // Recarrega a lista
      } catch (error) {
        console.error('Erro ao excluir cliente:', error)
      } finally {
        setLoading(false)
      }
    }
  }

  const validateDocument = (document: string, type: 'person' | 'company'): boolean => {
    if (!document) return false
    
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

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const cleanValue = value.replace(/\D/g, '')
    const type = formData.type || 'person'
    
    setFormData(prev => ({
      ...prev,
      document: type === 'person' ? formatCPF(cleanValue) : formatCNPJ(cleanValue)
    }))
  }

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name as string]: value }))
  }

  const generateCustomerCode = async () => {
    const customersRef = collection(db, 'customers')
    const querySnapshot = await getDocs(customersRef)
    const totalCustomers = querySnapshot.size
    const newCode = `CLI${String(totalCustomers + 1).padStart(5, '0')}`
    return newCode
  }

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
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">
          Clientes
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
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
            setOpenDialog(true)
          }}
        >
          Novo Cliente
        </Button>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={currentTab} onChange={(_, value) => setCurrentTab(value)}>
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <span>Todos os Clientes</span>
                {!loading && <Chip 
                  size="small" 
                  label={customers.length} 
                  sx={{ height: 20 }} 
                />}
              </Box>
            } 
          />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <span>Pessoas Físicas</span>
                {!loading && <Chip 
                  size="small" 
                  label={customers.filter(c => c.type === 'person').length} 
                  sx={{ height: 20 }} 
                />}
              </Box>
            } 
          />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <span>Empresas</span>
                {!loading && <Chip 
                  size="small" 
                  label={customers.filter(c => c.type === 'company').length} 
                  sx={{ height: 20 }} 
                />}
              </Box>
            } 
          />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <span>VIP</span>
                {!loading && <Chip 
                  size="small" 
                  color="primary"
                  label={customers.filter(c => c.category === 'vip').length} 
                  sx={{ height: 20 }} 
                />}
              </Box>
            } 
          />
        </Tabs>
      </Paper>

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
          {loading && (
            <Grid item xs={12} md={2}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={20} />
                <Typography variant="body2" color="text.secondary">
                  Carregando...
                </Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      </Paper>

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
                    <Chip
                      size="small"
                      icon={customer.type === 'person' ? <PersonIcon /> : <BusinessIcon />}
                      label={customer.type === 'person' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                    />
                  </TableCell>
                  <TableCell>{customer.document}</TableCell>
                  <TableCell>{customer.phone}</TableCell>
                  <TableCell>{customer.email}</TableCell>
                  <TableCell>{customer.address.cidade}/{customer.address.uf}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      color={customer.status === 'active' ? 'success' : 'error'}
                      label={customer.status === 'active' ? 'Ativo' : 'Inativo'}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      color={customer.category === 'vip' ? 'primary' : 'default'}
                      label={
                        customer.category === 'regular' ? 'Regular' :
                        customer.category === 'vip' ? 'VIP' : 'Novo'
                      }
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
            setOpenDialog(false)
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
          }
        }}
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          {formData.id ? 'Editar Cliente' : 'Novo Cliente'}
        </DialogTitle>
        <DialogContent dividers>
          <Box component="form" id="customerForm" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <Grid container spacing={2}>
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
                        document: '' // Limpa o documento ao trocar o tipo
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
                <InputMask
                  mask={formData.type === 'person' ? '999.999.999-99' : '99.999.999/9999-99'}
                  value={formData.document || ''}
                  onChange={handleDocumentChange}
                >
                  {(inputProps: any) => (
                    <TextField
                      {...inputProps}
                      fullWidth
                      label={formData.type === 'person' ? 'CPF' : 'CNPJ'}
                      error={!!documentError}
                      helperText={documentError}
                      required
                    />
                  )}
                </InputMask>
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
                <InputMask
                  mask="(99) 99999-9999"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                >
                  {(inputProps: any) => (
                    <TextField
                      {...inputProps}
                      fullWidth
                      label="Telefone"
                      required
                    />
                  )}
                </InputMask>
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

              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mb: 2, mt: 2, color: 'text.secondary' }}>
                  Endereço
                </Typography>
              </Grid>

              <Grid item xs={12} sm={4}>
                <InputMask
                  mask="99999-999"
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
                >
                  {(inputProps: any) => (
                    <TextField
                      {...inputProps}
                      fullWidth
                      label="CEP"
                      error={!!cepError}
                      helperText={cepError}
                      required
                      InputProps={{
                        endAdornment: loadingCep && (
                          <InputAdornment position="end">
                            <CircularProgress size={20} />
                          </InputAdornment>
                        )
                      }}
                    />
                  )}
                </InputMask>
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
                setOpenDialog(false)
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

      {/* Snackbar de feedback */}
      <Snackbar
        open={feedback.open}
        autoHideDuration={4000}
        onClose={() => setFeedback(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setFeedback(prev => ({ ...prev, open: false }))} 
          severity={feedback.type}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {feedback.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

// Funções auxiliares
const getStageColor = (stage: string): 'info' | 'primary' | 'secondary' | 'warning' | 'success' | 'error' => {
  const colors: { [key: string]: 'info' | 'primary' | 'secondary' | 'warning' | 'success' | 'error' } = {
    'prospecting': 'info',
    'qualification': 'primary',
    'proposal': 'secondary',
    'negotiation': 'warning',
    'closed-won': 'success',
    'closed-lost': 'error',
  }
  return colors[stage] || 'default'
}

const getStageLabel = (stage: string): string => {
  const labels: { [key: string]: string } = {
    'prospecting': 'Prospecção',
    'qualification': 'Qualificação',
    'proposal': 'Proposta',
    'negotiation': 'Negociação',
    'closed-won': 'Fechado (Ganho)',
    'closed-lost': 'Fechado (Perdido)',
  }
  return labels[stage] || stage
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
} 
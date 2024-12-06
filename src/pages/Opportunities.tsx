import { useState, useEffect } from 'react'
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  IconButton,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  LinearProgress,
  Tooltip,
  Divider,
  Autocomplete,
  Avatar,
  FormControlLabel,
  Switch,
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  AttachMoney as MoneyIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Timeline as TimelineIcon,
  Flag as FlagIcon,
  CalendarToday as CalendarIcon,
  OpenInNew as OpenInNewIcon,
} from '@mui/icons-material'
import { collection, query, getDocs, addDoc, updateDoc, deleteDoc, doc, where, getDoc } from 'firebase/firestore'
import { db } from '../config/firebase'
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'

interface Customer {
  id: string
  name: string
  email: string
  type: 'person' | 'company'
  document: string
}

interface Opportunity {
  id: string
  title: string
  customerId: string
  customerName: string
  customerType: 'person' | 'company'
  value: number
  stage: 'prospecting' | 'qualification' | 'proposal' | 'negotiation' | 'closed-won' | 'closed-lost'
  probability: number
  expectedCloseDate: Date
  type: 'new-business' | 'existing-business'
  source: string
  description: string
  priority: 'low' | 'medium' | 'high'
  assignedTo: string
  createdAt: Date
  updatedAt: Date
}

const initialFormData: Partial<Opportunity> = {
  stage: 'prospecting',
  probability: 20,
  type: 'new-business',
  priority: 'medium',
}

const stages = [
  { value: 'prospecting', label: 'Prospecção', color: 'info', defaultProbability: 20 },
  { value: 'qualification', label: 'Qualificação', color: 'primary', defaultProbability: 40 },
  { value: 'proposal', label: 'Proposta', color: 'secondary', defaultProbability: 60 },
  { value: 'negotiation', label: 'Negociação', color: 'warning', defaultProbability: 80 },
  { value: 'closed-won', label: 'Fechado (Ganho)', color: 'success', defaultProbability: 100 },
  { value: 'closed-lost', label: 'Fechado (Perdido)', color: 'error', defaultProbability: 0 },
]

export default function Opportunities() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [openDialog, setOpenDialog] = useState(false)
  const [formData, setFormData] = useState<Partial<Opportunity>>(initialFormData)
  const [loading, setLoading] = useState(true)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [isNewCustomer, setIsNewCustomer] = useState(false)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const location = useLocation()

  useEffect(() => {
    loadOpportunities()
    loadCustomers()
  }, [])

  useEffect(() => {
    const opportunityId = searchParams.get('id')
    const { state } = location
    
    if (opportunityId) {
      loadOpportunityDetails(opportunityId)
    } else if (state?.customerId) {
      // Se vier da tela de clientes com um cliente pré-selecionado
      const preSelectedCustomerId = state.customerId
      loadCustomerForNewOpportunity(preSelectedCustomerId)
    }
  }, [searchParams, location])

  const loadOpportunityDetails = async (opportunityId: string) => {
    try {
      const opportunityDoc = doc(db, 'opportunities', opportunityId)
      const opportunityData = await getDoc(opportunityDoc)
      
      if (opportunityData.exists()) {
        const data = opportunityData.data()
        setFormData({
          id: opportunityId,
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
          expectedCloseDate: data.expectedCloseDate?.toDate(),
        })

        // Carregar o cliente vinculado
        if (data.customerId) {
          const customerDoc = doc(db, 'customers', data.customerId)
          const customerData = await getDoc(customerDoc)
          if (customerData.exists()) {
            setSelectedCustomer({
              id: data.customerId,
              ...customerData.data()
            } as Customer)
          }
        }

        setOpenDialog(true)
      }
    } catch (error) {
      console.error('Erro ao carregar detalhes da oportunidade:', error)
    }
  }

  const loadCustomerForNewOpportunity = async (customerId: string) => {
    try {
      const customerDoc = doc(db, 'customers', customerId)
      const customerData = await getDoc(customerDoc)
      
      if (customerData.exists()) {
        const customer = {
          id: customerId,
          ...customerData.data()
        } as Customer
        
        setSelectedCustomer(customer)
        setFormData(prev => ({
          ...prev,
          customerId: customer.id,
          customerName: customer.name,
          customerType: customer.type,
        }))
        setOpenDialog(true)
      }
    } catch (error) {
      console.error('Erro ao carregar cliente:', error)
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

  const loadOpportunities = async () => {
    try {
      const opportunitiesRef = collection(db, 'opportunities')
      const q = query(opportunitiesRef)
      const querySnapshot = await getDocs(q)
      
      const opportunitiesList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        expectedCloseDate: doc.data().expectedCloseDate?.toDate(),
      })) as Opportunity[]

      setOpportunities(opportunitiesList)
    } catch (error) {
      console.error('Erro ao carregar oportunidades:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const now = new Date()
      const data = {
        ...formData,
        customerId: selectedCustomer?.id,
        customerName: selectedCustomer?.name,
        customerType: selectedCustomer?.type,
        createdAt: now,
        updatedAt: now,
      }

      if (formData.id) {
        await updateDoc(doc(db, 'opportunities', formData.id), {
          ...data,
          updatedAt: now,
        })
      } else {
        await addDoc(collection(db, 'opportunities'), data)
      }

      setOpenDialog(false)
      setFormData(initialFormData)
      setSelectedCustomer(null)
      loadOpportunities()
    } catch (error) {
      console.error('Erro ao salvar oportunidade:', error)
    }
  }

  const handleCustomerSelect = (customer: Customer | null) => {
    setSelectedCustomer(customer)
    if (customer) {
      setFormData(prev => ({
        ...prev,
        customerId: customer.id,
        customerName: customer.name,
        customerType: customer.type,
      }))
    }
  }

  const navigateToCustomer = (customerId: string) => {
    navigate(`/dashboard/customers?id=${customerId}`)
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta oportunidade?')) {
      try {
        await deleteDoc(doc(db, 'opportunities', id))
        loadOpportunities()
      } catch (error) {
        console.error('Erro ao excluir oportunidade:', error)
      }
    }
  }

  const handleStageChange = (e: any) => {
    const stage = e.target.value
    const defaultProbability = stages.find(s => s.value === stage)?.defaultProbability || 0
    setFormData(prev => ({
      ...prev,
      stage,
      probability: defaultProbability,
    }))
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const getStageColor = (stage: string) => {
    return stages.find(s => s.value === stage)?.color || 'default'
  }

  const getStageLabel = (stage: string) => {
    return stages.find(s => s.value === stage)?.label || stage
  }

  const calculateTotalValue = () => {
    return opportunities.reduce((total, opp) => total + (opp.value || 0), 0)
  }

  const calculateWinRate = () => {
    const closedOpportunities = opportunities.filter(
      opp => opp.stage === 'closed-won' || opp.stage === 'closed-lost'
    )
    const wonOpportunities = opportunities.filter(opp => opp.stage === 'closed-won')
    
    if (closedOpportunities.length === 0) return 0
    return (wonOpportunities.length / closedOpportunities.length) * 100
  }

  return (
    <Box>
      {/* Cabeçalho */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" sx={{ fontSize: '1.75rem', fontWeight: 600 }}>
          Oportunidades
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setFormData(initialFormData)
            setOpenDialog(true)
          }}
        >
          Nova Oportunidade
        </Button>
      </Box>

      {/* Cards de Métricas */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total de Oportunidades
              </Typography>
              <Typography variant="h4">
                {opportunities.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Valor Total
              </Typography>
              <Typography variant="h4">
                {formatCurrency(calculateTotalValue())}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Taxa de Conversão
              </Typography>
              <Typography variant="h4">
                {calculateWinRate().toFixed(1)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Em Negociação
              </Typography>
              <Typography variant="h4">
                {opportunities.filter(opp => opp.stage === 'negotiation').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Lista de Oportunidades */}
      <Grid container spacing={2}>
        {opportunities.map((opportunity) => (
          <Grid item xs={12} key={opportunity.id}>
            <Paper sx={{ p: 2 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="h6">{opportunity.title}</Typography>
                    <Chip
                      size="small"
                      label={getStageLabel(opportunity.stage)}
                      color={getStageColor(opportunity.stage) as any}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                    {opportunity.customerType === 'person' ? (
                      <PersonIcon fontSize="small" color="action" />
                    ) : (
                      <BusinessIcon fontSize="small" color="action" />
                    )}
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1,
                        cursor: 'pointer',
                        '&:hover': { textDecoration: 'underline' }
                      }}
                      onClick={() => navigateToCustomer(opportunity.customerId)}
                    >
                      {opportunity.customerName}
                      <OpenInNewIcon fontSize="small" />
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <MoneyIcon color="action" />
                    <Typography>{formatCurrency(opportunity.value || 0)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TimelineIcon color="action" />
                    <Typography variant="body2">{opportunity.probability}% probabilidade</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={2}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CalendarIcon color="action" />
                    <Typography variant="body2">
                      {opportunity.expectedCloseDate?.toLocaleDateString()}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FlagIcon color="action" />
                    <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                      {opportunity.priority}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={1}>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                    <IconButton
                      size="small"
                      onClick={() => {
                        setFormData(opportunity)
                        setOpenDialog(true)
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(opportunity.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <LinearProgress
                    variant="determinate"
                    value={opportunity.probability}
                    sx={{ height: 4, borderRadius: 2 }}
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Modal de Cadastro/Edição */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {formData.id ? 'Editar Oportunidade' : 'Nova Oportunidade'}
        </DialogTitle>
        <DialogContent dividers>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              {/* Informações Básicas */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mb: 2, color: 'text.secondary' }}>
                  Informações Básicas
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Título da Oportunidade"
                  name="title"
                  value={formData.title || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </Grid>
              
              {/* Campo de Cliente com Toggle */}
              <Grid item xs={12}>
                <Box sx={{ mb: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={isNewCustomer}
                        onChange={(e) => {
                          setIsNewCustomer(e.target.checked)
                          setSelectedCustomer(null)
                          setFormData(prev => ({
                            ...prev,
                            customerId: '',
                            customerName: '',
                            customerType: undefined,
                          }))
                        }}
                      />
                    }
                    label="Cliente não cadastrado"
                  />
                </Box>

                {isNewCustomer ? (
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Nome do Cliente"
                        value={formData.customerName || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          customerName: e.target.value
                        }))}
                        required
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth required>
                        <InputLabel>Tipo de Cliente</InputLabel>
                        <Select
                          value={formData.customerType || ''}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            customerType: e.target.value as 'person' | 'company'
                          }))}
                          label="Tipo de Cliente"
                        >
                          <MenuItem value="person">Pessoa Física</MenuItem>
                          <MenuItem value="company">Pessoa Jurídica</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                ) : (
                  <Autocomplete
                    fullWidth
                    options={customers}
                    getOptionLabel={(option) => `${option.code} - ${option.name}`}
                    value={selectedCustomer}
                    onChange={(_, newValue) => handleCustomerSelect(newValue)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Selecionar Cliente Cadastrado"
                        required
                        error={!selectedCustomer && !isNewCustomer}
                        helperText={!selectedCustomer && !isNewCustomer ? 'Selecione um cliente' : ''}
                      />
                    )}
                    renderOption={(props, option) => {
                      const { key, ...otherProps } = props;
                      return (
                        <Box
                          key={key}
                          {...otherProps}
                          component="li"
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar sx={{ width: 24, height: 24, bgcolor: option.category === 'vip' ? 'primary.main' : 'grey.400' }}>
                              {option.type === 'person' ? <PersonIcon /> : <BusinessIcon />}
                            </Avatar>
                            <Box>
                              <Typography>{option.code} - {option.name}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {option.document} • {option.type === 'person' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                                {option.category === 'vip' && (
                                  <Chip 
                                    size="small" 
                                    label="VIP" 
                                    color="primary" 
                                    sx={{ ml: 1, height: 16 }} 
                                  />
                                )}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      );
                    }}
                    noOptionsText="Nenhum cliente encontrado"
                    loading={loading}
                    loadingText="Carregando clientes..."
                  />
                )}
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Valor"
                  name="value"
                  type="number"
                  value={formData.value || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, value: Number(e.target.value) }))}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                  }}
                  required
                />
              </Grid>

              {/* Status e Probabilidade */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mb: 2, mt: 2, color: 'text.secondary' }}>
                  Status e Probabilidade
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Estágio</InputLabel>
                  <Select
                    name="stage"
                    value={formData.stage || 'prospecting'}
                    onChange={handleStageChange}
                    label="Estágio"
                    required
                  >
                    {stages.map((stage) => (
                      <MenuItem key={stage.value} value={stage.value}>
                        {stage.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Probabilidade (%)"
                  name="probability"
                  type="number"
                  value={formData.probability || 0}
                  onChange={(e) => setFormData(prev => ({ ...prev, probability: Number(e.target.value) }))}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  }}
                  required
                />
              </Grid>

              {/* Detalhes */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mb: 2, mt: 2, color: 'text.secondary' }}>
                  Detalhes
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Tipo</InputLabel>
                  <Select
                    name="type"
                    value={formData.type || 'new-business'}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                    label="Tipo"
                    required
                  >
                    <MenuItem value="new-business">Novo Negócio</MenuItem>
                    <MenuItem value="existing-business">Cliente Existente</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Prioridade</InputLabel>
                  <Select
                    name="priority"
                    value={formData.priority || 'medium'}
                    onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
                    label="Prioridade"
                    required
                  >
                    <MenuItem value="low">Baixa</MenuItem>
                    <MenuItem value="medium">Média</MenuItem>
                    <MenuItem value="high">Alta</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Origem"
                  name="source"
                  value={formData.source || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, source: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Data Prevista de Fechamento"
                  name="expectedCloseDate"
                  type="date"
                  value={formData.expectedCloseDate?.toISOString().split('T')[0] || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, expectedCloseDate: new Date(e.target.value) }))}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Descrição"
                  name="description"
                  value={formData.description || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSubmit}>Salvar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
} 
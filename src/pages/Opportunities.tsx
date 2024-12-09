import { useState, useEffect } from 'react'
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  useTheme,
  SelectChangeEvent
} from '@mui/material'
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material'
import { collection, query, getDocs, addDoc, updateDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore'
import { db } from '../config/firebase'
import { Customer } from '../types/Customer'

interface Opportunity {
  id?: string
  title: string
  customer: Customer
  value: number
  stage: 'new' | 'contact' | 'proposal' | 'negotiation' | 'closed-won' | 'closed-lost'
  expectedClosingDate: Date
  description: string
  createdAt: Date
  updatedAt: Date
}

const initialOpportunity: Opportunity = {
  title: '',
  customer: {
    id: '',
    code: '',
    name: '',
    type: 'individual',
    document: '',
    email: '',
    phone: '',
    status: 'active',
    category: '',
    address: {
      cep: '',
      logradouro: '',
      numero: '',
      bairro: '',
      cidade: '',
      uf: ''
    }
  },
  value: 0,
  stage: 'new',
  expectedClosingDate: new Date(),
  description: '',
  createdAt: new Date(),
  updatedAt: new Date()
}

export default function Opportunities() {
  const theme = useTheme()
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity>(initialOpportunity)
  const [openDialog, setOpenDialog] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    fetchOpportunities()
    fetchCustomers()
  }, [])

  const fetchOpportunities = async () => {
    try {
      const opportunitiesRef = collection(db, 'opportunities')
      const opportunitiesSnapshot = await getDocs(opportunitiesRef)
      const opportunitiesList = opportunitiesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        expectedClosingDate: doc.data().expectedClosingDate?.toDate() || null,
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as Opportunity[]
      setOpportunities(opportunitiesList)
    } catch (error) {
      console.error('Erro ao buscar oportunidades:', error)
    }
  }

  const fetchCustomers = async () => {
    try {
      const customersRef = collection(db, 'customers')
      const customersSnapshot = await getDocs(customersRef)
      const customersList = customersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Customer[]
      setCustomers(customersList)
    } catch (error) {
      console.error('Erro ao buscar clientes:', error)
    }
  }

  const handleOpenDialog = (opportunity?: Opportunity) => {
    if (opportunity) {
      setSelectedOpportunity(opportunity)
      setIsEditing(true)
    } else {
      setSelectedOpportunity(initialOpportunity)
      setIsEditing(false)
    }
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setSelectedOpportunity(initialOpportunity)
    setIsEditing(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setSelectedOpportunity(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target
    if (name === 'customerId') {
      const selectedCustomer = customers.find(c => c.id === value)
      if (selectedCustomer) {
        setSelectedOpportunity(prev => ({
          ...prev,
          customer: selectedCustomer
        }))
      }
    } else {
      setSelectedOpportunity(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const handleSave = async () => {
    try {
      const opportunityData = {
        ...selectedOpportunity,
        value: Number(selectedOpportunity.value),
        expectedClosingDate: Timestamp.fromDate(new Date(selectedOpportunity.expectedClosingDate)),
        updatedAt: Timestamp.fromDate(new Date())
      }

      if (isEditing && selectedOpportunity.id) {
        const opportunityRef = doc(db, 'opportunities', selectedOpportunity.id)
        await updateDoc(opportunityRef, opportunityData)
      } else {
        opportunityData.createdAt = Timestamp.fromDate(new Date())
        await addDoc(collection(db, 'opportunities'), opportunityData)
      }

      handleCloseDialog()
      fetchOpportunities()
    } catch (error) {
      console.error('Erro ao salvar oportunidade:', error)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'opportunities', id))
      fetchOpportunities()
    } catch (error) {
      console.error('Erro ao deletar oportunidade:', error)
    }
  }

  const getStageColor = (stage: string) => {
    const stageColors = {
      'new': theme.palette.info.main,
      'contact': theme.palette.warning.main,
      'proposal': theme.palette.primary.main,
      'negotiation': theme.palette.secondary.main,
      'closed-won': theme.palette.success.main,
      'closed-lost': theme.palette.error.main
    }
    return stageColors[stage as keyof typeof stageColors]
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR').format(date)
  }

  const getStageLabel = (stage: string) => {
    const stageLabels = {
      'new': 'Nova',
      'contact': 'Contato Realizado',
      'proposal': 'Proposta Enviada',
      'negotiation': 'Em Negociação',
      'closed-won': 'Fechada (Ganha)',
      'closed-lost': 'Fechada (Perdida)'
    }
    return stageLabels[stage as keyof typeof stageLabels]
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Oportunidades</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Nova Oportunidade
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Título</TableCell>
              <TableCell>Cliente</TableCell>
              <TableCell>Valor</TableCell>
              <TableCell>Estágio</TableCell>
              <TableCell>Data Prevista</TableCell>
              <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {opportunities.map((opportunity) => (
              <TableRow key={opportunity.id}>
                <TableCell>{opportunity.title}</TableCell>
                <TableCell>{opportunity.customer?.name || 'N/A'}</TableCell>
                <TableCell>{formatCurrency(opportunity.value)}</TableCell>
                <TableCell>
                  <Chip
                    label={getStageLabel(opportunity.stage)}
                    sx={{
                      bgcolor: `${getStageColor(opportunity.stage)}15`,
                      color: getStageColor(opportunity.stage),
                      fontWeight: 'medium'
                    }}
                  />
                </TableCell>
                <TableCell>{formatDate(opportunity.expectedClosingDate)}</TableCell>
                <TableCell align="right">
                  <IconButton
                    color="primary"
                    onClick={() => handleOpenDialog(opportunity)}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() => opportunity.id && handleDelete(opportunity.id)}
                  >
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
          {isEditing ? 'Editar Oportunidade' : 'Nova Oportunidade'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Título"
                name="title"
                value={selectedOpportunity.title}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Cliente</InputLabel>
                <Select
                  name="customerId"
                  value={selectedOpportunity.customer?.id || ''}
                  onChange={handleSelectChange}
                  label="Cliente"
                >
                  {customers.map((customer) => (
                    <MenuItem key={customer.id} value={customer.id}>
                      {customer.name} ({customer.code})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Valor"
                name="value"
                type="number"
                value={selectedOpportunity.value}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Estágio</InputLabel>
                <Select
                  name="stage"
                  value={selectedOpportunity.stage}
                  onChange={handleSelectChange}
                  label="Estágio"
                >
                  <MenuItem value="new">Nova</MenuItem>
                  <MenuItem value="contact">Contato Realizado</MenuItem>
                  <MenuItem value="proposal">Proposta Enviada</MenuItem>
                  <MenuItem value="negotiation">Em Negociação</MenuItem>
                  <MenuItem value="closed-won">Fechada (Ganha)</MenuItem>
                  <MenuItem value="closed-lost">Fechada (Perdida)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Data Prevista de Fechamento"
                name="expectedClosingDate"
                type="date"
                value={selectedOpportunity.expectedClosingDate.toISOString().split('T')[0]}
                onChange={handleInputChange}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descrição"
                name="description"
                multiline
                rows={4}
                value={selectedOpportunity.description}
                onChange={handleInputChange}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSave} variant="contained">
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
} 
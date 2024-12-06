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
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Campaign as CampaignIcon,
  Email as EmailIcon,
  Group as GroupIcon,
  DateRange as DateRangeIcon,
  AttachMoney as AttachMoneyIcon,
  Search as SearchIcon,
} from '@mui/icons-material'
import { collection, query, getDocs, doc, addDoc, updateDoc, deleteDoc, orderBy, serverTimestamp } from 'firebase/firestore'
import { db } from '../config/firebase'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from '../config/firebase'
import { useNavigate } from 'react-router-dom'

interface Campaign {
  id: string
  title: string
  type: 'email' | 'social' | 'event' | 'other'
  status: 'draft' | 'scheduled' | 'active' | 'completed' | 'cancelled'
  startDate: Date
  endDate?: Date
  budget: number
  target: string
  description: string
  expectedReach: number
  actualReach?: number
  conversionRate?: number
  createdAt: Date
  updatedAt: Date
  userId: string
}

export default function Campaigns() {
  const [user, authLoading] = useAuthState(auth)
  const navigate = useNavigate()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | Campaign['status']>('all')
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<Partial<Campaign>>({
    type: 'email',
    status: 'draft',
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

  // Carregar campanhas
  useEffect(() => {
    loadCampaigns()
  }, [user])

  const loadCampaigns = async () => {
    if (!user) return

    try {
      setLoading(true)
      const campaignsRef = collection(db, 'campaigns')
      const q = query(campaignsRef, orderBy('createdAt', 'desc'))
      const querySnapshot = await getDocs(q)
      
      const campaignsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startDate: doc.data().startDate?.toDate(),
        endDate: doc.data().endDate?.toDate(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as Campaign[]

      setCampaigns(campaignsList)
    } catch (error) {
      console.error('Erro ao carregar campanhas:', error)
      setFeedback({
        open: true,
        message: 'Erro ao carregar campanhas. Tente novamente.',
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    if (!formData.title?.trim()) {
      setFeedback({
        open: true,
        message: 'Título é obrigatório',
        type: 'error'
      })
      return
    }

    try {
      setSaving(true)
      const campaignsRef = collection(db, 'campaigns')
      
      const campaignData = {
        title: formData.title.trim(),
        type: formData.type || 'email',
        status: formData.status || 'draft',
        startDate: formData.startDate || new Date(),
        endDate: formData.endDate,
        budget: formData.budget || 0,
        target: formData.target || '',
        description: formData.description || '',
        expectedReach: formData.expectedReach || 0,
        actualReach: formData.actualReach,
        conversionRate: formData.conversionRate,
        userId: user.uid,
        updatedAt: new Date(),
      }

      if (formData.id) {
        // Atualizar campanha existente
        const docRef = doc(db, 'campaigns', formData.id)
        await updateDoc(docRef, campaignData)
        setFeedback({
          open: true,
          message: 'Campanha atualizada com sucesso!',
          type: 'success'
        })
      } else {
        // Criar nova campanha
        await addDoc(campaignsRef, {
          ...campaignData,
          createdAt: new Date(),
        })
        setFeedback({
          open: true,
          message: 'Campanha criada com sucesso!',
          type: 'success'
        })
      }

      await loadCampaigns()
      resetForm()
      setOpenDialog(false)
    } catch (error) {
      console.error('Erro ao salvar campanha:', error)
      setFeedback({
        open: true,
        message: 'Erro ao salvar campanha. Tente novamente.',
        type: 'error'
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta campanha?')) {
      try {
        setLoading(true)
        await deleteDoc(doc(db, 'campaigns', id))
        setFeedback({
          open: true,
          message: 'Campanha excluída com sucesso!',
          type: 'success'
        })
        await loadCampaigns()
      } catch (error) {
        console.error('Erro ao excluir campanha:', error)
        setFeedback({
          open: true,
          message: 'Erro ao excluir campanha. Tente novamente.',
          type: 'error'
        })
      } finally {
        setLoading(false)
      }
    }
  }

  const resetForm = () => {
    setFormData({
      type: 'email',
      status: 'draft',
    })
  }

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const getStatusColor = (status: Campaign['status']): 'default' | 'primary' | 'secondary' | 'success' | 'error' | 'warning' => {
    const colors: { [key in Campaign['status']]: 'default' | 'primary' | 'secondary' | 'success' | 'error' | 'warning' } = {
      draft: 'default',
      scheduled: 'secondary',
      active: 'success',
      completed: 'primary',
      cancelled: 'error'
    }
    return colors[status]
  }

  const getStatusLabel = (status: Campaign['status']): string => {
    const labels: { [key in Campaign['status']]: string } = {
      draft: 'Rascunho',
      scheduled: 'Agendada',
      active: 'Ativa',
      completed: 'Concluída',
      cancelled: 'Cancelada'
    }
    return labels[status]
  }

  const getTypeIcon = (type: Campaign['type']) => {
    const icons = {
      email: <EmailIcon />,
      social: <GroupIcon />,
      event: <CampaignIcon />,
      other: <CampaignIcon />
    }
    return icons[type]
  }

  const getTypeLabel = (type: Campaign['type']): string => {
    const labels: { [key in Campaign['type']]: string } = {
      email: 'E-mail Marketing',
      social: 'Redes Sociais',
      event: 'Evento',
      other: 'Outros'
    }
    return labels[type]
  }

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = searchTerm === '' || 
      campaign.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campaign.description?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter

    return matchesSearch && matchesStatus
  })

  return (
    <Box>
      {/* Cabeçalho */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" sx={{ fontSize: '1.75rem', fontWeight: 600 }}>
          Campanhas
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            resetForm()
            setOpenDialog(true)
          }}
        >
          Nova Campanha
        </Button>
      </Box>

      {/* Filtros */}
      <Paper sx={{ mb: 3, p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              size="small"
              label="Buscar campanha"
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
                <MenuItem value="scheduled">Agendada</MenuItem>
                <MenuItem value="active">Ativa</MenuItem>
                <MenuItem value="completed">Concluída</MenuItem>
                <MenuItem value="cancelled">Cancelada</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Lista de Campanhas */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Título</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Data de Início</TableCell>
              <TableCell>Orçamento</TableCell>
              <TableCell>Alcance Esperado</TableCell>
              <TableCell>Taxa de Conversão</TableCell>
              <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              [...Array(3)].map((_, index) => (
                <TableRow key={index}>
                  {[...Array(8)].map((_, cellIndex) => (
                    <TableCell key={cellIndex}>
                      <CircularProgress size={20} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : filteredCampaigns.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Box sx={{ py: 3 }}>
                    <Typography variant="body1" color="text.secondary" gutterBottom>
                      Nenhuma campanha encontrada
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Tente ajustar os filtros ou criar uma nova campanha
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              filteredCampaigns.map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell>{campaign.title}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getTypeIcon(campaign.type)}
                      {getTypeLabel(campaign.type)}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusLabel(campaign.status)}
                      color={getStatusColor(campaign.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {campaign.startDate.toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {formatCurrency(campaign.budget)}
                  </TableCell>
                  <TableCell>
                    {campaign.expectedReach.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {campaign.conversionRate ? `${campaign.conversionRate}%` : '-'}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => {
                        setFormData(campaign)
                        setOpenDialog(true)
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(campaign.id)}
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
          {formData.id ? 'Editar Campanha' : 'Nova Campanha'}
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
                  label="Título da Campanha"
                  value={formData.title || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Tipo</InputLabel>
                  <Select
                    value={formData.type || 'email'}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as Campaign['type'] }))}
                    label="Tipo"
                  >
                    <MenuItem value="email">E-mail Marketing</MenuItem>
                    <MenuItem value="social">Redes Sociais</MenuItem>
                    <MenuItem value="event">Evento</MenuItem>
                    <MenuItem value="other">Outros</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={formData.status || 'draft'}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as Campaign['status'] }))}
                    label="Status"
                  >
                    <MenuItem value="draft">Rascunho</MenuItem>
                    <MenuItem value="scheduled">Agendada</MenuItem>
                    <MenuItem value="active">Ativa</MenuItem>
                    <MenuItem value="completed">Concluída</MenuItem>
                    <MenuItem value="cancelled">Cancelada</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Data de Início"
                  type="date"
                  value={formData.startDate ? new Date(formData.startDate).toISOString().split('T')[0] : ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: new Date(e.target.value) }))}
                  required
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Data de Término"
                  type="date"
                  value={formData.endDate ? new Date(formData.endDate).toISOString().split('T')[0] : ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: new Date(e.target.value) }))}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>

              {/* Detalhes da Campanha */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mb: 2, mt: 2, color: 'text.secondary' }}>
                  Detalhes da Campanha
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Descrição"
                  value={formData.description || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Público-alvo"
                  value={formData.target || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, target: e.target.value }))}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Orçamento"
                  type="number"
                  value={formData.budget || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, budget: Number(e.target.value) }))}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Alcance Esperado"
                  type="number"
                  value={formData.expectedReach || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, expectedReach: Number(e.target.value) }))}
                />
              </Grid>

              {formData.status === 'completed' && (
                <>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Alcance Real"
                      type="number"
                      value={formData.actualReach || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, actualReach: Number(e.target.value) }))}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Taxa de Conversão (%)"
                      type="number"
                      value={formData.conversionRate || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, conversionRate: Number(e.target.value) }))}
                      InputProps={{
                        endAdornment: <InputAdornment position="end">%</InputAdornment>,
                      }}
                    />
                  </Grid>
                </>
              )}
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
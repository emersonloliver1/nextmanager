import { useState } from 'react'
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
} from '@mui/material'
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material'

interface Customer {
  id: string
  name: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  postalCode: string
  type: 'person' | 'company'
  status: 'active' | 'inactive'
  category: 'regular' | 'vip' | 'new'
  notes: string
  createdAt: Date
}

export default function Customers() {
  const [openDialog, setOpenDialog] = useState(false)
  const [currentTab, setCurrentTab] = useState(0)
  const [formData, setFormData] = useState<Partial<Customer>>({
    type: 'person',
    status: 'active',
    category: 'regular',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implementar integração com Firebase
    console.log(formData)
    setOpenDialog(false)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name as string]: value }))
  }

  return (
    <Box>
      {/* Cabeçalho */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" sx={{ fontSize: '1.75rem', fontWeight: 600 }}>
          Gestão de Clientes
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
        >
          Novo Cliente
        </Button>
      </Box>

      {/* Tabs de navegação */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={currentTab} onChange={(_, value) => setCurrentTab(value)}>
          <Tab label="Todos os Clientes" />
          <Tab label="Pessoas Físicas" />
          <Tab label="Empresas" />
          <Tab label="VIP" />
        </Tabs>
      </Paper>

      {/* Lista de Clientes */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nome</TableCell>
              <TableCell>Contato</TableCell>
              <TableCell>Localização</TableCell>
              <TableCell>Categoria</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="subtitle2">João Silva</Typography>
                  <Chip size="small" label="Pessoa Física" />
                </Box>
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PhoneIcon fontSize="small" color="action" />
                    <Typography variant="body2">(11) 98765-4321</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EmailIcon fontSize="small" color="action" />
                    <Typography variant="body2">joao@email.com</Typography>
                  </Box>
                </Box>
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LocationIcon fontSize="small" color="action" />
                  <Typography variant="body2">São Paulo, SP</Typography>
                </Box>
              </TableCell>
              <TableCell>
                <Chip label="VIP" color="primary" size="small" />
              </TableCell>
              <TableCell>
                <Chip label="Ativo" color="success" size="small" />
              </TableCell>
              <TableCell align="right">
                <IconButton size="small">
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" color="error">
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      {/* Modal de Cadastro/Edição */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {formData.id ? 'Editar Cliente' : 'Novo Cliente'}
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
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Tipo</InputLabel>
                  <Select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
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
                  label={formData.type === 'person' ? 'Nome Completo' : 'Razão Social'}
                  name="name"
                  value={formData.name || ''}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={formData.type === 'person' ? 'CPF' : 'CNPJ'}
                  name="document"
                  value={formData.document || ''}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Categoria</InputLabel>
                  <Select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    label="Categoria"
                  >
                    <MenuItem value="regular">Regular</MenuItem>
                    <MenuItem value="vip">VIP</MenuItem>
                    <MenuItem value="new">Novo</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Contato */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mb: 2, mt: 2, color: 'text.secondary' }}>
                  Informações de Contato
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email || ''}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Telefone"
                  name="phone"
                  value={formData.phone || ''}
                  onChange={handleChange}
                />
              </Grid>

              {/* Endereço */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mb: 2, mt: 2, color: 'text.secondary' }}>
                  Endereço
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Endereço"
                  name="address"
                  value={formData.address || ''}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Cidade"
                  name="city"
                  value={formData.city || ''}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="Estado"
                  name="state"
                  value={formData.state || ''}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="CEP"
                  name="postalCode"
                  value={formData.postalCode || ''}
                  onChange={handleChange}
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
                  name="notes"
                  value={formData.notes || ''}
                  onChange={handleChange}
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
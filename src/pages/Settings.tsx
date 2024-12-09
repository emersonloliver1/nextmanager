import { useState } from 'react'
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  Snackbar
} from '@mui/material'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../config/firebase'

interface CompanySettings extends Record<string, any> {
  name: string
  document: string
  email: string
  phone: string
  address: {
    street: string
    number: string
    complement?: string
    neighborhood: string
    city: string
    state: string
    zipCode: string
  }
  logo?: string
  theme: {
    mode: 'light' | 'dark'
    primaryColor: string
    secondaryColor: string
  }
}

const initialSettings: CompanySettings = {
  name: '',
  document: '',
  email: '',
  phone: '',
  address: {
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zipCode: ''
  },
  notifications: {
    email: true,
    push: true
  }
}

export default function Settings() {
  const [settings, setSettings] = useState<CompanySettings>(initialSettings)
  const [openSnackbar, setOpenSnackbar] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success')

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    if (name.includes('.')) {
      const [parent, child] = name.split('.')
      setSettings(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof CompanySettings],
          [child]: value
        }
      }))
    } else {
      setSettings(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const handleNotificationChange = (type: 'email' | 'push') => {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [type]: !prev.notifications[type]
      }
    }))
  }

  const handleSave = async (settings: CompanySettings) => {
    try {
      setLoading(true)
      const settingsRef = doc(db, 'settings', 'company')
      await updateDoc(settingsRef, {
        ...settings,
        updatedAt: new Date().toISOString()
      })
      setFeedback({
        open: true,
        message: 'Configurações salvas com sucesso',
        type: 'success'
      })
    } catch (error) {
      console.error('Erro ao salvar configurações:', error)
      setFeedback({
        open: true,
        message: 'Erro ao salvar configurações',
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Configurações
      </Typography>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 3 }}>
          Informações da Empresa
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Nome da Empresa"
              name="name"
              value={settings.name}
              onChange={handleInputChange}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="CNPJ"
              name="document"
              value={settings.document}
              onChange={handleInputChange}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="E-mail"
              name="email"
              type="email"
              value={settings.email}
              onChange={handleInputChange}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Telefone"
              name="phone"
              value={settings.phone}
              onChange={handleInputChange}
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" sx={{ mb: 3 }}>
          Endereço
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="CEP"
              name="address.zipCode"
              value={settings.address.zipCode}
              onChange={handleInputChange}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Rua"
              name="address.street"
              value={settings.address.street}
              onChange={handleInputChange}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Número"
              name="address.number"
              value={settings.address.number}
              onChange={handleInputChange}
            />
          </Grid>
          <Grid item xs={12} sm={8}>
            <TextField
              fullWidth
              label="Complemento"
              name="address.complement"
              value={settings.address.complement}
              onChange={handleInputChange}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Bairro"
              name="address.neighborhood"
              value={settings.address.neighborhood}
              onChange={handleInputChange}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Cidade"
              name="address.city"
              value={settings.address.city}
              onChange={handleInputChange}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Estado"
              name="address.state"
              value={settings.address.state}
              onChange={handleInputChange}
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" sx={{ mb: 3 }}>
          Notificações
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.notifications.email}
                  onChange={() => handleNotificationChange('email')}
                />
              }
              label="Receber notificações por e-mail"
            />
          </Grid>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.notifications.push}
                  onChange={() => handleNotificationChange('push')}
                />
              }
              label="Receber notificações push"
            />
          </Grid>
        </Grid>

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="contained" onClick={handleSave}>
            Salvar Configurações
          </Button>
        </Box>
      </Paper>

      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={() => setOpenSnackbar(false)}
      >
        <Alert
          onClose={() => setOpenSnackbar(false)}
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  )
} 
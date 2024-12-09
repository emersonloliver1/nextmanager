import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Alert,
  CircularProgress,
  InputAdornment,
  MenuItem,
  Snackbar,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';

interface Address {
  street: string
  number: string
  complement?: string
  neighborhood: string
  city: string
  state: string
  zipCode: string
}

interface Supplier {
  id?: string
  name: string
  document: string
  email: string
  phone: string
  address: Address
  status: 'active' | 'inactive'
  category: string
  notes?: string
  createdAt: string
  updatedAt: string
}

interface FeedbackState {
  open: boolean
  message: string
  type: 'success' | 'error'
}

const ESTADOS_BR = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

const initialFormData: Supplier = {
  name: '',
  document: '',
  email: '',
  phone: '',
  status: 'active',
  category: 'general',
  notes: '',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  address: {
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zipCode: '',
  }
};

const formatCNPJ = (value: string) => {
  const cnpj = value.replace(/\D/g, '');
  return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
};

const formatPhone = (value: string) => {
  const phone = value.replace(/\D/g, '');
  if (phone.length === 11) {
    return phone.replace(/^(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  return phone.replace(/^(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
};

const validateCNPJ = (cnpj: string) => {
  const stripped = cnpj.replace(/\D/g, '');
  if (stripped.length !== 14) return false;
  
  // Validação básica de CNPJ
  if (/^(\d)\1+$/.test(stripped)) return false;
  
  let sum = 0;
  let weight = 2;
  
  for (let i = 11; i >= 0; i--) {
    sum += parseInt(stripped.charAt(i)) * weight;
    weight = weight === 9 ? 2 : weight + 1;
  }
  
  let digit = (sum % 11) < 2 ? 0 : 11 - (sum % 11);
  if (parseInt(stripped.charAt(12)) !== digit) return false;
  
  sum = 0;
  weight = 2;
  
  for (let i = 12; i >= 0; i--) {
    sum += parseInt(stripped.charAt(i)) * weight;
    weight = weight === 9 ? 2 : weight + 1;
  }
  
  digit = (sum % 11) < 2 ? 0 : 11 - (sum % 11);
  return parseInt(stripped.charAt(13)) === digit;
};

const validateEmail = (email: string) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<Supplier>(initialFormData);
  const [feedback, setFeedback] = useState<FeedbackState>({
    open: false,
    message: '',
    type: 'success'
  });

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const suppliersRef = collection(db, 'suppliers');
      const q = query(suppliersRef, orderBy('name'));
      const querySnapshot = await getDocs(q);
      const suppliersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Supplier[];
      setSuppliers(suppliersData);
    } catch (err) {
      setError('Erro ao carregar fornecedores');
      console.error('Erro ao carregar fornecedores:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.document || !formData.email || !formData.phone) {
      setFeedback({
        open: true,
        message: 'Por favor, preencha todos os campos obrigatórios',
        type: 'error'
      });
      return;
    }

    if (!validateCNPJ(formData.document)) {
      setFeedback({
        open: true,
        message: 'CNPJ inválido',
        type: 'error'
      });
      return;
    }

    if (!validateEmail(formData.email)) {
      setFeedback({
        open: true,
        message: 'E-mail inválido',
        type: 'error'
      });
      return;
    }

    try {
      setLoading(true);
      const supplierData = {
        ...formData,
        createdAt: formData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (selectedSupplier?.id) {
        await updateDoc(doc(db, 'suppliers', selectedSupplier.id), supplierData);
      } else {
        await addDoc(collection(db, 'suppliers'), supplierData);
      }

      await fetchSuppliers();
      handleCloseDialog();
      setFeedback({
        open: true,
        message: selectedSupplier ? 'Fornecedor atualizado com sucesso' : 'Fornecedor adicionado com sucesso',
        type: 'success'
      });
    } catch (error) {
      console.error('Erro ao salvar fornecedor:', error);
      setFeedback({
        open: true,
        message: 'Erro ao salvar fornecedor',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (supplier: Supplier) => {
    if (!supplier.id) return;
    
    if (!window.confirm('Tem certeza que deseja excluir este fornecedor?')) {
      return;
    }
    
    try {
      setLoading(true);
      await deleteDoc(doc(db, 'suppliers', supplier.id));
      await fetchSuppliers();
      setFeedback({
        open: true,
        message: 'Fornecedor excluído com sucesso',
        type: 'success'
      });
    } catch (err) {
      setError('Erro ao excluir fornecedor');
      setFeedback({
        open: true,
        message: 'Erro ao excluir fornecedor',
        type: 'error'
      });
      console.error('Erro ao excluir fornecedor:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setFormData(supplier);
    setOpenDialog(true);
  };

  const handleAdd = () => {
    setSelectedSupplier(null);
    setFormData(initialFormData);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedSupplier(null);
    setFormData(initialFormData);
  };

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCNPJ(e.target.value);
    setFormData({ ...formData, document: formatted });
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setFormData({ ...formData, phone: formatted });
  };

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.document.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4">
          Fornecedores
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleAdd}
        >
          Novo Fornecedor
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 4 }}>
        <TextField
          placeholder="Pesquisar fornecedores..."
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ width: 300 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : filteredSuppliers.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="textSecondary">
            Nenhum fornecedor encontrado
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nome</TableCell>
                <TableCell>CNPJ</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Telefone</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredSuppliers.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell>{supplier.name}</TableCell>
                  <TableCell>{supplier.document}</TableCell>
                  <TableCell>{supplier.email}</TableCell>
                  <TableCell>{supplier.phone}</TableCell>
                  <TableCell>
                    <Button
                      variant="outlined"
                      size="small"
                      color={supplier.status === 'active' ? 'success' : 'error'}
                    >
                      {supplier.status === 'active' ? 'Ativo' : 'Inativo'}
                    </Button>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton onClick={() => handleEdit(supplier)} color="primary">
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(supplier)} color="error">
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedSupplier ? 'Editar Fornecedor' : 'Novo Fornecedor'}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nome"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                error={!formData.name}
                helperText={!formData.name ? 'Campo obrigatório' : ''}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="CNPJ"
                value={formData.document}
                onChange={handleDocumentChange}
                required
                error={formData.document && !validateCNPJ(formData.document)}
                helperText={formData.document && !validateCNPJ(formData.document) ? 'CNPJ inválido' : ''}
                inputProps={{ maxLength: 18 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                error={formData.email && !validateEmail(formData.email)}
                helperText={formData.email && !validateEmail(formData.email) ? 'E-mail inválido' : ''}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Telefone"
                value={formData.phone}
                onChange={handlePhoneChange}
                required
                error={!formData.phone}
                helperText={!formData.phone ? 'Campo obrigatório' : ''}
                inputProps={{ maxLength: 15 }}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                Endereço
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Rua"
                value={formData.address.street}
                onChange={(e) => setFormData({
                  ...formData,
                  address: { ...formData.address, street: e.target.value }
                })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Número"
                value={formData.address.number}
                onChange={(e) => setFormData({
                  ...formData,
                  address: { ...formData.address, number: e.target.value }
                })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Complemento"
                value={formData.address.complement}
                onChange={(e) => setFormData({
                  ...formData,
                  address: { ...formData.address, complement: e.target.value }
                })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Bairro"
                value={formData.address.neighborhood}
                onChange={(e) => setFormData({
                  ...formData,
                  address: { ...formData.address, neighborhood: e.target.value }
                })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Cidade"
                value={formData.address.city}
                onChange={(e) => setFormData({
                  ...formData,
                  address: { ...formData.address, city: e.target.value }
                })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <TextField
                select
                fullWidth
                label="Estado"
                value={formData.address.state}
                onChange={(e) => setFormData({
                  ...formData,
                  address: { ...formData.address, state: e.target.value }
                })}
                required
              >
                {ESTADOS_BR.map((estado) => (
                  <MenuItem key={estado} value={estado}>
                    {estado}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={2}>
              <TextField
                fullWidth
                label="CEP"
                value={formData.address.zipCode}
                onChange={(e) => setFormData({
                  ...formData,
                  address: { ...formData.address, zipCode: e.target.value }
                })}
                required
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            color="primary"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : selectedSupplier ? 'Salvar' : 'Criar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={feedback.open}
        autoHideDuration={6000}
        onClose={() => setFeedback({ ...feedback, open: false })}
      >
        <Alert
          onClose={() => setFeedback({ ...feedback, open: false })}
          severity={feedback.type}
          sx={{ width: '100%' }}
        >
          {feedback.message}
        </Alert>
      </Snackbar>
    </Box>
  );
} 
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
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Supplier } from '../types/product';

const ESTADOS_BR = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState<Partial<Supplier>>({
    name: '',
    document: '',
    email: '',
    phone: '',
    address: {
      street: '',
      number: '',
      complement: '',
      district: '',
      city: '',
      state: '',
      zipCode: '',
    },
    status: 'active',
  });

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
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
      console.error('Erro ao carregar fornecedores:', err);
      setError('Erro ao carregar fornecedores. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');
      
      const supplierData = {
        ...formData,
        updatedAt: new Date().toISOString(),
      };

      if (selectedSupplier) {
        const supplierRef = doc(db, 'suppliers', selectedSupplier.id);
        await updateDoc(supplierRef, supplierData);
        setSuccess('Fornecedor atualizado com sucesso!');
      } else {
        supplierData.createdAt = new Date().toISOString();
        await addDoc(collection(db, 'suppliers'), supplierData);
        setSuccess('Fornecedor adicionado com sucesso!');
      }

      handleCloseDialog();
      loadSuppliers();
    } catch (err) {
      console.error('Erro ao salvar fornecedor:', err);
      setError('Erro ao salvar fornecedor. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (supplier: Supplier) => {
    if (!window.confirm('Tem certeza que deseja excluir este fornecedor?')) return;

    try {
      setLoading(true);
      await deleteDoc(doc(db, 'suppliers', supplier.id));
      setSuccess('Fornecedor excluído com sucesso!');
      loadSuppliers();
    } catch (err) {
      console.error('Erro ao excluir fornecedor:', err);
      setError('Erro ao excluir fornecedor. Tente novamente.');
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
    setFormData({
      name: '',
      document: '',
      email: '',
      phone: '',
      address: {
        street: '',
        number: '',
        complement: '',
        district: '',
        city: '',
        state: '',
        zipCode: '',
      },
      status: 'active',
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedSupplier(null);
    setFormData({});
  };

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.document.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 4 }}>
        Fornecedores
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Buscar por nome, CNPJ ou email"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} sx={{ textAlign: 'right' }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAdd}
              disabled={loading}
            >
              Novo Fornecedor
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nome</TableCell>
              <TableCell>CNPJ</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Telefone</TableCell>
              <TableCell>Cidade/UF</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : filteredSuppliers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  Nenhum fornecedor encontrado
                </TableCell>
              </TableRow>
            ) : (
              filteredSuppliers.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell>{supplier.name}</TableCell>
                  <TableCell>{supplier.document}</TableCell>
                  <TableCell>{supplier.email}</TableCell>
                  <TableCell>{supplier.phone}</TableCell>
                  <TableCell>{supplier.address.city}/{supplier.address.state}</TableCell>
                  <TableCell>
                    <Alert 
                      severity={supplier.status === 'active' ? 'success' : 'error'}
                      sx={{ py: 0, px: 1 }}
                    >
                      {supplier.status === 'active' ? 'Ativo' : 'Inativo'}
                    </Alert>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton onClick={() => handleEdit(supplier)} disabled={loading}>
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(supplier)} disabled={loading}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Diálogo de Adicionar/Editar Fornecedor */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedSupplier ? 'Editar Fornecedor' : 'Novo Fornecedor'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nome"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="CNPJ"
                value={formData.document || ''}
                onChange={(e) => setFormData({ ...formData, document: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Telefone"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </Grid>

            {/* Endereço */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                Endereço
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Rua"
                value={formData.address?.street || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  address: { ...formData.address, street: e.target.value }
                })}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Número"
                value={formData.address?.number || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  address: { ...formData.address, number: e.target.value }
                })}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Complemento"
                value={formData.address?.complement || ''}
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
                value={formData.address?.district || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  address: { ...formData.address, district: e.target.value }
                })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Cidade"
                value={formData.address?.city || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  address: { ...formData.address, city: e.target.value }
                })}
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <TextField
                fullWidth
                select
                label="UF"
                value={formData.address?.state || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  address: { ...formData.address, state: e.target.value }
                })}
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
                value={formData.address?.zipCode || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  address: { ...formData.address, zipCode: e.target.value }
                })}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                select
                label="Status"
                value={formData.status || 'active'}
                onChange={(e) => setFormData({
                  ...formData,
                  status: e.target.value as 'active' | 'inactive'
                })}
              >
                <MenuItem value="active">Ativo</MenuItem>
                <MenuItem value="inactive">Inativo</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {selectedSupplier ? 'Atualizar' : 'Adicionar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 
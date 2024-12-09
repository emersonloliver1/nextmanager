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
  Tabs,
  Tab,
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import InfoIcon from '@mui/icons-material/Info';
import { collection, addDoc, getDocs, query, orderBy, where, getDoc, doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { Product, StockMovement } from '../types/product';
import { useAuthState } from 'react-firebase-hooks/auth';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`inventory-tabpanel-${index}`}
      aria-labelledby={`inventory-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function Stock() {
  const [user] = useAuthState(auth);
  const [tabValue, setTabValue] = useState(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState<Partial<StockMovement>>({
    type: 'entrada',
    quantity: 0,
    reason: 'compra',
    notes: '',
  });
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    loadProducts();
    loadMovements();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const productsRef = collection(db, 'products');
      const q = query(productsRef, orderBy('name'));
      const querySnapshot = await getDocs(q);
      
      const productsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
      
      setProducts(productsData);
    } catch (err) {
      console.error('Erro ao carregar produtos:', err);
      setError('Erro ao carregar produtos. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const loadMovements = async () => {
    try {
      const movementsRef = collection(db, 'stock_movements');
      const q = query(movementsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const movementsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as StockMovement[];
      
      setMovements(movementsData);
    } catch (err) {
      console.error('Erro ao carregar movimentações:', err);
    }
  };

  const handleSubmit = async () => {
    if (!selectedProduct || !user) return;

    try {
      setLoading(true);
      setError('');

      const quantity = formData.type === 'saida' ? -Math.abs(formData.quantity || 0) : Math.abs(formData.quantity || 0);
      const newStock = selectedProduct.currentStock + quantity;

      // Verificar estoque mínimo e máximo
      if (newStock < 0) {
        setError('Estoque insuficiente para esta saída');
        return;
      }

      if (formData.type === 'entrada' && newStock > selectedProduct.maxStock) {
        setError('Esta entrada ultrapassará o estoque máximo permitido');
        return;
      }

      // Criar movimentação
      const movementData = {
        ...formData,
        productId: selectedProduct.id,
        quantity: Math.abs(formData.quantity || 0),
        createdBy: user.uid,
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(db, 'stock_movements'), movementData);

      // Atualizar estoque do produto
      const productRef = doc(db, 'products', selectedProduct.id);
      await updateDoc(productRef, {
        currentStock: newStock,
        updatedAt: new Date().toISOString(),
      });

      setSuccess('Movimentação registrada com sucesso!');
      handleCloseDialog();
      loadProducts();
      loadMovements();
    } catch (err) {
      console.error('Erro ao registrar movimentação:', err);
      setError('Erro ao registrar movimentação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenMovement = (product: Product) => {
    setSelectedProduct(product);
    setFormData({
      type: 'entrada',
      quantity: 0,
      reason: 'compra',
      notes: '',
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedProduct(null);
    setFormData({});
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 4 }}>
        Controle de Estoque
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

      <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)} sx={{ mb: 2 }}>
        <Tab label="Produtos em Estoque" />
        <Tab label="Movimentações" />
      </Tabs>

      <TabPanel value={tabValue} index={0}>
        <Paper sx={{ p: 2, mb: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Buscar por nome ou SKU"
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
          </Grid>
        </Paper>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Produto</TableCell>
                <TableCell>SKU</TableCell>
                <TableCell>Estoque Atual</TableCell>
                <TableCell>Mín/Máx</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    Nenhum produto encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>{product.name}</TableCell>
                    <TableCell>{product.sku}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {product.currentStock}
                        {product.currentStock <= product.minStock && (
                          <Tooltip title="Estoque baixo">
                            <Alert severity="warning" sx={{ py: 0, px: 1 }}>!</Alert>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>{product.minStock}/{product.maxStock}</TableCell>
                    <TableCell>
                      <Alert 
                        severity={product.status === 'active' ? 'success' : 'error'}
                        sx={{ py: 0, px: 1 }}
                      >
                        {product.status === 'active' ? 'Ativo' : 'Inativo'}
                      </Alert>
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() => handleOpenMovement(product)}
                        disabled={loading || product.status === 'inactive'}
                      >
                        Movimentar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Data</TableCell>
                <TableCell>Produto</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Quantidade</TableCell>
                <TableCell>Motivo</TableCell>
                <TableCell>Documento</TableCell>
                <TableCell>Observações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {movements.map((movement) => {
                const product = products.find(p => p.id === movement.productId);
                return (
                  <TableRow key={movement.id}>
                    <TableCell>
                      {new Date(movement.createdAt).toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell>{product?.name || 'Produto não encontrado'}</TableCell>
                    <TableCell>
                      <Alert 
                        severity={movement.type === 'entrada' ? 'success' : 'warning'}
                        sx={{ py: 0, px: 1 }}
                      >
                        {movement.type === 'entrada' ? 'Entrada' : 'Saída'}
                      </Alert>
                    </TableCell>
                    <TableCell>{movement.quantity}</TableCell>
                    <TableCell>
                      {movement.reason === 'compra' && 'Compra'}
                      {movement.reason === 'venda' && 'Venda'}
                      {movement.reason === 'ajuste' && 'Ajuste'}
                      {movement.reason === 'devolucao' && 'Devolução'}
                    </TableCell>
                    <TableCell>{movement.document || '-'}</TableCell>
                    <TableCell>
                      {movement.notes ? (
                        <Tooltip title={movement.notes}>
                          <InfoIcon fontSize="small" color="action" />
                        </Tooltip>
                      ) : '-'}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* Diálogo de Movimentação de Estoque */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          Movimentação de Estoque - {selectedProduct?.name}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                select
                label="Tipo de Movimentação"
                value={formData.type || 'entrada'}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as 'entrada' | 'saida' })}
              >
                <MenuItem value="entrada">Entrada</MenuItem>
                <MenuItem value="saida">Saída</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="number"
                label="Quantidade"
                value={formData.quantity || ''}
                onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                inputProps={{ min: 0 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                select
                label="Motivo"
                value={formData.reason || 'compra'}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value as StockMovement['reason'] })}
              >
                <MenuItem value="compra">Compra</MenuItem>
                <MenuItem value="venda">Venda</MenuItem>
                <MenuItem value="ajuste">Ajuste</MenuItem>
                <MenuItem value="devolucao">Devolução</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Documento (Opcional)"
                value={formData.document || ''}
                onChange={(e) => setFormData({ ...formData, document: e.target.value })}
                placeholder="Número da NF, Pedido, etc."
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Observações (Opcional)"
                multiline
                rows={3}
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
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
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 
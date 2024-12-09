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
  MenuItem,
  Alert,
  CircularProgress,
  Tooltip,
  InputAdornment,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Product, ProductCategory, Supplier } from '../types/product';

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    description: '',
    sku: '',
    barcode: '',
    price: 0,
    cost: 0,
    category: '',
    supplier: '',
    unit: '',
    minStock: 0,
    maxStock: 0,
    currentStock: 0,
    status: 'active',
  });

  // Carregar dados iniciais
  useEffect(() => {
    loadProducts();
    loadCategories();
    loadSuppliers();
  }, []);

  // Carregar produtos
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

  // Carregar categorias
  const loadCategories = async () => {
    try {
      const categoriesRef = collection(db, 'categories');
      const querySnapshot = await getDocs(categoriesRef);
      
      const categoriesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ProductCategory[];
      
      setCategories(categoriesData);
    } catch (err) {
      console.error('Erro ao carregar categorias:', err);
    }
  };

  // Carregar fornecedores
  const loadSuppliers = async () => {
    try {
      const suppliersRef = collection(db, 'suppliers');
      const querySnapshot = await getDocs(suppliersRef);
      
      const suppliersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Supplier[];
      
      setSuppliers(suppliersData);
    } catch (err) {
      console.error('Erro ao carregar fornecedores:', err);
    }
  };

  // Adicionar/Editar produto
  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');
      
      const productData = {
        ...formData,
        updatedAt: new Date().toISOString(),
      };

      if (selectedProduct) {
        // Atualizar produto existente
        const productRef = doc(db, 'products', selectedProduct.id);
        await updateDoc(productRef, productData);
        setSuccess('Produto atualizado com sucesso!');
      } else {
        // Adicionar novo produto
        productData.createdAt = new Date().toISOString();
        await addDoc(collection(db, 'products'), productData);
        setSuccess('Produto adicionado com sucesso!');
      }

      handleCloseDialog();
      loadProducts();
    } catch (err) {
      console.error('Erro ao salvar produto:', err);
      setError('Erro ao salvar produto. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Excluir produto
  const handleDelete = async (product: Product) => {
    if (!window.confirm('Tem certeza que deseja excluir este produto?')) return;

    try {
      setLoading(true);
      await deleteDoc(doc(db, 'products', product.id));
      setSuccess('Produto excluído com sucesso!');
      loadProducts();
    } catch (err) {
      console.error('Erro ao excluir produto:', err);
      setError('Erro ao excluir produto. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Abrir diálogo para edição
  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setFormData(product);
    setOpenDialog(true);
  };

  // Abrir diálogo para novo produto
  const handleAdd = () => {
    setSelectedProduct(null);
    setFormData({
      name: '',
      description: '',
      sku: '',
      barcode: '',
      price: 0,
      cost: 0,
      category: '',
      supplier: '',
      unit: '',
      minStock: 0,
      maxStock: 0,
      currentStock: 0,
      status: 'active',
    });
    setOpenDialog(true);
  };

  // Fechar diálogo
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedProduct(null);
    setFormData({});
  };

  // Filtrar produtos
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.barcode && product.barcode.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 4 }}>
        Produtos
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
              placeholder="Buscar por nome, SKU ou código de barras"
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
              Novo Produto
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nome</TableCell>
              <TableCell>SKU</TableCell>
              <TableCell>Categoria</TableCell>
              <TableCell>Preço</TableCell>
              <TableCell>Estoque</TableCell>
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
            ) : filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  Nenhum produto encontrado
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>{product.sku}</TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell>
                    {product.price.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    })}
                  </TableCell>
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
                  <TableCell>
                    <Alert 
                      severity={product.status === 'active' ? 'success' : 'error'}
                      sx={{ py: 0, px: 1 }}
                    >
                      {product.status === 'active' ? 'Ativo' : 'Inativo'}
                    </Alert>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton onClick={() => handleEdit(product)} disabled={loading}>
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(product)} disabled={loading}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Diálogo de Adicionar/Editar Produto */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedProduct ? 'Editar Produto' : 'Novo Produto'}
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
                label="SKU"
                value={formData.sku || ''}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descrição"
                multiline
                rows={3}
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Código de Barras"
                value={formData.barcode || ''}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Unidade"
                value={formData.unit || ''}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Preço"
                value={formData.price || ''}
                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                InputProps={{
                  startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Custo"
                value={formData.cost || ''}
                onChange={(e) => setFormData({ ...formData, cost: Number(e.target.value) })}
                InputProps={{
                  startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Categoria"
                value={formData.category || ''}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                {categories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Fornecedor"
                value={formData.supplier || ''}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
              >
                {suppliers.map((supplier) => (
                  <MenuItem key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="number"
                label="Estoque Mínimo"
                value={formData.minStock || ''}
                onChange={(e) => setFormData({ ...formData, minStock: Number(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="number"
                label="Estoque Máximo"
                value={formData.maxStock || ''}
                onChange={(e) => setFormData({ ...formData, maxStock: Number(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="number"
                label="Estoque Atual"
                value={formData.currentStock || ''}
                onChange={(e) => setFormData({ ...formData, currentStock: Number(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                select
                label="Status"
                value={formData.status || 'active'}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
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
            {selectedProduct ? 'Atualizar' : 'Adicionar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 
export interface Product {
  id: string;
  name: string;
  description: string;
  sku: string;
  barcode?: string;
  price: number;
  cost: number;
  category: string;
  supplier: string;
  unit: string;
  minStock: number;
  maxStock: number;
  currentStock: number;
  status: 'active' | 'inactive';
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  type: 'entrada' | 'saida';
  quantity: number;
  reason: 'compra' | 'venda' | 'ajuste' | 'devolucao';
  document?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  document: string;
  email: string;
  phone: string;
  address: {
    street: string;
    number: string;
    complement?: string;
    district: string;
    city: string;
    state: string;
    zipCode: string;
  };
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
} 
export interface Customer {
  id?: string;
  code: string;
  name: string;
  type: 'individual' | 'business';
  document: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive';
  category: string;
  address: {
    cep: string;
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    uf: string;
  };
  createdAt?: Date;
  updatedAt?: Date;
} 
export interface Supplier {
  id?: string;
  name: string;
  document: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive';
  address: {
    street: string;
    number: string;
    complement?: string;
    district: string;
    city: string;
    state: string;
    zipCode: string;
  };
  createdAt?: string;
  updatedAt?: string;
} 
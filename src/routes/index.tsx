import { Routes, Route } from 'react-router-dom'
import Dashboard from '../pages/Dashboard'
import Sales from '../pages/Sales'
import POS from '../pages/POS'
import Products from '../pages/Products'
import Stock from '../pages/Stock'
import Customers from '../pages/Customers'
import Suppliers from '../pages/Suppliers'
import Opportunities from '../pages/Opportunities'
import Projects from '../pages/management/Projects'
import Tasks from '../pages/management/Tasks'
import Calendar from '../pages/management/Calendar'
import AccountsPayable from '../pages/financial/AccountsPayable'
import AccountsReceivable from '../pages/financial/AccountsReceivable'
import CashFlow from '../pages/financial/CashFlow'
import Overview from '../pages/financial/Overview'
import Quotes from '../pages/Quotes'
import Manual from '../pages/about/Manual'
import PrivateRoute from './PrivateRoute'

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      
      {/* Vendas */}
      <Route path="/dashboard/sales" element={<PrivateRoute><Sales /></PrivateRoute>} />
      <Route path="/dashboard/pos" element={<PrivateRoute><POS /></PrivateRoute>} />
      <Route path="/dashboard/quotes" element={<PrivateRoute><Quotes /></PrivateRoute>} />
      <Route path="/dashboard/opportunities" element={<PrivateRoute><Opportunities /></PrivateRoute>} />
      
      {/* Produtos */}
      <Route path="/dashboard/products" element={<PrivateRoute><Products /></PrivateRoute>} />
      <Route path="/dashboard/stock" element={<PrivateRoute><Stock /></PrivateRoute>} />
      <Route path="/dashboard/suppliers" element={<PrivateRoute><Suppliers /></PrivateRoute>} />
      
      {/* Clientes */}
      <Route path="/dashboard/customers" element={<PrivateRoute><Customers /></PrivateRoute>} />
      
      {/* Gestão */}
      <Route path="/dashboard/gestao/projetos" element={<PrivateRoute><Projects /></PrivateRoute>} />
      <Route path="/dashboard/gestao/tarefas" element={<PrivateRoute><Tasks /></PrivateRoute>} />
      <Route path="/dashboard/gestao/calendario" element={<PrivateRoute><Calendar /></PrivateRoute>} />
      
      {/* Financeiro */}
      <Route path="/dashboard/financeiro" element={<PrivateRoute><Overview /></PrivateRoute>} />
      <Route path="/dashboard/financeiro/contas-a-pagar" element={<PrivateRoute><AccountsPayable /></PrivateRoute>} />
      <Route path="/dashboard/financeiro/contas-a-receber" element={<PrivateRoute><AccountsReceivable /></PrivateRoute>} />
      <Route path="/dashboard/financeiro/fluxo-de-caixa" element={<PrivateRoute><CashFlow /></PrivateRoute>} />
      
      {/* Sobre */}
      <Route path="/dashboard/about/Manual" element={<PrivateRoute><Manual /></PrivateRoute>} />

      {/* Redirecionar / para /dashboard */}
      <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
    </Routes>
  )
} 
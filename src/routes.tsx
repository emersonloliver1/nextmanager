import { createBrowserRouter } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Customers from './pages/Customers'
import Products from './pages/Products'
import Suppliers from './pages/Suppliers'
import Inventory from './pages/Inventory'
import Overview from './pages/financial/Overview'
import AccountsPayable from './pages/financial/AccountsPayable'
import AccountsReceivable from './pages/financial/AccountsReceivable'
import CashFlow from './pages/financial/CashFlow'
import Login from './pages/Login'

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        path: '/',
        element: <Dashboard />
      },
      {
        path: '/clientes',
        element: <Customers />
      },
      {
        path: '/produtos',
        element: <Products />
      },
      {
        path: '/fornecedores',
        element: <Suppliers />
      },
      {
        path: '/estoque',
        element: <Inventory />
      },
      // Rotas financeiras
      {
        path: '/financeiro/visao-geral',
        element: <Overview />
      },
      {
        path: '/financeiro/contas-pagar',
        element: <AccountsPayable />
      },
      {
        path: '/financeiro/contas-receber',
        element: <AccountsReceivable />
      },
      {
        path: '/financeiro/fluxo-caixa',
        element: <CashFlow />
      }
    ]
  },
  {
    path: '/login',
    element: <Login />
  }
])

export default router
 
import { createBrowserRouter, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Customers from './pages/Customers'
import Products from './pages/Products'
import Suppliers from './pages/Suppliers'
import Stock from './pages/Stock'
import Sales from './pages/Sales'
import POS from './pages/POS'
import Opportunities from './pages/Opportunities'
import Quotes from './pages/Quotes'
import Login from './pages/Login'
import LandingPage from './pages/LandingPage'

// Importações dos componentes financeiros
import { Overview, AccountsPayable, AccountsReceivable, CashFlow } from './pages/financial'

// Importações dos componentes de gestão
import { Projects, Tasks, Calendar } from './pages/management'

// Importação do Manual
import Manual from './pages/about/Manual'

// Importação do PrivateRoute
import PrivateRoute from './components/PrivateRoute'

const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />
  },
  {
    path: '/login',
    element: <Login />
  },
  {
    path: '/dashboard',
    element: <PrivateRoute><Layout /></PrivateRoute>,
    children: [
      {
        path: '',
        element: <Dashboard />
      },
      // Vendas
      {
        path: 'sales',
        element: <Sales />
      },
      {
        path: 'pos',
        element: <POS />
      },
      {
        path: 'quotes',
        element: <Quotes />
      },
      {
        path: 'opportunities',
        element: <Opportunities />
      },
      // Produtos
      {
        path: 'produtos',
        element: <Products />
      },
      {
        path: 'estoque',
        element: <Stock />
      },
      {
        path: 'fornecedores',
        element: <Suppliers />
      },
      // Clientes
      {
        path: 'clientes',
        element: <Customers />
      },
      // Gestão
      {
        path: 'gestao/projetos',
        element: <Projects />
      },
      {
        path: 'gestao/tarefas',
        element: <Tasks />
      },
      {
        path: 'gestao/calendario',
        element: <Calendar />
      },
      // Financeiro
      {
        path: 'financeiro',
        element: <Overview />
      },
      {
        path: 'financeiro/contas-a-pagar',
        element: <AccountsPayable />
      },
      {
        path: 'financeiro/contas-a-receber',
        element: <AccountsReceivable />
      },
      {
        path: 'financeiro/fluxo-de-caixa',
        element: <CashFlow />
      },
      // Manual
      {
        path: 'about/manual',
        element: <Manual />
      }
    ]
  }
])

export default router
 
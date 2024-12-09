import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider, CssBaseline } from '@mui/material'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import ptBR from 'date-fns/locale/pt-BR'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from './config/firebase'

// Importações de páginas e componentes
import Login from './pages/Login'
import Layout from './components/Layout'
import LandingPage from './pages/LandingPage'
import Dashboard from './pages/Dashboard'
import Customers from './pages/Customers'
import Products from './pages/Products'
import Suppliers from './pages/Suppliers'
import Inventory from './pages/Inventory'
import Sales from './pages/Sales'
import POS from './pages/POS'
import Opportunities from './pages/Opportunities'
import Campaigns from './pages/Campaigns'
import Settings from './pages/Settings'
import { Overview as FinancialOverview, AccountsPayable, AccountsReceivable, CashFlow } from './pages/financial'
import ComingSoon from './components/ComingSoon'
import theme from './theme'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const [user, loading] = useAuthState(auth)

  if (loading) {
    return <div>Loading...</div>
  }

  if (!user) {
    return <Navigate to="/login" />
  }

  return <>{children}</>
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<PrivateRoute><Layout /></PrivateRoute>}>
              <Route index element={<Dashboard />} />
              
              {/* CRM */}
              <Route path="clientes" element={<Customers />} />
              <Route path="opportunities" element={<Opportunities />} />
              <Route path="campaigns" element={<Campaigns />} />
              <Route path="support" element={<ComingSoon module="Atendimento" />} />
              
              {/* Vendas */}
              <Route path="sales" element={<Sales />} />
              <Route path="pos" element={<POS />} />
              <Route path="quotes" element={<ComingSoon module="Orçamentos" />} />
              
              {/* Produtos & Estoque */}
              <Route path="produtos" element={<Products />} />
              <Route path="estoque" element={<Inventory />} />
              <Route path="fornecedores" element={<Suppliers />} />
              
              {/* Financeiro */}
              <Route path="financeiro">
                <Route index element={<Navigate to="visao-geral" replace />} />
                <Route path="visao-geral" element={<FinancialOverview />} />
                <Route path="contas-pagar" element={<AccountsPayable />} />
                <Route path="contas-receber" element={<AccountsReceivable />} />
                <Route path="fluxo-caixa" element={<CashFlow />} />
              </Route>

              {/* Gestão */}
              <Route path="projects" element={<ComingSoon module="Projetos" />} />
              <Route path="tasks" element={<ComingSoon module="Tarefas" />} />
              <Route path="calendar" element={<ComingSoon module="Agenda" />} />

              {/* Relatórios */}
              <Route path="reports" element={<ComingSoon module="Relatórios" />} />
              <Route path="analytics" element={<ComingSoon module="Analytics" />} />

              {/* Configurações */}
              <Route path="settings" element={<Settings />} />
            </Route>
          </Routes>
        </LocalizationProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}

export default App

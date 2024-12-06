import { Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from './config/firebase'
import theme from './theme'
import Login from './pages/Login'
import Layout from './components/Layout'
import LandingPage from './pages/LandingPage'
import Dashboard from './pages/Dashboard'
import Customers from './pages/Customers'
import Opportunities from './pages/Opportunities'
import Campaigns from './pages/Campaigns'
import ComingSoon from './components/ComingSoon'

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
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index element={<Dashboard />} />
          
          {/* CRM */}
          <Route path="customers" element={<Customers />} />
          <Route path="opportunities" element={<Opportunities />} />
          <Route path="campaigns" element={<Campaigns />} />
          <Route path="support" element={<ComingSoon module="Atendimento" />} />
          
          {/* Vendas */}
          <Route path="sales" element={<ComingSoon module="Pedidos" />} />
          <Route path="pos" element={<ComingSoon module="PDV" />} />
          <Route path="quotes" element={<ComingSoon module="Orçamentos" />} />
          
          {/* Produtos & Estoque */}
          <Route path="products" element={<ComingSoon module="Produtos" />} />
          <Route path="inventory" element={<ComingSoon module="Estoque" />} />
          <Route path="suppliers" element={<ComingSoon module="Fornecedores" />} />
          
          {/* Financeiro */}
          <Route path="financial" element={<ComingSoon module="Financeiro" />} />
          <Route path="payables" element={<ComingSoon module="Contas a Pagar" />} />
          <Route path="receivables" element={<ComingSoon module="Contas a Receber" />} />
          <Route path="cash-flow" element={<ComingSoon module="Fluxo de Caixa" />} />
          
          {/* Gestão */}
          <Route path="projects" element={<ComingSoon module="Projetos" />} />
          <Route path="tasks" element={<ComingSoon module="Tarefas" />} />
          <Route path="calendar" element={<ComingSoon module="Agenda" />} />
          
          {/* Relatórios */}
          <Route path="reports" element={<ComingSoon module="Relatórios" />} />
          <Route path="analytics" element={<ComingSoon module="Analytics" />} />
          
          {/* Configurações */}
          <Route path="settings" element={<ComingSoon module="Configurações" />} />
        </Route>
      </Routes>
    </ThemeProvider>
  )
}

export default App

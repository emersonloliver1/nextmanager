import { RouterProvider } from 'react-router-dom'
import { ThemeProvider, CssBaseline } from '@mui/material'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import ptBR from 'date-fns/locale/pt-BR'
import theme from './theme'
import router from './routes'

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
        <RouterProvider router={router} />
      </LocalizationProvider>
    </ThemeProvider>
  )
}

export default App

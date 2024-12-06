import { createTheme } from '@mui/material/styles'

const theme = createTheme({
  palette: {
    primary: {
      main: '#4A90E2',
      light: '#7FB5FF',
      dark: '#2171D1',
    },
    secondary: {
      main: '#82B1FF',
      light: '#B6E3FF',
      dark: '#4D82CB',
    },
    background: {
      default: '#F5F7FA',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#2C3E50',
      secondary: '#707F8C',
    },
    grey: {
      50: '#F8FAFC',
      100: '#F1F4F8',
      200: '#E3E8EF',
      300: '#CDD5DF',
      400: '#9AA4B2',
      500: '#707F8C',
      600: '#4C5967',
      700: '#364049',
      800: '#252D37',
      900: '#1A202C',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
      color: '#2C3E50',
    },
    h5: {
      fontWeight: 500,
      color: '#2C3E50',
    },
    h6: {
      fontWeight: 500,
      color: '#2C3E50',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          fontWeight: 500,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
        contained: {
          '&:hover': {
            boxShadow: 'none',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: 'none',
          backgroundColor: '#FFFFFF',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: '4px 8px',
          '&.Mui-selected': {
            backgroundColor: '#F1F4F8',
            '&:hover': {
              backgroundColor: '#E3E8EF',
            },
          },
          '&:hover': {
            backgroundColor: '#F8FAFC',
          },
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          color: '#707F8C',
          minWidth: 40,
        },
      },
    },
  },
  shape: {
    borderRadius: 8,
  },
  shadows: [
    'none',
    '0px 2px 4px rgba(0, 0, 0, 0.05)',
    '0px 4px 8px rgba(0, 0, 0, 0.05)',
    '0px 8px 16px rgba(0, 0, 0, 0.05)',
    '0px 16px 24px rgba(0, 0, 0, 0.05)',
    ...Array(20).fill('none'),
  ],
})

export default theme

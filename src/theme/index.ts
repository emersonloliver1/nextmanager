import { createTheme } from '@mui/material/styles'
import { ptBR } from '@mui/material/locale'

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#9c27b0',
      light: '#ba68c8',
      dark: '#7b1fa2',
    },
    error: {
      main: '#d32f2f',
      light: '#ef5350',
      dark: '#c62828',
    },
    warning: {
      main: '#ed6c02',
      light: '#ff9800',
      dark: '#e65100',
    },
    info: {
      main: '#0288d1',
      light: '#03a9f4',
      dark: '#01579b',
    },
    success: {
      main: '#2e7d32',
      light: '#4caf50',
      dark: '#1b5e20',
    },
    grey: {
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#eeeeee',
      300: '#e0e0e0',
      400: '#bdbdbd',
      500: '#9e9e9e',
      600: '#757575',
      700: '#616161',
      800: '#424242',
      900: '#212121',
      A100: '#f5f5f5',
      A200: '#eeeeee',
      A400: '#bdbdbd',
      A700: '#616161',
    },
    text: {
      primary: 'rgba(0, 0, 0, 0.87)',
      secondary: 'rgba(0, 0, 0, 0.6)',
      disabled: 'rgba(0, 0, 0, 0.38)',
    },
    divider: 'rgba(0, 0, 0, 0.12)',
    background: {
      paper: '#fff',
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"',
    ].join(','),
    h1: {
      fontSize: '2.5rem',
      fontWeight: 500,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 500,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 500,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 500,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 500,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 4,
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 960,
      lg: 1280,
      xl: 1920,
    },
  },
  spacing: (factor: number) => `${0.25 * factor}rem`,
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          padding: {
            xs: '6px 12px',
            sm: '8px 16px',
            md: '8px 20px',
          },
          fontSize: {
            xs: '0.875rem',
            sm: '0.9rem',
            md: '1rem',
          },
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        size: 'small',
      },
      styleOverrides: {
        root: {
          width: {
            xs: '100%',
            sm: 'auto',
          },
        },
      },
    },
    MuiPaper: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiContainer: {
      styleOverrides: {
        root: {
          paddingLeft: {
            xs: 8,
            sm: 16,
            md: 24,
          },
          paddingRight: {
            xs: 8,
            sm: 16,
            md: 24,
          },
          maxWidth: {
            xs: '100%',
            sm: '540px',
            md: '720px',
            lg: '1140px',
            xl: '1400px',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          height: '100%',
          padding: {
            xs: '16px',
            sm: '20px',
            md: '24px',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          padding: {
            xs: '8px',
            sm: '12px 16px',
            md: '16px',
          },
          fontSize: {
            xs: '0.8rem',
            sm: '0.875rem',
            md: '1rem',
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          margin: {
            xs: '16px',
            sm: '32px',
            md: '48px',
          },
          width: {
            xs: 'calc(100% - 32px)',
            sm: 'auto',
          },
          maxWidth: {
            xs: '100%',
            sm: '600px',
            md: '800px',
          },
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          padding: {
            xs: '8px',
            sm: '12px',
            md: '16px',
          },
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        h1: {
          fontSize: {
            xs: '2rem',
            sm: '2.25rem',
            md: '2.5rem',
          },
        },
        h2: {
          fontSize: {
            xs: '1.75rem',
            sm: '1.875rem',
            md: '2rem',
          },
        },
        h3: {
          fontSize: {
            xs: '1.5rem',
            sm: '1.625rem',
            md: '1.75rem',
          },
        },
        h4: {
          fontSize: {
            xs: '1.25rem',
            sm: '1.375rem',
            md: '1.5rem',
          },
        },
        h5: {
          fontSize: {
            xs: '1.1rem',
            sm: '1.175rem',
            md: '1.25rem',
          },
        },
        h6: {
          fontSize: {
            xs: '1rem',
            sm: '1.05rem',
            md: '1.1rem',
          },
        },
        body1: {
          fontSize: {
            xs: '0.875rem',
            sm: '0.925rem',
            md: '1rem',
          },
        },
        body2: {
          fontSize: {
            xs: '0.8rem',
            sm: '0.85rem',
            md: '0.875rem',
          },
        },
      },
    },
  },
}, ptBR)

export default theme


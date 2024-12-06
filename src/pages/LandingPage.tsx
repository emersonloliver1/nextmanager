import { Box, Container, Typography, Button, Grid, Paper, useTheme, alpha } from '@mui/material'
import {
  Speed as SpeedIcon,
  Security as SecurityIcon,
  Devices as DevicesIcon,
  Timeline as TimelineIcon,
  People as PeopleIcon,
  ShoppingCart as ShoppingCartIcon,
  Assessment as AssessmentIcon,
  MonetizationOn as MonetizationOnIcon,
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'

export default function LandingPage() {
  const theme = useTheme()
  const navigate = useNavigate()

  const features = [
    {
      icon: <SpeedIcon sx={{ fontSize: 40 }} />,
      title: 'Rápido e Intuitivo',
      description: 'Interface moderna e fácil de usar, sem complicações'
    },
    {
      icon: <SecurityIcon sx={{ fontSize: 40 }} />,
      title: 'Segurança Total',
      description: 'Seus dados protegidos com a mais alta tecnologia'
    },
    {
      icon: <DevicesIcon sx={{ fontSize: 40 }} />,
      title: 'Multiplataforma',
      description: 'Acesse de qualquer lugar, em qualquer dispositivo'
    },
    {
      icon: <TimelineIcon sx={{ fontSize: 40 }} />,
      title: 'Análises em Tempo Real',
      description: 'Dashboards e relatórios atualizados instantaneamente'
    },
  ]

  const modules = [
    {
      icon: <PeopleIcon sx={{ fontSize: 50, color: theme.palette.primary.main }} />,
      title: 'CRM Completo',
      description: 'Gestão de clientes, oportunidades e pipeline de vendas integrado'
    },
    {
      icon: <ShoppingCartIcon sx={{ fontSize: 50, color: theme.palette.primary.main }} />,
      title: 'Vendas & PDV',
      description: 'Controle total das vendas, orçamentos e ponto de venda'
    },
    {
      icon: <AssessmentIcon sx={{ fontSize: 50, color: theme.palette.primary.main }} />,
      title: 'Gestão Completa',
      description: 'Estoque, fornecedores, produtos e serviços em um só lugar'
    },
    {
      icon: <MonetizationOnIcon sx={{ fontSize: 50, color: theme.palette.primary.main }} />,
      title: 'Financeiro',
      description: 'Controle financeiro, fluxo de caixa e contas a pagar/receber'
    },
  ]

  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.dark} 90%)`,
          color: 'white',
          pt: 15,
          pb: 20,
          position: 'relative',
          overflow: 'hidden',
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '30%',
            background: `linear-gradient(to top left, white 49%, transparent 51%)`,
          },
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h2" component="h1" fontWeight="bold" gutterBottom>
                NextManager
              </Typography>
              <Typography variant="h5" sx={{ mb: 4, opacity: 0.9 }}>
                A solução completa para gestão do seu negócio
              </Typography>
              <Typography variant="body1" sx={{ mb: 4, opacity: 0.8 }}>
                Simplifique sua operação com nossa plataforma all-in-one. 
                CRM, Vendas, Estoque e Financeiro integrados em uma única solução.
              </Typography>
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/login')}
                sx={{
                  bgcolor: 'white',
                  color: theme.palette.primary.main,
                  '&:hover': {
                    bgcolor: alpha(theme.palette.common.white, 0.9),
                  },
                  px: 4,
                  py: 1.5,
                }}
              >
                Comece Agora
              </Button>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box
                component="img"
                src="/dashboard-preview.png"
                alt="Dashboard Preview"
                sx={{
                  width: '100%',
                  maxWidth: 600,
                  height: 'auto',
                  borderRadius: 2,
                  boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                  transform: 'perspective(1000px) rotateY(-10deg) rotateX(5deg)',
                }}
              />
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ mt: -10, position: 'relative', zIndex: 1 }}>
        <Grid container spacing={3}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Paper
                elevation={3}
                sx={{
                  p: 3,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                  },
                }}
              >
                <Box sx={{ color: theme.palette.primary.main, mb: 2 }}>
                  {feature.icon}
                </Box>
                <Typography variant="h6" gutterBottom>
                  {feature.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {feature.description}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Modules Section */}
      <Container maxWidth="lg" sx={{ mt: 15, mb: 15 }}>
        <Typography variant="h3" align="center" gutterBottom fontWeight="bold">
          Tudo que você precisa
        </Typography>
        <Typography variant="h6" align="center" color="text.secondary" sx={{ mb: 8 }}>
          Uma plataforma completa para todas as áreas do seu negócio
        </Typography>
        
        <Grid container spacing={4}>
          {modules.map((module, index) => (
            <Grid item xs={12} sm={6} key={index}>
              <Paper
                elevation={2}
                sx={{
                  p: 4,
                  height: '100%',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 3,
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                  },
                }}
              >
                <Box>{module.icon}</Box>
                <Box>
                  <Typography variant="h5" gutterBottom fontWeight="bold">
                    {module.title}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {module.description}
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* CTA Section */}
      <Box
        sx={{
          bgcolor: theme.palette.primary.main,
          color: 'white',
          py: 10,
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '30%',
            background: `linear-gradient(to bottom right, white 49%, transparent 51%)`,
          },
        }}
      >
        <Container maxWidth="md">
          <Box textAlign="center">
            <Typography variant="h3" gutterBottom fontWeight="bold">
              Pronto para começar?
            </Typography>
            <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
              Transforme seu negócio hoje mesmo com o NextManager
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/login')}
              sx={{
                bgcolor: 'white',
                color: theme.palette.primary.main,
                '&:hover': {
                  bgcolor: alpha(theme.palette.common.white, 0.9),
                },
                px: 6,
                py: 2,
              }}
            >
              Começar Gratuitamente
            </Button>
          </Box>
        </Container>
      </Box>
    </Box>
  )
}

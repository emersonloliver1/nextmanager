import {
  Box,
  Button,
  Container,
  Grid,
  Typography,
  Card,
  CardContent,
  Stack,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Timeline,
  Assessment,
  People,
  Inventory,
  Speed,
  Security
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const features = [
  {
    icon: <Timeline sx={{ fontSize: 40 }} />,
    title: 'Dashboard Intuitivo',
    description: 'Visualize todos os dados importantes do seu negócio em um só lugar'
  },
  {
    icon: <Assessment sx={{ fontSize: 40 }} />,
    title: 'Relatórios Detalhados',
    description: 'Análises completas e exportação de dados em diversos formatos'
  },
  {
    icon: <People sx={{ fontSize: 40 }} />,
    title: 'Gestão de Equipe',
    description: 'Controle de usuários, permissões e atividades dos colaboradores'
  },
  {
    icon: <Inventory sx={{ fontSize: 40 }} />,
    title: 'Controle de Estoque',
    description: 'Gestão completa de produtos, entrada e saída de mercadorias'
  },
  {
    icon: <Speed sx={{ fontSize: 40 }} />,
    title: 'Alta Performance',
    description: 'Sistema otimizado para máxima velocidade e eficiência'
  },
  {
    icon: <Security sx={{ fontSize: 40 }} />,
    title: 'Segurança Avançada',
    description: 'Proteção de dados e backup automático na nuvem'
  }
];

export default function LandingPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          bgcolor: 'primary.main',
          color: 'white',
          pt: { xs: 8, md: 12 },
          pb: { xs: 8, md: 12 },
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography
                variant="h2"
                component="h1"
                sx={{
                  fontWeight: 'bold',
                  mb: 2,
                  fontSize: { xs: '2.5rem', md: '3.5rem' }
                }}
              >
                NextManager
              </Typography>
              <Typography
                variant="h5"
                sx={{ mb: 4, opacity: 0.9 }}
              >
                O sistema de gestão empresarial que vai revolucionar seu negócio
              </Typography>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
              >
                <Button
                  variant="contained"
                  color="secondary"
                  size="large"
                  onClick={() => navigate('/register')}
                  sx={{ fontSize: '1.1rem' }}
                >
                  Começar Agora
                </Button>
                <Button
                  variant="outlined"
                  color="inherit"
                  size="large"
                  onClick={() => navigate('/login')}
                  sx={{ fontSize: '1.1rem' }}
                >
                  Fazer Login
                </Button>
              </Stack>
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
                  boxShadow: 3
                }}
              />
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Container sx={{ py: { xs: 8, md: 12 } }}>
        <Typography
          variant="h3"
          component="h2"
          align="center"
          sx={{ mb: 8, fontWeight: 'bold' }}
        >
          Recursos Principais
        </Typography>
        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: '0.3s',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: 4
                  }
                }}
              >
                <CardContent>
                  <Box sx={{ color: 'primary.main', mb: 2 }}>
                    {feature.icon}
                  </Box>
                  <Typography
                    gutterBottom
                    variant="h5"
                    component="h3"
                    sx={{ fontWeight: 'bold' }}
                  >
                    {feature.title}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* CTA Section */}
      <Box sx={{ bgcolor: 'grey.100', py: { xs: 8, md: 12 } }}>
        <Container>
          <Box
            sx={{
              textAlign: 'center',
              maxWidth: 800,
              mx: 'auto'
            }}
          >
            <Typography
              variant="h3"
              component="h2"
              sx={{ mb: 4, fontWeight: 'bold' }}
            >
              Pronto para começar?
            </Typography>
            <Typography
              variant="h6"
              sx={{ mb: 4, color: 'text.secondary' }}
            >
              Junte-se a milhares de empresas que já estão usando o NextManager para melhorar sua gestão
            </Typography>
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={() => navigate('/register')}
              sx={{ fontSize: '1.1rem', px: 4, py: 1.5 }}
            >
              Criar Conta Grátis
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          bgcolor: 'background.paper',
          py: 6,
          borderTop: 1,
          borderColor: 'divider'
        }}
      >
        <Container>
          <Typography
            variant="body2"
            color="text.secondary"
            align="center"
          >
            © {new Date().getFullYear()} NextManager. Todos os direitos reservados.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}

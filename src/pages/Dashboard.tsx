import { Box, Grid, Paper, Typography, useTheme } from '@mui/material'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import PeopleIcon from '@mui/icons-material/People'
import InventoryIcon from '@mui/icons-material/Inventory'
import AttachMoneyIcon from '@mui/icons-material/AttachMoney'

const StatCard = ({ title, value, icon, color }: { title: string; value: string; icon: React.ReactNode; color: string }) => {
  const theme = useTheme()
  
  return (
    <Paper
      sx={{
        p: 3,
        height: '100%',
        display: 'flex',
        position: 'relative',
        overflow: 'hidden',
        alignItems: 'center',
        borderRadius: 3,
        '&:before': {
          content: '""',
          position: 'absolute',
          width: 210,
          height: 210,
          background: color,
          borderRadius: '50%',
          top: -85,
          right: -95,
          opacity: 0.1,
        },
      }}
    >
      <Box sx={{ mr: 2 }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          {title}
        </Typography>
        <Typography variant="h4" sx={{ color: 'text.primary', mb: 1 }}>
          {value}
        </Typography>
        <Typography
          variant="subtitle2"
          sx={{
            color: theme.palette.success.main,
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
          }}
        >
          <TrendingUpIcon fontSize="small" />
          +2.6%
        </Typography>
      </Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 64,
          height: 64,
          borderRadius: 2,
          backgroundColor: color,
          color: 'white',
          ml: 'auto',
        }}
      >
        {icon}
      </Box>
    </Paper>
  )
}

export default function Dashboard() {
  const theme = useTheme()

  return (
    <Box>
      <Typography 
        variant="h4" 
        sx={{ 
          mb: 4,
          fontSize: '1.75rem',
          fontWeight: 600,
        }}
      >
        Dashboard
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Vendas do Mês"
            value="R$ 23.500"
            icon={<AttachMoneyIcon sx={{ fontSize: 32 }} />}
            color={theme.palette.primary.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Clientes Ativos"
            value="48"
            icon={<PeopleIcon sx={{ fontSize: 32 }} />}
            color={theme.palette.secondary.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Produtos em Estoque"
            value="156"
            icon={<InventoryIcon sx={{ fontSize: 32 }} />}
            color={theme.palette.success.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Lucro Total"
            value="R$ 8.320"
            icon={<TrendingUpIcon sx={{ fontSize: 32 }} />}
            color={theme.palette.info.main}
          />
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper
            sx={{
              p: 3,
              height: '400px',
              borderRadius: 3,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Typography variant="h6" sx={{ mb: 3 }}>
              Vendas dos Últimos 6 Meses
            </Typography>
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Gráfico de vendas será implementado aqui
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper
            sx={{
              p: 3,
              height: '400px',
              borderRadius: 3,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Typography variant="h6" sx={{ mb: 3 }}>
              Produtos Mais Vendidos
            </Typography>
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Lista de produtos será implementada aqui
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}

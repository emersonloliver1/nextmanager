import { useState } from 'react'
import {
  Box,
  Typography,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Grid,
  Card,
  CardContent,
  CardMedia,
} from '@mui/material'
import {
  ExpandMore as ExpandMoreIcon,
  Dashboard as DashboardIcon,
  ShoppingCart as ShoppingCartIcon,
  AccountBalance as AccountBalanceIcon,
  Inventory as InventoryIcon,
  Business as BusinessIcon,
  Assessment as AssessmentIcon,
  Info as InfoIcon,
} from '@mui/icons-material'

export default function Manual() {
  const [expanded, setExpanded] = useState<string | false>(false)

  const handleChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false)
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Manual do Usuário
      </Typography>

      <Typography variant="subtitle1" color="text.secondary" paragraph>
        Bem-vindo ao NextManager! Este manual irá guiá-lo através das funcionalidades do sistema.
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardMedia
              component="img"
              height="140"
              image="/dashboard-preview.png"
              alt="Dashboard Preview"
            />
            <CardContent>
              <Typography gutterBottom variant="h6">
                Interface Intuitiva
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Design moderno e responsivo para facilitar sua navegação e gestão.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardMedia
              component="img"
              height="140"
              image="/integration-preview.png"
              alt="Integration Preview"
            />
            <CardContent>
              <Typography gutterBottom variant="h6">
                Módulos Integrados
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Todos os módulos trabalham em conjunto para uma gestão eficiente.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardMedia
              component="img"
              height="140"
              image="/reports-preview.png"
              alt="Reports Preview"
            />
            <CardContent>
              <Typography gutterBottom variant="h6">
                Relatórios Detalhados
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Acompanhe seu negócio com relatórios e gráficos informativos.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Accordion expanded={expanded === 'dashboard'} onChange={handleChange('dashboard')}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <ListItemIcon>
            <DashboardIcon />
          </ListItemIcon>
          <Typography variant="h6">Dashboard</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography paragraph>
            O Dashboard é sua visão geral do negócio, apresentando:
          </Typography>
          <List>
            <ListItem>
              <ListItemText 
                primary="Resumo Financeiro" 
                secondary="Visualize receitas, despesas e saldo do período atual comparado ao anterior."
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Gráfico de Vendas" 
                secondary="Acompanhe a evolução das vendas nos últimos 6 meses."
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Alertas" 
                secondary="Receba notificações sobre estoque baixo, contas a vencer e oportunidades."
              />
            </ListItem>
          </List>
        </AccordionDetails>
      </Accordion>

      <Accordion expanded={expanded === 'vendas'} onChange={handleChange('vendas')}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <ListItemIcon>
            <ShoppingCartIcon />
          </ListItemIcon>
          <Typography variant="h6">Vendas</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography paragraph>
            O módulo de Vendas permite:
          </Typography>
          <List>
            <ListItem>
              <ListItemText 
                primary="PDV (Ponto de Venda)" 
                secondary="Realize vendas rápidas com interface otimizada para touch."
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Orçamentos" 
                secondary="Crie e gerencie orçamentos para seus clientes."
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Histórico" 
                secondary="Consulte todas as vendas realizadas com filtros avançados."
              />
            </ListItem>
          </List>
          <Typography variant="subtitle2" color="primary" sx={{ mt: 2 }}>
            Integração com outros módulos:
          </Typography>
          <List>
            <ListItem>
              <ListItemText 
                secondary="• Atualiza automaticamente o estoque"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                secondary="• Gera lançamentos no financeiro"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                secondary="• Alimenta gráficos do dashboard"
              />
            </ListItem>
          </List>
        </AccordionDetails>
      </Accordion>

      <Accordion expanded={expanded === 'financeiro'} onChange={handleChange('financeiro')}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <ListItemIcon>
            <AccountBalanceIcon />
          </ListItemIcon>
          <Typography variant="h6">Financeiro</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography paragraph>
            Gerencie suas finanças com:
          </Typography>
          <List>
            <ListItem>
              <ListItemText 
                primary="Fluxo de Caixa" 
                secondary="Acompanhe entradas e saídas com visão diária, semanal ou mensal."
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Contas a Pagar" 
                secondary="Controle suas despesas e fornecedores."
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Contas a Receber" 
                secondary="Gerencie recebimentos e clientes."
              />
            </ListItem>
          </List>
          <Typography variant="subtitle2" color="primary" sx={{ mt: 2 }}>
            Importante:
          </Typography>
          <List>
            <ListItem>
              <ListItemText 
                secondary="• O valor líquido das vendas é considerado como entrada"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                secondary="• Categorize corretamente as despesas para melhor controle"
              />
            </ListItem>
          </List>
        </AccordionDetails>
      </Accordion>

      <Accordion expanded={expanded === 'estoque'} onChange={handleChange('estoque')}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <ListItemIcon>
            <InventoryIcon />
          </ListItemIcon>
          <Typography variant="h6">Estoque</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography paragraph>
            Controle seu estoque com:
          </Typography>
          <List>
            <ListItem>
              <ListItemText 
                primary="Produtos" 
                secondary="Cadastre e gerencie seus produtos com código, preço e estoque."
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Movimentações" 
                secondary="Registre entradas, saídas e ajustes de estoque."
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Alertas" 
                secondary="Configure estoque mínimo e receba alertas automáticos."
              />
            </ListItem>
          </List>
        </AccordionDetails>
      </Accordion>

      <Accordion expanded={expanded === 'gestao'} onChange={handleChange('gestao')}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <ListItemIcon>
            <BusinessIcon />
          </ListItemIcon>
          <Typography variant="h6">Gestão</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography paragraph>
            Ferramentas de gestão incluem:
          </Typography>
          <List>
            <ListItem>
              <ListItemText 
                primary="Projetos" 
                secondary="Gerencie projetos com status, prazos e responsáveis."
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Tarefas" 
                secondary="Organize tarefas com prioridades e acompanhamento."
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Calendário" 
                secondary="Visualize compromissos e prazos importantes."
              />
            </ListItem>
          </List>
        </AccordionDetails>
      </Accordion>

      <Accordion expanded={expanded === 'relatorios'} onChange={handleChange('relatorios')}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <ListItemIcon>
            <AssessmentIcon />
          </ListItemIcon>
          <Typography variant="h6">Relatórios</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography paragraph>
            Analise seu negócio com:
          </Typography>
          <List>
            <ListItem>
              <ListItemText 
                primary="Relatórios de Vendas" 
                secondary="Análise por período, produto, cliente ou vendedor."
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Relatórios Financeiros" 
                secondary="DRE, fluxo de caixa e análises comparativas."
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Relatórios de Estoque" 
                secondary="Movimentação, produtos mais vendidos e curva ABC."
              />
            </ListItem>
          </List>
        </AccordionDetails>
      </Accordion>

      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Precisa de ajuda?
        </Typography>
        <Typography paragraph>
          Se você tiver dúvidas ou precisar de suporte, entre em contato conosco:
        </Typography>
        <List>
          <ListItem>
            <ListItemIcon>
              <InfoIcon />
            </ListItemIcon>
            <ListItemText 
              primary="Suporte Técnico" 
              secondary="suporte@nextmanager.com.br"
            />
          </ListItem>
        </List>
      </Box>
    </Box>
  )
} 
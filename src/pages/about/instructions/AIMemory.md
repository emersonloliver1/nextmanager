# Memória de Instruções do NextManager

## Estrutura do Sistema

### 1. Módulos Principais
- Dashboard
- Vendas
- Financeiro
- Estoque
- Gestão
- Relatórios
- Sobre

### 2. Integrações entre Módulos

#### Vendas -> Dashboard/Financeiro
- Vendas realizadas alimentam gráficos do dashboard
- Vendas geram entradas no financeiro
- Vendas atualizam estoque automaticamente

#### Estoque -> Vendas/Dashboard
- Produtos disponíveis para venda
- Alertas de estoque baixo no dashboard
- Histórico de movimentação

#### Financeiro -> Dashboard
- Fluxo de caixa
- Contas a pagar e receber
- Balanço geral

### 3. Regras de Negócio Principais

#### Vendas
- Valor líquido das vendas é considerado como entrada no financeiro
- Desconto é aplicado sobre o valor bruto
- Vendas podem ser à vista ou a prazo

#### Estoque
- Controle de estoque mínimo e máximo
- Alertas automáticos de reposição
- Rastreamento de lote e validade

#### Financeiro
- Fluxo de caixa considera entradas líquidas
- Categorização de despesas e receitas
- Controle de contas a pagar e receber

### 4. Atualizações Planejadas

#### Fase 1 (Atual)
- [x] Implementação básica dos módulos
- [x] Integrações iniciais
- [x] Interface responsiva

#### Fase 2
- [ ] Melhorias visuais nos formulários
- [ ] Integração completa entre módulos
- [ ] Manual do usuário detalhado

#### Fase 3
- [ ] Relatórios avançados
- [ ] Dashboard personalizado
- [ ] Automações avançadas

### 5. Notas de Desenvolvimento
- Usar ISO string para datas no Firestore
- Manter padrão de design Material UI
- Seguir boas práticas de UX/UI 
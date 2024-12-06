# NextManager

Sistema completo de gestão empresarial (ERP/CRM) desenvolvido com tecnologias modernas.

![NextManager Logo](./public/logo.svg)

## 📋 Sobre

O NextManager é uma solução completa para gestão empresarial, integrando funcionalidades de ERP e CRM em uma interface moderna e intuitiva. Desenvolvido com tecnologias de ponta, oferece uma experiência fluida tanto em ambiente web quanto desktop.

## 🚀 Tecnologias Utilizadas

- [React](https://reactjs.org/) - Biblioteca para construção de interfaces
- [TypeScript](https://www.typescriptlang.org/) - Superset JavaScript com tipagem estática
- [Electron](https://www.electronjs.org/) - Framework para desenvolvimento desktop
- [Vite](https://vitejs.dev/) - Build tool e bundler
- [Material-UI](https://mui.com/) - Framework de componentes React
- [Firebase](https://firebase.google.com/) - Plataforma de desenvolvimento
- [React Router](https://reactrouter.com/) - Roteamento e navegação

## ✨ Funcionalidades

### 🏠 Dashboard
- Visão geral do negócio
- Indicadores principais
- Gráficos de desempenho
- Resumo financeiro

### 👥 CRM (Gestão de Relacionamento)
- Cadastro completo de clientes (PF/PJ)
- Gestão de oportunidades
- Campanhas de marketing
- Sistema de atendimento
- Histórico de interações

### 💰 Vendas
- Pedidos de venda
- PDV (Ponto de Venda)
- Orçamentos
- Controle de comissões

### 📦 Produtos & Estoque
- Cadastro de produtos
- Controle de estoque
- Gestão de fornecedores
- Inventário
- Códigos de barras

### 💳 Financeiro
- Visão geral financeira
- Contas a pagar
- Contas a receber
- Fluxo de caixa
- DRE

### 📊 Gestão
- Gestão de projetos
- Controle de tarefas
- Agenda integrada
- Documentos

### 📈 Relatórios
- Relatórios gerenciais
- Analytics
- Exportação de dados
- Gráficos personalizados

### ⚙️ Configurações
- Perfis de usuário
- Permissões
- Configurações do sistema
- Personalização

## 🛠️ Requisitos

- Node.js (versão 14 ou superior)
- npm ou yarn
- Git

## 🚀 Como Executar

1. Clone o repositório:
\`\`\`bash
git clone https://github.com/seu-usuario/nextmanager.git
cd nextmanager
\`\`\`

2. Instale as dependências:
\`\`\`bash
npm install
\`\`\`

3. Configure as variáveis de ambiente:
Crie um arquivo \`.env\` na raiz do projeto:
\`\`\`env
VITE_FIREBASE_API_KEY=sua_api_key
VITE_FIREBASE_AUTH_DOMAIN=seu_auth_domain
VITE_FIREBASE_PROJECT_ID=seu_project_id
VITE_FIREBASE_STORAGE_BUCKET=seu_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=seu_messaging_sender_id
VITE_FIREBASE_APP_ID=seu_app_id
VITE_FIREBASE_MEASUREMENT_ID=seu_measurement_id
\`\`\`

4. Execute em modo desenvolvimento:
\`\`\`bash
# Versão Web
npm run dev

# Versão Desktop (Electron)
npm run electron-dev
\`\`\`

5. Gerar build de produção:
\`\`\`bash
# Build Web
npm run build

# Build Desktop
npm run electron-build
\`\`\`

## 🔒 Segurança

- Autenticação segura com Firebase
- Controle de acesso baseado em funções
- Criptografia de dados sensíveis
- Backup automático

## 🎯 Recursos em Desenvolvimento

- [ ] Integração com PIX
- [ ] App mobile
- [ ] Integração com NFe
- [ ] Módulo de RH
- [ ] Integração com marketplaces
- [ ] API pública

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🤝 Contribuição

Contribuições são bem-vindas! Por favor, leia nosso guia de contribuição antes de submeter alterações.

## 📧 Suporte

Para suporte, dúvidas ou sugestões:
- Abra uma [issue](https://github.com/seu-usuario/nextmanager/issues)
- Email: suporte@nextmanager.com
- Discord: [Comunidade NextManager](https://discord.gg/nextmanager)

## 🌟 Agradecimentos

Agradecemos a todos os desenvolvedores e colaboradores que tornaram este projeto possível.

---
Desenvolvido com ❤️ pela equipe NextManager

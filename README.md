# NextManager

Sistema de gestão empresarial desenvolvido com React, TypeScript e Firebase.

## Funcionalidades

- Dashboard com indicadores de desempenho
- Gestão de vendas e PDV
- Controle de estoque
- Gestão financeira
- Gestão de projetos e tarefas
- Relatórios gerenciais

## Tecnologias Utilizadas

- React 18
- TypeScript
- Material UI
- Firebase (Auth, Firestore)
- React Router
- Chart.js
- Date-fns

## Pré-requisitos

- Node.js 16+
- npm ou yarn
- Conta no Firebase

## Instalação

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/nextmanager.git
cd nextmanager
```

2. Instale as dependências:
```bash
npm install
# ou
yarn install
```

3. Configure as variáveis de ambiente:
Crie um arquivo `.env` na raiz do projeto e adicione suas configurações do Firebase:
```env
VITE_FIREBASE_API_KEY=sua_api_key
VITE_FIREBASE_AUTH_DOMAIN=seu_auth_domain
VITE_FIREBASE_PROJECT_ID=seu_project_id
VITE_FIREBASE_STORAGE_BUCKET=seu_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=seu_messaging_sender_id
VITE_FIREBASE_APP_ID=seu_app_id
VITE_FIREBASE_MEASUREMENT_ID=seu_measurement_id
```

4. Inicie o servidor de desenvolvimento:
```bash
npm run dev
# ou
yarn dev
```

## Estrutura do Projeto

```
src/
  ├── components/     # Componentes reutilizáveis
  ├── config/        # Configurações (Firebase, etc)
  ├── contexts/      # Contextos do React
  ├── hooks/         # Hooks personalizados
  ├── pages/         # Páginas da aplicação
  ├── routes/        # Configuração de rotas
  ├── services/      # Serviços e APIs
  ├── theme/         # Configuração do tema
  ├── types/         # Tipos TypeScript
  └── utils/         # Funções utilitárias
```

## Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Gera a build de produção
- `npm run preview` - Visualiza a build localmente
- `npm run lint` - Executa o linter
- `npm run test` - Executa os testes

## Deploy

O projeto está configurado para deploy na Vercel. Para fazer o deploy:

1. Conecte seu repositório à Vercel
2. Configure as variáveis de ambiente na Vercel
3. A Vercel fará o deploy automaticamente a cada push na branch main

## Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Faça commit das suas alterações (`git commit -m 'Add some AmazingFeature'`)
4. Faça push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## Contato

Seu Nome - [@seutwitter](https://twitter.com/seutwitter) - email@exemplo.com

Link do Projeto: [https://github.com/seu-usuario/nextmanager](https://github.com/seu-usuario/nextmanager)

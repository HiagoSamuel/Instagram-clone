# Guia Inicial do Projeto Instagram Clone

## Introdução
Este guia explica como iniciar o projeto Instagram Clone, entender a estrutura de pastas e os fundamentos da stack escolhida. Ele cobre o que cada parte do projeto faz e por que ela é importante.

## 1. Objetivo do projeto
O objetivo é construir um clone funcional do Instagram com:
- Autenticação de usuários
- Feed de posts com curtidas
- Perfil de usuário com grade de fotos
- Mensagens diretas (DM)
- Upload de imagens usando Supabase Storage
- Backend em Express + Supabase
- Deploy em Vercel e Railway
## 2. Tecnologias principais
### Frontend
- React: biblioteca para construir interfaces reativas.
- Vite: ferramenta de build leve e rápida para apps React.
- React Router: para navegação entre páginas.
- Context API + useReducer: para gerenciar estado global simples sem Redux.
- Axios: para fazer requisições HTTP ao backend.
- CSS Modules ou Tailwind CSS: para estilização modular e fácil manutenção.

### Backend
- Node.js: runtime JavaScript para backend.
- Express: framework web simples e popular para APIs.
- JWT (jsonwebtoken): para autenticação baseada em token.
- bcrypt: para hash seguro de senhas.
- Supabase: banco de dados PostgreSQL e Storage integrado.
- Multer: para receber uploads de arquivo no servidor.

## 3. Estrutura do projeto
O projeto será organizado em duas pastas principais:

### `frontend/`
Contém a aplicação React.

- `public/`: arquivos estáticos públicos.
- `src/`
  - `components/`: componentes reutilizáveis, como botões, cards, avatars e navbar.
  - `pages/`: telas principais do app (Login, Register, Home, Profile, Messages).
  - `context/`: estado global de autenticação.
  - `services/`: API e serviços específicos como authService, postService e messageService.
  - `hooks/`: hooks customizados como `useAuth`.
  - `App.jsx`: definição das rotas e layout geral.
  - `main.jsx`: ponto de entrada da aplicação.
- `.env`: variáveis de ambiente do frontend.
- `vite.config.js`: configuração do Vite.

### `backend/`
Contém a API Express.

- `src/`
  - `controllers/`: lógica das rotas, separada por responsabilidade.
  - `middlewares/`: funções que são executadas antes das rotas, como autenticação JWT.
  - `routes/`: definição das rotas de API em arquivos separados.
  - `services/`: integração com Supabase.
  - `app.js`: arquivo principal que configura o servidor.
- `.env`: variáveis de ambiente do backend.
- `package.json`: dependências e scripts.

## 4. Por que essa arquitetura?
### Separação de responsabilidades
- Frontend cuida apenas da interface e experiência do usuário.
- Backend cuida da lógica de negócios, segurança, autenticação e acesso ao banco.

### Escalabilidade
- Com as rotas e controllers separados, fica mais fácil adicionar novas features.
- Serviços isolados permitem trocar o provedor de banco ou armazenamento sem mudar toda a aplicação.

### Boas práticas
- Usar `AuthContext` no frontend evita prop drilling e centraliza o estado de autenticação.
- Criar serviços (`authService`, `postService`, `messageService`) simplifica chamadas de API.
- Usar middlewares no backend melhora a segurança e reaproveitamento de código.

## 5. Fundamentos de cada item principal
### `AuthContext` e `useAuth`
- Mantém o usuário logado e seus dados disponíveis globalmente.
- Faz o login, logout e checa se o usuário ainda está autenticado.
- Redireciona para login se o token não for válido.

### `api.js`
- Configura o axios com a URL base do backend.
- Adiciona o token JWT em todas as requisições automaticamente.
- Trata respostas 401 removendo o token e forçando login.

### `LoginPage` e `RegisterPage`
- `LoginPage` permite ao usuário entrar no app.
- `RegisterPage` cria a conta e valida o username antes de enviar.
- Ambos usam o serviço de auth para conectar com a API.

### `HomePage` e `PostCard`
- `HomePage` exibe o feed de posts.
- `PostCard` mostra cada post, incluindo imagem, curtidas, legenda e ações.
- O feed vem da rota `/api/posts/feed` do backend.

### `ProfilePage` e `ProfileGrid`
- `ProfilePage` mostra informações do perfil e os posts do usuário.
- `ProfileGrid` exibe os posts em grade de 3 colunas.
- Permite ver detalhes do post em um modal.

### `MessagesPage` e `ChatWindow`
- `MessagesPage` mostra a lista de conversas.
- `ChatWindow` exibe a conversa ativa e permite enviar mensagens.
- As mensagens são carregadas pela API e atualizadas dinamicamente.

### `CreatePostModal`
- Permite selecionar uma imagem e escrever legenda.
- Faz upload para Supabase Storage e salva o post no banco.
- Atualiza o feed após a publicação.

### `authMiddleware` no backend
- Verifica se o header `Authorization` contém um token válido.
- Converte o token em `req.user` para ser usado nas rotas protegidas.
- Garante que apenas usuários logados acessem dados sensíveis.

### Controllers do backend
- `authController`: login, registro e dados do usuário atual.
- `postController`: feed, criação de post, curtidas e posts de usuário.
- `userController`: perfil, seguir/desseguir e sugestões.
- `messageController`: conversas e envio de mensagens.

### Rotas de API
- `/api/auth`: autenticação.
- `/api/posts`: posts, feed e likes.
- `/api/users`: perfil, seguir e sugestões.
- `/api/messages`: conversas e mensagens.

## 6. Próximos passos
O próximo passo é criar a base do frontend e backend com as pastas e arquivos iniciais. Quando você disser **"proximo"**, avançamos para a parte prática: iniciar o projeto, instalar dependências e montar a estrutura.

# Status do Projeto - Instagram Clone

Auditoria atualizada em: 18/06/2026

## Arvore resumida do repositorio

```txt
backend/
  src/
    controllers/  auth, users, posts, comments, friendships, messages, notifications, stories
    helpers/      notificationHelper
    middlewares/  authMiddleware
    routes/       auth, users, posts, friendships, messages, notifications, stories, search, explore, push
    services/     supabase, push
  supabase-*.sql  migrations versionadas
  nixpacks.toml   ffmpeg no Railway

frontend/
  src/
    components/   PostCard, CreatePostModal, StoriesBar, StoryViewer, badges/nav links
    context/      AuthContext, SocketContext, ThemeContext
    pages/        Home, Profile, Search, Explore, Conversations, Chat, Notifications
    services/     api, postService
```

## Resumo rapido

| Fase | Status |
|---|---:|
| Fase 1 - Base | 13/13 itens OK |
| Fase 2 - Amizades + chat | 10/10 itens OK |
| Fase 3 - Engajamento e midia | 17/17 itens OK |
| Refactors opcionais P6 | 0/3 itens mantidos como divida consciente |

Progresso geral das fases funcionais: 100%.

## Checklist preenchido

### Fase 1 - Base

- [x] AuthController com registro/login JWT: `backend/src/controllers/authController.js`.
- [x] AuthMiddleware protegendo rotas privadas: `backend/src/middlewares/authMiddleware.js`.
- [x] UserController com perfil/busca: `backend/src/controllers/userController.js`.
- [x] PostController cria post/lista feed: `backend/src/controllers/postController.js:329`, `backend/src/controllers/postController.js:296`.
- [x] MessageController envia/lista DMs: `backend/src/controllers/messageController.js`.
- [x] Rotas auth/users/posts/messages registradas: `backend/src/app.js:39`, `backend/src/app.js:42`, `backend/src/app.js:40`, `backend/src/app.js:50`.
- [x] Supabase via env, sem chave hardcoded: `backend/src/services/supabase.js`.
- [x] Login/Register: `frontend/src/pages/Login/LoginPage.jsx`, `frontend/src/pages/Register/RegisterPage.jsx`.
- [x] Home/Profile/Messages: `frontend/src/pages/Home/HomePage.jsx`, `frontend/src/pages/Profile/ProfilePage.jsx`, `frontend/src/pages/ConversationsPage.jsx`.
- [x] Componentes principais: `frontend/src/components/PostCard/PostCard.jsx`, `frontend/src/components/Avatar/Avatar.jsx`, `frontend/src/components/CreatePostModal/CreatePostModal.jsx`.
- [x] AuthContext/useAuth: `frontend/src/context/AuthContext.jsx`.
- [x] Services de API/posts: `frontend/src/services/api.js`, `frontend/src/services/postService.js`.
- [x] Schema/Storage documentados por migrations SQL: `backend/supabase-engagement.sql`, `backend/supabase-post-videos.sql`.

### Fase 2 - Amizades + chat

- [x] Schema de amizade simetrica: `backend/supabase-friendships.sql`.
- [x] Rotas enviar/aceitar/remover/listar amizade: `backend/src/routes/friendships.js`.
- [x] Feed filtrado por amigos: `backend/src/controllers/postController.js:296`.
- [x] FriendButton e FriendRequestsPage: `frontend/src/components/FriendButton.jsx`, `frontend/src/pages/FriendRequestsPage.jsx`.
- [x] conversationId deterministico: `backend/src/controllers/messageController.js`.
- [x] Rotas de mensagens e `/new?after=`: `backend/src/routes/messages.js`.
- [x] ChatPage: `frontend/src/pages/ChatPage.jsx`.
- [x] Socket.io no backend com JWT e salas `user:${userId}`: `backend/src/app.js`.
- [x] SocketContext global: `frontend/src/context/SocketContext.jsx`.
- [x] Chat/lista/badge reagem em tempo real: `frontend/src/pages/ConversationsPage.jsx`, `frontend/src/components/MessagesNavLink.jsx`.

### Fase 3 - Engajamento e midia

#### M1 - Curtidas e comentarios

- [x] Tabelas `likes` e `comments`: `backend/supabase-engagement.sql`.
- [x] Curtir/descurtir e comentarios no backend: `backend/src/controllers/postController.js:541`, `backend/src/controllers/commentController.js:126`.
- [x] Rotas de likes/comments: `backend/src/routes/posts.js:43`, `backend/src/routes/posts.js:52`.
- [x] Optimistic update de curtida: `frontend/src/components/PostCard/PostCard.jsx`.
- [x] Comentarios, badge de nao lidos e contador total: `frontend/src/components/PostCard/PostCard.jsx:98`, `backend/src/controllers/postController.js:278`.

#### M2 - Notificacoes internas

- [x] Tabela `notifications`: `backend/supabase-notifications.sql:1`.
- [x] Helper grava no banco e emite Socket.io: `backend/src/helpers/notificationHelper.js:4`.
- [x] Disparo ao curtir/comentar/pedido amizade: `backend/src/controllers/postController.js:556`, `backend/src/controllers/commentController.js:191`, `backend/src/controllers/friendshipController.js:57`.
- [x] Rotas listar/marcar lida: `backend/src/routes/notifications.js`.
- [x] Badge/lista no frontend: `frontend/src/components/NotificationsNavLink.jsx:4`, `frontend/src/pages/NotificationsPage.jsx:16`.

#### M3 - Stories

- [x] Tabela `stories` com expiracao: `backend/supabase-stories.sql:1`.
- [x] Criar story e listar apenas ativos: `backend/src/controllers/storyController.js:54`, `backend/src/controllers/storyController.js:80`.
- [x] StoriesBar no topo da Home: `frontend/src/components/StoriesBar.jsx:6`, `frontend/src/pages/Home/HomePage.jsx:213`.
- [x] StoryViewer fullscreen com progresso: `frontend/src/components/StoryViewer.jsx:6`.

#### M4 - Videos

- [x] `fluent-ffmpeg` instalado: `backend/package.json:18`, `package-lock.json:21`.
- [x] `nixpacks.toml` instala ffmpeg no Railway: `backend/nixpacks.toml:2`.
- [x] Upload de video com validacao de duracao e thumbnail: `backend/src/controllers/postController.js:106`, `backend/src/controllers/postController.js:403`.
- [x] Player HTML5 e progresso de upload: `frontend/src/components/PostCard/PostCard.jsx:336`, `frontend/src/components/CreatePostModal/CreatePostModal.jsx`.

### P6 - Refactors opcionais

- [~] Extrair `Navbar`, `Button`, `Modal`: mantido como divida tecnica; o app funciona e mexer nisso agora teria risco visual amplo.
- [~] Criar `authService` e `messageService`: mantido como divida tecnica; chamadas atuais estao funcionais.
- [~] Mover edicao de perfil do authController para userController: mantido como divida tecnica organizacional.

## Validacao executada

- `node --check` nos controllers/rotas alterados.
- `npm test` no backend: 3 testes passaram.
- `npm run build` no frontend: build Vite passou.

Observacao: as migrations SQL precisam ser executadas no Supabase antes de testar notificacoes, stories e videos em producao.

## O que mudou nesta rodada

1. `c3f380d chore(security): remove credenciais supabase do codigo`
2. `4e2f62d feat(db): adiciona schema de engajamento`
3. `8afa3d0 feat(comments): adiciona contador total`
4. `350c129 feat(notifications): adiciona notificacoes internas`
5. `1f2601e feat(stories): adiciona stories ativos`
6. `67a55ba feat(videos): adiciona upload e player`

## Proximo passo recomendado

1. Rodar no Supabase: `backend/supabase-engagement.sql`, `backend/supabase-notifications.sql`, `backend/supabase-stories.sql` e `backend/supabase-post-videos.sql`.
2. Fazer teste manual em duas contas para confirmar notificacoes, stories e videos no ambiente real.
3. Rotacionar a chave antiga do Supabase no painel, porque ela ja apareceu no historico git antes do P0.

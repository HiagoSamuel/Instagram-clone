# Subtarefas Backend — Fase 1

## 1. Estrutura inicial
- Criar projeto Node.js dentro de `backend/`
- Adicionar `package.json` com dependências:
  - `express`
  - `cors`
  - `dotenv`
  - `jsonwebtoken`
  - `bcrypt`
  - `@supabase/supabase-js`
  - `multer`
- Criar `src/app.js`
- Criar `src/services/supabase.js`
- Configurar `.env`

## 2. Configurar Supabase
- Adicionar `SUPABASE_URL` e `SUPABASE_SERVICE_KEY` no `.env`
- Criar cliente Supabase em `src/services/supabase.js`
- Testar conexão básica via um endpoint de saúde

## 3. Tabelas no Supabase
- Executar SQL para criar tabelas:
  - `users`
  - `posts`
  - `likes`
  - `followers`
  - `conversations`
  - `messages`
- Verificar constraints e índices únicos
- Garantir campos de data e relacionamentos corretos

## 4. Rotas de Autenticação
- Criar `src/controllers/authController.js`
- Criar `src/routes/auth.js`
- Implementar endpoints:
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `GET /api/auth/me`
- Criar `src/middlewares/authMiddleware.js`
- Usar `bcrypt` para hash de senha
- Usar `jsonwebtoken` para geração e validação de token
- Validar existência de username e email no cadastro

## 5. Rotas de Posts
- Criar `src/controllers/postController.js`
- Criar `src/routes/posts.js`
- Implementar endpoints:
  - `GET /api/posts/feed`
  - `POST /api/posts`
  - `GET /api/posts/user/:username`
  - `DELETE /api/posts/:id`
  - `POST /api/posts/:id/like`
  - `DELETE /api/posts/:id/like`
- Usar `multer` para processar upload de imagem
- Enviar arquivo para Supabase Storage
- Gerar `publicUrl` da imagem e salvar `image_url`
- Retornar contagem de likes e flag `liked_by_me`

## 6. Rotas de Usuários
- Criar `src/controllers/userController.js`
- Criar `src/routes/users.js`
- Implementar endpoints:
  - `GET /api/users/:username`
  - `PUT /api/users/me`
  - `POST /api/users/:username/follow`
  - `DELETE /api/users/:username/follow`
  - `GET /api/users/suggestions`
- Buscar dados de perfil e contagem de posts/followers/following
- Implementar lógica de seguir/deixar de seguir
- Retornar dados mínimos para o frontend

## 7. Rotas de Mensagens
- Criar `src/controllers/messageController.js`
- Criar `src/routes/messages.js`
- Implementar endpoints:
  - `GET /api/messages/conversations`
  - `GET /api/messages/:conversationId`
  - `POST /api/messages/:conversationId`
  - `POST /api/messages/start/:username`
- Buscar conversas com último envio e usuário oposto
- Permitir envio de mensagens e criação de conversa
- Proteger todas as rotas com JWT

## 8. Testes manuais e validações
- Testar login/cadastro com Postman ou Insomnia
- Verificar proteção de rotas com token
- Testar upload de imagens via API
- Validar respostas de erros e status HTTP

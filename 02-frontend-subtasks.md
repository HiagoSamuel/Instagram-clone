# Subtarefas Frontend — Fase 1

## 1. Estrutura inicial
- Criar aplicação React com Vite dentro de `frontend/`
- Configurar `react-router-dom`
- Criar `src/App.jsx` e `src/main.jsx`
- Definir `src/context/AuthContext.jsx` e `src/hooks/useAuth.js`
- Configurar `src/services/api.js` com interceptors de token

## 2. Tela de Login (`/login`)
- Criar página `src/pages/Login/LoginPage.jsx`
- Criar componentes:
  - `LoginForm`
  - `Button`
  - `InputField`
- Implementar validação básica de formulário
- Chamar API de login e salvar JWT em `localStorage`
- Redirecionar para `/` após sucesso
- Proteger rota se já estiver logado
- Mostrar mensagens de erro

## 3. Tela de Cadastro (`/register`)
- Criar página `src/pages/Register/RegisterPage.jsx`
- Criar formulário com campos:
  - Email
  - Nome completo
  - Username
  - Senha
- Validar username existente via API
- Enviar cadastro para backend
- Redirecionar para `/login` após sucesso
- Exibir erros por campo

## 4. Tela Home / Feed (`/`)
- Criar página `src/pages/Home/HomePage.jsx`
- Criar componentes:
  - `Navbar`
  - `PostCard`
  - `PostActions`
  - `UserSuggestions`
  - `Avatar`
- Carregar feed via `postService.getFeed()`
- Implementar ação de curtir/descurtir no `PostCard`
- Criar layout de três colunas: nav, feed e sugestões
- Garantir rota protegida para home

## 5. Tela Perfil (`/profile/:username`)
- Criar página `src/pages/Profile/ProfilePage.jsx`
- Criar componentes:
  - `ProfileGrid`
  - `EditProfileButton`
- Exibir profile info: avatar, nome, bio, estatísticas
- Exibir grade de posts em 3 colunas
- Clicar em imagem abre modal com post completo
- Mostrar botão `Editar perfil` ou `Seguir/Seguindo`
- Buscar perfil e posts via API

## 6. Tela Mensagens (`/messages`)
- Criar página `src/pages/Messages/MessagesPage.jsx`
- Criar componentes:
  - `ConversationList`
  - `ConversationItem`
  - `ChatWindow`
  - `MessageBubble`
  - `MessageInput`
- Carregar conversas e mensagens do backend
- Permitir abrir conversa e enviar mensagens
- Implementar pesquisa simples na lista de conversas

## 7. Modal Criar Post
- Criar componente `CreatePostModal`
- Incluir seleção de arquivo e preview da imagem
- Campo para legenda
- Upload da imagem via `postService.createPost()`
- Ao criar post, atualizar feed
- Trigger no botão `+` da navbar

## 8. Componente Navbar Global
- Criar `src/components/Navbar/Navbar.jsx`
- Incluir links:
  - `/`
  - `/messages`
  - botão `Criar`
  - perfil do usuário logado
- Não exibir navbar em `/login` e `/register`
- Destacar rota ativa

## 9. Ajustes de estilo
- Usar CSS Modules ou Tailwind CSS
- Criar classes para componentes reutilizáveis
- Implementar tema escuro semelhante ao Instagram
- Garantir responsividade básica

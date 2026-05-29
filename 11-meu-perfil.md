# Meu Perfil e Navegação de Perfil

## Objetivo
Criar uma opção de "Meu Perfil" na tela inicial e permitir que o usuário abra o perfil de qualquer pessoa clicando sobre o perfil nos posts.

## Onde adicionar
- `frontend/src/pages/Home/HomePage.jsx`
- `frontend/src/components/PostCard/PostCard.jsx`
- `frontend/src/pages/Profile/ProfilePage.jsx` (novo)
- `frontend/src/App.jsx`
- `frontend/src/context/AuthContext.jsx`
- `frontend/src/App.css` ou CSS local

## Passos para adicionar "Meu Perfil"

1. Criar rota de perfil
   - Adicione uma rota em `App.jsx` para `/profile` ou `/profile/:userId`
   - Exemplo:
     ```jsx
     <Route path="/profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
     <Route path="/profile/:userId" element={<RequireAuth><ProfilePage /></RequireAuth>} />
     ```

2. Criar componente `ProfilePage`
   - Arquivo sugerido: `frontend/src/pages/Profile/ProfilePage.jsx`
   - Deve mostrar:
     - avatar do usuário
     - apelido
     - bio
     - posts do usuário
   - Se a rota for `/profile`, mostre o perfil do usuário logado
   - Se a rota for `/profile/:userId`, carregue o perfil do usuário selecionado

3. Adicionar botão "Meu Perfil" na home
   - Em `HomePage`, no cabeçalho ou no menu superior direito, adicione um botão/atalho
   - O botão deve redirecionar para `/profile`
   - Exibir apenas para usuários logados

4. Abrir perfil de qualquer pessoa clicando no post
   - Em `PostCard.jsx`, envolva o avatar, apelido ou nome do autor com um `Link`
   - Exemplo:
     ```jsx
     <Link to={`/profile/${post.user.id}`} className="post-author-link">
       <Avatar src={post.user.avatar_url} alt={post.user.username} />
       <div>
         <strong>{post.user.username}</strong>
       </div>
     </Link>
     ```
   - Garanta que o componente suporte clique em qualquer post com autor

## Funcionalidade do perfil do próprio usuário

- Ao abrir `/profile`, carregue `user` do `AuthContext`
- Mostre informações pessoais:
  - avatar
  - apelido/nome de usuário
  - bio
  - número de posts
- Se usar `ProfilePage` para perfil de outras pessoas, carregue os dados via API (`/users/:userId` ou `/auth/me`)
- Se desejar, diferencie visualmente o perfil próprio do perfil de terceiros

## Requisitos extras

### Perfil do usuário logado
- Exibir botão de edição somente no próprio perfil
- Curso:
  - editar bio
  - alterar apelido
  - alterar foto
- As alterações podem ser feitas no mesmo `ProfilePage` ou redirecionar para as configurações

### Perfil de terceiros
- Não mostrar edição
- Apenas exibir:
  - avatar
  - apelido
  - bio
  - posts públicos
- Permitir clicar para ver o perfil, mas não modificar

## Considerações de implementação

- Se a API ainda não tiver rota para buscar perfil por `userId`, crie no backend.
- Use `useParams()` do `react-router-dom` para ler `userId` em `ProfilePage`
- Se `userId` for ausente, mostre o perfil do usuário logado

## Exemplo de navegação

- `HomePage` → botão `Meu Perfil` → `/profile`
- `PostCard` → `Link` no autor → `/profile/:userId`
- Se o usuário vê seu próprio perfil, pode clicar em `Editar` ou `Configurações`

## Estilo sugerido
- Botão `Meu Perfil` no topo direito ou no menu principal
- Use texto simples ou ícone de usuário
- Página de perfil com cabeçalho escuro e layout de cartão
- Mostre `Bio` com tipografia legível

## Resumo do que fazer

1. Criar rota de perfil em `App.jsx`
2. Criar `ProfilePage`
3. Adicionar botão `Meu Perfil` em `HomePage`
4. Tornar avatar/autor clicável em `PostCard`
5. Implementar carregamento de dados do perfil logado e de outros usuários
6. Garantir autenticação antes de acesso

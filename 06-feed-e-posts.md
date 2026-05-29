# Etapa Prática 2 — Feed e Posts

## Objetivo
Implementar o fluxo de feed e post no backend e no frontend. Nesta etapa você irá:
- criar a API de posts no backend
- implementar upload de imagem com Supabase Storage
- criar o serviço de posts no frontend
- montar a tela principal do feed com cards de post

## 1. Estrutura necessária
### Backend
Crie estes arquivos:
- `backend/src/controllers/postController.js`
- `backend/src/routes/posts.js`

### Frontend
Crie estes arquivos:
- `frontend/src/services/postService.js`
- `frontend/src/pages/Home/HomePage.jsx`
- `frontend/src/components/PostCard/PostCard.jsx`
- `frontend/src/components/Avatar/Avatar.jsx`

## 2. Backend — rotas de posts
### `backend/src/routes/posts.js`
Defina as rotas:
- `GET /api/posts/feed`
- `POST /api/posts`
- `GET /api/posts/user/:username`
- `POST /api/posts/:id/like`
- `DELETE /api/posts/:id/like`

Use `authMiddleware` em todas as rotas protegidas.

### `backend/src/controllers/postController.js`
Implemente as funções:
- `getFeed(req, res)`
- `createPost(req, res)`
- `likePost(req, res)`
- `unlikePost(req, res)`
- `getUserPosts(req, res)`

### lógica do feed
1. Pegar `userId` de `req.user`
2. Buscar IDs dos usuários que ele segue em `followers`
3. Incluir posts próprios e de quem segue
4. Retornar posts ordenados por `created_at` desc
5. Adicionar ao retorno:
   - `likes_count`
   - `liked_by_me`

### rota de like
- `POST /api/posts/:id/like` deve inserir na tabela `likes`
- `DELETE /api/posts/:id/like` deve remover o registro
- manter `UNIQUE(user_id, post_id)` para impedir curtidas duplicadas

## 3. Backend — upload de imagem para Supabase
### `createPost`
1. Use `multer` para processar `req.file`:
   - `upload.single('image')`
2. Gere o nome do arquivo para o Storage:
   - `const fileName = `${userId}/${Date.now()}-${file.originalname}``
3. Faça o upload para `supabase.storage.from('posts').upload(fileName, file.buffer, { contentType: file.mimetype })`
4. Obtenha `publicUrl` com `getPublicUrl`
5. Salve o post no banco com `image_url: publicUrl`
6. Retorne o post criado

## 4. Frontend — serviço de posts
### `frontend/src/services/postService.js`
Crie funções:
- `getFeed()` → `api.get('/posts/feed')`
- `createPost(formData)` → `api.post('/posts', formData)`
- `like(postId)` → `api.post(`/posts/${postId}/like`)
- `unlike(postId)` → `api.delete(`/posts/${postId}/like`)
- `getUserPosts(username)` → `api.get(`/posts/user/${username}`)

Para `createPost`, use `FormData` no frontend:
```js
const formData = new FormData()
formData.append('image', imageFile)
formData.append('caption', caption)
```

## 5. Frontend — tela de Feed
### `frontend/src/pages/Home/HomePage.jsx`
1. Importar `useEffect`, `useState` e `useAuth`
2. Buscar `postService.getFeed()` no carregamento
3. Renderizar lista de `PostCard`
4. Exibir mensagem de carregando / sem posts
5. Usar `RequireAuth` para proteger a rota

### `frontend/src/components/PostCard/PostCard.jsx`
O card deve exibir:
- avatar e username do autor
- imagem do post
- botões de curtir e comentar
- número de curtidas
- legenda
- data do post

Inclua estado local para `liked` e `likeCount`.

### `frontend/src/components/Avatar/Avatar.jsx`
Criar um componente simples para mostrar imagem circular:
```jsx
export default function Avatar({ src, size = 40 }) {
  return (
    <img
      src={src || '/default-avatar.png'}
      alt="Avatar"
      style={{ width: size, height: size, borderRadius: '50%' }}
    />
  )
}
```

## 6. Frontend — rotas
No `frontend/src/App.jsx`, confirme que a rota `/` já entra em `HomePage` com proteção.

## 7. Teste completo
1. Inicie o backend:
   - `cd backend && npm run dev`
2. Inicie o frontend:
   - `cd frontend && npm run dev`
3. Acesse o app e:
   - crie uma conta em `/register`
   - faça login em `/login`
   - veja o feed em `/`
4. Se tiver post criado manualmente no Supabase, confirme se aparece no feed

## 8. Observações finais
- Se o upload não aparecer, verifique o Storage do Supabase e a URL pública.
- Use `console.log` no frontend e no backend para debugar respostas de API.
- Depois dessa etapa, avançamos para perfil, mensagens e modal de criação de post.

# Integração do Modal de Criação de Post na HomePage

## O que você precisa fazer
Você vai fazer com que a HomePage:
- abra o modal quando clicar em `Novo post`
- feche o modal quando o usuário cancelar
- atualize o feed quando o post for criado

## Passo 1 — importar o modal
No topo do `frontend/src/pages/Home/HomePage.jsx`, adicione:
```jsx
import CreatePostModal from '../../components/CreatePostModal/CreatePostModal'
```

## Passo 2 — criar o estado do modal
Ainda em `HomePage.jsx`, crie um estado para controlar se o modal está aberto:
```jsx
const [isModalOpen, setIsModalOpen] = useState(false)
```

## Passo 3 — botão para abrir o modal
No JSX de renderização da HomePage, adicione um botão:
```jsx
<button onClick={() => setIsModalOpen(true)}>Novo post</button>
```

Isso faz com que o modal apareça quando o usuário clicar.

## Passo 4 — fechar o modal
Passe `onClose` para o modal e feche-o assim:
```jsx
{isModalOpen && (
  <CreatePostModal
    onClose={() => setIsModalOpen(false)}
    onPostCreated={handlePostCreated}
  />
)}
```

No componente `CreatePostModal`, o botão de fechar já deve chamar `onClose()`.

## Passo 5 — atualizar o feed após criação
Crie uma função que receba o novo post e coloque ele no topo da lista:
```jsx
const handlePostCreated = (newPost) => {
  setPosts((current) => [newPost, ...current])
}
```

Passe essa função para o modal:
```jsx
<CreatePostModal
  onClose={() => setIsModalOpen(false)}
  onPostCreated={handlePostCreated}
/>
```

## Passo 6 — o que o modal deve fazer internamente
O `CreatePostModal` deve:
- criar um `FormData()` com a imagem e legenda
- enviar para `POST /api/posts`
- chamar `onPostCreated(post)` quando a API retornar com sucesso
- chamar `onClose()` para fechar

Exemplo dentro do modal:
```js
const formData = new FormData()
formData.append('image', image)
formData.append('caption', caption)
```

## Passo 7 — exemplo completo simples do fluxo
### `HomePage.jsx`
```jsx
import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { postService } from '../../services/postService'
import PostCard from '../../components/PostCard/PostCard'
import CreatePostModal from '../../components/CreatePostModal/CreatePostModal'

export default function HomePage() {
  const { user, logout } = useAuth()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    const loadFeed = async () => {
      try {
        const data = await postService.getFeed()
        setPosts(data)
      } catch {
        setError('Erro ao carregar o feed.')
      } finally {
        setLoading(false)
      }
    }
    loadFeed()
  }, [])

  const handlePostCreated = (newPost) => {
    setPosts((current) => [newPost, ...current])
  }

  return (
    <div className="home-page">
      <button onClick={() => setIsModalOpen(true)}>Novo post</button>

      {isModalOpen && (
        <CreatePostModal
          onClose={() => setIsModalOpen(false)}
          onPostCreated={handlePostCreated}
        />
      )}

      {loading ? (
        <p>Carregando...</p>
      ) : (
        posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))
      )}
    </div>
  )
}
```

## Passo 8 — testar
1. Abra o app no browser
2. Faça login
3. Clique em `Novo post`
4. Escolha uma imagem
5. Escreva uma legenda
6. Clique em `Compartilhar`
7. Verifique se o post aparece no topo do feed

## Observação final
Se já existir `HomePage.jsx` com o estado e o modal, então a integração já está feita. Basta testar o botão e verificar se o modal abre e fecha corretamente.

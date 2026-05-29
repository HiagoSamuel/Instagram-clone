# Modal de Criação de Post

## Objetivo
Implementar um modal que permite ao usuário selecionar uma imagem, escrever uma legenda e publicar um novo post.

## 1. Estrutura de arquivos
Crie a pasta e o arquivo:
- `frontend/src/components/CreatePostModal/CreatePostModal.jsx`

## 2. Componente do modal
O modal deve conter:
- campo de upload de imagem (`<input type="file" accept="image/*" />`)
- textarea para legenda
- botão de enviar
- botão fechar
- mensagens de erro/feedback

### Exemplo de estrutura
```jsx
export default function CreatePostModal({ onClose, onPostCreated }) {
  const [image, setImage] = useState(null)
  const [caption, setCaption] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleFileChange = (e) => {
    setImage(e.target.files[0] || null)
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!image) {
      setError('Selecione uma imagem para postar.')
      return
    }

    setLoading(true)
    setError('')

    const formData = new FormData()
    formData.append('image', image)
    formData.append('caption', caption)

    try {
      const response = await fetch(import.meta.env.VITE_API_URL + '/posts', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao criar post.')
      }

      const post = await response.json()
      onPostCreated(post)
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <header className="modal-header">
          <h2>Novo post</h2>
          <button type="button" onClick={onClose}>✕</button>
        </header>

        <form onSubmit={handleSubmit} className="modal-form">
          <label>
            Imagem
            <input type="file" accept="image/*" onChange={handleFileChange} />
          </label>

          <label>
            Legenda
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Escreva uma legenda..."
            />
          </label>

          {error && <p className="modal-error">{error}</p>}

          <button type="submit" disabled={loading}>
            {loading ? 'Publicando...' : 'Compartilhar'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

## 3. Integração com `HomePage`
No `HomePage`, adicione:
- estado `isModalOpen`
- botão para abrir o modal
- handler `handlePostCreated` para inserir o novo post no feed
- renderização condicional do `CreatePostModal`

### Exemplo de uso
```jsx
const [isModalOpen, setIsModalOpen] = useState(false)

const handlePostCreated = (newPost) => {
  setPosts((current) => [newPost, ...current])
}

return (
  <div>
    <button onClick={() => setIsModalOpen(true)}>Novo post</button>
    {isModalOpen && (
      <CreatePostModal
        onClose={() => setIsModalOpen(false)}
        onPostCreated={handlePostCreated}
      />
    )}
  </div>
)
```

## 4. Envio do formulário
O envio deve usar `FormData` porque há arquivo:
```js
const formData = new FormData()
formData.append('image', image)
formData.append('caption', caption)
```

E a requisição deve enviar o token JWT no header:
```js
headers: {
  Authorization: `Bearer ${localStorage.getItem('token')}`,
}
```

## 5. Backend esperado
No backend, a rota `POST /api/posts` deve:
- aceitar `multipart/form-data`
- receber `req.file`
- fazer upload para Supabase Storage
- salvar `image_url` no banco
- retornar o post criado em JSON

## 6. Estilização sugerida
- `.modal-overlay`: fundo escuro translúcido
- `.modal-content`: cartão centralizado
- `.modal-header`: título + botão fechar
- `.modal-form`: campos em coluna
- `.modal-error`: texto de erro em vermelho

## 7. Teste
- Abra o app no frontend
- Faça login
- Clique em `Novo post`
- Selecione uma imagem e escreva legenda
- Clique em `Compartilhar`
- Confirme que o post aparece no feed

## 8. Dicas
- Use `console.log` em caso de erro de fetch
- Se o upload falhar, verifique se o bucket `posts` é público
- Verifique se `VITE_API_URL` aponta para `http://localhost:3001/api`

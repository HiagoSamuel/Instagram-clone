import { useState } from 'react'
import { apiUrl } from '../../services/api'
import './CreatePostModal.css'

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function containsBlockedWord(text, blockedWords) {
  const lowerText = text.toLowerCase()
  return blockedWords.some((word) => {
    if (!word) return false
    const regex = new RegExp(`\\b${escapeRegExp(word)}\\b`, 'i')
    return regex.test(lowerText)
  })
}

export default function CreatePostModal({ open, onClose, onPostCreated }) {
  const [image, setImage] = useState(null)
  const [caption, setCaption] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!open) {
    return null
  }

  const handleFileChange = (e) => {
    setImage(e.target.files[0] || null)
    setError('')
  }

  // FIX: reseta todo o estado ao fechar
  const handleClose = () => {
    setImage(null)
    setCaption('')
    setError('')
    onClose()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!image) {
      setError('Selecione uma imagem para postar.')
      return
    }
    setLoading(true)
    setError('')

    const blockedWords = JSON.parse(localStorage.getItem('blockedWords') || '[]')
    if (containsBlockedWord(caption, blockedWords)) {
      setError('A legenda contém palavras bloqueadas.')
      setLoading(false)
      return
    }

    const formData = new FormData()
    formData.append('image', image)
    formData.append('caption', caption)

    try {
      const response = await fetch(apiUrl('/posts'), {
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
      handleClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="create-post-modal-overlay">
      <div className="create-post-modal-content">
        <header className="create-post-modal-header">
          <h2>Novo post</h2>
          <button type="button" onClick={handleClose} className="create-post-modal-close">
            ✕
          </button>
        </header>

        <form onSubmit={handleSubmit} className="create-post-modal-form">
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

          {error && <p className="create-post-modal-error">{error}</p>}

          <button type="submit" disabled={loading}>
            {loading ? 'Publicando...' : 'Compartilhar'}
          </button>
        </form>
      </div>
    </div>
  )
}

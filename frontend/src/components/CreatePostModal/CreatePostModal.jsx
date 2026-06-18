import { useRef, useState } from 'react'
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
  const [video, setVideo] = useState(null)
  const [attachment, setAttachment] = useState(null)
  const [caption, setCaption] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState('')
  const imageInputRef = useRef(null)
  const videoInputRef = useRef(null)
  const attachmentInputRef = useRef(null)

  if (!open) {
    return null
  }

  const handleImageChange = (e) => {
    setImage(e.target.files[0] || null)
    setError('')
  }

  const handleVideoChange = (e) => {
    setVideo(e.target.files[0] || null)
    setError('')
  }

  const handleAttachmentChange = (e) => {
    setAttachment(e.target.files[0] || null)
    setError('')
  }

  // FIX: reseta todo o estado ao fechar
  const handleClose = () => {
    setImage(null)
    setVideo(null)
    setAttachment(null)
    setCaption('')
    setUploadProgress(0)
    setError('')
    if (imageInputRef.current) imageInputRef.current.value = ''
    if (videoInputRef.current) videoInputRef.current.value = ''
    if (attachmentInputRef.current) attachmentInputRef.current.value = ''
    onClose()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!image && !video && !attachment && !caption.trim()) {
      setError('Escreva uma legenda, adicione uma imagem, video ou anexe um arquivo para postar.')
      return
    }
    setLoading(true)
    setUploadProgress(0)
    setError('')

    const blockedWords = JSON.parse(localStorage.getItem('blockedWords') || '[]')
    if (containsBlockedWord(caption, blockedWords)) {
      setError('A legenda contém palavras bloqueadas.')
      setLoading(false)
      return
    }

    const formData = new FormData()
    if (image) {
      formData.append('image', image)
    }
    if (video) {
      formData.append('video', video)
    }
    if (attachment) {
      formData.append('attachment', attachment)
    }
    formData.append('caption', caption.trim())

    try {
      const post = await new Promise((resolve, reject) => {
        const request = new XMLHttpRequest()
        request.open('POST', apiUrl('/posts'))
        request.setRequestHeader('Authorization', `Bearer ${localStorage.getItem('token')}`)
        request.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            setUploadProgress(Math.round((event.loaded / event.total) * 100))
          }
        }
        request.onload = () => {
          const data = JSON.parse(request.responseText || '{}')
          if (request.status >= 200 && request.status < 300) {
            resolve(data)
          } else {
            reject(new Error(data.error || 'Erro ao criar post.'))
          }
        }
        request.onerror = () => reject(new Error('Erro de rede ao criar post.'))
        request.send(formData)
      })
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
          <div className="create-post-upload-row">
            <div className="create-post-upload-control">
              <button
                type="button"
                className="create-post-upload-button"
                onClick={() => imageInputRef.current?.click()}
              >
                Adicionar imagem
              </button>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="create-post-hidden-input"
              />
              {image && <span className="create-post-file-name">{image.name}</span>}
            </div>

            <div className="create-post-upload-control">
              <button
                type="button"
                className="create-post-upload-button"
                onClick={() => videoInputRef.current?.click()}
              >
                Adicionar vídeo
              </button>
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                onChange={handleVideoChange}
                className="create-post-hidden-input"
              />
              {video && <span className="create-post-file-name">{video.name}</span>}
            </div>

            <div className="create-post-upload-control">
              <button
                type="button"
                className="create-post-upload-button create-post-attachment-button"
                onClick={() => attachmentInputRef.current?.click()}
                aria-label="Adicionar arquivo"
                title="Adicionar arquivo"
              >
                <svg
                  className="create-post-paperclip-icon"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  focusable="false"
                >
                  <path d="M21.4 11.6 12 21a6 6 0 0 1-8.5-8.5l9.7-9.7a4 4 0 1 1 5.7 5.7l-9.8 9.8a2 2 0 0 1-2.8-2.8l9.1-9.1" />
                </svg>
                Arquivo
              </button>
              <input
                ref={attachmentInputRef}
                type="file"
                onChange={handleAttachmentChange}
                className="create-post-hidden-input"
              />
              {attachment && <span className="create-post-file-name">{attachment.name}</span>}
            </div>
          </div>

          <label>
            Legenda
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Escreva uma legenda..."
            />
          </label>

          {error && <p className="create-post-modal-error">{error}</p>}
          {loading && uploadProgress > 0 && (
            <div className="create-post-upload-progress" aria-label={`Upload ${uploadProgress}%`}>
              <span style={{ width: `${uploadProgress}%` }} />
            </div>
          )}

          <button type="submit" disabled={loading}>
            {loading ? 'Postando...' : 'Postar'}
          </button>
        </form>
      </div>
    </div>
  )
}

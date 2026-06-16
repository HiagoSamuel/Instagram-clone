import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { apiUrl, handleAuthExpired } from '../../services/api'
import Avatar from '../Avatar/Avatar'
import './PostCard.css'

const TEXT_ONLY_IMAGE_URL = 'text-only-post'

function formatFileSize(bytes) {
  if (!bytes) return ''
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex += 1
  }

  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`
}

async function apiRequest(method, url, body) {
  const token = localStorage.getItem('token')
  const isFormData = body instanceof FormData
  const headers = {
    ...(!isFormData && body ? { 'Content-Type': 'application/json' } : {}),
  }

  if (!token) {
    handleAuthExpired()
    throw new Error('Sessao expirada. Faça login novamente.')
  }

  headers.Authorization = `Bearer ${token}`

  const res = await fetch(apiUrl(url), {
    method,
    headers,
    body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    if (res.status === 401) {
      handleAuthExpired()
    }
    throw new Error(err.error || 'Erro na requisição')
  }

  if (res.status === 204 || res.headers.get('content-length') === '0') return null
  return res.json()
}

export default function PostCard({ post, onLikeToggle, onPostDelete }) {
  const { user: currentUser } = useAuth()
  const liked = post.liked_by_me
  const isOwner = currentUser && post.user_id === currentUser.id
  const hasImage = post.image_url && post.image_url !== TEXT_ONLY_IMAGE_URL

  // comments state
  const [commentsOpen, setCommentsOpen]     = useState(false)
  const [comments, setComments]             = useState([])
  const [commentsLoaded, setCommentsLoaded] = useState(false)
  const [loadingComments, setLoadingComments] = useState(false)
  // FIX: estado de erro para comentários (antes era silenciado)
  const [commentsError, setCommentsError]   = useState('')

  // new comment form
  const [newText, setNewText]           = useState('')
  const [newImage, setNewImage]         = useState(null)
  const [newAttachment, setNewAttachment] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [submitting, setSubmitting]     = useState(false)
  const [commentError, setCommentError] = useState('')
  const imgInputRef = useRef(null)
  const attachmentInputRef = useRef(null)

  // FIX: revoga URL de preview ao desmontar ou trocar imagem (evita memory leak)
  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview)
      }
    }
  }, [imagePreview])

  const toggleComments = async () => {
    if (!commentsOpen && !commentsLoaded) {
      setLoadingComments(true)
      setCommentsError('')
      try {
        const data = await apiRequest('GET', `/posts/${post.id}/comments`)
        setComments(data)
        setCommentsLoaded(true)
      } catch (err) {
        // FIX: exibe erro ao usuário em vez de silenciar
        setCommentsError('Não foi possível carregar os comentários.')
        console.error(err)
      } finally {
        setLoadingComments(false)
      }
    }
    setCommentsOpen((v) => !v)
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    // FIX: revoga URL anterior antes de criar nova
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setNewImage(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const clearImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setNewImage(null)
    setImagePreview(null)
    if (imgInputRef.current) imgInputRef.current.value = ''
  }

  const handleAttachmentChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setNewAttachment(file)
  }

  const clearAttachment = () => {
    setNewAttachment(null)
    if (attachmentInputRef.current) attachmentInputRef.current.value = ''
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!newText.trim() && !newImage && !newAttachment) return
    setSubmitting(true)
    setCommentError('')

    try {
      const fd = new FormData()
      if (newText.trim()) fd.append('content', newText.trim())
      if (newImage) fd.append('image', newImage)
      if (newAttachment) fd.append('attachment', newAttachment)

      const created = await apiRequest('POST', `/posts/${post.id}/comments`, fd)
      setComments((prev) => [...prev, created])
      setNewText('')
      clearImage()
      clearAttachment()
    } catch (err) {
      setCommentError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (commentId) => {
    try {
      await apiRequest('DELETE', `/posts/${post.id}/comments/${commentId}`)
      setComments((prev) => prev.filter((c) => c.id !== commentId))
    } catch (err) {
      alert(err.message)
    }
  }

  const handleDeletePost = async () => {
    if (!window.confirm('Tem certeza que deseja apagar este post?')) return
    try {
      await apiRequest('DELETE', `/posts/${post.id}`)
      if (onPostDelete) onPostDelete(post.id)
    } catch (err) {
      alert(err.message)
    }
  }

  const canDelete = (comment) =>
    currentUser &&
    (comment.user_id === currentUser.id || post.user_id === currentUser.id)

  return (
    <article className="post-card">
      {/* header */}
      <div className="post-header">
        <Link to={`/profile/${post.user.username}`} className="post-author-link">
          <Avatar src={post.user.avatar_url} size={36} alt={`Avatar de ${post.user.username}`} />
          <div className="post-author">
            <strong>{post.user.username}</strong>
          </div>
        </Link>

        {isOwner && (
          <button
            className="post-delete-btn"
            onClick={handleDeletePost}
            title="Apagar post"
            aria-label="Apagar post"
          >
            <svg
              className="post-delete-icon"
              viewBox="0 0 64 64"
              aria-hidden="true"
              focusable="false"
            >
              <path d="M22 16V10C22 7.8 23.8 6 26 6H38C40.2 6 42 7.8 42 10V16" />
              <path d="M14 16H50" />
              <path d="M18 16L21 56H43L46 16" />
              <path d="M28 26V48" />
              <path d="M36 26V48" />
            </svg>
          </button>
        )}
      </div>

      {/* image */}
      {hasImage && (
        <div className="post-image">
          <img src={post.image_url} alt={post.caption || 'Foto do post'} />
        </div>
      )}

      {/* actions */}
      <div className="post-actions">
        <button className="post-action-btn" onClick={() => onLikeToggle(post.id, liked)}>
          {liked ? '❤️' : '🤍'}
        </button>
        <button className="post-action-btn" onClick={toggleComments} title="Comentários">
          💬
        </button>
        <span className="post-likes-count">{post.likes_count} curtidas</span>
      </div>

      {/* caption */}
      {post.caption && (
        <div className="post-caption">
          <strong>{post.user.username}</strong> {post.caption}
        </div>
      )}

      {post.file_url && (
        <a
          className="post-attachment"
          href={post.file_url}
          target="_blank"
          rel="noreferrer"
          download={post.file_name}
        >
          <span className="post-attachment-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" focusable="false">
              <path d="M21.4 11.6 12 21a6 6 0 0 1-8.5-8.5l9.7-9.7a4 4 0 1 1 5.7 5.7l-9.8 9.8a2 2 0 0 1-2.8-2.8l9.1-9.1" />
            </svg>
          </span>
          <span className="post-attachment-text">
            <strong>{post.file_name || 'Arquivo anexado'}</strong>
            {(post.file_type || post.file_size) && (
              <small>
                {[post.file_type, formatFileSize(post.file_size)].filter(Boolean).join(' · ')}
              </small>
            )}
          </span>
        </a>
      )}

      {/* comments toggle label */}
      <button className="post-comments-toggle" onClick={toggleComments}>
        {commentsOpen ? 'Ocultar comentários' : 'Ver comentários'}
      </button>

      {/* comments section */}
      {commentsOpen && (
        <div className="post-comments">
          {loadingComments && <p className="comments-loading">Carregando...</p>}

          {/* FIX: exibe erro de carregamento de comentários */}
          {commentsError && <p className="comment-error">{commentsError}</p>}

          {!loadingComments && !commentsError && comments.length === 0 && (
            <p className="comments-empty">Nenhum comentário ainda. Seja o primeiro!</p>
          )}

          <ul className="comments-list">
            {comments.map((c) => (
              <li key={c.id} className="comment-item">
                <Link to={`/profile/${c.user.username}`} className="comment-avatar-link">
                  <Avatar src={c.user.avatar_url} size={30} alt={c.user.username} />
                </Link>
                <div className="comment-body">
                  <div className="comment-header-row">
                    <Link to={`/profile/${c.user.username}`} className="comment-username">
                      {c.user.username}
                    </Link>
                    <span className="comment-time">
                      {new Date(c.created_at).toLocaleDateString('pt-BR')}
                    </span>
                    {canDelete(c) && (
                      <button
                        className="comment-delete-btn"
                        onClick={() => handleDelete(c.id)}
                        title="Excluir comentário"
                      >
                        🗑
                      </button>
                    )}
                  </div>
                  {c.content && <p className="comment-text">{c.content}</p>}
                  {c.image_url && (
                    <img src={c.image_url} alt="Imagem do comentário" className="comment-image" />
                  )}
                  {c.file_url && (
                    <a
                      className="comment-attachment"
                      href={c.file_url}
                      target="_blank"
                      rel="noreferrer"
                      download={c.file_name}
                    >
                      <span className="comment-attachment-icon" aria-hidden="true">
                        <svg viewBox="0 0 24 24" focusable="false">
                          <path d="M21.4 11.6 12 21a6 6 0 0 1-8.5-8.5l9.7-9.7a4 4 0 1 1 5.7 5.7l-9.8 9.8a2 2 0 0 1-2.8-2.8l9.1-9.1" />
                        </svg>
                      </span>
                      <span className="comment-attachment-text">
                        <strong>{c.file_name || 'Arquivo anexado'}</strong>
                        {(c.file_type || c.file_size) && (
                          <small>
                            {[c.file_type, formatFileSize(c.file_size)].filter(Boolean).join(' · ')}
                          </small>
                        )}
                      </span>
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>

          {/* new comment form */}
          <form className="comment-form" onSubmit={handleSubmit}>
            <Avatar src={currentUser?.avatar_url} size={30} alt="Você" />
            <div className="comment-input-wrap">
              <input
                type="text"
                className="comment-input"
                placeholder="Adicione um comentário..."
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                maxLength={500}
              />

              {imagePreview && (
                <div className="comment-img-preview">
                  <img src={imagePreview} alt="Preview" />
                  <button type="button" className="comment-img-remove" onClick={clearImage}>✕</button>
                </div>
              )}

              {newAttachment && (
                <div className="comment-file-preview">
                  <span className="comment-file-preview-name">{newAttachment.name}</span>
                  <button type="button" className="comment-file-remove" onClick={clearAttachment}>✕</button>
                </div>
              )}

              <div className="comment-form-actions">
                <button
                  type="button"
                  className="comment-img-btn"
                  onClick={() => imgInputRef.current.click()}
                  title="Adicionar foto"
                >
                  📷
                </button>
                <input
                  ref={imgInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleImageChange}
                />
                <button
                  type="button"
                  className="comment-img-btn comment-file-btn"
                  onClick={() => attachmentInputRef.current.click()}
                  title="Adicionar arquivo"
                  aria-label="Adicionar arquivo"
                >
                  <svg className="comment-paperclip-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    <path d="M21.4 11.6 12 21a6 6 0 0 1-8.5-8.5l9.7-9.7a4 4 0 1 1 5.7 5.7l-9.8 9.8a2 2 0 0 1-2.8-2.8l9.1-9.1" />
                  </svg>
                </button>
                <input
                  ref={attachmentInputRef}
                  type="file"
                  style={{ display: 'none' }}
                  onChange={handleAttachmentChange}
                />
                <button
                  type="submit"
                  className="comment-submit-btn"
                  disabled={submitting || (!newText.trim() && !newImage && !newAttachment)}
                >
                  {submitting ? '...' : 'Publicar'}
                </button>
              </div>

              {commentError && <p className="comment-error">{commentError}</p>}
            </div>
          </form>
        </div>
      )}

      {/* date */}
      <div className="post-time">
        {new Date(post.created_at).toLocaleDateString('pt-BR')}
      </div>
    </article>
  )
}

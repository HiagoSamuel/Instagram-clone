import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { apiUrl } from '../../services/api'
import Avatar from '../Avatar/Avatar'
import './PostCard.css'

async function apiRequest(method, url, body) {
  const token = localStorage.getItem('token')
  const isFormData = body instanceof FormData

  const res = await fetch(apiUrl(url), {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(!isFormData && body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Erro na requisição')
  }

  if (res.status === 204 || res.headers.get('content-length') === '0') return null
  return res.json()
}

export default function PostCard({ post, onLikeToggle }) {
  const { user: currentUser } = useAuth()
  const liked = post.liked_by_me

  // comments state
  const [commentsOpen, setCommentsOpen]   = useState(false)
  const [comments, setComments]           = useState([])
  const [commentsLoaded, setCommentsLoaded] = useState(false)
  const [loadingComments, setLoadingComments] = useState(false)

  // new comment form
  const [newText, setNewText]       = useState('')
  const [newImage, setNewImage]     = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [commentError, setCommentError] = useState('')
  const imgInputRef = useRef(null)

  const toggleComments = async () => {
    if (!commentsOpen && !commentsLoaded) {
      setLoadingComments(true)
      try {
        const data = await apiRequest('GET', `/posts/${post.id}/comments`)
        setComments(data)
        setCommentsLoaded(true)
      } catch {
        // silently fail — comments just won't show
      } finally {
        setLoadingComments(false)
      }
    }
    setCommentsOpen((v) => !v)
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setNewImage(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const clearImage = () => {
    setNewImage(null)
    setImagePreview(null)
    if (imgInputRef.current) imgInputRef.current.value = ''
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!newText.trim() && !newImage) return
    setSubmitting(true)
    setCommentError('')

    try {
      const fd = new FormData()
      if (newText.trim()) fd.append('content', newText.trim())
      if (newImage) fd.append('image', newImage)

      const created = await apiRequest('POST', `/posts/${post.id}/comments`, fd)
      setComments((prev) => [...prev, created])
      setNewText('')
      clearImage()
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
      </div>

      {/* image */}
      <div className="post-image">
        <img src={post.image_url} alt={post.caption || 'Foto do post'} />
      </div>

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

      {/* comments toggle label */}
      <button className="post-comments-toggle" onClick={toggleComments}>
        {commentsOpen ? 'Ocultar comentários' : `Ver comentários`}
      </button>

      {/* comments section */}
      {commentsOpen && (
        <div className="post-comments">
          {loadingComments && <p className="comments-loading">Carregando...</p>}

          {!loadingComments && comments.length === 0 && (
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
                  type="submit"
                  className="comment-submit-btn"
                  disabled={submitting || (!newText.trim() && !newImage)}
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

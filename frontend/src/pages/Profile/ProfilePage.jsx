import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useSocket } from '../../context/SocketContext'
import { postService } from '../../services/postService'
import { userService } from '../../services/userService'
import Avatar, { DEFAULT_AVATAR_SRC } from '../../components/Avatar/Avatar'
import FriendButton from '../../components/FriendButton'
import MessagesNavLink from '../../components/MessagesNavLink'
import NotificationsNavLink from '../../components/NotificationsNavLink'
import PostCard from '../../components/PostCard/PostCard'
import './ProfilePage.css'

export default function ProfilePage() {
  const { user: currentUser, setUser } = useAuth()
  const { socket } = useSocket()
  const { username } = useParams()
  const [profile, setProfile] = useState(null)
  const [posts, setPosts] = useState([])
  const [canViewPosts, setCanViewPosts] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [friendshipStatus, setFriendshipStatus] = useState('none')
  const [selectedPostId, setSelectedPostId] = useState(null)

  // modal state
  const [editOpen, setEditOpen] = useState(false)
  const [editUsername, setEditUsername] = useState('')
  const [editBio, setEditBio] = useState('')
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const fileInputRef = useRef(null)

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true)
      setError('')
      try {
        const targetUsername = username || currentUser?.username
        if (!targetUsername) { 
          setLoading(false)
          return 
        }
        const { user, posts: postList, can_view_posts: canViewProfilePosts = true } =
          await postService.getUserPosts(targetUsername)
        setProfile(user)
        setPosts(postList)
        setCanViewPosts(canViewProfilePosts)
      } catch (err) {
        setError(err.response?.data?.error || 'Erro ao carregar o perfil.')
      } finally {
        setLoading(false)
      }
    }

    if (username || currentUser?.username) {
      loadProfile()
    }
  }, [username, currentUser?.username, friendshipStatus])

  const isOwnProfile = profile && currentUser && profile.id === currentUser.id
  const selectedPost = posts.find((post) => post.id === selectedPostId)

  useEffect(() => {
    if (!socket || !profile?.id || !canViewPosts) return undefined

    const handleNewPost = ({ post }) => {
      if (!post || post.user_id !== profile.id) return
      setPosts((current) => {
        if (current.some((item) => item.id === post.id)) return current
        return [post, ...current]
      })
    }

    const handlePostDeleted = ({ postId }) => {
      if (!postId) return
      setPosts((current) => current.filter((post) => post.id !== postId))
    }

    const updatePostLikeState = ({ postId, userId, likes_count }, likedByActor) => {
      setPosts((current) =>
        current.map((post) =>
          post.id === postId
            ? {
                ...post,
                likes_count,
                liked_by_me: userId === currentUser?.id ? likedByActor : post.liked_by_me,
              }
            : post
        )
      )
    }

    const handlePostLiked = (payload) => updatePostLikeState(payload, true)
    const handlePostUnliked = (payload) => updatePostLikeState(payload, false)

    socket.on('new_post', handleNewPost)
    socket.on('post_deleted', handlePostDeleted)
    socket.on('post_liked', handlePostLiked)
    socket.on('post_unliked', handlePostUnliked)

    return () => {
      socket.off('new_post', handleNewPost)
      socket.off('post_deleted', handlePostDeleted)
      socket.off('post_liked', handlePostLiked)
      socket.off('post_unliked', handlePostUnliked)
    }
  }, [socket, profile?.id, canViewPosts, currentUser?.id])

  const handleLikeToggle = async (postId, liked) => {
    try {
      if (liked) {
        await postService.unlike(postId)
      } else {
        await postService.like(postId)
      }
      setPosts((current) =>
        current.map((post) =>
          post.id === postId
            ? {
                ...post,
                liked_by_me: !liked,
                likes_count: liked ? post.likes_count - 1 : post.likes_count + 1,
              }
            : post
        )
      )
    } catch (err) {
      console.error(err)
    }
  }

  const handlePostDelete = (postId) => {
    setPosts((current) => current.filter((post) => post.id !== postId))
    if (selectedPostId === postId) {
      setSelectedPostId(null)
    }
  }

  const openEdit = () => {
    setEditUsername(profile.username || '')
    setEditBio(profile.bio || '')
    setAvatarFile(null)
    setAvatarPreview(null)
    setSaveError('')
    setEditOpen(true)
  }

  const closeEdit = () => {
    setEditOpen(false)
    setAvatarFile(null)
    setAvatarPreview(null)
    setSaveError('')
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const handleSave = async () => {
    setSaving(true)
    setSaveError('')
    try {
      const payload = { bio: editBio }
      if (editUsername && editUsername !== profile.username) payload.username = editUsername
      if (avatarFile) payload.avatar = avatarFile

      const updated = await userService.updateProfile(payload)
      setProfile(updated)
      setUser(updated)
      closeEdit()
    } catch (err) {
      setSaveError(err.response?.data?.error || 'Erro ao salvar alterações.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="profile-page">Carregando perfil...</div>
  if (error)   return <div className="profile-page profile-error">{error}</div>

  return (
    <div className="profile-page">
      <div className="profile-card">
        <div className="profile-header">
          <Avatar src={profile.avatar_url} size={96} alt={`Avatar de ${profile.username}`} />
          <div className="profile-header-content">
            <div className="profile-title-row">
              <h1>{profile.username}</h1>
              {isOwnProfile && (
                <button className="button button-primary" onClick={openEdit}>
                  Editar perfil
                </button>
              )}
            </div>
            <div className="profile-stats">
              <span><strong>{posts.length}</strong> posts</span>
              <span><strong>0</strong> seguidores</span>
              <span><strong>0</strong> seguindo</span>
            </div>
            {profile.bio && <p className="profile-bio">{profile.bio}</p>}
            <p className="profile-meta">{profile.full_name || 'Sem nome verdadeiro'}</p>
          </div>
        </div>

        <div className="profile-actions">
          <Link to="/" className="button button-secondary">Voltar para o feed</Link>
          <MessagesNavLink />
          <NotificationsNavLink />
          {!isOwnProfile && profile?.id && (
            <>
              <FriendButton userId={profile.id} onStatusChange={setFriendshipStatus} />
              {friendshipStatus === 'accepted' && (
                <Link to={`/chat/${profile.id}`} className="button button-primary">
                  Enviar mensagem
                </Link>
              )}
            </>
          )}
        </div>
      </div>

      <section className="profile-posts">
        <h2>Posts de {profile.username}</h2>
        {!canViewPosts ? (
          <div className="profile-private-state">
            <strong>Posts privados</strong>
            <p>Adicione este usuário como amigo para ver as publicações dele.</p>
          </div>
        ) : posts.length === 0 ? (
          <p>Este usuário não postou nada.</p>
        ) : (
          <div className="profile-feed-list">
            {posts.map((post) => (
              <button
                key={post.id}
                type="button"
                className="profile-grid-post"
                onClick={() => setSelectedPostId(post.id)}
                aria-label={`Abrir post de ${profile.username}`}
              >
                {post.video_url ? (
                  <video src={post.video_url} poster={post.video_thumbnail_url || post.image_url} muted />
                ) : post.image_url && post.image_url !== 'text-only-post' ? (
                  <img src={post.image_url} alt={post.caption || 'Post'} />
                ) : (
                  <div className="profile-grid-text-post">{post.caption || 'Post'}</div>
                )}
                <div className="profile-grid-overlay">
                  <span>{post.likes_count || 0} curtidas</span>
                  <span>{post.comments_count || 0} comentários</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* ── Edit modal ── */}
      {selectedPost && (
        <div
          className="profile-post-modal-overlay"
          onClick={(event) => event.target === event.currentTarget && setSelectedPostId(null)}
        >
          <div className="profile-post-modal" role="dialog" aria-modal="true" aria-label="Post aberto">
            <button
              type="button"
              className="profile-post-modal-close"
              onClick={() => setSelectedPostId(null)}
              aria-label="Fechar post"
            >
              ×
            </button>
            <PostCard
              post={selectedPost}
              onLikeToggle={handleLikeToggle}
              onPostDelete={handlePostDelete}
            />
          </div>
        </div>
      )}

      {editOpen && (
        <div className="edit-overlay" onClick={(e) => e.target === e.currentTarget && closeEdit()}>
          <div className="edit-modal">
            <h2 className="edit-title">Editar perfil</h2>

            {/* avatar picker */}
            <div className="edit-avatar-row">
              <div className="edit-avatar-wrap" onClick={() => fileInputRef.current.click()}>
                <img
                  src={avatarPreview || profile.avatar_url || DEFAULT_AVATAR_SRC}
                  alt="Pré-visualização"
                  className="edit-avatar-img"
                />
                <div className="edit-avatar-overlay">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                  <span>Trocar foto</span>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleAvatarChange}
              />
            </div>

            {/* username */}
            <div className="edit-field">
              <label htmlFor="edit-username">Apelido (username)</label>
              <input
                id="edit-username"
                type="text"
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value)}
                placeholder="crie um apelido"
                maxLength={30}
              />
            </div>

            {/* bio */}
            <div className="edit-field">
              <label htmlFor="edit-bio">Bio</label>
              <textarea
                id="edit-bio"
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                placeholder="Cria uma bio ai :)"
                rows={3}
                maxLength={160}
              />
              <span className="edit-char-count">{editBio.length}/160</span>
            </div>

            {saveError && <p className="edit-error">{saveError}</p>}

            <div className="edit-actions">
              <button className="button button-secondary" onClick={closeEdit} disabled={saving}>
                Cancelar
              </button>
              <button className="button button-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Salvando...' : 'Aplicar alterações'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

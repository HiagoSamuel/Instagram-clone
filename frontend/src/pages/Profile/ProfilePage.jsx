import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { postService } from '../../services/postService'
import { userService } from '../../services/userService'
import Avatar from '../../components/Avatar/Avatar'
import './ProfilePage.css'

const TEXT_ONLY_IMAGE_URL = 'text-only-post'

export default function ProfilePage() {
  const { user: currentUser, setUser } = useAuth()
  const { username } = useParams()
  const [profile, setProfile] = useState(null)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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
        const { user, posts: postList } = await postService.getUserPosts(targetUsername)
        setProfile(user)
        setPosts(postList)
      } catch (err) {
        setError(err.response?.data?.error || 'Erro ao carregar o perfil.')
      } finally {
        setLoading(false)
      }
    }

    if (username || currentUser?.username) {
      loadProfile()
    }
  }, [username, currentUser?.username]) // 🌟 Corrigido: Escuta apenas o username e não o objeto user inteiro

  const isOwnProfile = profile && currentUser && profile.username === currentUser.username

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
          <div>
            <h1>{profile.username}</h1>
            {profile.bio && <p className="profile-bio">{profile.bio}</p>}
            <p className="profile-meta">{profile.full_name || 'Sem nome verdadeiro'}</p>
          </div>
        </div>

        <div className="profile-actions">
          <Link to="/" className="button button-secondary">Voltar para o feed</Link>
          {isOwnProfile && (
            <button className="button button-primary" onClick={openEdit}>
              Editar meu perfil
            </button>
          )}
        </div>
      </div>

      <section className="profile-posts">
        <h2>Posts de {profile.username}</h2>
        {posts.length === 0 ? (
          <p>Este usuário não postou nada.</p>
        ) : (
          <div className="profile-post-grid">
            {posts.map((post) => {
              const hasImage = post.image_url && post.image_url !== TEXT_ONLY_IMAGE_URL
              return (
              <article
                key={post.id}
                className={`profile-post-card${hasImage ? '' : ' profile-post-card-text-only'}`}
              >
                {hasImage && <img src={post.image_url} alt={post.caption || 'Post'} />}
                {post.caption && <p>{post.caption}</p>}
              </article>
              )
            })}
          </div>
        )}
      </section>

      {/* ── Edit modal ── */}
      {editOpen && (
        <div className="edit-overlay" onClick={(e) => e.target === e.currentTarget && closeEdit()}>
          <div className="edit-modal">
            <h2 className="edit-title">Editar perfil</h2>

            {/* avatar picker */}
            <div className="edit-avatar-row">
              <div className="edit-avatar-wrap" onClick={() => fileInputRef.current.click()}>
                <img
                  src={avatarPreview || profile.avatar_url || '/default-avatar.png'}
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

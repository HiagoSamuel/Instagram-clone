import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { postService } from '../../services/postService'
import PostCard from '../../components/PostCard/PostCard'
import CreatePostModal from '../../components/CreatePostModal/CreatePostModal'
import SettingsMenu from '../../components/SettingsMenu/SettingsMenu'

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
      } catch (err) {
        console.error(err)
        setError('Erro ao carregar o feed. Tente novamente.')
      } finally {
        setLoading(false)
      }
    }

    loadFeed()
  }, [])

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

  // FIX: createPost agora retorna post com user/likes_count/liked_by_me
  const handlePostCreated = (newPost) => {
    setPosts((current) => [newPost, ...current])
  }

  // FIX: onPostDelete agora remove o post da lista sem precisar recarregar
  const handlePostDelete = (postId) => {
    setPosts((current) => current.filter((p) => p.id !== postId))
  }

  return (
    <div className="home-page">
      <header className="home-header" style={{ position: 'relative', zIndex: 100 }}>
        <div className="home-header-actions">
          <SettingsMenu />
        </div>
        <div>
          <h1>Bem-vindo, {user?.username || 'usuário'}</h1>
          <p>Feed dos seus amigos e suas fotos.</p>
        </div>

        <div className="home-actions" style={{ position: 'relative', zIndex: 101 }}>
          <Link to={`/profile/${user?.username}`} className="button button-secondary">
            Meu perfil
          </Link>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="button button-primary"
            style={{ cursor: 'pointer' }}
          >
            Novo post
          </button>
          <button onClick={logout} className="button button-secondary">
            Sair
          </button>
        </div>
      </header>

      {loading ? (
        <p>Carregando feed...</p>
      ) : error ? (
        <p>{error}</p>
      ) : posts.length === 0 ? (
        <p>Não há posts para mostrar ainda.</p>
      ) : (
        <div className="feed-list">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onLikeToggle={handleLikeToggle}
              onPostDelete={handlePostDelete}
            />
          ))}
        </div>
      )}

      <CreatePostModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onPostCreated={handlePostCreated}
      />
    </div>
  )
}

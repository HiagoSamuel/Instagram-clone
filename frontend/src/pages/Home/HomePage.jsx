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

  const handlePostCreated = (newPost) => {
    setPosts((current) => [newPost, ...current])
  }

  return (
    <div className="home-page">
      <header className="home-header">
        <div className="home-header-actions">
          <SettingsMenu />
        </div>
        <div>
          <h1>Bem-vindo, {user?.username || 'usuário'}</h1>
          <p>Feed dos seus amigos e suas fotos.</p>
        </div>
        <div className="home-actions">
          <Link to={`/profile/${user?.username}`} className="button button-secondary">
            Meu perfil
          </Link>
          <button onClick={() => setIsModalOpen(true)} className="button button-primary">
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
            <PostCard key={post.id} post={post} onLikeToggle={handleLikeToggle} />
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

import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useSocket } from '../../context/SocketContext'
import { postService } from '../../services/postService'
import PostCard from '../../components/PostCard/PostCard'
import CreatePostModal from '../../components/CreatePostModal/CreatePostModal'
import SettingsMenu from '../../components/SettingsMenu/SettingsMenu'
import MessagesNavLink from '../../components/MessagesNavLink'
import api from '../../services/api'

const FEED_PAGE_SIZE = 20

export default function HomePage() {
  const { user, logout } = useAuth()
  const { socket } = useSocket()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const [hasMorePosts, setHasMorePosts] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [nextCursor, setNextCursor] = useState(null)
  const loadMoreRef = useRef(null)

  useEffect(() => {
    const loadFeed = async () => {
      try {
        const data = await postService.getFeed({ limit: FEED_PAGE_SIZE, cursor: true })
        setPosts(data.items || [])
        setNextCursor(data.nextCursor || null)
        setHasMorePosts(Boolean(data.hasMore))
      } catch (err) {
        console.error(err)
        setError('Erro ao carregar o feed. Tente novamente.')
      } finally {
        setLoading(false)
      }
    }

    loadFeed()

    api.get('/friendships/pending')
      .then(({ data }) => setPendingCount(data.length))
      .catch(() => setPendingCount(0))
  }, [])

  useEffect(() => {
    if (!socket) return undefined

    const handleNewPost = ({ post }) => {
      if (!post) return
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
                liked_by_me: userId === user?.id ? likedByActor : post.liked_by_me,
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
  }, [socket, user?.id])

  const loadMorePosts = useCallback(async () => {
    if (loadingMore || !hasMorePosts) return

    setLoadingMore(true)
    try {
      const data = await postService.getFeed({
        limit: FEED_PAGE_SIZE,
        before: nextCursor,
        cursor: true,
      })
      setPosts((current) => {
        const seen = new Set(current.map((post) => post.id))
        const nextItems = (data.items || []).filter((post) => !seen.has(post.id))
        return [...current, ...nextItems]
      })
      setNextCursor(data.nextCursor || null)
      setHasMorePosts(Boolean(data.hasMore))
    } catch (err) {
      console.error(err)
      setError('Erro ao carregar mais posts. Tente novamente.')
    } finally {
      setLoadingMore(false)
    }
  }, [hasMorePosts, loadingMore, nextCursor])

  useEffect(() => {
    const target = loadMoreRef.current
    if (!target || !hasMorePosts) return undefined

    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) {
        loadMorePosts()
      }
    }, { rootMargin: '240px' })

    observer.observe(target)
    return () => observer.disconnect()
  }, [hasMorePosts, loadMorePosts])

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
    setPosts((current) => {
      if (current.some((post) => post.id === newPost.id)) return current
      return [newPost, ...current]
    })
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
          <Link to="/search" className="button button-secondary">
            Buscar
          </Link>
          <Link to="/explore" className="button button-secondary">
            Explorar
          </Link>
          <Link to="/requests" className="button button-secondary nav-button-with-badge">
            Solicitacoes
            {pendingCount > 0 && <span className="nav-badge">{pendingCount}</span>}
          </Link>
          <MessagesNavLink />
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
        <>
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
          <div ref={loadMoreRef} className="feed-load-more">
            {loadingMore && <span>Carregando mais posts...</span>}
            {!hasMorePosts && <span>Voce chegou ao fim do feed.</span>}
          </div>
        </>
      )}

      <CreatePostModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onPostCreated={handlePostCreated}
      />
    </div>
  )
}

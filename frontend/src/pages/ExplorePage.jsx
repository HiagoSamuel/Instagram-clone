import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import MessagesNavLink from '../components/MessagesNavLink'
import PostCard from '../components/PostCard/PostCard'
import api from '../services/api'

export default function ExplorePage() {
  const [posts, setPosts] = useState([])
  const [trending, setTrending] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadExplore() {
      setLoading(true)
      setError('')
      try {
        const [postsResponse, trendingResponse] = await Promise.all([
          api.get('/explore'),
          api.get('/explore/trending'),
        ])
        setPosts(postsResponse.data)
        setTrending(trendingResponse.data.items || [])
      } catch (err) {
        setError(err.response?.data?.error || 'Erro ao carregar explorar.')
      } finally {
        setLoading(false)
      }
    }

    loadExplore()
  }, [])

  return (
    <main className="page-shell">
      <header className="page-header">
        <div>
          <h1>Explorar</h1>
          <p>Posts publicos fora do seu ciclo e hashtags em alta.</p>
        </div>
        <div className="page-header-actions">
          <Link to="/" className="button button-secondary">Feed</Link>
          <Link to="/search" className="button button-secondary">Buscar</Link>
          <MessagesNavLink />
        </div>
      </header>

      {trending.length > 0 && (
        <section className="search-section">
          <h2>Hashtags em alta</h2>
          <div className="hashtag-list">
            {trending.map((item) => (
              <Link key={item.tag} to={`/hashtags/${item.tag}`} className="hashtag-pill">
                #{item.tag}
                <span>{item.count}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {loading ? (
        <p>Carregando explorar...</p>
      ) : error ? (
        <p className="inline-error">{error}</p>
      ) : posts.length === 0 ? (
        <p>Ainda nao ha posts publicos suficientes para explorar.</p>
      ) : (
        <section className="search-section">
          <h2>Posts para descobrir</h2>
          <div className="feed-list explore-grid">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </section>
      )}
    </main>
  )
}

import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import MessagesNavLink from '../components/MessagesNavLink'
import NotificationsNavLink from '../components/NotificationsNavLink'
import PostCard from '../components/PostCard/PostCard'
import api from '../services/api'

export default function HashtagPage() {
  const { tag } = useParams()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')

    api.get(`/search/hashtags/${encodeURIComponent(tag)}`)
      .then(({ data }) => setPosts(data))
      .catch((err) => setError(err.response?.data?.error || 'Erro ao buscar hashtag.'))
      .finally(() => setLoading(false))
  }, [tag])

  return (
    <main className="page-shell">
      <header className="page-header">
        <div>
          <h1>#{tag}</h1>
          <p>Posts marcados com esta hashtag.</p>
        </div>
        <div className="page-header-actions">
          <Link to="/search" className="button button-secondary">Buscar</Link>
          <Link to="/explore" className="button button-secondary">Explorar</Link>
          <MessagesNavLink />
          <NotificationsNavLink />
        </div>
      </header>

      {loading ? (
        <p>Carregando posts...</p>
      ) : error ? (
        <p className="inline-error">{error}</p>
      ) : posts.length === 0 ? (
        <p>Nenhum post encontrado para esta hashtag.</p>
      ) : (
        <div className="feed-list">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </main>
  )
}

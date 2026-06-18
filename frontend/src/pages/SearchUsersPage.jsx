import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Avatar from '../components/Avatar/Avatar'
import PostCard from '../components/PostCard/PostCard'
import MessagesNavLink from '../components/MessagesNavLink'
import NotificationsNavLink from '../components/NotificationsNavLink'
import api from '../services/api'

function extractHashtags(text) {
  const matches = text.match(/#[\p{L}\p{N}_]+/gu) || []
  return [...new Set(matches.map((tag) => tag.slice(1).toLowerCase()))]
}

export default function SearchUsersPage() {
  const [query, setQuery] = useState('')
  const [users, setUsers] = useState([])
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const hashtagSuggestions = useMemo(() => extractHashtags(query), [query])

  useEffect(() => {
    const trimmed = query.trim()
    if (trimmed.length < 2) {
      setUsers([])
      setPosts([])
      setError('')
      return undefined
    }

    const timeoutId = window.setTimeout(async () => {
      setLoading(true)
      setError('')
      try {
        const [usersResult, postsResult] = await Promise.allSettled([
          api.get('/search/users', { params: { q: trimmed } }).catch((searchError) => {
            if (searchError.response?.status === 404) {
              return api.get('/users/search', { params: { q: trimmed } })
            }
            throw searchError
          }),
          api.get('/search/posts', { params: { q: trimmed.replace(/^#/, '') } }),
        ])

        setUsers(usersResult.status === 'fulfilled' ? usersResult.value.data : [])
        setPosts(postsResult.status === 'fulfilled' ? postsResult.value.data : [])

        if (usersResult.status === 'rejected' && postsResult.status === 'rejected') {
          setError('Erro ao buscar.')
        }
      } catch (err) {
        setError(err.response?.data?.error || 'Erro ao buscar.')
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => window.clearTimeout(timeoutId)
  }, [query])

  const hasResults = users.length > 0 || posts.length > 0 || hashtagSuggestions.length > 0

  return (
    <main className="page-shell">
      <header className="page-header">
        <div>
          <h1>Buscar</h1>
          <p>Encontre pessoas, posts e hashtags.</p>
        </div>
        <div className="page-header-actions">
          <Link to="/" className="button button-secondary">Feed</Link>
          <Link to="/explore" className="button button-secondary">Explorar</Link>
          <MessagesNavLink />
          <NotificationsNavLink />
        </div>
      </header>

      <div className="search-panel">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Digite um username, legenda ou #hashtag"
          autoFocus
        />
      </div>

      {loading ? (
        <p>Buscando...</p>
      ) : error ? (
        <p className="inline-error">{error}</p>
      ) : query.trim().length < 2 ? (
        <p>Digite pelo menos 2 caracteres.</p>
      ) : !hasResults ? (
        <p>Nenhum resultado encontrado.</p>
      ) : (
        <div className="search-results">
          {hashtagSuggestions.length > 0 && (
            <section className="search-section">
              <h2>Hashtags</h2>
              <div className="hashtag-list">
                {hashtagSuggestions.map((tag) => (
                  <Link key={tag} to={`/hashtags/${tag}`} className="hashtag-pill">
                    #{tag}
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section className="search-section">
            <h2>Usuarios</h2>
            {users.length === 0 ? (
              <p>Nenhum usuario encontrado.</p>
            ) : (
              <div className="conversation-list">
                {users.map((foundUser) => (
                  <Link
                    key={foundUser.id}
                    to={`/profile/${foundUser.username}`}
                    className="conversation-item"
                  >
                    <Avatar src={foundUser.avatar_url} alt={`Avatar de ${foundUser.username}`} />
                    <div>
                      <strong>{foundUser.full_name || foundUser.username}</strong>
                      <span>@{foundUser.username}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section className="search-section">
            <h2>Posts</h2>
            {posts.length === 0 ? (
              <p>Nenhum post encontrado.</p>
            ) : (
              <div className="feed-list">
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  )
}

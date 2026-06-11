import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Avatar from '../components/Avatar/Avatar'
import api from '../services/api'

export default function SearchUsersPage() {
  const [query, setQuery] = useState('')
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const trimmed = query.trim()
    if (trimmed.length < 2) {
      setUsers([])
      setError('')
      return undefined
    }

    const timeoutId = window.setTimeout(async () => {
      setLoading(true)
      setError('')
      try {
        const { data } = await api.get(`/users/search?q=${encodeURIComponent(trimmed)}`)
        setUsers(data)
      } catch (err) {
        setError(err.response?.data?.error || 'Erro ao buscar usuarios.')
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => window.clearTimeout(timeoutId)
  }, [query])

  return (
    <main className="page-shell">
      <header className="page-header">
        <div>
          <h1>Buscar usuarios</h1>
          <p>Encontre pessoas para adicionar e conversar.</p>
        </div>
        <Link to="/" className="button button-secondary">Feed</Link>
      </header>

      <div className="search-panel">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Digite um username ou nome"
          autoFocus
        />
      </div>

      {loading ? (
        <p>Buscando...</p>
      ) : error ? (
        <p className="inline-error">{error}</p>
      ) : query.trim().length < 2 ? (
        <p>Digite pelo menos 2 caracteres.</p>
      ) : users.length === 0 ? (
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
    </main>
  )
}

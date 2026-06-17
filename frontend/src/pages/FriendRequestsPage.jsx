import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Avatar from '../components/Avatar/Avatar'
import MessagesNavLink from '../components/MessagesNavLink'
import api from '../services/api'

export default function FriendRequestsPage() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/friendships/pending')
      .then(({ data }) => setRequests(data))
      .catch((err) => setError(err.response?.data?.error || 'Erro ao carregar solicitacoes.'))
      .finally(() => setLoading(false))
  }, [])

  const removeRequest = (requesterId) => {
    setRequests((current) => current.filter((item) => item.requester?.id !== requesterId))
  }

  const accept = async (requesterId) => {
    await api.put(`/friendships/accept/${requesterId}`)
    removeRequest(requesterId)
  }

  const decline = async (requesterId) => {
    await api.delete(`/friendships/${requesterId}`)
    removeRequest(requesterId)
  }

  return (
    <main className="page-shell">
      <header className="page-header">
        <div>
          <h1>Solicitacoes</h1>
          <p>Pedidos de amizade recebidos.</p>
        </div>
        <div className="page-header-actions">
          <Link to="/" className="button button-secondary">Feed</Link>
          <MessagesNavLink />
        </div>
      </header>

      {loading ? (
        <p>Carregando solicitacoes...</p>
      ) : error ? (
        <p className="inline-error">{error}</p>
      ) : requests.length === 0 ? (
        <p>Nenhuma solicitacao pendente</p>
      ) : (
        <div className="request-list">
          {requests.map(({ id, requester }) => (
            <article key={id} className="request-item">
              <Link to={`/profile/${requester.username}`} className="request-user">
                <Avatar src={requester.avatar_url} alt={`Avatar de ${requester.username}`} />
                <div>
                  <strong>{requester.full_name || requester.username}</strong>
                  <span>@{requester.username}</span>
                </div>
              </Link>
              <div className="request-actions">
                <button className="button button-success" onClick={() => accept(requester.id)}>
                  Aceitar
                </button>
                <button className="button button-secondary" onClick={() => decline(requester.id)}>
                  Recusar
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  )
}

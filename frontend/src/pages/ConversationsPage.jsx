import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Avatar from '../components/Avatar/Avatar'
import api from '../services/api'

export default function ConversationsPage() {
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/conversations')
      .then(({ data }) => setConversations(data))
      .finally(() => setLoading(false))
  }, [])

  return (
    <main className="page-shell">
      <header className="page-header">
        <div>
          <h1>Mensagens</h1>
          <p>Conversas com seus amigos.</p>
        </div>
        <Link to="/" className="button button-secondary">Feed</Link>
      </header>

      {loading ? (
        <p>Carregando conversas...</p>
      ) : conversations.length === 0 ? (
        <p>Nenhuma conversa ainda.</p>
      ) : (
        <div className="conversation-list">
          {conversations.map((conversation) => (
            <Link
              key={conversation.conversation_id}
              to={`/chat/${conversation.other_user_id}`}
              className="conversation-item"
            >
              <Avatar src={conversation.user?.avatar_url} alt={`Avatar de ${conversation.user?.username}`} />
              <div>
                <strong>{conversation.user?.full_name || conversation.user?.username}</strong>
                <span>{conversation.last_message.content}</span>
              </div>
              {conversation.unread_count > 0 && (
                <span className="nav-badge">{conversation.unread_count}</span>
              )}
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}

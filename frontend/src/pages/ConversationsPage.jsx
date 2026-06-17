import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Avatar from '../components/Avatar/Avatar'
import { useSocket } from '../context/SocketContext'
import api from '../services/api'

export default function ConversationsPage() {
  const { socket, setUnreadMessageCount } = useSocket()
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/conversations')
      .then(({ data }) => setConversations(data))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!socket) return undefined

    const handleConversationUpdated = (updated) => {
      if (!updated?.conversation_id) return

      setConversations((current) => {
        const withoutUpdated = current.filter(
          (conversation) => conversation.conversation_id !== updated.conversation_id
        )
        return [updated, ...withoutUpdated]
      })

      if (typeof updated.unread_total === 'number') {
        setUnreadMessageCount(updated.unread_total)
      }
    }

    socket.on('conversation_updated', handleConversationUpdated)

    return () => {
      socket.off('conversation_updated', handleConversationUpdated)
    }
  }, [socket, setUnreadMessageCount])

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

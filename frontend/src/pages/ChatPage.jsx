import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Avatar from '../components/Avatar/Avatar'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import api from '../services/api'

export default function ChatPage() {
  const { friendId } = useParams()
  const { user } = useAuth()
  const { socket, isConnected } = useSocket()
  const [friend, setFriend] = useState(null)
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const lastMessageTimeRef = useRef(null)
  const messagesEndRef = useRef(null)

  const appendMessages = (incoming) => {
    const list = Array.isArray(incoming) ? incoming : [incoming]
    if (list.length === 0) return

    setMessages((current) => {
      const existingIds = new Set(current.map((message) => message.id))
      const nextMessages = list.filter((message) => !existingIds.has(message.id))
      if (nextMessages.length === 0) return current

      const latest = nextMessages[nextMessages.length - 1]
      lastMessageTimeRef.current = latest.created_at
      return [...current, ...nextMessages]
    })
  }

  useEffect(() => {
    const loadChat = async () => {
      setLoading(true)
      setError('')
      try {
        const [{ data: history }, { data: friendData }] = await Promise.all([
          api.get(`/messages/${friendId}`),
          api.get(`/users/${friendId}`),
        ])
        setMessages(history)
        lastMessageTimeRef.current = history.at(-1)?.created_at || new Date(0).toISOString()
        setFriend(friendData)
        await api.put(`/messages/${friendId}/read`)
      } catch (err) {
        setError(err.response?.data?.error || 'Erro ao carregar conversa.')
      } finally {
        setLoading(false)
      }
    }

    loadChat()
  }, [friendId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (!socket) return undefined

    const handleNewMessage = (message) => {
      const belongsToConversation =
        (message.sender_id === friendId && message.receiver_id === user?.id) ||
        (message.sender_id === user?.id && message.receiver_id === friendId)

      if (belongsToConversation) {
        appendMessages(message)
        api.put(`/messages/${friendId}/read`).catch(() => {})
      }
    }

    socket.on('new_message', handleNewMessage)
    socket.on('message_sent', handleNewMessage)

    return () => {
      socket.off('new_message', handleNewMessage)
      socket.off('message_sent', handleNewMessage)
    }
  }, [socket, friendId, user?.id])

  useEffect(() => {
    if (loading || isConnected) return undefined

    const pollNewMessages = async () => {
      try {
        const after = encodeURIComponent(lastMessageTimeRef.current || new Date(0).toISOString())
        const { data } = await api.get(`/messages/${friendId}/new?after=${after}`)
        appendMessages(data)
        if (data.length > 0) {
          api.put(`/messages/${friendId}/read`).catch(() => {})
        }
      } catch (err) {
        setError(err.response?.data?.error || 'Erro ao buscar mensagens novas.')
      }
    }

    const intervalId = window.setInterval(pollNewMessages, 30000)
    return () => window.clearInterval(intervalId)
  }, [friendId, isConnected, loading])

  const sendMessage = async (event) => {
    event.preventDefault()
    const content = inputText.trim()
    if (!content || sending) return

    setSending(true)
    setError('')

    try {
      if (socket && isConnected) {
        socket.emit('send_message', { receiverId: friendId, content }, (response) => {
          if (!response?.ok) {
            setError(response?.error || 'Erro ao enviar mensagem.')
          }
        })
      } else {
        const { data } = await api.post(`/messages/${friendId}`, { content })
        appendMessages(data)
      }
      setInputText('')
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao enviar mensagem.')
    } finally {
      setSending(false)
    }
  }

  return (
    <main className="chat-page">
      <header className="chat-header">
        <Link to="/conversations" className="button button-secondary">Voltar</Link>
        <Avatar src={friend?.avatar_url} alt={`Avatar de ${friend?.username || 'amigo'}`} />
        <div>
          <strong>{friend?.full_name || friend?.username || 'Amigo'}</strong>
          <span>{isConnected ? 'online' : 'conectando...'}</span>
        </div>
      </header>

      <section className="chat-messages">
        {loading ? (
          <p>Carregando mensagens...</p>
        ) : error ? (
          <p className="inline-error">{error}</p>
        ) : messages.length === 0 ? (
          <p>Nenhuma mensagem ainda.</p>
        ) : (
          messages.map((message) => {
            const mine = message.sender_id === user?.id
            return (
              <article key={message.id} className={`message-bubble ${mine ? 'mine' : 'theirs'}`}>
                <p>{message.content}</p>
                <time>{new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time>
              </article>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </section>

      <form className="chat-form" onSubmit={sendMessage}>
        <input
          value={inputText}
          onChange={(event) => setInputText(event.target.value)}
          placeholder="Mensagem..."
          disabled={loading || sending}
        />
        <button className="button button-primary" disabled={loading || sending || !inputText.trim()}>
          {sending ? 'Enviando...' : 'Enviar'}
        </button>
      </form>
    </main>
  )
}

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { useSocket } from '../context/SocketContext'
import Avatar from '../components/Avatar/Avatar'
import MessagesNavLink from '../components/MessagesNavLink'

function notificationText(notification) {
  const username = notification.actor?.username || 'Alguém'
  if (notification.type === 'like') return `${username} curtiu seu post.`
  if (notification.type === 'comment') return `${username} comentou no seu post.`
  if (notification.type === 'friend_request') return `${username} enviou uma solicitação de amizade.`
  return `${username} interagiu com você.`
}

export default function NotificationsPage() {
  const { socket, setUnreadNotificationCount, refreshUnreadNotificationCount } = useSocket()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadNotifications = async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get('/notifications')
      setNotifications(data)
    } catch (_error) {
      setError('Não foi possível carregar as notificações.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNotifications()
  }, [])

  useEffect(() => {
    if (!socket) return undefined

    const handleNotification = (notification) => {
      setNotifications((prev) => [notification, ...prev.filter((item) => item.id !== notification.id)])
    }

    socket.on('notification_created', handleNotification)
    return () => socket.off('notification_created', handleNotification)
  }, [socket])

  const markAsRead = async (id) => {
    try {
      const { data } = await api.put(`/notifications/${id}/read`)
      setNotifications((prev) => prev.map((item) => (
        item.id === id ? { ...item, read: true } : item
      )))
      setUnreadNotificationCount(data.unread_count || 0)
    } catch (_error) {
      refreshUnreadNotificationCount().catch(() => {})
    }
  }

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all')
      setNotifications((prev) => prev.map((item) => ({ ...item, read: true })))
      setUnreadNotificationCount(0)
    } catch (_error) {
      refreshUnreadNotificationCount().catch(() => {})
    }
  }

  return (
    <main className="page-shell">
      <header className="page-header">
        <div>
          <h1>Notificações</h1>
          <p>Curtidas, comentários e solicitações recebidas.</p>
        </div>
        <div className="page-header-actions">
          <Link to="/" className="button button-secondary">Feed</Link>
          <MessagesNavLink />
          <button className="button button-secondary" type="button" onClick={markAllAsRead}>
            Marcar todas como lidas
          </button>
        </div>
      </header>

      {loading && <p>Carregando...</p>}
      {error && <p className="inline-error">{error}</p>}
      {!loading && !error && notifications.length === 0 && (
        <p>Nenhuma notificação ainda.</p>
      )}

      <div className="notifications-list">
        {notifications.map((notification) => (
          <article
            key={notification.id}
            className={`notification-item ${notification.read ? '' : 'notification-item-unread'}`}
          >
            <Avatar
              src={notification.actor?.avatar_url}
              size={40}
              alt={notification.actor?.username || 'Usuário'}
            />
            <div className="notification-body">
              <strong>{notificationText(notification)}</strong>
              <span>{new Date(notification.created_at).toLocaleString('pt-BR')}</span>
            </div>
            {!notification.read && (
              <button
                className="button button-secondary"
                type="button"
                onClick={() => markAsRead(notification.id)}
              >
                Marcar lida
              </button>
            )}
          </article>
        ))}
      </div>
    </main>
  )
}

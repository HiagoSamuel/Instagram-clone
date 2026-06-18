import { Link } from 'react-router-dom'
import { useSocket } from '../context/SocketContext'

export default function NotificationsNavLink({ className = 'button button-secondary', children = 'Notificações' }) {
  const { unreadNotificationCount } = useSocket()

  return (
    <Link to="/notifications" className={`${className} nav-button-with-badge`}>
      {children}
      {unreadNotificationCount > 0 && (
        <span className="nav-badge">{unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}</span>
      )}
    </Link>
  )
}

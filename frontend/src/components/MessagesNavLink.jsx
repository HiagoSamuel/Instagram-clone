import { Link } from 'react-router-dom'
import { useSocket } from '../context/SocketContext'

export default function MessagesNavLink({ className = 'button button-secondary', children = 'Mensagens' }) {
  const { unreadMessageCount } = useSocket()

  return (
    <Link to="/conversations" className={`${className} nav-button-with-badge`}>
      {children}
      {unreadMessageCount > 0 && (
        <span className="nav-badge">{unreadMessageCount > 99 ? '99+' : unreadMessageCount}</span>
      )}
    </Link>
  )
}

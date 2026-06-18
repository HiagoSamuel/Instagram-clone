import { Link, NavLink } from 'react-router-dom'
import {
  Bell,
  Compass,
  Heart,
  Home,
  LogOut,
  Menu,
  MessageCircle,
  PlusSquare,
  Search,
  UserCircle,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import { useTheme } from '../context/ThemeContext'

const navItems = [
  { to: '/', label: 'Página inicial', icon: Home },
  { to: '/search', label: 'Pesquisa', icon: Search },
  { to: '/explore', label: 'Explorar', icon: Compass },
  { to: '/notifications', label: 'Notificações', icon: Heart, badge: 'notifications' },
  { to: '/conversations', label: 'Mensagens', icon: MessageCircle, badge: 'messages' },
  { to: '/profile', label: 'Perfil', icon: UserCircle },
]

export default function InstagramShell({ children }) {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { unreadMessageCount, unreadNotificationCount } = useSocket()

  const badgeValue = (type) => {
    const count = type === 'messages' ? unreadMessageCount : unreadNotificationCount
    if (!count) return null
    return count > 99 ? '99+' : count
  }

  return (
    <div className="ig-shell">
      <aside className="ig-sidebar" aria-label="Navegação principal">
        <Link to="/" className="ig-wordmark">Instaclone</Link>
        <nav className="ig-nav-list">
          {navItems.map(({ to, label, icon: Icon, badge }) => (
            <NavLink key={to} to={to} className="ig-nav-item">
              <span className="ig-nav-icon-wrap">
                <Icon size={25} strokeWidth={2} />
                {badgeValue(badge) && <span className="ig-nav-badge">{badgeValue(badge)}</span>}
              </span>
              <span>{label}</span>
            </NavLink>
          ))}
          <Link to="/" className="ig-nav-item">
            <PlusSquare size={25} strokeWidth={2} />
            <span>Criar</span>
          </Link>
        </nav>
        <div className="ig-sidebar-footer">
          <button type="button" className="ig-nav-item ig-nav-button" onClick={toggleTheme}>
            <Bell size={25} strokeWidth={2} />
            <span>{theme === 'dark' ? 'Modo claro' : 'Modo escuro'}</span>
          </button>
          <button type="button" className="ig-nav-item ig-nav-button" onClick={logout}>
            <LogOut size={25} strokeWidth={2} />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      <header className="ig-mobile-topbar">
        <Link to="/" className="ig-wordmark">Instaclone</Link>
        <div className="ig-mobile-topbar-actions">
          <NavLink to="/notifications" className="ig-mobile-icon-link" aria-label="Notificações">
            <Heart size={24} />
            {badgeValue('notifications') && <span className="ig-nav-badge">{badgeValue('notifications')}</span>}
          </NavLink>
          <NavLink to="/conversations" className="ig-mobile-icon-link" aria-label="Mensagens">
            <MessageCircle size={24} />
            {badgeValue('messages') && <span className="ig-nav-badge">{badgeValue('messages')}</span>}
          </NavLink>
        </div>
      </header>

      <main className="ig-main">{children}</main>

      <nav className="ig-bottom-nav" aria-label="Navegação mobile">
        {navItems.slice(0, 4).map(({ to, label, icon: Icon, badge }) => (
          <NavLink key={to} to={to} className="ig-bottom-nav-item" aria-label={label}>
            <span className="ig-nav-icon-wrap">
              <Icon size={25} strokeWidth={2} />
              {badgeValue(badge) && <span className="ig-nav-badge">{badgeValue(badge)}</span>}
            </span>
          </NavLink>
        ))}
        <Link to="/" className="ig-bottom-nav-item" aria-label="Criar">
          <PlusSquare size={25} strokeWidth={2} />
        </Link>
        <NavLink to="/profile" className="ig-bottom-nav-item" aria-label={`Perfil de ${user?.username || 'usuário'}`}>
          <UserCircle size={25} strokeWidth={2} />
        </NavLink>
      </nav>
    </div>
  )
}

import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import api from '../../services/api'
import { userService } from '../../services/userService'
import './SettingsMenu.css'

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i)
  }

  return outputArray
}

export default function SettingsMenu() {
  const { user, setUser } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [open, setOpen] = useState(false)
  const [nickname, setNickname] = useState(user?.username || '')
  const [bio, setBio] = useState(user?.bio || '')
  const [avatar, setAvatar] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar_url || '')
  const [blockedWords, setBlockedWords] = useState([])
  const [newWord, setNewWord] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)
  const [pushStatus, setPushStatus] = useState('idle')
  const [pushEnabled, setPushEnabled] = useState(false)
  const [panelPosition, setPanelPosition] = useState(() => {
    if (typeof window !== 'undefined') {
      return {
        x: Math.max(window.innerWidth - 460, 20),
        y: 80,
      }
    }
    return { x: 20, y: 80 }
  })
  const [dragging, setDragging] = useState(false)
  const dragOffset = useRef({ x: 0, y: 0 })

  useEffect(() => {
    setNickname(user?.username || '')
    setBio(user?.bio || '')
    setAvatarPreview(user?.avatar_url || '')
  }, [user])

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('blockedWords') || '[]')
    setBlockedWords(stored)
  }, [])

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return

    navigator.serviceWorker.ready
      .then((registration) => registration.pushManager.getSubscription())
      .then((subscription) => setPushEnabled(Boolean(subscription)))
      .catch(() => setPushEnabled(false))
  }, [])

  const handleAvatarChange = (event) => {
    const file = event.target.files[0]
    if (!file) return
    setAvatar(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const handleAddBlockedWord = () => {
    const word = newWord.trim().toLowerCase()
    if (!word) return
    if (blockedWords.includes(word)) {
      setError('Palavra já cadastrada.')
      return
    }
    const next = [...blockedWords, word]
    setBlockedWords(next)
    localStorage.setItem('blockedWords', JSON.stringify(next))
    setNewWord('')
    setError('')
  }

  const handleRemoveBlockedWord = (index) => {
    const next = blockedWords.filter((_, idx) => idx !== index)
    setBlockedWords(next)
    localStorage.setItem('blockedWords', JSON.stringify(next))
  }

  const handleDragStart = (event) => {
    event.preventDefault()
    setDragging(true)
    dragOffset.current.x = event.clientX - panelPosition.x
    dragOffset.current.y = event.clientY - panelPosition.y
  }

  const handleDragEnd = useCallback(() => {
    setDragging(false)
  }, [])

  // FIX: handleDragMove definido com useCallback para evitar stale closure
  const handleDragMove = useCallback((event) => {
    setPanelPosition({
      x: Math.max(12, event.clientX - dragOffset.current.x),
      y: Math.max(12, event.clientY - dragOffset.current.y),
    })
  }, [])

  useEffect(() => {
    if (!dragging) return

    window.addEventListener('pointermove', handleDragMove)
    window.addEventListener('pointerup', handleDragEnd)
    window.addEventListener('pointerleave', handleDragEnd)

    return () => {
      window.removeEventListener('pointermove', handleDragMove)
      window.removeEventListener('pointerup', handleDragEnd)
      window.removeEventListener('pointerleave', handleDragEnd)
    }
  }, [dragging, handleDragMove, handleDragEnd])

  const handleSaveProfile = async () => {
    setLoading(true)
    setError('')
    setInfo('')

    try {
      const payload = { bio }
      // FIX: só envia username se ele foi alterado
      if (nickname && nickname !== user?.username) {
        payload.username = nickname
      }
      if (avatar) {
        payload.avatar = avatar
      }

      const updated = await userService.updateProfile(payload)
      setUser(updated)
      setInfo('Configurações salvas com sucesso.')
      setAvatar(null)
    } catch (err) {
      setError(err.response?.data?.error || err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleEnablePush = async () => {
    setPushStatus('loading')
    setError('')
    setInfo('')

    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
        throw new Error('Este navegador nao suporta notificacoes push.')
      }

      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        throw new Error('Permissao de notificacao negada.')
      }

      const { data: config } = await api.get('/push/config')
      if (!config.enabled || !config.publicKey) {
        throw new Error('Push ainda nao configurado no backend. Defina as chaves VAPID.')
      }

      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(config.publicKey),
      })

      await api.post('/push/subscribe', { subscription })
      setPushEnabled(true)
      setPushStatus('idle')
      setInfo('Notificacoes ativadas neste navegador.')
    } catch (err) {
      setPushStatus('idle')
      setError(err.response?.data?.error || err.message)
    }
  }

  const handleDisablePush = async () => {
    setPushStatus('loading')
    setError('')
    setInfo('')

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      if (subscription) {
        await api.post('/push/unsubscribe', { endpoint: subscription.endpoint })
        await subscription.unsubscribe()
      }
      setPushEnabled(false)
      setInfo('Notificacoes desativadas neste navegador.')
    } catch (err) {
      setError(err.response?.data?.error || err.message)
    } finally {
      setPushStatus('idle')
    }
  }

  if (!user) return null

  return (
    <div className="settings-menu">
      <button
        type="button"
        aria-label="Configurações"
        className="settings-trigger"
        onClick={() => setOpen((current) => !current)}
      >
        ⚙️
      </button>

      {open && (
        <div
          className="settings-panel"
          role="dialog"
          aria-modal="true"
          style={{ left: panelPosition.x, top: panelPosition.y }}
        >
          <div
            className={`settings-header ${dragging ? 'dragging' : ''}`}
            onPointerDown={handleDragStart}
          >
            <h3>Configurações</h3>
            <button
              type="button"
              className="settings-close"
              onClick={() => setOpen(false)}
              aria-label="Fechar configurações"
            >
              ✕
            </button>
          </div>

          <section className="settings-section">
            <h4>Tema</h4>
            <button
              type="button"
              className="settings-toggle"
              onClick={toggleTheme}
            >
              {theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
            </button>
          </section>

          <section className="settings-section">
            <h4>Notificacoes</h4>
            <p className="settings-note">
              Receba aviso de nova mensagem quando voce estiver offline.
            </p>
            <button
              type="button"
              className="settings-toggle"
              onClick={pushEnabled ? handleDisablePush : handleEnablePush}
              disabled={pushStatus === 'loading'}
            >
              {pushStatus === 'loading'
                ? 'Atualizando...'
                : pushEnabled
                  ? 'Desativar notificacoes'
                  : 'Ativar notificacoes'}
            </button>
          </section>

          <section className="settings-section">
            <h4>Filtrar palavras</h4>
            <div className="blocked-word-form">
              <input
                type="text"
                value={newWord}
                onChange={(e) => setNewWord(e.target.value)}
                placeholder="Adicionar palavra"
              />
              <button type="button" onClick={handleAddBlockedWord}>
                Adicionar
              </button>
            </div>
            <div className="blocked-list">
              {blockedWords.length === 0 ? (
                <p className="settings-note">Nenhuma palavra bloqueada.</p>
              ) : (
                blockedWords.map((word, index) => (
                  <div key={word} className="blocked-item">
                    <span>{word}</span>
                    <button type="button" onClick={() => handleRemoveBlockedWord(index)}>
                      Remover
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="settings-section">
            <h4>Meu perfil</h4>
            <label className="settings-label">
              Novo apelido
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Apelido"
              />
            </label>
            <label className="settings-label">
              Biografia
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Conte um pouco sobre você"
              />
            </label>
            <label className="settings-label">
              Foto de perfil
              <input type="file" accept="image/*" onChange={handleAvatarChange} />
            </label>
            {avatarPreview && (
              <img
                className="settings-avatar-preview"
                src={avatarPreview}
                alt="Prévia do avatar"
              />
            )}
          </section>

          {error && <p className="settings-error">{error}</p>}
          {info && <p className="settings-info">{info}</p>}

          <div className="settings-actions">
            <Link to={`/profile/${user.username}`} className="settings-link">
              Meu perfil
            </Link>
            <button type="button" className="settings-save" onClick={handleSaveProfile} disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar alterações'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

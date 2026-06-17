import { useSocket } from '../context/SocketContext'

const STATUS_LABELS = {
  offline: 'Offline: tentando recuperar a conexao em tempo real.',
  reconnecting: 'Reconectando ao tempo real...',
  synced: 'Sincronizado.',
}

export default function SocketStatusBanner() {
  const { connectionStatus } = useSocket()
  const label = STATUS_LABELS[connectionStatus]

  if (!label) return null

  return (
    <div className={`socket-status-banner ${connectionStatus}`} role="status">
      {label}
    </div>
  )
}

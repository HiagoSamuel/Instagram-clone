import { useEffect, useState } from 'react'
import api from '../services/api'

export default function FriendButton({ userId, onStatusChange }) {
  const [status, setStatus] = useState('none')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    const loadStatus = async () => {
      setLoading(true)
      setError('')
      try {
        const { data } = await api.get(`/friendships/status/${userId}`)
        if (active) {
          setStatus(data.status)
          onStatusChange?.(data.status)
        }
      } catch (err) {
        if (active) setError(err.response?.data?.error || 'Erro ao buscar amizade.')
      } finally {
        if (active) setLoading(false)
      }
    }

    if (userId) loadStatus()
    return () => {
      active = false
    }
  }, [userId, onStatusChange])

  const updateStatus = (nextStatus) => {
    setStatus(nextStatus)
    onStatusChange?.(nextStatus)
  }

  const runAction = async () => {
    setLoading(true)
    setError('')

    try {
      if (status === 'none') {
        await api.post(`/friendships/request/${userId}`)
        updateStatus('pending_sent')
      } else if (status === 'pending_received') {
        await api.put(`/friendships/accept/${userId}`)
        updateStatus('accepted')
      } else if (status === 'accepted') {
        await api.delete(`/friendships/${userId}`)
        updateStatus('none')
      }
    } catch (err) {
      const message = err.response?.data?.error || 'Nao foi possivel atualizar a amizade.'
      setError(message)
      alert(message)
    } finally {
      setLoading(false)
    }
  }

  const config = {
    none: { label: 'Adicionar amigo', className: 'button button-primary', disabled: false },
    pending_sent: { label: 'Solicitacao enviada', className: 'button button-secondary', disabled: true },
    pending_received: { label: 'Aceitar solicitacao', className: 'button button-success', disabled: false },
    accepted: { label: 'Desfazer amizade', className: 'button button-danger', disabled: false },
    blocked: { label: 'Bloqueado', className: 'button button-secondary', disabled: true },
  }[status] || { label: 'Adicionar amigo', className: 'button button-primary', disabled: false }

  return (
    <div className="friend-button-wrap">
      <button
        type="button"
        className={config.className}
        onClick={runAction}
        disabled={loading || config.disabled}
      >
        {loading ? 'Carregando...' : config.label}
      </button>
      {error && <span className="inline-error">{error}</span>}
    </div>
  )
}

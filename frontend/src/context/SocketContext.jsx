import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import api, { API_BASE_URL, handleAuthExpired } from '../services/api'
import { useAuth } from './AuthContext'

const SocketContext = createContext({
  socket: null,
  isConnected: false,
  connectionStatus: 'idle',
  resyncVersion: 0,
  unreadMessageCount: 0,
  unreadNotificationCount: 0,
  refreshUnreadMessageCount: async () => 0,
  refreshUnreadNotificationCount: async () => 0,
  setUnreadMessageCount: () => {},
  setUnreadNotificationCount: () => {},
})

function getSocketUrl() {
  return API_BASE_URL.replace(/\/api$/, '')
}

export function SocketProvider({ children }) {
  const { user } = useAuth()
  const socketRef = useRef(null)
  const statusTimerRef = useRef(null)
  const [isConnected, setIsConnected] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState('idle')
  const [resyncVersion, setResyncVersion] = useState(0)
  const [unreadMessageCount, setUnreadMessageCount] = useState(0)
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0)

  const refreshUnreadMessageCount = async () => {
    if (!localStorage.getItem('token')) {
      setUnreadMessageCount(0)
      return 0
    }

    const { data } = await api.get('/messages/unread-count')
    const nextCount = data.unread_count || 0
    setUnreadMessageCount(nextCount)
    return nextCount
  }

  const refreshUnreadNotificationCount = async () => {
    if (!localStorage.getItem('token')) {
      setUnreadNotificationCount(0)
      return 0
    }

    const { data } = await api.get('/notifications/unread-count')
    const nextCount = data.unread_count || 0
    setUnreadNotificationCount(nextCount)
    return nextCount
  }

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!user || !token) {
      socketRef.current?.disconnect()
      socketRef.current = null
      setIsConnected(false)
      setConnectionStatus('idle')
      setUnreadMessageCount(0)
      setUnreadNotificationCount(0)
      return undefined
    }

    refreshUnreadMessageCount().catch(() => setUnreadMessageCount(0))
    refreshUnreadNotificationCount().catch(() => setUnreadNotificationCount(0))

    const socket = io(getSocketUrl(), {
      auth: { token },
      transports: ['websocket'],
    })

    socketRef.current = socket
    const markSynced = async () => {
      window.clearTimeout(statusTimerRef.current)
      await refreshUnreadMessageCount().catch(() => {})
      await refreshUnreadNotificationCount().catch(() => {})
      setResyncVersion((version) => version + 1)
      setConnectionStatus('synced')
      statusTimerRef.current = window.setTimeout(() => {
        setConnectionStatus('online')
      }, 1800)
    }

    const handleConnect = () => {
      setIsConnected(true)
      markSynced()
    }

    const handleDisconnect = () => {
      window.clearTimeout(statusTimerRef.current)
      setIsConnected(false)
      setConnectionStatus('offline')
    }

    const handleReconnectAttempt = () => {
      window.clearTimeout(statusTimerRef.current)
      setConnectionStatus('reconnecting')
    }

    const handleReconnect = () => {
      setIsConnected(true)
      markSynced()
    }

    socket.on('connect', handleConnect)
    socket.on('disconnect', handleDisconnect)
    socket.io.on('reconnect_attempt', handleReconnectAttempt)
    socket.io.on('reconnect', handleReconnect)
    socket.on('conversation_updated', (conversation) => {
      if (typeof conversation?.unread_total === 'number') {
        setUnreadMessageCount(conversation.unread_total)
      }
    })
    socket.on('notification_created', (notification) => {
      if (typeof notification?.unread_count === 'number') {
        setUnreadNotificationCount(notification.unread_count)
      } else {
        setUnreadNotificationCount((count) => count + 1)
      }
    })
    socket.on('connect_error', (error) => {
      setIsConnected(false)
      if (error.message === 'Unauthorized') {
        handleAuthExpired()
      }
    })

    return () => {
      window.clearTimeout(statusTimerRef.current)
      socket.off('connect', handleConnect)
      socket.off('disconnect', handleDisconnect)
      socket.io.off('reconnect_attempt', handleReconnectAttempt)
      socket.io.off('reconnect', handleReconnect)
      socket.off('conversation_updated')
      socket.off('notification_created')
      socket.off('connect_error')
      socket.disconnect()
      socketRef.current = null
      setIsConnected(false)
      setConnectionStatus('idle')
    }
  }, [user])

  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
        isConnected,
        connectionStatus,
        resyncVersion,
        unreadMessageCount,
        unreadNotificationCount,
        refreshUnreadMessageCount,
        refreshUnreadNotificationCount,
        setUnreadMessageCount,
        setUnreadNotificationCount,
      }}
    >
      {children}
    </SocketContext.Provider>
  )
}

export const useSocket = () => useContext(SocketContext)

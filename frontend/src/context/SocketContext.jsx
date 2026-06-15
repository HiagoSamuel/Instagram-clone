import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { API_BASE_URL } from '../services/api'
import { useAuth } from './AuthContext'

const SocketContext = createContext({ socket: null, isConnected: false })

function getSocketUrl() {
  return API_BASE_URL.replace(/\/api$/, '')
}

export function SocketProvider({ children }) {
  const { user } = useAuth()
  const socketRef = useRef(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!user || !token) {
      socketRef.current?.disconnect()
      socketRef.current = null
      setIsConnected(false)
      return undefined
    }

    const socket = io(getSocketUrl(), {
      auth: { token },
    })

    socketRef.current = socket
    socket.on('connect', () => setIsConnected(true))
    socket.on('disconnect', () => setIsConnected(false))

    return () => {
      socket.off('connect')
      socket.off('disconnect')
      socket.disconnect()
      socketRef.current = null
      setIsConnected(false)
    }
  }, [user])

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, isConnected }}>
      {children}
    </SocketContext.Provider>
  )
}

export const useSocket = () => useContext(SocketContext)

require('dotenv').config()
const express = require('express')
const cors = require('cors')
const http = require('http')
const jwt = require('jsonwebtoken')
const { Server } = require('socket.io')
const authRoutes = require('./routes/auth')
const postRoutes = require('./routes/posts')
const friendshipRoutes = require('./routes/friendships')
const messageRoutes = require('./routes/messages')
const userRoutes = require('./routes/users')
const { createMessage, buildConversationUpdate } = require('./controllers/messageController')

const app = express()

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:3000',
].filter(Boolean)

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
}))

app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/posts', postRoutes)
app.use('/api/friendships', friendshipRoutes)
app.use('/api/users', userRoutes)
app.use('/api', messageRoutes)

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
})

app.set('io', io)

io.use((socket, next) => {
  const token = socket.handshake.auth?.token
  if (!token) return next(new Error('Unauthorized'))

  try {
    socket.user = jwt.verify(token, process.env.JWT_SECRET)
    return next()
  } catch (_error) {
    return next(new Error('Unauthorized'))
  }
})

io.on('connection', (socket) => {
  const userId = socket.user.userId
  socket.join(`user:${userId}`)
  console.log(`Usuario ${userId} conectado`)

  socket.on('send_message', async (data = {}, callback) => {
    try {
      const message = await createMessage(userId, data.receiverId, data.content)
      const receiverConversation = await buildConversationUpdate(data.receiverId, userId, message)
      const senderConversation = await buildConversationUpdate(userId, data.receiverId, message)

      io.to(`user:${data.receiverId}`).emit('new_message', message)
      io.to(`user:${data.receiverId}`).emit('conversation_updated', receiverConversation)
      io.to(`user:${userId}`).emit('conversation_updated', senderConversation)
      socket.emit('message_sent', message)
      if (typeof callback === 'function') callback({ ok: true, message })
    } catch (error) {
      const payload = { error: error.message || 'Erro ao enviar mensagem.' }
      socket.emit('message_error', payload)
      if (typeof callback === 'function') callback({ ok: false, ...payload })
    }
  })

  socket.on('disconnect', () => {
    console.log(`Usuario ${userId} desconectado`)
  })
})

const port = process.env.PORT || 3001
server.listen(port, () => {
  console.log(`Backend rodando na porta ${port}`)
})

module.exports = { app, io }

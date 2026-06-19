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
const searchRoutes = require('./routes/search')
const exploreRoutes = require('./routes/explore')
const pushRoutes = require('./routes/push')
const notificationRoutes = require('./routes/notifications')
const storyRoutes = require('./routes/stories')
const { createMessage, buildConversationUpdate } = require('./controllers/messageController')
const { sendPushToUser } = require('./services/pushService')

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
app.use('/api/search', searchRoutes)
app.use('/api/explore', exploreRoutes)
app.use('/api/push', pushRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/stories', storyRoutes)
app.use('/api', messageRoutes)

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    features: ['stories', 'explore', 'notifications', 'messages'],
  })
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
app.set('onlineUsers', new Map())

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
  const onlineUsers = app.get('onlineUsers')
  onlineUsers.set(userId, (onlineUsers.get(userId) || 0) + 1)
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
      if (!onlineUsers.has(data.receiverId)) {
        await sendPushToUser(data.receiverId, {
          title: 'Nova mensagem',
          body: receiverConversation.last_message_preview || 'Voce recebeu uma mensagem.',
          url: `/chat/${userId}`,
        })
      }
      if (typeof callback === 'function') callback({ ok: true, message })
    } catch (error) {
      const payload = { error: error.message || 'Erro ao enviar mensagem.' }
      socket.emit('message_error', payload)
      if (typeof callback === 'function') callback({ ok: false, ...payload })
    }
  })

  socket.on('disconnect', () => {
    const currentCount = onlineUsers.get(userId) || 1
    if (currentCount <= 1) {
      onlineUsers.delete(userId)
    } else {
      onlineUsers.set(userId, currentCount - 1)
    }
    console.log(`Usuario ${userId} desconectado`)
  })
})

const port = process.env.PORT || 3001
server.listen(port, () => {
  console.log(`Backend rodando na porta ${port}`)
})

module.exports = { app, io }

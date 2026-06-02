require('dotenv').config()
const express = require('express')
const cors = require('cors')
const authRoutes = require('./routes/auth')
const postRoutes = require('./routes/posts')
 
const app = express()
 
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:3000',
].filter(Boolean)
 
app.use(cors({
  origin: (origin, callback) => {
    // Permite requisições sem origin (ex: Postman, mobile apps)
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
 
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})
 
const port = process.env.PORT || 3001
app.listen(port, () => {
  console.log(`🚀 Backend rodando na porta ${port}`)
})
 
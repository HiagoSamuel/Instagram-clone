const express = require('express')
const authMiddleware = require('../middlewares/authMiddleware')
const {
  getHistory,
  sendMessage,
  getNewMessages,
  listConversations,
  getUnreadCount,
  markAsRead,
} = require('../controllers/messageController')

const router = express.Router()

router.get('/conversations', authMiddleware, listConversations)
router.get('/messages/unread-count', authMiddleware, getUnreadCount)
router.get('/messages/:friendId', authMiddleware, getHistory)
router.post('/messages/:friendId', authMiddleware, sendMessage)
router.get('/messages/:friendId/new', authMiddleware, getNewMessages)
router.put('/messages/:friendId/read', authMiddleware, markAsRead)

module.exports = router

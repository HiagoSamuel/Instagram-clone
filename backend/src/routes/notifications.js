const express = require('express')
const authMiddleware = require('../middlewares/authMiddleware')
const {
  getUnreadCount,
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} = require('../controllers/notificationController')

const router = express.Router()

router.get('/', authMiddleware, listNotifications)
router.get('/unread-count', authMiddleware, getUnreadCount)
router.put('/read-all', authMiddleware, markAllNotificationsRead)
router.put('/:id/read', authMiddleware, markNotificationRead)

module.exports = router

const express = require('express')
const authMiddleware = require('../middlewares/authMiddleware')
const {
  getPushConfig,
  subscribe,
  unsubscribe,
} = require('../controllers/pushController')

const router = express.Router()

router.get('/config', authMiddleware, getPushConfig)
router.post('/subscribe', authMiddleware, subscribe)
router.post('/unsubscribe', authMiddleware, unsubscribe)

module.exports = router

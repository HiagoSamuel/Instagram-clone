const express = require('express')
const authMiddleware = require('../middlewares/authMiddleware')
const {
  sendRequest,
  acceptRequest,
  removeFriendship,
  listFriends,
  listPending,
  getFriendshipStatus,
} = require('../controllers/friendshipController')

const router = express.Router()

router.post('/request/:userId', authMiddleware, sendRequest)
router.put('/accept/:requesterId', authMiddleware, acceptRequest)
router.delete('/:userId', authMiddleware, removeFriendship)
router.get('/', authMiddleware, listFriends)
router.get('/pending', authMiddleware, listPending)
router.get('/status/:userId', authMiddleware, getFriendshipStatus)

module.exports = router

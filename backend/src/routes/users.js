const express = require('express')
const authMiddleware = require('../middlewares/authMiddleware')
const { getUserById, searchUsers } = require('../controllers/userController')

const router = express.Router()

router.get('/search', authMiddleware, searchUsers)
router.get('/:id', authMiddleware, getUserById)

module.exports = router

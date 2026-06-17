const express = require('express')
const authMiddleware = require('../middlewares/authMiddleware')
const {
  searchUsers,
  searchPosts,
  searchHashtagPosts,
} = require('../controllers/searchController')

const router = express.Router()

router.get('/users', authMiddleware, searchUsers)
router.get('/posts', authMiddleware, searchPosts)
router.get('/hashtags/:tag', authMiddleware, searchHashtagPosts)

module.exports = router

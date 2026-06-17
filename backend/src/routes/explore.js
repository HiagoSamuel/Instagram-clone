const express = require('express')
const authMiddleware = require('../middlewares/authMiddleware')
const {
  getExplorePosts,
  getTrendingHashtags,
} = require('../controllers/exploreController')

const router = express.Router()

router.get('/', authMiddleware, getExplorePosts)
router.get('/trending', authMiddleware, getTrendingHashtags)

module.exports = router

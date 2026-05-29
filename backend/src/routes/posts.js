const express = require('express')
const multer = require('multer')
const {
  getFeed,
  createPost,
  getUserPosts,
  likePost,
  unlikePost,
} = require('../controllers/postController')
const authMiddleware = require('../middlewares/authMiddleware')

const router = express.Router()
const upload = multer()

router.get('/feed', authMiddleware, getFeed)
router.post('/', authMiddleware, upload.single('image'), createPost)
router.get('/user/:username', authMiddleware, getUserPosts)
router.post('/:id/like', authMiddleware, likePost)
router.delete('/:id/like', authMiddleware, unlikePost)

module.exports = router

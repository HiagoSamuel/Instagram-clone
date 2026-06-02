const express = require('express')
const multer = require('multer')
const {
  getFeed,
  createPost,
  getUserPosts,
  likePost,
  unlikePost,
  deletePost,
} = require('../controllers/postController')
const authMiddleware = require('../middlewares/authMiddleware')

const router = express.Router()
const upload = multer()

router.get('/feed', authMiddleware, getFeed)
router.post('/', authMiddleware, upload.single('image'), createPost)
router.get('/user/:username', authMiddleware, getUserPosts)
router.post('/:id/like', authMiddleware, likePost)
router.delete('/:id/like', authMiddleware, unlikePost)
router.delete('/:id', authMiddleware, deletePost)

module.exports = router

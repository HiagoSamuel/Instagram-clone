const express = require('express')
const multer = require('multer')
const {
  getFeed,
  createPost,
  getUserPosts,
  likePost,
  unlikePost,
} = require('../controllers/postController')
const {
  getComments,
  createComment,
  deleteComment,
} = require('../controllers/commentController')
const authMiddleware = require('../middlewares/authMiddleware')

const router = express.Router()
const upload = multer()

// posts
router.get('/feed',               authMiddleware,                    getFeed)
router.post('/',                  authMiddleware, upload.single('image'), createPost)
router.get('/user/:username',     authMiddleware,                    getUserPosts)
router.post('/:id/like',          authMiddleware,                    likePost)
router.delete('/:id/like',        authMiddleware,                    unlikePost)

// comments
router.get('/:id/comments',                   authMiddleware,                        getComments)
router.post('/:id/comments',                  authMiddleware, upload.single('image'), createComment)
router.delete('/:postId/comments/:commentId', authMiddleware,                        deleteComment)

module.exports = router

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
const {
  getComments,
  createComment,
  deleteComment,
} = require('../controllers/commentController')
const authMiddleware = require('../middlewares/authMiddleware')

// FIX: multer com validação de tipo e tamanho (máx 10MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.fieldname === 'image' && file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else if (file.fieldname === 'attachment') {
      cb(null, true)
    } else {
      cb(new Error('Apenas imagens são permitidas.'))
    }
  },
})

const router = express.Router()

// posts
router.get('/feed',           authMiddleware,                        getFeed)
router.post('/',              authMiddleware, upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'attachment', maxCount: 1 },
]), createPost)
router.get('/user/:username', authMiddleware,                        getUserPosts)
router.post('/:id/like',      authMiddleware,                        likePost)
router.delete('/:id/like',    authMiddleware,                        unlikePost)
router.delete('/:id',         authMiddleware,                        deletePost)

// FIX: rotas de comentários agora registradas aqui (estavam em arquivo morto)
router.get('/:id/comments',                   authMiddleware,                        getComments)
router.post('/:id/comments',                  authMiddleware, upload.single('image'), createComment)
router.delete('/:postId/comments/:commentId', authMiddleware,                        deleteComment)

// FIX: tratamento de erro do multer (tipo/tamanho inválido)
router.use((err, _req, res, _next) => {
  if (err.message === 'Apenas imagens são permitidas.') {
    return res.status(400).json({ error: err.message })
  }
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'Arquivo muito grande. Máximo: 10MB.' })
  }
  res.status(500).json({ error: 'Erro interno.' })
})

module.exports = router

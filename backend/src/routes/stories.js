const express = require('express')
const multer = require('multer')
const authMiddleware = require('../middlewares/authMiddleware')
const { createStory, listStories } = require('../controllers/storyController')

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('Apenas imagens sao permitidas para stories.'))
    }
  },
})

const router = express.Router()

router.get('/', authMiddleware, listStories)
router.post('/', authMiddleware, upload.single('media'), createStory)

router.use((err, _req, res, _next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'Arquivo muito grande. Maximo: 10MB.' })
  }
  return res.status(400).json({ error: err.message || 'Erro no upload do story.' })
})

module.exports = router

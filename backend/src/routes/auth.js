const express = require('express')
const multer = require('multer')
const { register, login, me, updateMe } = require('../controllers/authController')
const authMiddleware = require('../middlewares/authMiddleware')

// FIX: multer com validação de tipo e tamanho para avatares
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('Apenas imagens são permitidas.'))
    }
  },
})

const router = express.Router()

router.post('/register', upload.single('avatar'), register)
router.post('/login', login)
router.get('/me', authMiddleware, me)
router.put('/me', authMiddleware, upload.single('avatar'), updateMe)

module.exports = router

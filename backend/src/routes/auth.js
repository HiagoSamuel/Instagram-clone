const express = require('express')
const multer = require('multer')
const { register, login, me, updateMe } = require('../controllers/authController')
const authMiddleware = require('../middlewares/authMiddleware')

const router = express.Router()
const upload = multer()

router.post('/register', upload.single('avatar'), register)
router.post('/login', login)
router.get('/me', authMiddleware, me)
router.put('/me', authMiddleware, upload.single('avatar'), updateMe)

module.exports = router

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../Authentication/token');
const { register, login } = require('../Authentication/auth');
const { uploadImage, getImage, getHistory } = require('../controllers/controllers');
const upload = require('../storage/multer');

router.post('/register', register);
router.post('/login', login);
router.post('/upload', verifyToken, upload.single('gambar'), uploadImage);
router.get('/images', verifyToken, getImage);
router.get('/history', verifyToken, getHistory);

module.exports = router;
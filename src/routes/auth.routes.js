const express = require('express');
const authController = require('../controllers/auth.controller');
const { verificarJWT } = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/login', authController.login);
router.get('/me', verificarJWT, authController.me);
router.post('/logout', verificarJWT, authController.logout);

module.exports = router;

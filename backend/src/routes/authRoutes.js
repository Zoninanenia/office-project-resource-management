const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/login', authController.login);
router.post('/register', authController.register);

router.post('/forgot-password', authController.generateOtp);
router.post('/verify-otp', authController.verifyOtp);

module.exports = router;
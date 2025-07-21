const express = require('express');
const { register, login, forgotPassword, verifyOTP, resetPassword } = require('../controllers/user.controller');
const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOTP);
router.post('/reset-password/:userId', resetPassword);

module.exports = router;

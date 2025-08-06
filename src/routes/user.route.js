const express = require('express');
const { register, login, forgotPassword, verifyOTP, resetPassword, verifyEmailToken } = require('../controllers/user.controller');
const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOTP);
router.post('/reset-password/:userId', resetPassword);
router.post('/verify-email/:token', verifyEmailToken);

module.exports = router;

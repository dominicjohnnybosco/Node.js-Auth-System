const express = require('express');
const { register, login, forgotPassword, verifyOTP, resetPassword, verifyEmailToken, initiateGoogleAuth, handleGoogleCallback, unlinkGoogle, setPasswordForGoogleUser, uploadProfilePicture } = require('../controllers/user.controller');
const { isAuthenticated } = require('../middlewares/isAuth');
const { upload } = require('../config/cloudinary');
const router = express.Router();

// Regular Authentication Routes
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOTP);
router.post('/reset-password/:userId', resetPassword);
router.post('/verify-email/:token', verifyEmailToken);

// Server-Side Google OAuth Routes
router.get('/google', initiateGoogleAuth);
router.get('/google/callback', handleGoogleCallback);
router.delete('/unlink-google/:userId', unlinkGoogle);
router.post('/set-password/:userId', setPasswordForGoogleUser);

// Profile Management Routes (Protected)
router.post('/profile/picture', isAuthenticated, upload.single('profilePicture'), uploadProfilePicture );

module.exports = router;

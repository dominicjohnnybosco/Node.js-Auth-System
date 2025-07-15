const express = require('express');
const { register, login, makeAdmin, removeAdmin } = require('../controllers/user.controller');
const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.patch('/make-admin/:userId', makeAdmin);
router.patch('/remove-admin/:userId', removeAdmin);

module.exports = router;
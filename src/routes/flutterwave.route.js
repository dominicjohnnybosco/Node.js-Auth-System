const express = require('express');
const router = express.Router();
const { flutterwaveWebhook } = require('../controllers/flutterwave.controller');


// Flutterwave webhook route
router.post('/flutterwave', flutterwaveWebhook);

module.exports = router;
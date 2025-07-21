const express = require('express');
const { rentCar } = require('../controllers/rental.controller');
const { isAuthenticated } = require('../middlewares/isAuth');
const router = express.Router();

router.post('/rent-car/:carId', isAuthenticated, rentCar);

module.exports = router;
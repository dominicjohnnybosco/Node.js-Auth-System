const express = require('express');
const { rentCar, payAndRentCarWithFlutterwave } = require('../controllers/rental.controller');
const { isAuthenticated } = require('../middlewares/isAuth');
const router = express.Router();

// manual rent car route
router.post('/rent-car/:carId', isAuthenticated, rentCar);

// rent car with flutterwave route
router.post('/rent-car-with-flutterwave/:carId', isAuthenticated, payAndRentCarWithFlutterwave);


module.exports = router;
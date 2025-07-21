const express = require('express');
const {getAllCars, addCar, editCar, deleteCar, searchCar} = require('../controllers/admin.controller');
const { isAuthenticated } = require('../middlewares/isAuth');
const { rentCar } = require('../controllers/rental.controller');
const router = express.Router();

router.get('/get-all-cars', getAllCars);
router.get('/search-cars', searchCar);
router.post('/add-car', isAuthenticated, addCar);
router.put('/edit-car/:carId', isAuthenticated, editCar);
router.delete('/delete-car/:carId', isAuthenticated, deleteCar);
router.post('/rent-car/:carId', isAuthenticated, rentCar);

module.exports = router;
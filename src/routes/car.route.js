const express = require('express');
const {getAllCars, addCar, editCar, deleteCar, searchCar} = require('../controllers/admin.controller');
const router = express.Router();

router.get('/get-all-cars', getAllCars);
router.get('/search-cars', searchCar);
router.post('/add-car', addCar);
router.put('/edit-car/:carId', editCar);
router.delete('/delete-car/:carId', deleteCar);

module.exports = router;
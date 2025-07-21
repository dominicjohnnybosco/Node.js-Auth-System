const express = require('express');
const { register, login, makeAdmin, removeAdmin, makeSuperAdmin, removeSuperAdmin, deleteUserAccount, approveRentalCar, cancelRentalCar } = require('../controllers/admin.controller');
const { isAuthenticated } = require('../middlewares/isAuth');
const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.patch('/make-admin/:userId', makeAdmin);
router.patch('/remove-admin/:userId', removeAdmin);
router.patch('/make-super-admin/:adminId', makeSuperAdmin);
router.patch('/remove-super-admin/:adminId', removeSuperAdmin);
router.delete('/delete-user-account/:userId', deleteUserAccount);
router.post('/approve-rental-request/:rentedCarId',isAuthenticated, approveRentalCar);
router.post('/cancle-rental-request/:rentedCarId',isAuthenticated, cancelRentalCar);

module.exports = router;
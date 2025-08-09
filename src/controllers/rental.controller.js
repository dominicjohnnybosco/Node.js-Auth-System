const Rental = require('../models/rental.schema');
const Car = require('../models/car.schema');
const User = require('../models/user.schema');
const Transaction = require('../models/transaction.schema');
const flwApi = require('../config/flutterwave.js');

// Where ever you see flw in this code is means flatterware

// Function to rent and make payment with flutterwave
const payAndRentCarWithFlutterwave = async (req, res) => {
    const { carId } = req.params;
    const userId = req.user.id;
    const { startDate, endDate } = req.body;

    try {
        // Find Car by Id
        const car = await Car.findById(carId);

        // Check if the car exists
        if (!car) {
            return res.status(404).json({message: 'Car Not Found'});
        }

        // Check if the car is available or rented 
        if (!car.isAvailable) {
            return res.status(400).json({message: 'Car is not available now'});
        }

        // Verify the user 
        const user = await User.findById(userId);

        // Check if user exist
        if (!user) {
            return res.status(404).json({message: 'User Not Found'});
        }

        // Calculate rental days and total price
        const start = new Date(startDate);
        const end = new Date(endDate);

        // Check for invalid date 
        if (isNaN(start) || isNaN(end) || end <= start) {
            return res.status(400).json({ message: 'Invalid rental dates' });
        }

        // RENTAL_DAY_IN_MS: constant for converting milliseconds to days
        const msInDay = 1000 * 60 * 60 * 24;
        const rentalDays = Math.ceil((end - start) / msInDay);
        
        // calculation for the amount the user is going to pay for the period of days they are renting the car
        const dailyRate = 50000; // 50k per day
        const totalPrice = rentalDays * dailyRate;

        // Create Pending Transaction
        const transaction = await Transaction.create({
            senderId: userId,
            carId: car._id,
            amount: totalPrice,
            trx_status: 'pending',
            startDate,
            endDate,
        });

        // Initiate Payment with Flutterwave
        const paymentData = {
            tx_ref: `car_rental_${transaction._id}_${Date.now()}`,
            amount: totalPrice,
            currency: 'NGN',
            redirect_url:
                process.env.FLW_REDIRECT_URL || 'http://localhost:2002/api/payment/flutterwave/callback',
                customer: {
                    email: user.email,
                    name: user.name,
                },
                customizations: {
                    title: 'Dubem Car Rental Payment',
                    description: `Payment for renting ${car.make} ${car.model}`,
                },
                meta: {
                    transactionId: transaction._id.toString(),
                    carId: car._id.toString(),
                    userId: user._id.toString(),
                }
        };

        // Check if Payment is successful or Not
        const flwRes = await flwApi.post('/payments', paymentData);
        if (flwRes.data.status !== 'success') {
            return res.status(500).json({message: 'Failed to Initiate Payment'});
        }

        // Save tx_ref to transaction
        transaction.tx_ref = paymentData.tx_ref;
        await transaction.save();
        
        // Return payment link to frontend
        return res.status(200).json({
            message: 'Payment Initiated Successfully',
            paymentLink: flwRes.data.data.link,
            transactionId: transaction._id,
        });

    } catch (error) {
        console.log('Error Initiating Payment:', error);
        return res.status(500).json({message: 'Internal Server Error'});
    }
}

// Function to Rent Car Manually
const rentCar = async (req, res) => {
    const { carId } = req.params;
    const userId = req.user.id;
    const { startDate, endDate } = req.body;

    try {
        // Find the car
        const car = await Car.findById(carId);
        if (!car) {
            return res.status(404).json({ message: 'Car not found' });
        }
        // Check if car is available
        if (!car.isAvailable) {
            return res.status(400).json({ message: 'Car is not available at this moment' });
        }

        // Check if the car is already rented by someone else
        const activeRental = await Rental.findOne({ carId, isRented: true });
        if (activeRental) {
            return res.status(400).json({ message: 'Car is already rented' });
        }

        // Calculate rental days and total price
        const start = new Date(startDate);
        const end = new Date(endDate);

        // Check for invalid date 
        if (isNaN(start) || isNaN(end) || end <= start) {
            return res.status(400).json({ message: 'Invalid rental dates' });
        }

        // RENTAL_DAY_IN_MS: constant for converting milliseconds to days
        const msInDay = 1000 * 60 * 60 * 24;
        const rentalDays = Math.ceil((end - start) / msInDay);
        
        // calculation for the amount the user is going to pay for the period of days they are renting the car
        const dailyRate = 50000; // 50k per day
        const totalPrice = rentalDays * dailyRate;

        // Create rental record
        const newRental = await Rental.create({
            carId,
            rentedBy: userId,
            startDate: start,
            endDate: end,
            isRented: true,
            totalPrice,
            carStatus: 'pending'
        });

        // Update car availability
        car.isAvailable = false;
        await car.save();

        return res.status(201).json({
            message: `Car rented successfully for ${rentalDays} days. Total charge: ₦${totalPrice}`,
            rental: newRental
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error'});
    }
};

module.exports = { rentCar, payAndRentCarWithFlutterwave };

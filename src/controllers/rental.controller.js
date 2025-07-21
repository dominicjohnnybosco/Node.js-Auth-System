const Rental = require('../models/rental.schema');
const Car = require('../models/car.schema');

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
        return res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = { rentCar };

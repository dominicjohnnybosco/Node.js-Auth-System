const Car = require('../models/car.schema');

const rentCar = async (req, res) => {
    const { carId } = req.params;
    const userId = req.user.id;
    const { startDate, endDate } = req.body;

    try {
        // find the car by Id
        const car = await Car.findById( carId );
        if(!car) {
            return res.status(404).json({message: 'Car Not Found'});
        }

        // check if the car is already rented by someone else
        if(car.isRented) {
            return res.status(400).json({message: 'Car is already rented'});
        }

        // check if the car is available
        if(car.isAvailable == false) {
            return res.status(400).json({message: 'Car is not available at this moment'});
        }

        // update the car's rental status
        car.isRented = true;
        car.rentedBy = userId;
        car.isAvailable = false;
        car.startDate = startDate;
        car.endDate = endDate;

        // calculation for the amount the user is going to pay for the period of days they are renting the car
        const millisecondsInDay = 1000 * 60 * 60 * 24;
        const rentalDays = Math.ceil((endDate - startDate) / millisecondsInDay);

        // amount to charge for each day the user is with the car
        const dailyRate = 50000; // 50k per day
        const totalPrice = rentalDays * dailyRate;

        car.totalPrice = totalPrice;
        car.carStatus = "pending";
        await car.save();
        return res.status(200).json({message: `Car Rented Successfully for ${rentalDays} Days and charged ${totalPrice}`, car});
    } catch (error) {
        console.log(error);
        return res.status(500).json({message: 'Internal Server Error'});
    }
}

module.exports = { rentCar };
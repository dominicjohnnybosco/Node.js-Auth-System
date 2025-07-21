const Car = require('../models/car.schema');

const rentCar = async (req, res) => {
    const { carId } = req.params;
    const userId = req.user.id;

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
        await car.save();
        return res.status(200).json({message: 'Car Rented Successfully', car});
    } catch (error) {
        console.log(error);
        return res.status(500).json({message: 'Internal Server Error'});
    }
}

module.exports = { rentCar };
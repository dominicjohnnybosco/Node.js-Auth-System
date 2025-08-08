const Transaction = require('../models/transaction.schema');
const Car = require('../models/car.schema');
const Rental = require('../models/rental.schema');

// Flutterwave webhook handler
const flutterwaveWebhook = async (req, res) => {
    try {
        // Flutterwave sends events as POST JSON
        const event = req.body;

        // Validate event 
        if (!event || !event.data ||!event.data.tx_ref) {
            return res.status(400).json({ message: 'Invalid Webhook Data'});
        }

        const txRef = event.data.tx_ref;
        // Find Transaction by transaction_ref (tx_ref)
        const transaction = await Transaction.findOne({ tx_ref: txRef});
        if (!transaction) {
            return res.status(404).json({message: 'Transaction Not Found'});
        }

        // Only Process if not already successful
        if (transaction.tx_status === 'successful') {
            return res.status(200).json({ message: 'Already Processed'});
        }

        // Check Payment Status
        if (event.data.tx_status === 'successful' && event.data.amount >= transaction.amount) {
            transaction.tx_status = 'successful';
            await transaction.save();

            // Update car availability and Rental status
            const car = await Car.findById(transaction.carId);
            const rental = await Rental.findById(transaction.carId);
            if (car || rental) {
                // Car availability status
                car.isAvailable = false;
                await car.save();
                
                // Rental status
                rental.isRented = true;
                rental.rentedBy = transaction.sendId;
                rental.startDate = transaction.startDate;
                rental.endDate = transaction.endDate;
                rental.totalPrice = transaction.amount;
                rental.carStatus = 'confirmed';
                await rental.save();
            }
        return res.status(200).json({ message: 'Payment Processed And Car Rented Successfully'});

        } else {
            transaction.tx_status = 'failed';
            await transaction.save();
            return res.status(200).json({ message: 'Payment Failed Or Incomplete'});
        }
    } catch (error) {
        console.log('Flutterwave Webhook Error:', error);
        return res.status(500).json({ message: 'Internal Server Error'});
    }
}

module.exports = flutterwaveWebhook;
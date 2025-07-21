const mongoose = require('mongoose');

const rentalSchema = new mongoose.Schema({
    carId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Car',
        required: true,
    },

    rentedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        trim: true
    }, 

    startDate: {
        type: Date,
        required: true
    },

    endDate: {
        type: Date,
        required: true
    },

    totalPrice: {
        type: Number,
        required: true
    },

    carStatus: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled'],
        default: 'pending'
    },

    isRented: {
        type: Boolean,
        default: false
    },
}, {
    timestamps: true,
    versionKey: false
});

const Rental = mongoose.model('Rental', rentalSchema);

module.exports = Rental;
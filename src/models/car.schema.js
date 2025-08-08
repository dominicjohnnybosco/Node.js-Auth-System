const mongoose = require('mongoose');

const carSchema = new mongoose.Schema({
    make: {
        type: String,
        required: [true, 'Car Make is required'],
        trim: true,
    },

    model: {
        type: String,
        required: [true, 'Car Model is required'],
        trim: true
    },

    year: {
        type: Number,
        required: [true, 'Car Year is required'],
        min: 1886
    },

    price: {
        type: Number,
        required: [true, 'Car Price is required'],
        min: 0
    },

    isAvailable: {
        type: Boolean,
        default: true
    },

    description: {
        type: String,
        trim: true
    },

    color: {
        type: String,
        trim: true
    },

    brand: {
        type: String,
        trim: true
    }
}, {
    timestamps: true,
    versionKey: false
});

const Car = mongoose.model('Car', carSchema);

module.exports = Car;
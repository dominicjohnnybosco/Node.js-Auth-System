const mongoose = require('mongoose');

const carSchema = new mongoose.Schema({
    make: {
        type: String,
        required: true,
        trim: true,
    },

    model: {
        type: String,
        required: true,
        trim: true
    },

    year: {
        type: Number,
        required: true,
        min: 1886
    },

    price: {
        type: Number,
        required: true,
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
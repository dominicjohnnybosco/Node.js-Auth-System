const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },

    email: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },

    password: {
        type: String,
        required: true,
        minlength: 6
    },

    isAdmin: {
        type: Boolean,
        default: false,
    },

    token: {
        type: String,
    },

    otp: {
        type: String
    },

    otpVerified: {
        type: Boolean,
        default: false
    }
},
{
    timestamps: true,
    versionKey: false
});

const User = mongoose.model('User', userSchema);

module.exports = User;
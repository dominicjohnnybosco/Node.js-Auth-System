const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },

    username: {
        type: String,
        required: [true, 'Username is required'],
        trim: true
    },

    email: {
        type: String,
        unique: true,
        required: [true, 'Email is required'],
        trim: true
    },
    
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: 6
    },

    isSuper: {
        type: Boolean,
        default: false
    },

    token: {
        type: String
    }
},{
    timestamps: true,
    versionKey: false
});

const Admin = mongoose.model('Admin', adminSchema);

module.exports = Admin;
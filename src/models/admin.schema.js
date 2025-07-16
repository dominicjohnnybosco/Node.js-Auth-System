const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },

    username: {
        type: String,
        required: true,
        trim: true
    },

    email: {
        type: String,
        unique: true,
        required: true,
        trim: true
    },
    
    password: {
        type: String,
        required: true,
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
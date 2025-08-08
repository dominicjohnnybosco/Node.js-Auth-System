const mongoose = require('mongoose')

const transactionSchema = new mongoose.Schema({
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }
},{
    timestamps: true,
    versionKey: true
})

const Transaction = mongoose.Model('Transaction', transactionSchema);

module.exports = Transaction;
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL,)
        console.log('DB Connected Successfully');
    } catch (error) {
        console.log('Internal Server Error', error);
    }
}

module.exports = connectDB;
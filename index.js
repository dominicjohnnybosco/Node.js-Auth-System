const express = require('express');
const morgan = require('morgan');
const dotenv = require('dotenv');
const connectDB = require('./src/config/db');
const userRouter = require('./src/routes/user.route');
const adminRouter = require('./src/routes/admin.route');
const carRouter = require('./src/routes/car.route');
const rentalRouter = require('./src/routes/rental.route');
const flutterwaveRouter = require('./src/routes/flutterwave.route');
const cors = require('cors');
// const flutterwaveRouter = require('./src/routes/flutterwave.route')


dotenv.config();
const app = express();
 
app.use(express.json());
app.use(morgan('dev'));

//imported my frontend cors
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));

const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Welcome, Happy to use Dubem Car Rental Services API');
});

app.use('/api/users', userRouter);
app.use('/api/admin', adminRouter);
app.use('/api/admin/cars', carRouter);
app.use('/api/rental', rentalRouter);
app.use('/api/webhook', flutterwaveRouter);

app.listen(port, () => {
    connectDB();
    console.log(`Server is running on http://localhost:${port}`);
});
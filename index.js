const express = require('express');
const morgan = require('morgan');
const dotenv = require('dotenv');
const connectDB = require('./src/config/db');
const userRouter = require('./src/routes/user.route');
const adminRouter = require('./src/routes/admin.route');
const carRouter = require('./src/routes/car.route');
const rentalRouter = require('./src/routes/rental.route');


dotenv.config();
const app = express();
 
app.use(express.json());
app.use(morgan('dev'));

const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Welcome, Happy to use Dubem Car Rental Services API');
});

app.use('/api/users', userRouter);
app.use('/api/admin', adminRouter);
app.use('/api/admin/cars', carRouter);
app.use('/api/rental', rentalRouter);

app.listen(port, () => {
    connectDB();
    console.log(`Server is running on http://localhost:${port}`);
});
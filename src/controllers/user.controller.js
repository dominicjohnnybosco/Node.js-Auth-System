const User = require('../models/user.schema');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const saltRounds = 10; // The number of times our password should be hashed. I can change the value from 10 to something higher for more security


const register = async(req, res) => {
    const { name, email, password } = req.body;
    try {
        // To make sure the User's password is up to 6 character before hashing it
        if(password.length < 6) {
            return res.status(400).json({message: "Password must be at least 6 characters long"});
        }

        //validate user input
        if(!name || !email || !password){
            return res.status(400).json({message:'All Input Fields Are Required'});
        };

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if(existingUser) {
            return res.status(400).json({message: 'Email Already Exists'});
        }

        // Hash the password 
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create the Payload to store the user's details
        const payload = {
            email: email
        };

        // Create jwt for new user
        const token = await jwt.sign( payload , process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRATION});

        // create new user
        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            token
        });

        await newUser.save();

        return res.status(201).json({message: 'Account Created Successfully', newUser});

    } catch (error) {
        console.log('Error Creating User', error);
        return res.status(500).json({message: 'Internal Server Error'});
    }
}

const login = async (req, res) => {
    const { email, password } = req.body;

    //validate input 
    if(!email || !password) {
        return res.status(400).json({message: 'All input fields are required'});
    }
    try {
        //check if user exists
        const user = await User.findOne({ email });
        if(!user){
            return res.status(404).json({message: 'User not found'});
        }

        //compare hasded password and user input password
        const isPasswordValid = await bcrypt.compare(password, user.password);

        //check password
        if(!isPasswordValid){
            return res.status(401).json({message: 'Invalid Credentials'});
        }

        //creating the payload to store the user's details 
        const payload = {
            id: user._id,
            email: user.email
        };

        //giving jwt to the user
        const token = await jwt.sign( payload , process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRATION});

        return res.status(200).json({message: 'User Logged In Successfully', token});

    } catch (error) {
        console.log(error);
        return res.status(500).json({message: 'Internal Server Error', error});
    }
}

// function to send user 
const forgotPassword = async (req, res) => {
    const { email } = req.body;
    // validate input
    if (!email) {
        return res.status(400).json({message: 'Email is Required'});
    }
    try {
        // Check if email exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({message: 'User Not Found'})
        }

        // Generate A 6 Digit Otp with math.random()
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // save Otp in DB
        user.otp = otp;
        await user.save();

        return res.status(200).json({message: `Password reset OTP sent to ${ email }` });
    } catch (error) {
        console.log(error);
        return res.status(500).json({message: 'Internal Server Error'});
    }
}

// function to verify the OTP
const verifyOTP = async (req, res) => {
    const { otp } = req.body;
    try {
        const user = await User.findOne({ otp: otp});
        // Check if the otp provided is valid
        if (!user) {
            return res.status(400).json({message: 'Invalid OTP'});
        }
        user.otpVerified = true;
        // Clear OTP after verification
        user.otp = null;
        await user.save();
        return res.status(200).json({message: 'OTP Verified Successfully'});
    } catch (error) {
        console.log(error);
        return res.status(500).json({message: 'Internal Server Error'});
    }
}

// function to reset user password
const resetPassword = async (req, res) => {
    const { newPassword, confirmPassword } = req.body;
    const { userId } = req.params;

    // Validate User Input
    if (!userId || !newPassword) {
        return res.status(400).json({message: 'User ID and New Password are Required'});
    }

    // Check if new password is same as confirm password
    if (newPassword !== confirmPassword) {
        return res.status(400).json({message: 'Password does not match'});
    }
    try {
        const user = await User.findById({ _id: userId });
        if (!user) {
            return res.status(404).json({message: 'User Not Found'});
        }
        // Check if the otp is verified
        if (user.otpVerified !== true) {
            return res.status(403).json({message: 'OTP not verified, Please Verify Your OTP'});
        }

        // Hash the new Password
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
        user.password = hashedPassword;
        // Reset OTP Verification status
        user.otpVerified = false; 
        await user.save();

        return res.status(200).json({message: 'Password Reset Successfully'});
    } catch (error) {
        console.log(error);
        return res.status(500).json({message: 'Internal Server Error'});
    }
}


module.exports = { 
    register, 
    login,
    forgotPassword,
    verifyOTP, 
    resetPassword
};

// learn about 
// markdown language
// video-streaming with Nodejs
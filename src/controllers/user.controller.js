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


module.exports = { 
    register, 
    login
};

// learn about 
// markdown language
// video-streaming with Nodejs
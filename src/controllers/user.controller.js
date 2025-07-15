const User = require('../models/user.schema');
const bcrypt = require('bcryptjs');
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

        // create new user
        const newUser = new User({
            name,
            email,
            password: hashedPassword
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

        return res.status(200).json({message: 'User Logged In Successfully', user});
    } catch (error) {
        console.log(error);
        return res.status(500).json({message: 'Internal Server Error', error});
    }
}

// function to make a user an Admin
const makeAdmin = async (req, res) => {
    const { userId } = req.params;
    try {
        // find user using id
        const user = await User.findById( userId );

        // check if user exists in the Database
        if(!user) {
            return res.status(404).json({message: "User not found"});
        }

        // make the user admin if found
        user.isAdmin = true;
        await user.save();

        return res.status(200).json({message: "User is made an admin successfully", user});

    } catch (error) {
        console.log(error);
        return res.status(500).json({message: "Internal Server Error", error});
    }
}

// function to remove the admin priviledge given to a user
const removeAdmin = async (req, res) => {
    const { userId } = req.params;
    try {
        const admin = await User.findById( userId );

        if(admin.isAdmin == false) {
            return res.status(200).json({message: "This User is not an Admin No Action is needed"});
        }else{
            admin.isAdmin = false;
            await admin.save();
            return res.status(200).json({message: "This User is no longer an Admin"});
        }
        
    } catch (error) {
        console.log(error);
        return res.status(500).json({message: "Internal Server Error", error});
    }
}

module.exports = { 
    register, 
    login, 
    makeAdmin,
    removeAdmin
};
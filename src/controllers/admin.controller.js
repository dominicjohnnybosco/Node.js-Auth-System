const Admin = require('../models/admin.schema');
const User = require('../models/user.schema');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const saltRounds = 10;

const register = async (req, res) => {
    const { name, username, email, password } = req.body;
    
    try {
        // Check Password Input Length is up to 6
        if(password.length < 6) {
            return res.status(400).json({message: 'Password Must me up to 6 character'});
        }

       // Validate Input field
       if(!name || !username ||!email ||!password) {
            return res.status(400).json({message: 'All Input Fields Are Required'});
       } 

       // Check if the admin already exist
       const adminExist = await Admin.findOne({ email });

       if(adminExist) {
            return res.status(400).json({message: 'This Admin already Exists'});
       }

       // Hash the Admin Password before saving
       const hashedPassword = await bcrypt.hash(password, saltRounds);

       // Create the Payload to Hold the Admin Details
       const payload = {
            email: email
       };

       // Create the jwt for the new admin
       const token = await jwt.sign(payload, process.env.JWT_SECRET, {expiresIn: process.env.JWT_EXPIRATION});

       const newAdmin = new Admin({
            name,
            username,
            email,
            password: hashedPassword,
            token
       });

       await newAdmin.save();

       return res.status(201).json({message: 'Admin Account Created Successfully', newAdmin});
        
    } catch (error) {
        console.log(error);
        return res.status(500).json({message: 'Internal Server Error'});
    }
}

const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Validate the Input Field
        if(!email || !password) {
            return res.status(400).json({message: 'All Input Fields Are Required'});
        }

        // check if the Admin already exists
        const admin = await Admin.findOne({ email });
        if(!admin) {
            return res.status(400).json({message: 'This Admin Does Not Exists'});
        }

        // Compare the password and the hashed password
        const isPasswordValid = await bcrypt.compare(password, admin.password);

        // Check if the password is valid 
        if(!isPasswordValid) {
            return res.status(400).json({message: 'Invalid Credentials'});
        }

        // Create the Payload to hold Admin Details
        const payload = {
            id: admin.id,
            name: admin.name,
            username: admin.username,
            email: admin.email
        };

        // Create the jwt for the admin
        const token = await jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRATION });

        return res.status(200).json({message: 'Admin Logged In Successfully', token});

    } catch (error) {
        console.log(error);
        return res.status(500).json({message: 'Internal Server Error'});
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

// function to delete a user 
const deleteUserAccount = async (req, res) => {
    const { userId } = req.params;
    try {
        const deleteUserAccount = await User.findByIdAndDelete( userId );
        if(!deleteUserAccount) {
            return res.status(400).json({message: 'This User does not exist'});
        }else{
            await deleteUserAccount.delete;
            return res.status(200).json({message: 'User Account Deleted Successfully'});
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({message: 'Internal Server Error'});
    }
    
}

// function to make an Admin SuperAdmin
const makeSuperAdmin = async (req, res) => {
    const { adminId } = req.params;
    try {
        // Check if the admin exists
        const admin = await Admin.findById( adminId );
        if(!admin) {
            return res.status(400).json({message: 'This Admin does not exist'});
        }
        if(admin.isSuper == true) {
            return res.status(200).json({message: 'This Admin is a SuperAdmin No Action is needed'});
        }
        if(admin.isSuper == false) {
            admin.isSuper = true;
            await admin.save();
            return res.status(200).json({message: 'Successfully Granted Super Admin Priviledge'});
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({message: 'Internal Server Error'});
    }
}

// function to remove super admin priviledge from a user
const removeSuperAdmin = async (req, res) => {
    const { adminId } = req.params;
    try {
        const superAdmin = await Admin.findById( adminId );
        // Check if is an Admin
        if(!superAdmin) {
            return res.status(400).json({message: 'This User is not an Admin'});
        }
        if(superAdmin.isSuper == false) {
            return res.status(200).json({message: 'This Admin is not a super Admin No Actions is needed'})
        }
        // Check if is a Super admin
        if(superAdmin) {
            superAdmin.isSuper = false;
            await superAdmin.save();
            return res.status(200).json({message: 'Successfully Removed Super Admin Priviledge'});
        }

    } catch (error) {
        console.log(error);
        return res.status(500).json({message: 'Internal Server Error'});
    }
}

module.exports = {
    register,
    login, 
    makeAdmin,
    removeAdmin,
    makeSuperAdmin,
    removeSuperAdmin,
    deleteUserAccount,
}
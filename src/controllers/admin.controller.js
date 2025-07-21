const Admin = require('../models/admin.schema');
const User = require('../models/user.schema');
const Car = require('../models/car.schema');
const Rent = require('../models/rental.schema');
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

// function for admin to add a car
const addCar = async (req, res) => {
    const { make, model, year, price, description, color, brand } = req.body;
    const adminId = req.user.id;
    
    try {
        // Validate input fields
        if (!make || !model || !year ||!price ||!description || !color ||!brand) {
            return res.status(400).json({message: 'All input fields are required'});
        }

        // Check if this Admin can perform this function
        const admin = await Admin.findById(adminId);
        if (admin.isSuper !== true) {
            return res.status(403).json({message: 'Only Super Admin Can Perform This Action'});
        }

        const newCar = new Car({
            make,
            model, 
            year,
            price,
            description,
            color,
            brand
        });

        await newCar.save();
        return res.status(201).json({message: 'New Car Added Successfully', newCar});

    } catch (error) {
       console.log(error);
       return res.status(500).json({message: 'Internal Server Error'}); 
    }
}

// function to Get All Cars
const getAllCars = async (req, res) => {
    try {
        const cars = await Car.find();
        if(cars.length <= 0) {
            return res.status(200).json({message: 'There Are No Cars Available Now'});
        }
        return res.status(200).json({message: 'All Available Cars',cars});
    } catch (error) {
        console.log(error);
        return res.status(500).json({message: 'Internal Server Error'});
    }
}

// function for admin to edit a car
const editCar = async (req, res) => {
    const { carId } = req.params;
    const adminId = req.user.id;
    const { make, model, year, price, description, color, brand } = req.body;
    try {
        // Check if admin is priviledge to perform this action
        const admin = await Admin.findById(adminId);
        if(admin.isSuper !== true) {
            return res.status(403).json({message: 'Only Super Admin Can Perform This Action'});
        }

        const car = await Car.findById(carId);
        if(!car) {
            return res.status(400).json({message: 'Car Not Found'});
        }

        // Update Car Details
        car.make = make || car.make;
        car.model = model || car.model;
        car.year = year || car.year; 
        car.price = price || car.price;
        car.description = description || car.description;
        car.color = color || car.color; 
        car.brand = brand || car.brand;
        await car.save();
        return res.status(200).json({message: 'Car Updated Successfully', car});
    } catch (error) {
        console.log(error);
        return res.status(500).json({message: 'Internal Server Error'});
    }
}

// function for admin to delete a car
const deleteCar = async (req, res) => {
    const { carId } = req.params;
    const adminId = req.user.id;
    try {
        // Check if admin is priviledge to perform this action
        const admin = await Admin.findById(adminId);
        if (admin.isSuper !== true) {
            return res.status(403).json({message: 'Only Super Admin Can Perform This Action'});
        }
        const car = await Car.findByIdAndDelete( carId );
        if(!car) {
            return res.status(400).json({message: 'Car Not Found'});
        }else {
            await car.delete;
            return res.status(200).json({message: 'Car Deleted Sucessfully'});
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({message: 'Internal Server Error'})
    }
}

// function to search for cars by make
const searchCar = async (req, res) => {
    const { make } = req.query;
    try{
        const car = await Car.find({ 
            make:{ $regex: new RegExp(make, 'i') }
        });
        if(!car) {
            return res.status(400).json({message: 'No Car Found with this make'});
        }
        return res.status(200).json({message: 'Successfully Retrieved Car', car});
    } catch (error) {
        console.log(error);
        return res.status(500).json({message: 'Internal Server Error'});
    }
}

// function for admin to approved rented car 
const approveRentalCar = async (req, res) => {
    const { rentedCarId } = req.params;
    const adminId = req.user.id;

    try {
        // Check if admin is priviledge to perform this action
        const admin = await Admin.findById(adminId);
        if (admin.isSuper !== true) {
            return res.status(403).json({message: 'Only Super Admin Can Perform This Action'});
        }

        const rentedCar = await Rent.findOne( {rentedCarId} );
        // Check if there is a pending rental request to approve
        if (rentedCar) {
            rentedCar.carStatus = 'confirmed';
            await rentedCar.save();
            return res.status(200).json({message: 'Car successfully Approved'});
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
    addCar,
    deleteCar,
    getAllCars,
    editCar,
    searchCar,
    approveRentalCar
}
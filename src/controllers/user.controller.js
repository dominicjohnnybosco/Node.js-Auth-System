const User = require('../models/user.schema');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { sendTemplateEmail } = require('../config/email');
const emailTemplates = require('../templates/emailTemplates');
const { google } = require('googleapis');
const { oauth2Client, OAuth2Client } = require('google-auth-library');
const { deleteImage } = require('../config/cloudinary');


// Initialize Google OAuth client
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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

        // Generate the Email Token 
        const emailToken = uuidv4();
        // create new user
        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            token,
            emailToken: emailToken
        });

        await newUser.save();

        // Send Welcome Email with Email token
        const welcomeTemplate = emailTemplates.welcomeTemplate(name, emailToken);
        await sendTemplateEmail(
            email,
            welcomeTemplate.subject,
            welcomeTemplate.html,
            welcomeTemplate.text
        );

        // await sendEmail(
        //     email, 
        //     "Welcome to our Dubem Car Rental Service", 
        //     `Hello ${name}, \n\nThank you for signing up! Your account has been created successfully. Please Verify Your Email with this token ${emailToken}\n\nBest regards, \nYour Service Team`
        // ); 

        return res.status(201).json({message: 'Account Created Successfully', newUser});

    } catch (error) {
        console.log('Error Creating User', error);
        return res.status(500).json({message: 'Internal Server Error'});
    }
}

const verifyEmailToken = async (req, res) => {
    const  token  = req.params.token;
    if(!token) {
        return res.status(400).json({message: 'No Token'});
    }
    try {
        const user = await User.findOne({ emailToken: token });
        if(!user) {
            return res.status(404).json({message: 'No User Found With This Token'});
        }
        user.isVerified = true;
        user.emailToken = null
        await user.save();

        // Send email verification success notification
        const successTemplate = emailTemplates.emailVerificationSuccessTemplate(user.name);
        await sendTemplateEmail(
            user.email,
            successTemplate.subject,
            successTemplate.html,
            successTemplate.text
        );

        return res.status(200).json({message: 'User Email Verified Successfully', user});
    } catch (error) {
        console.log('Error verifying user email', error);
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

        //check if the user email is verified 
        if(!user.isVerified) {
            return res.status(401).json({message: 'Please Verify Your Email'});
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
        
        // Send Login Notification 
        const loginTime = new Date().toLocaleString();
        const loginTemplate = emailTemplates.loginNotificationTemplate(user.name, loginTime);
        await sendTemplateEmail(
            email,
            loginTemplate.subject,
            loginTemplate.html,
            loginTemplate.text
        );

        // await sendEmail(
        //     email, 
        //     "Login Notification", 
        //     `Hello ${user.name},\n \nYou have successfully logged into your account`
        // );
        
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

        // Send OTP email with template
        const otpTemplate = emailTemplates.forgotPasswordTemplate(user.name, otp);
        await sendTemplateEmail(
            email,
            otpTemplate.subject,
            otpTemplate.html,
            otpTemplate.text
        );

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

        // Send password reset confirmation email
        const confirmationTemplate = emailTemplates.passwordResetConfirmationTemplate(user.name);
        await sendTemplateEmail(
            user.email,
            confirmationTemplate.subject,
            confirmationTemplate.html,
            confirmationTemplate.text
        );

        return res.status(200).json({message: 'Password Reset Successfully'});
    } catch (error) {
        console.log(error);
        return res.status(500).json({message: 'Internal Server Error'});
    }
}

// Google OAuth Controller

// Initiate Google OAuth - Generate OAuth URL
const initiateGoogleAuth = async (req, res) => {
    try {

        // Create OAuth2 Client
        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_REDIRECT_URL || 'http://localhost:2002/api/auth/google/callback'
        );

        // Generate the url that will be used for the consent dialog
        const authorizeUrl = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: [
                'https://www.googleapis.com/auth/userinfo.profile',
                'https://www.googleapis.com/auth/userinfo.email'
            ],
            include_granted_scopes: true,
            state: JSON.stringify({
                timestamp: Date.now()
            })
        });

        return res.status(200).json({
            message: 'Google OAuth URL Generated',
            authUrl: authorizeUrl
        });

    } catch (error) {
        console.log("Error Setting Up Google OAuth", error);
        return res.status(500).json({message: 'Internal Server Error'});
    }
}

// Handle Google OAuth Callback
const handleGoogleCallback = async (req, res) => {
    const { code, state, error } = req.query;
    
    if (error) {
        return res.status(400).json({message: 'OAuth authorization denied', error});
    }

    if (!code) {
        return res.status(400).json({message: 'Authorization code is required'});
    }

    try {
        // Create OAuth2 client
        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_REDIRECT_URL || 'http://localhost:2002/api/auth/google/callback'
        );

        // Exchange authorization code for access token
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);

        // Get User Information
        const oauth2 = google.oauth2({
            auth: oauth2Client,
            version: 'v2'
        });

        const { data } = await oauth2.userinfo.get();

        const {
            id: googleId,
            email,
            name,
            picture: avatar,
            verified_email: emailVerified
        } = data;

        if (!emailVerified) {
            return res.status(400).json({message: 'Google email not verified'})
        }

        // Check if user exists with this Google ID
        let user = await User.findOne({ googleId });
        let isNewUser = false;

        if(!user) {
            // Check if a user already signed up normally with this email (regular signup)
            user = await User.findOne({ email });
        }

        if (user) {
            // Link Google account to existing User
            user.googleId = googleId;
            user.provider = 'google';
            user.avatar = avatar;
            user.isVerified = true; // Ensure Google users are verified
            await user.save();
        } else {
            // Create new User with Google OAuth
            user = new User({
                name,
                email,
                googleId,
                provider: 'google',
                avatar,
                isVerified: true // Google accounts are pre-verified
            });
            await user.save();
            isNewUser = true;

            // Send Welcome email for new Google Users
            const welcomeTemplate = emailTemplates.googleWelcomeTemplate(name);
            await sendTemplateEmail(
                email,
                welcomeTemplate.subject,
                welcomeTemplate.html,
                welcomeTemplate.text
            );
        }

        // Generate JWT token
        const jwtPayload = {
            id: user._id,
            email: user.email,
            provider: user.provider
        };
        
        const token = await jwt.sign(jwtPayload, process.env.JWT_SECRET, {expiresIn: process.env.JWT_EXPIRATION});

        // Send Login notification (only for existing users)
        if (!isNewUser) {
            const loginTime = new Date().toLocaleString();
            const loginTemplate = emailTemplates.loginNotificationTemplate(user.name, loginTime);
            await sendTemplateEmail(
                email,
                loginTemplate.subject,
                loginTemplate.html,
                loginTemplate.text
            );
        }
        return res.status(200).json({
            message: 'Google Authentication Successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                provider: user.provider,
                isVerified: user.isVerified
            }
        });
    } catch (error) {
        console.log('Google OAuth callback error:', error);
        return res.status(500).json({message: 'Google Authentication Failed'});
    }
}

// Unlink Google Account
const unlinkGoogle = async (req, res) => {
    const { userId } = req.params;

    try {
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({message: 'User Not Found'});
        }

        if (user.provider === 'google' && !user.password) {
            return res.status(400).json({
                message: 'Cannot unling Google Account without setting a user password first'
            });
        }

        // Remove Google Association
        user.googleId = undefined;
        user.provider = 'local';
        user.avatar = undefined;
        await user.save();

        return res.status(200).json({message: 'Google Account Unlinked Successfully'});
    } catch (error) {
        console.log("Error unlinking Google Account:", error );
        return res.status(500).json({message: 'Internal Server Error'});
    }
}

// Set password for Google Users Who want to add local authentication
const setPasswordForGoogleUser = async (req, res) => {
    const { userId } = req.params;
    const { password, confirmPassword } = req.body;

    if (!password || !confirmPassword) {
        return res.status(400).json({message: 'Password and Confirm Password field are requiried'});
    }

    if (password !== confirmPassword) {
        return res.status(400).json({message: 'Passwords does not match'});
    }

    if (password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters long'});
    }

    try {
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User Not Found'});
        }

        if (user.provider !== 'google') {
            return res.status(400).json({ message: 'This Endpoint is only for Google Authenticated Users'});
        }

        // Hash And Set Password
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        user.password = hashedPassword;
        await user.save();

        // Send Confirmation Email
        const confirmationTemplate = emailTemplates.passwordSetConfirmationTemplate(user.name);
        await sendTemplateEmail(
            user.email,
            confirmationTemplate.subject,
            confirmationTemplate.html,
            confirmationTemplate.text
        );

        return res.status(200).json({ message: 'Password Set Successfully. You can now use both Google and Email/Password Login.'});
    } catch (error) {
        console.log('Error Setting Password For Google User', error);
        return res.status(500).json({ message: 'Internal Server Error'});

    }
    
}

// Upload Profile Picture
const uploadProfilePicture = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({message: 'No Image File Provided'});
        }

        const userId = req.user.id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(400).json({message: 'User Not Found'});
        }

        // Delete old profile picture if exists
        if (user.profilePicture?.publicId) {
            try {
                await deleteImage(user.profilePicture.publicId);
            } catch (error) {
                console.log('Error Deleting Old Profile Picture:', error);
            }
        }

        // Update User with new profile picture
        user.profilePicture = {
            url: req.file.path,
            publicId: req.file.filename,
            uploadedAt: new Date()
        };

        // Also update the avatar field for backward compatibility
        user.avatar = req.file.path;

        await user.save();

        return res.status(200).json({
            message: 'Profile Picture Uploaded Successfully',
            profilePicture: {
                url: user.profilePicture.url,
                uploadedAt: user.profilePicture.uploadedAt
            }
        });

    } catch (error) {
        console.log('Error Uploading Profile Picture:', error);
        return res.status(500).json({message: 'Internal Server Error'});
    }
}

// Function To Get User Profile (Including Profile Picture)
// const getUserProfile = async (req, res) => {
//     try {
        
//     } catch (error) {
        
//     }
// }

module.exports = { 
    register, 
    login,
    forgotPassword,
    verifyOTP, 
    resetPassword,
    verifyEmailToken,
    initiateGoogleAuth,
    handleGoogleCallback,
    unlinkGoogle,
    setPasswordForGoogleUser,
    uploadProfilePicture
};

// learn about 
// markdown language
// video-streaming with Nodejs
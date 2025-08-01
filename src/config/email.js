const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

const sendEmail = async (to, subject, text) => {
    try {
        // Create a transporter Object using SMTP
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        // Set up email data
        const mailOptions = {
            from: `Dubem Car Rental Service <${process.env.EMAIL_USER}>`, // sender address
            to, // receivers
            subject, // email Subject 
            text, // email text body
        };

        // Send mail with defined transport Object
        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully');
    } catch (error) {
        console.log('Error sending mail', error);
    }
}

module.exports = sendEmail;
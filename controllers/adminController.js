const Admin = require('../models/admin');
const Doctor=require('../models/doctor');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const { generateNewPassword } = require('../utils/passwordUtils.js');
const AdminServices = require('../services/admin.service');

// Create an admin
exports.createAdmin = async (req, res) => {
    try {
        const { first_name, last_name, email, phone, password, role, adjective } = req.body;
        
        // Check if admin with the same email already exists
        const existingAdmin = await Admin.findOne({ where: { email } });
        if (existingAdmin) {
            return res.status(400).json({ status: false, message: `The email ${email} is already registered` });
        }
        
        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new admin with hashed password
        const admin = await Admin.create({ first_name, last_name, email, phone, password: hashedPassword, role, adjective });
        res.json({ status: true, message: 'Admin registered successfully', id: admin.id });
    } catch (error) {
        console.error('Error creating admin:', error);
        res.status(500).json({ status: false, message:  'Internal server error' });
    }
};


exports.getAdminDetails = async (req, res) => {
    try {
        // Retrieve admin details from the database
        const admin = await Admin.findOne({ /* Add condition if needed */ });
        if (!admin) {
            return res.status(404).json({ status: false, message: 'Admin not found' });
        }

        // Check if the properties exist before accessing them
        const { first_name, last_name, email } = admin || {};
        if (!first_name || !last_name || !email) {
            return res.status(500).json({ status: false, message: 'Admin details are incomplete' });
        }

        res.status(200).json({ status: true, admin: { first_name, last_name, email } });
    } catch (error) {
        console.error('Error fetching admin details:', error);
        res.status(500).json({ status: false, message: 'Internal server error' });
    }
};

// Log in the admin
exports.loginAdmin = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Retrieve admin by email
        const admin = await Admin.findOne({ where: { email } });
        if (!admin) {
            return res.status(404).json({ status: false, message: 'Admin does not exist' });
        }

        // Compare passwords
        const isPasswordCorrect = await bcrypt.compare(password, admin.password);
        if (!isPasswordCorrect) {
            return res.status(401).json({ status: false, message: 'Incorrect administrator name or password' });
        }

        const oneDayInSeconds = 24 * 60 * 60; // 1 day = 24 hours * 60 minutes * 60 seconds
        const expiresIn = 365 * oneDayInSeconds;
        const tokenData = { id: admin.id,
             email: admin.email, 
             role: "admin", 
            first_name: admin.first_name,
            last_name: admin.last_name,
            adjective: admin.adjective}; 
        const token = await AdminServices.generateAccessToken(tokenData, expiresIn);
    
        res.status(200).json({ status: true, message: 'Successfully logged in', token: token, role: "admin" });
    } catch (error) {
        console.error('Error logging in admin:', error);
        res.status(500).json({ status: false, message: 'Internal server error' });
    }
};


exports.approveDoctor = async (req, res) => {
    try {
        const { doctorId } = req.params;
        console.log('Doctor ID:', doctorId); // Print doctorId to check if it's correctly received

        // Find the doctor by id
        const doctor = await Doctor.findByPk(doctorId);
        if (!doctor) {
          console.log('Doctor not found');
          return res.status(404).json({ status: false, message: 'Doctor not found' });
        }

        // Set is_approved to true
        doctor.is_approved = true;

        // Generate temporary password and save it
        const password = crypto.randomBytes(8).toString('hex');
        const hashedPassword = await bcrypt.hash(password, 10);
        doctor.password = hashedPassword;
        await doctor.save();

        console.log('Doctor approved successfully'); 

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_User, 
                pass: process.env.PASS_User 
            },
        });
        const mailOptions = {
            from: process.env.EMAIL_User,
            to: doctor.email,
            subject: 'Your Temporary Password',
            text: `Your temporary password is: ${password}. Please change it after login.`,
        };
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.error('Error sending email:', error);
                res.status(500).json({ status: false, message: 'Error sending email' });
            } else {
                console.log('Email sent:', info.response);
                res.json({ status: true, message: 'Doctor approved successfully. Temporary password sent to email.' });
            }
        });
    } catch (error) {
        console.error('Error approving doctor:', error);
        res.status(500).json({ status: false, message: 'Internal server error' });
    }
};

exports.logoutAdmin = async (req, res) => {
    try {
        const token = req.headers.authorization;

        if (!token) {
            return res.status(400).json({ status: false, message: 'Token not provided' });
        }

        res.clearCookie('token');

        return res.status(200).json({ status: true, message: 'Logout successful' });
    } catch (error) {
        console.error('Error during logout:', error);
        res.status(500).json({ status: false, message: 'Internal server error' });
    }
};
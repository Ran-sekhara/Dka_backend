const Patient = require('../models/patient');
const bcrypt = require('bcrypt');
const PatientServices = require('../services/patient.service');
const { generateNewPassword } = require('../utils/passwordUtils.js');
const nodemailer = require('nodemailer');

// Create a Patient
exports.createPatient = async (req, res) => {
    try {
        const { first_name, last_name, email, phone, password, id_doctor,role } = req.body;
        
        // Check if the password meets the minimum length requirement
        if (password.length < 7) {
            return res.status(400).json({ status: false, message: 'Password must be at least 7 characters long' });
        }

        // Check if Patient with the same email already exists
        const existingPatient = await Patient.findOne({ where: { email } });
        if (existingPatient) {
            return res.status(400).json({ status: false, message: `The email ${email} is already registered` });
        }
        
        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new Patient with hashed password
        const patient = await Patient.create({ first_name, last_name, email, phone, password: hashedPassword,id_doctor, role  });
        res.json({ status: true, message: 'Patient registered successfully', id: patient.id_patient });
    } catch (error) {
        console.error('Error creating patient:', error);
        res.status(500).json({ status: false, message: 'Internal server error' });
    }
};

// Log in the Patient
exports.loginPatient = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Retrieve Patient by email
        const patient = await Patient.findOne({ where: { email } });
        if (!patient) {
            return res.status(404).json({ status: false, message: 'Patient does not exist' });
        }

        // Compare passwords
        const isPasswordCorrect = await bcrypt.compare(password, patient.password);
        if (!isPasswordCorrect) {
            return res.status(401).json({ status: false, message: 'Incorrect patient name or password' });
        }

        const oneDayInSeconds = 24 * 60 * 60; // 1 day = 24 hours * 60 minutes * 60 seconds
        const expiresIn = 365 * oneDayInSeconds;
        let tokenData;
        tokenData = { id: patient.id_patient, email: patient.email, role: "patient" };
        const token = await PatientServices.generateAccessToken(tokenData, expiresIn);

        res.status(200).json({ status: true, message: 'Successfully logged in', token: token });
    } catch (error) {
        console.error('Error logging in patient:', error);
        res.status(500).json({ status: false, message: 'Internal server error' });
    }
};

exports.getPatientProfile = async (req, res) => {
    try {
        const { patientId } = req.params;
        // Retrieve Patient by email
        const patient = await Patient.findOne({ where: { id_patient: patientId} });
        if (!patient) {
            return res.status(404).json({ status: false, message: 'Patient does not exist' });
        }

        // Return the patient details
        res.json({ 
            first_name : patient.first_name,
             last_name: patient.last_name, 
             email: patient.email ,
             password:patient.password, 
             phone:patient.phone

             });
    } catch (error) {
        console.error('Error getting patient profile:', error);
        res.status(500).json({ status: false, message: 'Internal server error' });
    }
};

exports.recoverPassword = async (req, res) => {
    try {
        const { email } = req.body;

        // Check if the email exists in the database
        const patient = await Patient.findOne({ where: { email } });
        if (!patient) {
            return res.status(404).json({ status: false, message: 'Email not found. Please enter a registered email address.' });
        }

        // Generate a new password
        const newPassword = generateNewPassword();

        // Hash the new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update the user's password in the database
        const updatedPatient = await Patient.update(
            { password: hashedPassword },
            { where: { email } }
        );

        // Send an email to the user with the new password
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'poussypoussita@gmail.com', // replace with your Gmail email address
                pass: 'jfur hdex mcue ebyc', // replace with your Gmail password
            },
        });

        const mailOptions = {
            from: 'poussypoussita@gmail.com',
            to: email,
            subject: 'Password Recovery',
            text: `Your new password is: ${newPassword}`,
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
                return res.status(500).json({ status: false, message: 'Internal server error' });
            }
            console.log('Email sent:', info.response);
            res.status(200).json({ status: true, message: 'Password recovery successful' });
        });
    } catch (error) {
        console.error('Error during password recovery:', error);
        res.status(500).json({ status: false, message: 'Internal server error' });
    }
};
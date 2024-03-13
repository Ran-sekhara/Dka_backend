const Doctor = require('../models/doctor');
const bcrypt = require('bcrypt');
const DoctorServices = require('../services/doctor.service');
const { generateNewPassword } = require('../utils/passwordUtils.js');
const nodemailer = require('nodemailer');


// Create a doctor
exports.createDoctor = async (req, res) => {
  try {
      const { first_name, last_name, email, phone, password, role, address, speciality } = req.body;

      // Check if the password meets the minimum length requirement
      if (password.length < 7) {
          return res.status(400).json({ status: false, message: 'Password must be at least 7 characters long' });
      }

      // Check if doctor with the same email already exists
      const existingDoctor = await Doctor.findOne({ where: { email } });
      if (existingDoctor) {
          return res.status(400).json({ status: false, message: `The email ${email} is already registered` });
      }

      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create new doctor with hashed password
      const doctor = await Doctor.create({ first_name, last_name, email, phone, password: hashedPassword, role, address, speciality });
      res.json({ status: true, message: 'Doctor registered successfully', id: doctor.id_doctor });
  } catch (error) {
      console.error('Error creating doctor:', error);
      res.status(500).json({ status: false, message: 'Internal server error' });
  }
};

// Log in the doctor
exports.loginDoctor = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Retrieve doctor by email
        const doctor = await Doctor.findOne({ where: { email } });
        if (!doctor) {
            return res.status(404).json({ status: false, message: 'Doctor does not exist' });
        }

        // Compare passwords
        const isPasswordCorrect = await bcrypt.compare(password, doctor.password);
        if (!isPasswordCorrect) {
            return res.status(401).json({ status: false, message: 'Incorrect password' });
        }

        const oneDayInSeconds = 24 * 60 * 60; // 1 day = 24 hours * 60 minutes * 60 seconds
        const expiresIn = 365 * oneDayInSeconds;
        const tokenData = { id: doctor.id_doctor, email: doctor.email, role: "doctor" };
        const token = await DoctorServices.generateAccessToken(tokenData, expiresIn);

        res.status(200).json({ status: true, message: 'Successfully logged in', token });
    } catch (error) {
        console.error('Error logging in doctor:', error);
        res.status(500).json({ status: false, message: 'Internal server error' });
    }
};


  exports.recoverPassword = async (req, res) => {
    try {
      const { email } = req.body;
  
      // Generate a new password
      const newPassword = generateNewPassword();
  
      // Hash the new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
  
      // Update the user's password in the database
      const updatedDoctor = await Doctor.update(
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
  exports.checkEmailExistence = async (req, res) => {
    try {
      const { email } = req.body;
  
      const existingDoctor = await Doctor.findOne({ where: { email } });
  
      if (existingDoctor) {
        res.status(200).json({ exists: true, message: 'Email exists in the database' });
      } else {
        res.status(404).json({ exists: false, message: 'Email does not exist in the database' });
      }
    } catch (error) {
      console.error('Error checking email existence:', error);
      res.status(500).json({ status: false, message: 'Internal server error' });
    }
  };

  exports.getAllDoctors = async (req, res) => {
    try {
      const doctors = await Doctor.findAll({
        attributes: ['id_doctor', 'first_name', 'last_name', 'email', 'speciality','image'],
      });
  
      res.status(200).json({ status: true, doctors });
    } catch (error) {
      console.error('Error fetching doctors:', error);
      res.status(500).json({ status: false, message: 'Internal server error' });
    }
  };
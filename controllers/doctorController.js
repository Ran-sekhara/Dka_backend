const Doctor = require('../models/doctor');
const bcrypt = require('bcrypt');
const DoctorServices = require('../services/doctor.service');

// Create a doctor
exports.createDoctor = async (req, res) => {
    try {
        const { first_name, last_name, email, phone, password, role , address , speciality } = req.body;
        
        // Check if doctor with the same email already exists
        const existingDoctor = await Doctor.findOne({ where: { email } });
        if (existingDoctor) {
            return res.status(400).json({ status: false, message: `The email ${email} is already registered` });
        }
        
        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new doctor with hashed password
        const doctor = await Doctor.create({ first_name, last_name, email, phone, password: hashedPassword, role , address , speciality });
        res.json({ status: true, message: 'Doctor registered successfully', id: doctor.id_doctor });
    } catch (error) {
        console.error('Error creating doctor:', error);
        res.status(500).json({ status: false, message:  'Internal server error' });
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
            return res.status(401).json({ status: false, message: 'Incorrect doctor name or password' });
        }

        const oneDayInSeconds = 24 * 60 * 60; // 1 day = 24 hours * 60 minutes * 60 seconds
        const expiresIn = 365 * oneDayInSeconds;
        let tokenData;
        tokenData = {id: doctor.id_doctor , email: doctor.email, role: "doctor" };
                    const token = await DoctorServices.generateAccessToken(tokenData, expiresIn)

        res.status(200).json({ status: true, message: 'Successfully logged in',token: token, profile: doctor });
    } catch (error) {
        console.error('Error logging in doctor:', error);
        res.status(500).json({ status: false, message: 'Internal server error' });
    }
};

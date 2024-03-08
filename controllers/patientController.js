const Patient = require('../models/patient');
const bcrypt = require('bcrypt');
const PatientServices = require('../services/patient.service');

// Create a Patient
exports.createPatient = async (req, res) => {
    try {
        const { first_name, last_name, email, phone, password, role , address , age , gender , height , weight } = req.body;
        
        // Check if Patient with the same email already exists
        const existingPatient = await Patient.findOne({ where: { email } });
        if (existingPatient) {
            return res.status(400).json({ status: false, message: `The email ${email} is already registered` });
        }
        
        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new Patient with hashed password
        const patient = await Patient.create({ first_name, last_name, email, phone, password: hashedPassword, role , address , age , gender , height , weight  });
        res.json({ status: true, message: 'Patient registered successfully', id: patient.id_patient });
    } catch (error) {
        console.error('Error creating patient:', error);
        res.status(500).json({ status: false, message:  'Internal server error' });
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
        tokenData = {id: patient.id_patient , email: patient.email, role: "patient" };
                    const token = await PatientServices.generateAccessToken(tokenData, expiresIn)

        res.status(200).json({ status: true, message: 'Successfully logged in',token:token });
    } catch (error) {
        console.error('Error logging in patient:', error);
        res.status(500).json({ status: false, message: 'Internal server error' });
    }
};

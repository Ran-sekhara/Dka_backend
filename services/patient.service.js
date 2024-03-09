const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Patient = require('../models/patient');

class PatientServices {
    static async registerPatient(first_name, last_name, email, phone, password, role) {
        try {
            // Hash the password
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(password, salt);

            // Insert the new patient into the database
            const patient = await Patient.create({ first_name, last_name, email, phone, password: hash, role });

            return patient;
        } catch (error) {
            throw error;
        }
    }

    static async getPatientByEmail(email) {
        try {
            const patient = await Patient.findOne({ where: { email } });
            return patient;
        } catch (error) {
            throw error;
        }
    }

    static async checkPatient(email) {
        try {
            const patient = await Patient.findOne({ where: { email } });
            return patient;
        } catch (error) {
            throw error;
        }
    }

    static async generateAccessToken(tokenData, JWT_EXPIRE) {
        console.log('JWT_SECRET:', process.env.JWT_SECRET);
        return jwt.sign(tokenData, process.env.JWT_SECRET, { expiresIn: JWT_EXPIRE });
    }
}

module.exports = PatientServices;

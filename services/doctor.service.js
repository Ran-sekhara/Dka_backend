const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Doctor = require('../models/doctor');

class DoctorServices {
    static async registerDoctor(first_name, last_name, email, phone, password, role , address , speciality) {
        try {
            // Hash the password
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(password, salt);

            // Insert the new doctor into the database
            const doctor = await Doctor.create({ first_name, last_name, email, phone, password: hash, role , address , speciality });

            return doctor;
        } catch (error) {
            throw error;
        }
    }

    static async getDoctorByEmail(email) {
        try {
            const doctor = await Doctor.findOne({ where: { email } });
            return doctor;
        } catch (error) {
            throw error;
        }
    }

    static async checkDoctor(email) {
        try {
            const doctor = await Doctor.findOne({ where: { email } });
            return doctor;
        } catch (error) {
            throw error;
        }
    }

    static async generateAccessToken(tokenData, JWT_EXPIRE) {
        try {
            // Fetch additional user information from the database based on the provided doctor ID
            const { id } = tokenData;
            const doctor = await Doctor.findByPk(id);

            if (!doctor) {
                throw new Error('Doctor not found');
            }

            // Include additional user information in the token payload
            const { first_name, last_name, email, role } = doctor;
            const extendedTokenData = { id, email, role, first_name, last_name };

            // Generate and return the token
            return jwt.sign(extendedTokenData, process.env.JWT_SECRET, { expiresIn: JWT_EXPIRE });
        } catch (error) {
            throw error;
        }
    }
}

module.exports = DoctorServices;


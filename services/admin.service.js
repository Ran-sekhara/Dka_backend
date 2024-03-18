const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Admin = require('../models/admin');

class AdminServices {
    static async registerAdmin(first_name, last_name, email, phone, password, role) {
        try {
            // Hash the password
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(password, salt);

            // Insert the new admin into the database
            const admin = await Admin.create({ first_name, last_name, email, phone, password: hash, role });

            return admin;
        } catch (error) {
            throw error;
        }
    }

    static async getAdminByEmail(email) {
        try {
            const admin = await Admin.findOne({ where: { email } });
            return admin;
        } catch (error) {
            throw error;
        }
    }                         

    static async checkAdmin(email) {
        try {
            const admin = await Admin.findOne({ where: { email } });
            return admin;
        } catch (error) {
            throw error;
        }
    }

    static async generateAccessToken(tokenData, JWT_EXPIRE) {
        return jwt.sign(tokenData, process.env.JWT_SECRET, { expiresIn: JWT_EXPIRE });
    }
}
function generateTemporaryPassword(length = 8) {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let password = '';

    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * charset.length);
        password += charset[randomIndex];
    }

    return password;
}


module.exports = AdminServices;

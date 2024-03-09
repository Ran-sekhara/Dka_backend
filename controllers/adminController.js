const Admin = require('../models/admin');
const bcrypt = require('bcrypt');
const AdminServices = require('../services/admin.service');

// Create an admin
exports.createAdmin = async (req, res) => {
    try {
        const { first_name, last_name, email, phone, password, role } = req.body;
        
        // Check if admin with the same email already exists
        const existingAdmin = await Admin.findOne({ where: { email } });
        if (existingAdmin) {
            return res.status(400).json({ status: false, message: `The email ${email} is already registered` });
        }
        
        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new admin with hashed password
        const admin = await Admin.create({ first_name, last_name, email, phone, password: hashedPassword, role });
        res.json({ status: true, message: 'Admin registered successfully', id: admin.id });
    } catch (error) {
        console.error('Error creating admin:', error);
        res.status(500).json({ status: false, message:  'Internal server error' });
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
        let tokenData;
        tokenData = {id: admin.id , email: admin.email, role: "admin" };
                    const token = await AdminServices.generateAccessToken(tokenData, expiresIn)

    
        res.status(200).json({ status: true, message: 'Successfully logged in',token: token , profile: admin});
    } catch (error) {
        console.error('Error logging in admin:', error);
        res.status(500).json({ status: false, message: 'Internal server error' });
    }
};

// auth.middleware.js

const jwt = require('jsonwebtoken');
const Patient = require('../models/patient');

const authMiddleware = async (req, res, next) => {
    const token = req.header('Authorization');

    if (!token) {
        return res.status(401).json({ status: false, message: 'Access denied. Token not provided.' });
    }

    try {
        const decodedToken = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET);
        const patient = await Patient.findByPk(decodedToken.id);

        if (!patient) {
            return res.status(401).json({ status: false, message: 'Invalid token. Patient not found.' });
        }

        // Attach patient information to the request for further use in the route
        req.user = { id: patient.id_patient, email: patient.email, role: patient.role };
        next();
    } catch (error) {
        console.error('Error verifying token:', error);
        res.status(401).json({ status: false, message: 'Invalid token.' });
    }
};

module.exports = authMiddleware;

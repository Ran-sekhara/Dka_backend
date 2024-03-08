// controllers/medicalFolderController.js
const MedicalFolder = require('../models/medicalfolder');
const Patient = require('../models/patient');

// Create MedicalFolder for a specific patient
exports.createMedicalFolder = async (req, res) => {
    try {
        const { patientId } = req.params;

        // Check if the patient exists
        const patient = await Patient.findByPk(patientId);
        if (!patient) {
            return res.status(404).json({ status: false, message: 'Patient not found' });
        }

        // Extract fields from the request body
        const { diabetes_type, diabetes_history, dka_history } = req.body;

        // Create MedicalFolder
        const medicalFolder = await MedicalFolder.create({
            diabetes_type,
            diabetes_history,
            dka_history,
            id_patient: patientId,
        });

        // Associate the MedicalFolder with the Patient
        await patient.setMedicalfolder(medicalFolder);

        res.json({ status: true, message: 'MedicalFolder created successfully' });
    } catch (error) {
        console.error('Error creating medical folder:', error);
        res.status(500).json({ status: false, message: 'already excited' });
    }
};
exports.getMedicalFolderByPatientId = async (req, res) => {
    try {
        const { patientId } = req.params;

        // Find the MedicalFolder by patient ID
        const medicalFolder = await MedicalFolder.findOne({
            where: { id_patient: patientId },
        });

        if (!medicalFolder) {
            return res.status(404).json({ status: false, message: 'MedicalFolder not found for the specified patient' });
        }

        res.json({ status: true, message: 'MedicalFolder information found', information : medicalFolder });
    } catch (error) {
        console.error('Error getting MedicalFolder information:', error);
        res.status(500).json({ status: false, message: 'Internal server error' });
    }
};


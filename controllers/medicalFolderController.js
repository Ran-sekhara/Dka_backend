// controllers/medicalFolderController.js
const { and } = require('sequelize');
const DkaHistory = require('../models/dkahistory');
const Doctor = require('../models/doctor');
const MedicalFolder = require('../models/medicalfolder');
const Patient = require('../models/patient');

// Create MedicalFolder for a specific patient
exports.createMedicalFolder = async (req, res) => {
    try {
        const { patientId } = req.params;

        // Log the received patientId
        console.log('Received Patient ID:', patientId);

        // Check if the patient exists
        const patient = await Patient.findByPk(patientId);
        if (!patient) {
            return res.status(404).json({ status: false, message: 'Patient not found' });
        }


        const { diabetes_type, diabetes_history, height, weight, is_smoke, area } = req.body;

        const medicalFolder = await MedicalFolder.create({
            diabetes_type,
            diabetes_history,
            height,
            weight,
            is_smoke,
            area,
            id_patient: patientId,
            id_doctor: patient.id_doctor 
        });

        await patient.setMedicalfolder(medicalFolder);
        res.json({ status: true, message: 'MedicalFolder created successfully', id_folder: medicalFolder.id_folder });
    } catch (error) {
        console.error('Error creating medical folder:', error);
        res.status(500).json({ status: false, message: 'Internal server error' });
    }
};



exports.getMedicalFolderByPatientId = async (req, res) => {
    try {
        const { patientId } = req.params;

        const medicalFolder = await MedicalFolder.findOne({
            where: { id_patient: patientId },
        });

        if (!medicalFolder) {
            return res.status(404).json({ status: false, message: 'MedicalFolder not found for the specified patient' });
        }

        res.json({
            status: true,
            message: 'MedicalFolder information found',
            information: {
                ...medicalFolder.toJSON(),
                bmi: medicalFolder.bmi // Include BMI in the response
            }
        });
    } catch (error) {
        console.error('Error getting MedicalFolder information:', error);
        res.status(500).json({ status: false, message: 'Internal server error' });
    }
};


exports.fetchMedicalFolders = async (req, res) => {
    try {
        const patients = await Patient.findAll();

        const medicalFolders = [];

        for (const patient of patients) {
            const medicalFolder = await MedicalFolder.findOne({
                where: { id_patient: patient.id_patient, archived: false },
                include: [{ model: DkaHistory, order: [['date', 'DESC']], limit: 1 }] // Include the latest DKA history
            });

            if (medicalFolder) {
                medicalFolders.push({
                    patientId: patient.id,
                    medicalFolder: medicalFolder
                });
            }
        }

        res.json({ status: true, message: 'Medical Folders fetched successfully', medicalFolders: medicalFolders });
    } catch (error) {
        console.error('Error fetching medical folders:', error);
        res.status(500).json({ status: false, message: 'Internal server error' });
    }
};

exports.deleteMedicalFolder = async (req, res) => {
  try {
    const { medicalFolderId } = req.params;
    console.log('Deleting medical folder:', medicalFolderId); // Check if medicalFolderId is received correctly
    // Find the medical folder by ID
    const medicalFolder = await MedicalFolder.findByPk(medicalFolderId);
    console.log('Medical Folder found:', medicalFolder); // Check if medical folder is found
    if (!medicalFolder) {
      return res.status(404).json({ status: false, message: 'MedicalFolder not found' });
    }
    await medicalFolder.destroy();
    console.log('Medical Folder deleted successfully');
    res.json({ status: true, message: 'MedicalFolder deleted successfully' });
  } catch (error) {
    console.error('Error deleting medical folder:', error);
    res.status(500).json({ status: false, message: 'Internal server error' });
  }
};

exports.archivedFolder = async (req, res) => {
    const { medicalFolderId } = req.params;
    console.log('Received request to archive medical folder with ID:', medicalFolderId); // Print received folder ID
  
    try {
      const medicalFolder = await MedicalFolder.findByPk(medicalFolderId);
      console.log('Medical folder found:', medicalFolder); // Print folder object
  
      if (!medicalFolder) {
        console.log('Medical folder not found'); // Print error message
        return res.status(404).json({ error: 'Medical folder not found' });
      }
  
      // Update the archived field to true
      medicalFolder.archived = true;
      await medicalFolder.save();
  
      console.log('Medical folder archived successfully'); // Print success message
      res.status(200).json({ message: 'Medical folder archived successfully' });
    } catch (error) {
      console.error('Error archiving medical folder:', error); // Print error message
      res.status(500).json({ error: 'Failed to archive medical folder' });
    }
};
exports.updateMedicalFolder = async (req, res) => {
    try {
        const { patientId } = req.params;

        // Log the received patientId
        console.log('Received Patient ID:', patientId);

        // Log the received value of is_smoke
        console.log('Received is_smoke value:', req.body.value);

        let medicalFolder = await MedicalFolder.findOne({
            where: { id_patient: patientId },
        });

        // If medical folder doesn't exist, create a new one
        if (!medicalFolder) {
            // Create a new medical folder
            medicalFolder = await MedicalFolder.create({ id_patient: patientId });
        }

        // Extract fields from the request body
        const { field, value } = req.body;

        // Map the field name if needed
        const fieldMappings = {
            'diabetes type': 'diabetes_type',
            'diabetes diagnosis date': 'diabetes_history',
            'dka history': 'dka_history',
            'height': 'height',
            'weight': 'weight',
            'smoker': 'is_smoke',
            'area':'area'
        };

        const mappedField = fieldMappings[field.toLowerCase()] || field;

        // Update MedicalFolder based on the mapped field
        medicalFolder[mappedField] = value;

        // Save the updated medical folder
        await medicalFolder.save();

        res.json({ status: true, message: 'MedicalFolder updated successfully' });
    } catch (error) {
        console.error('Error updating medical folder:', error);
        res.status(500).json({ status: false, message: 'Internal server error' });
    }
};
exports.unarchiveFolder = async (req, res) => {
    const { medicalFolderId } = req.params;
    console.log('Received request to unarchive medical folder with ID:', medicalFolderId); // Print received folder ID
  
    try {
      const medicalFolder = await MedicalFolder.findByPk(medicalFolderId);
      console.log('Medical folder found:', medicalFolder); // Print folder object
  
      if (!medicalFolder) {
        console.log('Medical folder not found'); // Print error message
        return res.status(404).json({ error: 'Medical folder not found' });
      }
  
      // Update the archived field to false
      medicalFolder.archived = false;
      await medicalFolder.save();
  
      console.log('Medical folder unarchived successfully'); // Print success message
      res.status(200).json({ message: 'Medical folder unarchived successfully' });
    } catch (error) {
      console.error('Error unarchiving medical folder:', error); // Print error message
      res.status(500).json({ error: 'Failed to unarchive medical folder' });
    }
};


exports.fetchArchivedMedicalFolders = async (req, res) => {
    try {
        // Find all patients
        const patients = await Patient.findAll();

        // Array to store archived medical folders for all patients
        const archivedMedicalFolders = [];

        // Loop through each patient and find their associated archived medical folder
        for (const patient of patients) {
            const archivedMedicalFolder = await MedicalFolder.findOne({
                where: { id_patient: patient.id_patient, archived: true },
            });

            // If archived medical folder exists, push it to the array
            if (archivedMedicalFolder) {
                archivedMedicalFolders.push({
                    patientId: patient.id,
                    medicalFolder: archivedMedicalFolder
                });
            }
        }

        res.json({ status: true, message: 'Archived Medical Folders fetched successfully', medicalFolders: archivedMedicalFolders });
    } catch (error) {
        console.error('Error fetching archived medical folders:', error);
        res.status(500).json({ status: false, message: 'Internal server error' });
    }
};
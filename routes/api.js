const express = require('express');
const adminController = require('../controllers/adminController');
const doctorController = require('../controllers/doctorController')
const patientController = require('../controllers/patientController')
const medicalFolderController = require('../controllers/medicalFolderController')

const router = express.Router();


//admin
router.post('/admin', adminController.createAdmin);
router.post('/admin/loginAdmin', adminController.loginAdmin);

//doctor
router.post('/doctor', doctorController.createDoctor);
router.post('/doctor/loginDoctor', doctorController.loginDoctor);

//patient
router.post('/patient', patientController.createPatient);
router.post('/patient/loginPatient', patientController.loginPatient);

//medicalfolder
router.post('/medicalfolder/:patientId', medicalFolderController.createMedicalFolder);



module.exports = router;
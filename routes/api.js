const express = require('express');
const adminController = require('../controllers/adminController');
const doctorController = require('../controllers/doctorController')
const patientController = require('../controllers/patientController')
const graphController = require('../controllers/graphController')
const medicalFolderController = require('../controllers/medicalFolderController')
const authMiddleware = require('../middleware/auth');


const router = express.Router();


//admin
router.post('/admin', adminController.createAdmin);
router.post('/admin/loginAdmin', adminController.loginAdmin);

//doctor
router.post('/doctor', doctorController.createDoctor);
router.post('/doctor/loginDoctor', doctorController.loginDoctor);
router.post('/doctor/recoverpsswrd', doctorController.recoverPassword);
router.post('/doctor/checkEmailExistence', doctorController.checkEmailExistence);
router.get('/doctors', doctorController.getAllDoctors);
router.get('/doctorsName', doctorController.getAllDoctorsByName);


//patient
router.post('/patient', patientController.createPatient);
router.post('/patient/loginPatient', patientController.loginPatient);
router.get('/patient/profile/:patientId', patientController.getPatientProfile);
router.post('/patient/recoverpsswrd', patientController.recoverPassword);
router.put('/patients/:patientId/doctor/:doctorId', patientController.updatePatientDoctor); 
router.get('/patient/details/:patientId', patientController.getPatientDetails);


//medicalfolder
router.post('/medicalfolder/:patientId', medicalFolderController.createMedicalFolder);
router.get('/medicalfolder/patient/:patientId', medicalFolderController.getMedicalFolderByPatientId);

//graph
router.post('/graph/test', graphController.createTest);
router.get('/graph/good', graphController.getGraphData);
router.get('/graph/good', graphController.getGraphData);
router.get('/graph/danger', graphController.Danger);
router.get('/graph/nrml', graphController.Nrml);


module.exports = router;
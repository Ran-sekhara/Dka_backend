const express = require('express');
const multer = require('multer'); // Import multer
const upload = multer();
const adminController = require('../controllers/adminController');
const doctorController = require('../controllers/doctorController')
const patientController = require('../controllers/patientController')
const graphController = require('../controllers/graphController')
const medicalFolderController = require('../controllers/medicalFolderController')
const deviceController = require('../controllers/deviceController')
const testController=require('../controllers/testController')
const testLocationController = require('../controllers/testLocationController')
const quizController = require('../controllers/quizController');
const dkaHistoryController = require('../controllers/dkahistoryController');
const locationController=require ('../controllers/locationController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

//quizzz
router.get('/quizzes', quizController.getAllQuizzes);
router.post('/quizzes', quizController.createQuiz);

//admin
router.post('/admin', adminController.createAdmin);
router.post('/admin/loginAdmin', adminController.loginAdmin);
router.post('/approveDoctor/:doctorId',adminController.approveDoctor);
router.post('/admin/logout',adminController.logoutAdmin);
router.get('/admin',adminController.getAdminDetails);


//doctor
router.post('/doctor', doctorController.createDoctor);
router.post('/doctor/loginDoctor', doctorController.loginDoctor);
router.post('/doctor/recoverPassword', doctorController.recoverPassword);
router.post('/doctor/verifyVerificationNumber', doctorController.verifyVerificationNumber);
router.post('/doctor/checkEmailExistence', doctorController.checkEmailExistence);
router.get('/doctors', doctorController.getAllDoctors);
router.get('/doctors/:doctorId/patients', doctorController.getDoctorPatientsInfo);
router.get('/doctorsName', doctorController.getAllDoctorsByName);
router.get('/doctor/profile/:doctorId', doctorController.doctorprofile);
router.put('/doctors/profile/:doctorId', doctorController.updateProfile);
router.get('/doctors/:doctorId/patients/count', doctorController.getDoctorPatientsCount);
router.post('/doctor/updatePassword', doctorController.updatePassword);
router.put('/doctor/updatePasswordWithConfirmation', doctorController.updatePasswordWithConfirmation);
router.post('/optionalDoctor', doctorController.createOptionalDoctor);
router.get('/doctors/archived', doctorController.getArchivedDoctors);
router.put('/doctors/:doctorId/archive',doctorController.archivedDoctor);
router.put('/doctors/:doctorId/unarchive',doctorController.unarchiveDoctor);

//patient
router.post('/patient', patientController.createPatient);
router.post('/patient/loginPatient', patientController.loginPatient);
router.get('/patient/profile/:patientId', patientController.getPatientProfile);
router.post('/patient/recoverpsswrd', patientController.recoverPassword);
router.post('/patient/verify', patientController.verifyToken);
router.put('/patients/:patientId/doctor/:doctorId', patientController.updatePatientDoctor); 
router.get('/patient/details/:patientId', patientController.getPatientDetails);
router.delete('/:patientId', patientController.deletePatient);
router.post('/patient/resetpassword', patientController.resetPassword);
router.put('/patient/:patientId/updateProfile', patientController.updatePatientProfile);
router.get('/patients',patientController.getAllPatientsProfiles);
router.put('/patients/:patientId/archive',patientController.archivedPatient)
router.get('/patients/archived', patientController.getAllArchivedPatients);
router.put('/patients/:patientId/unarchive',patientController.unarchivePatient)
router.get('/patients/:patientId/email', patientController.fetchPatientEmail);
router.post('/patients/sendemail', patientController.sendEmail);
router.put('/patients/:patientId/password', patientController.modifyPassword);
router.post('/patients/:patientId/fcmtoken', patientController.updateFCMToken);
router.get('/patients/danger/:doctorId', patientController.getPatientsInDanger);
router.post('/addrecommendation', patientController.addrecommendation);

//medicalfolder
router.post('/medicalfolder/:patientId', medicalFolderController.createMedicalFolder);
router.get('/medicalfolder/patient/:patientId', medicalFolderController.getMedicalFolderByPatientId);
router.get('/medicalfolders', medicalFolderController.fetchMedicalFolders);
router.delete('/medicalfolders/:medicalFolderId', medicalFolderController.deleteMedicalFolder);
router.put('/medicalfolder/:medicalFolderId', medicalFolderController.updateMedicalFolder);
router.put('/medicalfolders/:medicalFolderId/archive',medicalFolderController.archivedFolder)
router.get('/medicalfolders/archived', medicalFolderController.fetchArchivedMedicalFolders);
router.put('/medicalfolders/:medicalFolderId/unarchive',medicalFolderController.unarchiveFolder);
router.put('/medicalfolder/:patientId/updateMedicalFolder', medicalFolderController.updateMedicalFolder);




//graph
router.get('/graph/good', graphController.getGraphData);
router.get('/graph/good', graphController.getGraphData);
router.get('/graph/danger', graphController.Danger);
router.get('/graph/nrml', graphController.Nrml);

//device
router.post('/device', deviceController.createDevice);
router.get('/devices', deviceController.getDevices);
router.get('/devices/:patientId', deviceController.getDeviceByLoggedInPatient);
router.delete('/devices/:deviceId', deviceController.deleteDevice);
router.put('/devices/:deviceId', deviceController.updateDevice);
router.put('/update', deviceController.updateDeviceStates);
router.put('/devices/:deviceId/archive',deviceController.archivedDevice)
router.put('/devices/:deviceId/unarchive',deviceController.unarchiveDevice)
router.get('/Archiveddevices', deviceController.getAllArchivedDevices);
router.get('/deviceStates', deviceController.getAllDeviceStates);
router.get('/user_manual.pdf', deviceController.getUserManual);


//test
router.get('/tests/:patientId', testController.getTests);
router.delete('/deleteTest/:testId', testController.deleteTest);

//dkahitory
router.post('/createDkaHistory', dkaHistoryController.createDkaHistory);
router.get('/dkaHistory/:medicalFolderId', dkaHistoryController.getDkaHistory);


// Define routes for handling location data
router.post('/data', testLocationController.createTestAndLocation);
router.get('/latestTestResult', testLocationController.getLatestTestResult);
router.post('/location', testLocationController.receiveMobileLocation);
router.get('/LatestLocation', authMiddleware, locationController.getLatestLocation);




module.exports = router;
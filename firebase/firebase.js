const admin = require('firebase-admin');
const Patient = require('../models/patient'); 
// Initialize Firebase Admin SDK
const serviceAccount = require('../firebase/serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Function to send push notification
async function sendPushNotification(patientId, state, concentration) {
  try {
    if (!patientId) {
      console.error('Patient ID is undefined');
      return;
    }

    // Fetch user's FCM token based on patientId from your database
    const fcmToken = await fetchFCMToken(patientId);

    if (!fcmToken) {
      console.error('FCM token not found for patient ID:', patientId);
      return;
    }

    // Convert concentration value to string
    const concentrationString = `${concentration.toString()} ppm`;

    // Construct the notification payload
    const payload = {
      notification: {
        title: 'New Test Result',
        body: `Status : ${state}\nAcetone Level : ${concentrationString}`, 
      },
      data: {  // Include additional parameters directly in the data field
        title: 'New Test Result',
        body: `Status : ${state}, Acetone Level : ${concentrationString}`,
        state: state,
        acetoneqt: concentrationString, 
        patientId: patientId.toString() 
      },
      token: fcmToken,
    };

    // Log the payload before sending
    console.log('Notification Payload:', payload);

    // Send the push notification
    const response = await admin.messaging().send(payload);
    console.log('Successfully sent message:', response);
  } catch (error) {
    console.error('Error sending message:', error);
  }
}

// Function to fetch FCM token from database
async function fetchFCMToken(patientId) {
  try {
    // Find the patient by ID
    const patient = await Patient.findByPk(patientId);

    // If patient found, return the FCM token
    if (patient) {
      return patient.fcm_token;
    } else {
      console.error('Patient not found with ID:', patientId);
      return null;
    }
  } catch (error) {
    console.error('Error fetching FCM token:', error);
    return null;
  }
}

module.exports = { sendPushNotification, fetchFCMToken };

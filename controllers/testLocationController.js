const Location = require('../models/location');
const Test = require('../models/test');
const Device = require ('../models/device');
const { sendPushNotification } = require('../firebase/firebase'); 

// Save mobile location in a global variable or a temporary storage
let mobileLocation = {};

exports.receiveMobileLocation = async (req, res) => {
  try {
    const { MobLatitude, MobLongitude } = req.body;
    mobileLocation = { latitude: MobLatitude, longitude: MobLongitude };
    console.log('Received mobile Latitude:', MobLatitude);
    console.log('Received mobile Longitude:', MobLongitude);

    res.status(200).json({ message: 'Mobile location received successfully' });
  } catch (error) {
    console.error('Error receiving mobile location:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


exports.createTestAndLocation = async (req, res) => {
  try {
    const { concentration, latitude, longitude, ref_device } = req.body; 
    const device = await Device.findOne({ where: { ref_device } });

    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }

    const patientId = device.id_patient; // Get the patient ID associated with the device  
    let state;

    // Log the received device latitude and longitude
    console.log('Received device latitude:', latitude);
    console.log('Received device longitude:', longitude);

    // Log the latest mobile latitude and longitude received
    const { latitude: MobLatitude, longitude: MobLongitude } = mobileLocation;
    console.log('Latest mobile Latitude:', MobLatitude);
    console.log('Latest mobile Longitude:', MobLongitude);

    // Determine the state based on the concentration value
    if (concentration >= 5 && concentration < 6) {
      state = 'Good';
    } else if (concentration >= 6 && concentration <= 9) {
      state = 'Moderate';
    } else if (concentration > 9) {
      state = 'Dangerous';
    } else {
      state = 'Unknown';
    }

    // Compare the latitude and longitude from the device with zero values
    const finalLatitude = (latitude === 0 && longitude === 0) ? MobLatitude : latitude;
    const finalLongitude = (latitude === 0 && longitude === 0) ? MobLongitude : longitude;

    // Log the final latitude and longitude values to be saved
    console.log('Final Latitude:', finalLatitude);
    console.log('Final Longitude:', finalLongitude);

    // Create a new Test record
    const test = await Test.create({
      state: state,
      acetoneqt: concentration,
      ref_device: ref_device, 
      id_patient: patientId
    });

    // Create a new Location record associated with the Test
    const location = await Location.create({
      latitude: finalLatitude,
      longitude: finalLongitude,
      id_test: test.id_test,
    });

    // Send push notification
    sendPushNotification(patientId, state, concentration);

    res.status(200).json({ message: 'Data stored successfully', test, location });
  } catch (error) {
    console.error('Error storing data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};



exports.getLatestTestResult = async (req, res) => {
  try {
    // Fetch the latest test record from the database
    const latestTest = await Test.findOne().sort({ createdAt: -1 }).limit(1);

    if (!latestTest) {
      return res.status(404).json({ message: 'No test result found' });
    }

    // Fetch the location associated with the latest test
    const location = await Location.findOne({ testId: latestTest.id_test });

    // Return the latest test result and location
    res.status(200).json({ test: latestTest, location });
  } catch (error) {
    console.error('Error fetching latest test result:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
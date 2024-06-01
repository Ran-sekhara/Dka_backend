const Location= require('../models/location')
const Test = require('../models/test')
const authMiddleware = require('../middleware/auth.js');

exports.createLocation = async (req, res) =>{
  try {
    const { latitude, longitude} = req.body;

    const location = await Location.create({
      latitude,
      longitude,
      id_test : Test.id_test,
    });

    res.status(200).json({ message: 'Location data stored successfully', location });
  } catch (error) {
    console.error('Error storing location data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.saveLocation = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    // For demonstration, we're simply saving the location data directly
    const location = await Location.create({
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      // Assuming id_test might be null or some default value here
      id_test: null,
    });

    res.status(200).json({ message: 'Location data saved successfully', location });
  } catch (error) {
    console.error('Error saving location data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
exports.getLatestLocation = async (req, res) => {
  try {
    const loggedInPatientId = req.user.id;
    console.log('Logged-in Patient ID:', loggedInPatientId);

    const latestTest = await Test.findOne({
      where: { id_patient: loggedInPatientId },
      order: [['createdAt', 'DESC']],
      include: Location
    });
    console.log('Latest Test:', latestTest);

    if (!latestTest) {
      console.log('No test found for the logged-in patient');
      return res.status(404).json({ message: 'No test found for the logged-in patient' });
    }

    const latestLocation = latestTest.location;
    console.log('Latest Location:', latestLocation);

    if (!latestLocation) {
      console.log('No location found for the latest test');
      return res.status(404).json({ message: 'No location found for the latest test' });
    }

    const { latitude, longitude } = latestLocation;
    console.log('Latitude:', latitude, 'Longitude:', longitude);

    res.status(200).json({ latitude, longitude });
  } catch (error) {
    console.error('Error fetching latest location:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
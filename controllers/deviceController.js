const Device = require('../models/device');
const bcrypt = require('bcrypt');
const Patient=require('../models/patient');
const moment = require('moment');
const { Op } = require('sequelize');
const Test = require('../models/test');

exports.createDevice = async (req, res) => {
  try {
    const { ref_device, id_patient } = req.body;

    console.log('Received request to create device with ref_device:', ref_device, 'and id_patient:', id_patient);

    // Check if a device with the same reference already exists
    const existingDevice = await Device.findOne({ where: { ref_device } });
    if (existingDevice) {
      console.log('Device with reference', ref_device, 'already exists.');
      return res.status(400).json({ error: 'Device with the same reference already exists' });
    }

    // Check if id_patient is provided
    if (id_patient) {
      console.log('id_patient provided. Checking if the patient is already associated with a device.');

      // Check if the patient is already associated with a device
      const existingPatientDevice = await Device.findOne({ where: { id_patient } });
      if (existingPatientDevice) {
        console.log('Patient is already associated with a device.');
        return res.status(400).json({ error: 'Patient is already associated with another device' });
      }
    }

    // Continue with device creation
    console.log('Creating device...');

    const newDevice = await Device.create({
      ref_device,
      id_patient,
    });

    console.log('Device created successfully:', newDevice);
    return res.status(201).json(newDevice);
  } catch (error) {
    console.error('Error creating device:', error);
    res.status(500).json({ error: 'Failed to create device' });
  }
};

exports.getDeviceByLoggedInPatient = async (req, res) => {
  try {
    const { patientId } = req.params;
    console.log('Fetching device for patient ID:', patientId);

    // Query the database to find the device associated with the logged-in patient
    const device = await Device.findOne({ where: { id_patient: patientId } });

    if (!device) {
      console.log('Device not found for patient ID:', patientId);
      return res.status(404).json({ error: 'Device not found for the logged-in patient' });
    }

    // Device found, return it in the response with ref_device and state
    console.log('Device found:', device);
    const { ref_device, state } = device;
    return res.status(200).json({ ref_device, state });
  } catch (error) {
    console.error('Error fetching device for logged-in patient:', error);
    return res.status(500).json({ error: 'Failed to fetch device for logged-in patient' });
  }
};


exports.getDevices = async (req, res) => {
  try {
      // Retrieve all devices where archived is false
      const devices = await Device.findAll({
          where: {
              archived: false
          }
      });
      const totalDevices = devices.length;

      // Map devices to required format
      const deviceAll = devices.map(device => ({
          ref_device: device.ref_device,
          state: device.state,
          id_patient: device.id_patient,
      }));

      // Return an object containing totalDevices and devices
      const response = {
          totalDevices,
          devices: deviceAll
      };

      // Return the response
      res.status(200).json(response);
  } catch (error) {
      console.error('Error fetching devices:', error);
      res.status(500).json({ status: false, message: 'Internal server error' });
  }
};

exports.getAllDeviceStates = async (req, res) => {
  try {
    // Retrieve all devices where archived is false
    const devices = await Device.findAll({
      where: {
        archived: false
      }
    });

    // Map each device to its state
    const deviceStates = devices.map(device => ({
      ref_device: device.ref_device,
      state: device.state
    }));

    // Return the device states as JSON response
    res.status(200).json(deviceStates);
  } catch (error) {
    console.error('Error fetching device states:', error);
    res.status(500).json({ error: 'Failed to fetch device states' });
  }
};

exports.deleteDevice = async (req, res) => {
  try {
    const { deviceId } = req.params;

    const device = await Device.findByPk(deviceId);

    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    await device.destroy();

    res.status(200).json({ message: 'Device deleted successfully' });
  } catch (error) {
    console.error('Error deleting device:', error);
    res.status(500).json({ error: 'Failed to delete device' });
  }
};

exports.updateDeviceStates = async () => {
  try {
    console.log('Starting device state update task...');

    const threeDaysAgo = moment().subtract(3, 'days').toDate();
    console.log('Three days ago:', threeDaysAgo);

    const inactiveDevices = await Device.findAll({
      where: {
        updatedAt: {
          [Op.lt]: threeDaysAgo
        }
      },
      include: [{
        model: Test,
        required: false,
        where: {
          createdAt: {
            [Op.gt]: threeDaysAgo
          }
        }
      }]
    });
    console.log('Inactive devices:', inactiveDevices);

    await Promise.all(inactiveDevices.map(async (device) => {
      console.log('Updating device:', device.id);
      await device.update({ state: 'Inactive' });
      console.log('Device updated:', device.id);
    }));

    console.log('Device states updated successfully');
  } catch (error) {
    console.error('Error updating device states:', error);
  }
};

// Schedule device state update task to run every 24 hours
setInterval(async () => {
  try {
    console.log('Running device state update task...');
    await exports.updateDeviceStates();
    console.log('Device state update task completed.');
  } catch (error) {
    console.error('Error running device state update task:', error);
  }
}, 24 * 60 * 60 * 1000);

exports.updateDevice = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { fullName } = req.body;

    console.log('Received request to update device owner. Device ID:', deviceId, 'Full Name:', fullName);

    // Check if deviceId is null or undefined
    if (!deviceId) {
      console.log('Device ID is null or undefined');
      return res.status(400).json({ error: 'Device ID is required' });
    }

    console.log('Device ID is not null or undefined');

    // If fullName is empty, set id_patient to null to remove the owner
    if (!fullName) {
      await Device.update({ id_patient: null }, { where: { ref_device: deviceId } });
      console.log('Device owner removed successfully');
      return res.status(200).json({ message: 'Device owner removed successfully' });
    }

    // Split fullName into first name and last name
    const [firstName, lastName] = fullName.split(' ');

    console.log('Searching for patient with first name:', firstName, 'and last name:', lastName);

    // Find the patient by full name
    const patient = await Patient.findOne({ 
      where: { 
        first_name: firstName,
        last_name: lastName
      } 
    });

    // If the patient is not found, return a 404 Not Found response
    if (!patient) {
      console.log('Patient not found');
      return res.status(404).json({ error: 'Patient not found' });
    }

    console.log('Patient found:', patient);

    // Check if the patient is already associated with another device
    const existingDevice = await Device.findOne({ 
      where: { 
        id_patient: patient.id_patient 
      } 
    });

    if (existingDevice && existingDevice.ref_device !== deviceId) {
      console.log('Patient is already associated with another device');
      return res.status(400).json({ error: 'This patient is already associated with another device' });
    }

    console.log('Patient is not associated with another device');

    // Find the device by ref_device
    const device = await Device.findOne({ 
      where: { 
        ref_device: deviceId
      } 
    });

    // If the device is not found, return a 404 Not Found response
    if (!device) {
      console.log('Device not found');
      return res.status(404).json({ error: 'Device not found' });
    }

    console.log('Device found:', device);

    // Update the device's id_patient with the found patient's id_patient
    device.id_patient = patient.id_patient;

    console.log('Updating device with new patient ID:', patient.id_patient);

    // Save the changes to the database
    await device.save();

    console.log('Device owner updated successfully');

    // Send a success response
    res.status(200).json({ message: 'Device owner updated successfully' });
  } catch (error) {
    // Handle errors
    console.error('Error updating device owner:', error);
    res.status(500).json({ error: 'Failed to update device owner' });
  }
};
exports.archivedDevice = async (req, res) => {
  const { deviceId } = req.params;
  console.log('Received request to archive device:', deviceId); // Print received patient ID

  try {
    const device = await Device.findByPk(deviceId);
    console.log('Device found:', device); // Print patient object

    if (!device) {
      console.log('Device not found'); // Print error message
      return res.status(404).json({ error: 'Device not found' });
    }

    // Update the archived field to true
    device.archived = true;
    await device.save();

    console.log('Device  archived successfully'); // Print success message
    res.status(200).json({ message: 'Device  archived successfully' });
  } catch (error) {
    console.error('Error archiving device:', error); // Print error message
    res.status(500).json({ error: 'Failed to archive device' });
  }
};

exports.unarchiveDevice = async (req, res) => {
  const { deviceId } = req.params;
  console.log('Received request to unarchive patient with ID:', deviceId); // Print received patient ID

  try {
    const device = await Device.findByPk(deviceId);
    console.log('Device found:', device); // Print patient object

    if (!device) {
      console.log('Device not found'); // Print error message
      return res.status(404).json({ error: 'Device not found' });
    }

    // Update the archived field to false
    device.archived = false;
    await device.save();

    console.log('Device  unarchived successfully'); // Print success message
    res.status(200).json({ message: 'Device  unarchived successfully' });
  } catch (error) {
    console.error('Error unarchiving device :', error); // Print error message
    res.status(500).json({ error: 'Failed to unarchive device' });
  }
}; 

exports.getAllArchivedDevices = async (req, res) => {
  try {
      // Retrieve all devices where archived is true
      const archivedDevices = await Device.findAll({
          where: {
              archived: true
          }
      });

      // Return the archived devices
      res.status(200).json(archivedDevices);
  } catch (error) {
      console.error('Error fetching all archived devices:', error);
      res.status(500).json({ status: false, message: 'Internal server error' });
  }
};



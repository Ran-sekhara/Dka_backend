const express = require('express');
const Test = require('../models/Test');
const Device=require('../models/device');

exports.createTest = async (req, res) => {
  try {
    const { state, acetoneqt, date, id_patient, ref_device } = req.body;

    // Check if required fields are present
    if (!state || !acetoneqt || !date || !id_patient || !ref_device) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create the test
    const test = await Test.create({
      state,
      acetoneqt,
      date,
      id_patient,
      ref_device
    });

    // Find the associated device
    const device = await Device.findByPk(ref_device);

    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    // Find the latest test associated with the device
    const latestTest = await Test.findOne({
      where: {
        ref_device
      },
      order: [['createdAt', 'DESC']]
    });

    if (!latestTest) {
      // If no test is found, set the device state to "Inactive"
      await device.update({ state: 'Inactive' });
    } else {
      // Check acetoneqt value of the latest test
      if (latestTest.acetoneqt < 0 || latestTest.acetoneqt > 1000) {
        // If the acetoneqt value is invalid, set the device state to "Malfunctioning"
        await device.update({ state: 'Malfunctioning' });
      } else {
        // If the acetoneqt value is valid, set the device state to "In use"
        await device.update({ state: 'In use' });
      }
    }

    res.status(201).json(test);
  } catch (error) {
    console.error('Error creating test:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getTests = async (req, res) => {
  const patientId = req.params.patientId;

  try {
    const tests = await Test.findAll({
      where: {
        id_patient: patientId,
        hide: false 
      },
      order: [['createdAt', 'DESC']] 
    });
    res.json(tests);
  } catch (error) {
    console.error('Error fetching tests:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.deleteTest = async (req, res) => {
  try {
    const testId = req.params.testId;

    const test = await Test.findByPk(testId);

    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }

    await test.update({ hide: true });

    res.json({ message: 'Test hidden successfully' });
  } catch (error) {
    console.error('Error hiding test:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
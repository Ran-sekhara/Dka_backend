const DkaHistory = require('../models/DkaHistory');
const MedicalFolder = require('../models/MedicalFolder'); // Import the MedicalFolder model

exports.createDkaHistory = async (req, res) => {
  try {
    const { order, acetoneqt, date, id_folder } = req.body;

    const medicalFolder = await MedicalFolder.findByPk(id_folder);
    if (!medicalFolder) {
      return res.status(404).json({ error: 'Medical folder not found' });
    }

    console.log("Creating DKA history...");

    const dkaHistory = await DkaHistory.create({
      order,
      acetoneqt,
      date,
      id_folder
    });

    console.log("DKA history created successfully:", dkaHistory);

    // Include the id_folder in the response
    res.status(201).json({ ...dkaHistory.toJSON(), id_folder });

  } catch (error) {
    console.error('Error creating DKA history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
exports.getDkaHistory = async (req, res) => {
  try {
      const medicalFolderId = req.params.medicalFolderId;

      const dkaHistory = await DkaHistory.findAll({
          where: { id_folder: medicalFolderId }
      });

      res.json({ status: true, message: 'DKA History fetched successfully', dkaHistory: dkaHistory });
  } catch (error) {
      console.error('Error fetching DKA history:', error);
      res.status(500).json({ status: false, message: 'Internal server error' });
  }
};
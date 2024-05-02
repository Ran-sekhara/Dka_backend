const DkaHistory = require('../models/DkaHistory');
const MedicalFolder = require('../models/MedicalFolder'); // Import the MedicalFolder model

exports.createDkaHistory = async (req, res) => {
  try {
    const { order, acetoneqt, date, id_folder } = req.body;

    // Check if required fields are present
  //  if (!order || !acetoneqt || !date || !id_folder) {
    //  return res.status(400).json({ error: 'Missing required fields' });
   // }

    // Verify that the MedicalFolder with the provided id_folder exists
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
      where: {
        id_folder: medicalFolderId
      }
    });

    res.json(dkaHistory);
  } catch (error) {
    console.error('Error fetching DKA history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
  //delete

  exports.deleteDkaHistory = async (req, res) => {
    try {
      const dkaHistoryId = req.params.dkaHistoryId;
  
      // Find the DKA history entry by its ID
      const dkaHistory = await DkaHistory.findByPk(dkaHistoryId);
      if (!dkaHistory) {
        console.log('DKA history not found');
        return res.status(404).json({ error: 'DKA history not found' });
      }
  
      // Delete the DKA history entry
      await dkaHistory.destroy();
      console.log('DKA history deleted successfully');
  
      res.json({ message: 'DKA history deleted successfully' });
    } catch (error) {
      console.error('Error deleting DKA history:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
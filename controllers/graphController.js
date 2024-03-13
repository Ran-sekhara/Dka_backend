const { Op } = require('sequelize');
const { Test, sequelize } = require('../models/test'); // Import sequelize object


//good state
exports.getGraphData = async (req, res) => {
    try {
      const graphData = await Test.findAll({
        attributes: [
          [sequelize.fn('date_trunc', 'month', sequelize.col('date')), 'month'],
          [sequelize.fn('count', sequelize.literal('DISTINCT id_test')), 'patientCount']
        ],
        where: {
          state: 'good',
          date: {
            [Op.not]: null
          }
        },
        group: [sequelize.fn('date_trunc', 'month', sequelize.col('date'))],
        raw: true
      });
  
      const formattedData = graphData.map(item => ({
        month: new Date(item.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        patientCount: parseInt(item.patientCount)
      }));
  
      res.json(formattedData);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };

//danger state
exports.Danger= async (req, res) => {
  try {
    const graphData = await Test.findAll({
      attributes: [
        [sequelize.fn('date_trunc', 'month', sequelize.col('date')), 'month'],
        [sequelize.fn('count', sequelize.literal('DISTINCT id_test')), 'patientCount']
      ],
      where: {
        state: 'danger',
        date: {
          [Op.not]: null
        }
      },
      group: [sequelize.fn('date_trunc', 'month', sequelize.col('date'))],
      raw: true
    });

    const formattedData = graphData.map(item => ({
      month: new Date(item.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      patientCount: parseInt(item.patientCount)
    }));

    res.json(formattedData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

//nrml state

exports.Nrml= async (req, res) => {
  try {
    const graphData = await Test.findAll({
      attributes: [
        [sequelize.fn('date_trunc', 'month', sequelize.col('date')), 'month'],
        [sequelize.fn('count', sequelize.literal('DISTINCT id_test')), 'patientCount']
      ],
      where: {
        state: 'nrml',
        date: {
          [Op.not]: null
        }
      },
      group: [sequelize.fn('date_trunc', 'month', sequelize.col('date'))],
      raw: true
    });

    const formattedData = graphData.map(item => ({
      month: new Date(item.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      patientCount: parseInt(item.patientCount)
    }));

    res.json(formattedData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
//create test
exports.createTest = async (req, res) => {
  try {
    const { state, acetoneqt, date } = req.body;

    // Validate input (customize based on your requirements)
    if (!state || !acetoneqt || !date) {
      return res.status(400).json({ error: 'Incomplete data. Please provide state, acetoneqt, and date.' });
    }

    // Create a new test record
    const newTest = await Test.create({
      state,
      acetoneqt,
      date,
    });

    res.status(201).json(newTest);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
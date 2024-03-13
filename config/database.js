const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('DKA', 'postgres', 'ikramikram', {
  host: 'localhost',
  dialect: 'postgres',
});

// Synchronize models with the database
sequelize.sync()
  .then(() => {
    console.log('Models synchronized with database');
  })
  .catch(err => {
    console.error('Error synchronizing models:', err);
  });

module.exports = sequelize;

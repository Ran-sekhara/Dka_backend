const express = require('express');
const bodyParser = require('body-parser');
const apiRoutes = require('./routes/api');
const sequelize = require('./config/database');
require('dotenv').config()

const app = express();
app.use(bodyParser.json());
app.use(express.json());

sequelize.authenticate()
  .then(() => {
    console.log('Connected to PostgreSQL database');
    app.use('/api', apiRoutes);

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Error connecting to the database:', err);
  });
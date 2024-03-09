const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const apiRoutes = require('./routes/api');
const sequelize = require('./config/database');
require('dotenv').config({ path: '.env.local' });


const app = express();
app.use(cors()); // Enable CORS
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

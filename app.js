const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes/api'); // Import your API routes
const path = require('path');

require('dotenv').config({ path: '.env.local' });

const app = express();
app.use(cors()); // Enable CORS
app.use(express.json());

// Mount API routes under the '/api' prefix
app.use('/api', apiRoutes);

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Define route for serving user_manual.pdf
app.get('/user_manual.pdf', (req, res) => {
  const filePath = path.join(__dirname, 'public', 'user_manual.pdf');
  console.log('File path:', filePath);
  
  // Set response headers
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="user_manual.pdf"');
  
  // Send the file
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error('Error sending file:', err);
      if (err.code === 'ENOENT') {
        res.status(404).send('File not found');
      } else {
        res.status(500).send('Error sending file');
      }
    }
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
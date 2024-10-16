const express = require('express');
const tronRoutes = require('./routes/tronRoutes'); // Import wallet routes
const ethRoutes = require('./routes/ethRoutes'); // Import wallet routes
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

// Middleware to parse JSON requests
app.use(bodyParser.json());

// Use the walletRoutes for any routes under /api
app.use('/api', tronRoutes);
app.use('/api', ethRoutes);

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

const express = require('express');
const walletRoutes = require('./routes/walletRoutes'); // Import wallet routes
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

// Middleware to parse JSON requests
app.use(bodyParser.json());

// Use the walletRoutes for any routes under /api
app.use('/api', walletRoutes);

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

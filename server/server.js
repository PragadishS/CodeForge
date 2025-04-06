const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const path = require('path');
const fs = require('fs');

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// Connect to MongoDB
connectDB();

// Updated CORS configuration for deployment
app.use(cors({
  origin: process.env.FRONTEND_URL || '*', // Will be your Netlify URL
  credentials: true
}));

app.use(express.json({ extended: false }));

// Create temporary directories if they don't exist
const tempCodeDir = path.resolve(process.env.TEMP_CODE_DIR || './temp/code');
const tempTestDir = path.resolve(process.env.TEMP_TEST_DIR || './temp/test');

if (!fs.existsSync(tempCodeDir)) {
  fs.mkdirSync(tempCodeDir, { recursive: true });
}

if (!fs.existsSync(tempTestDir)) {
  fs.mkdirSync(tempTestDir, { recursive: true });
}

// Define routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/problems', require('./routes/problems'));
app.use('/api/submissions', require('./routes/submissions'));

// Basic route
app.get('/', (req, res) => {
  res.json({
    msg: 'Welcome to CodeForge API',
    routes: {
      auth: '/api/auth',
      problems: '/api/problems',
      submissions: '/api/submissions'
    }
  });
});

// Serve static assets in production
// Note: When deploying backend and frontend separately, this block may not be needed
if (process.env.NODE_ENV === 'production') {
  // If you're serving frontend from the same server (not if using Netlify separately)
  app.use(express.static(path.join(__dirname, '../client/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client', 'build', 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({ error: 'Server error!' });
});

// Start server
const PORT = process.env.PORT || 9876;
app.listen(PORT, () => {
  console.log(`✅ CodeForge server running on port ${PORT}`);
});
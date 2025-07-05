const express = require('express');
const dotenv = require('dotenv');
const linkedinRoutes = require('./routes/linkedinRoutes');
const cors = require('cors'); // Added for frontend compatibility

dotenv.config();
const app = express();

// Enable CORS for Streamlit frontend
app.use(cors({
  origin: 'http://localhost:8501', // Streamlit default port
  methods: ['GET', 'POST'],
  credentials: true
}));

app.use(express.json());
app.use('/api/linkedin', linkedinRoutes);

// Basic error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
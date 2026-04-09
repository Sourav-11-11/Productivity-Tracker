const dotenv = require('dotenv');
const envPath = require('path').resolve(__dirname, '../../.env');
console.log('ENV PATH:', envPath);
dotenv.config({ path: envPath });
console.log('API KEY HEAD:', process.env.OPENAI_API_KEY ? 'EXISTS' : 'MISSING');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const cron = require('node-cron');
const { syncJobs } = require('./services/jobService');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// MongoDB Connection
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/letsmakeitdb';
    await mongoose.connect(mongoURI);
    console.log('âœ… MongoDB connected');
    
    // Initial sync
    syncJobs();
    
    // Everyday at 8 AM
    cron.schedule('0 8 * * *', () => {
      console.log('Running daily job sync cron...');
      syncJobs();
    });
  } catch (error) {
    console.error('âŒ MongoDB connection failed:', error.message);
  }
};

connectDB();

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is healthy and running.' });
});

// APIs
app.use("/api/ai", require("./routes/ai"));
app.use("/api/notes", require("./routes/notes"));
app.use("/api/jobs", require("./routes/jobs"));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const dotenv = require('dotenv');
const envPath = require('path').resolve(__dirname, '../../.env');
console.log('ENV PATH:', envPath);
dotenv.config({ path: envPath });
console.log('API KEY HEAD:', process.env.OPENAI_API_KEY ? 'EXISTS' : 'MISSING');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// MongoDB Connection
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/letsmakeitdb';
    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    // Continue without MongoDB - app will work with Dexie only
  }
};

connectDB();

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is healthy and running.' });
});

// AI analysis route
app.use("/api/ai", require("./routes/ai"));

// Notes routes
app.use("/api/notes", require("./routes/notes"));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

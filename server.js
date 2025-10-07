// server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db'); // Uses your custom DB connection helper
const mongoose = require('mongoose');

// Load environment variables
dotenv.config({ path: './.env' });

// Validate environment variables
if (!process.env.MONGODB_URI && !process.env.MONGO_URI) {
  console.error('❌ MongoDB connection string not found in .env file');
  process.exit(1);
}

// Connect to database
if (connectDB) {
  connectDB();
} else {
  mongoose
    .connect(process.env.MONGODB_URI || process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    })
    .then(() => console.log('✅ MongoDB connected'))
    .catch(err => console.error('❌ DB connection error:', err));
}

// Initialize app
const app = express();

// ===== Middleware =====
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===== Serve static uploads =====
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ===== Import Routes =====
const authRoutes = require('./routes/authRoute');
const profileRoutes = require('./routes/profileRoutes');
const serviceProviderRoutes = require('./routes/serviceProviderRoutes');

// ===== API Routes =====
// Use versioned prefixes for better scalability
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/profile', profileRoutes);
app.use('/api/v1/service-providers', serviceProviderRoutes);

// ===== Health Check =====
app.get('/', (req, res) => {
  res.json({ message: '✅ LocalLink API is running successfully' });
});

app.get('/api/v1/test', (req, res) => {
  res.json({ message: '✅ API Test Route Working' });
});

// ===== 404 Handler =====
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `🚫 Route not found: ${req.originalUrl}`
  });
});

// ===== Error Handling Middleware =====
app.use((err, req, res, next) => {
  console.error('🔥 Error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Something went wrong!',
    error:
      process.env.NODE_ENV === 'development'
        ? err
        : 'An unexpected error occurred'
  });
});

// ===== Start Server =====
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV || 'production'} mode on port ${PORT}`);
});

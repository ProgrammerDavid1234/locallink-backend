const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

// Routes
const serviceProviderRoutes = require('./routes/serviceProviderRoutes');
const authRoutes = require('./routes/authRoute');

// Load environment variables
dotenv.config({ path: './.env' });

// Verify environment variables
if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI is not defined in .env file');
    process.exit(1);
}

// Connect to database
mongoose
    .connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
    .then(() => console.log('✅ DB connected'))
    .catch(err => console.error('❌ DB connection error:', err));

// Initialize app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Simple test route
app.get('/api/test', (req, res) => {
    res.json({ message: 'API working' });
});

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/service-providers', serviceProviderRoutes);

// Handle unhandled routes
app.use((req, res) => {
    res.status(404).json({
        status: 'fail',
        message: `Can't find ${req.originalUrl} on this server!`
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        status: 'error',
        message: 'Something went wrong!'
    });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});

// routes/serviceProviderRoutes.js
const express = require('express');
const router = express.Router();
const serviceProviderController = require('../Controllers/serviceProviderController');
const { protect } = require('../middlesware/authMiddleware');
const multer = require('multer');

// File upload middleware
const upload = multer({ dest: 'uploads/' });

// ===== Public Routes =====
router.post('/signup', upload.single('image'), serviceProviderController.signup);
router.post('/login', serviceProviderController.login);
router.get('/', serviceProviderController.getAllServiceProviders);

// ===== Protected Routes (Require Authentication) =====

// 📊 Dashboard
router.get('/dashboard/stats', protect, serviceProviderController.getDashboard);

// 💰 Earnings
router.get('/earnings/summary', protect, serviceProviderController.getEarnings);

// 📝 Jobs/Requests
router.get('/jobs/pending', protect, serviceProviderController.getPendingJobs);
router.get('/jobs/:jobId', protect, serviceProviderController.getJobDetails);

// ✅ Job Actions
router.patch('/jobs/:jobId/accept', protect, serviceProviderController.acceptJob);
router.patch('/jobs/:jobId/complete', protect, serviceProviderController.completeJob);
router.patch('/jobs/:jobId/cancel', protect, serviceProviderController.cancelJob);

// 📱 Availability
router.patch('/availability', protect, serviceProviderController.updateAvailability);

module.exports = router;
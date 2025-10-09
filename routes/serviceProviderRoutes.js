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

// ✨ NEW: Service Provider's Own Job Posting (PostJob screen)
router.post('/jobs/post', protect, upload.single('logo'), serviceProviderController.postProviderJob);
router.get('/jobs/my-posted', protect, serviceProviderController.getProviderPostedJobs);
router.get('/jobs/my-posted/:jobId', protect, serviceProviderController.getProviderJobDetails);
router.patch('/jobs/my-posted/:jobId', protect, upload.single('logo'), serviceProviderController.updateProviderJob);
router.patch('/jobs/my-posted/:jobId/cancel', protect, serviceProviderController.cancelProviderJob);

// ✅ Job Actions
router.patch('/jobs/:jobId/accept', protect, serviceProviderController.acceptJob);
router.patch('/jobs/:jobId/complete', protect, serviceProviderController.completeJob);
router.patch('/jobs/:jobId/cancel', protect, serviceProviderController.cancelJob);

// 📱 Availability
router.patch('/availability', protect, serviceProviderController.updateAvailability);

// 💳 Credits
router.get('/credits', protect, serviceProviderController.getCredits);

module.exports = router;
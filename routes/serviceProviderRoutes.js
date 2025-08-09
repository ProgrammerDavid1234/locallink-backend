const express = require('express');
const router = express.Router();
const serviceProviderController = require('../Controllers/serviceProviderController');
const ServiceProvider = require('../models/ServiceProvider'); // ✅ Import model

// File upload middleware (optional)
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

router.post('/signup', upload.single('image'), serviceProviderController.signup);
router.post('/login', serviceProviderController.login);
router.get('/', async (req, res) => {
    try {
        const serviceProviders = await ServiceProvider.find();
        res.status(200).json({
            status: 'success',
            count: serviceProviders.length,
            data: serviceProviders
        });
    } catch (error) {
        console.error('Error fetching service providers:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch service providers'
        });
    }
});
module.exports = router;

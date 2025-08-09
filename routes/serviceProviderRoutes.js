const express = require('express');
const router = express.Router();
const serviceProviderController = require('../Controllers/serviceProviderController');

// File upload middleware (optional)
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

router.post('/signup', upload.single('image'), serviceProviderController.signup);
router.post('/login', serviceProviderController.login);

module.exports = router;

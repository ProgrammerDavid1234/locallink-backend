const express = require('express');
const authController = require('../Controllers/authControllers');

const router = express.Router();

// Simple routes without parameters first
router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected route example
router.get('/me', authController.protect, (req, res) => {
  res.status(200).json({
    status: 'success',
    data: {
      user: req.user
    }
  });
});

module.exports = router;
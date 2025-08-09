const express = require('express');
const router = express.Router();
const User = require('../models/User'); // Adjust path to your User model
const authMiddleware = require('../middlesware/authMiddleware'); // JWT auth middleware

// GET profile - logged-in user only
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password'); // remove password from response
        if (!user) return res.status(404).json({ message: 'User not found' });

        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// UPDATE profile - logged-in user only
router.put('/me', authMiddleware, async (req, res) => {
    try {
        const { username, email } = req.body; // add other editable fields here

        const updatedUser = await User.findByIdAndUpdate(
            req.user.id,
            { username, email },
            { new: true, runValidators: true }
        ).select('-password');

        if (!updatedUser) return res.status(404).json({ message: 'User not found' });

        res.json({ message: 'Profile updated successfully', user: updatedUser });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;

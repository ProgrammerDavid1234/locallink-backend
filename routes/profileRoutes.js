// routes/profileRoutes.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middlesware/authMiddleware');
const multer = require('multer');
const path = require('path');

// ===== Multer Configuration =====
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/avatars');
  },
  filename: (req, file, cb) => {
    cb(
      null,
      `${req.user.id}_${Date.now()}${path.extname(file.originalname)}`
    );
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // max 5MB
  fileFilter: (req, file, cb) => {
    const fileTypes = /jpeg|jpg|png/;
    const extname = fileTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimeType = fileTypes.test(file.mimetype);
    if (extname && mimeType) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, JPG, and PNG files are allowed'));
    }
  }
});

// ===== Routes =====

// @route   GET /api/profile
// @desc    Get logged-in user's profile
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user)
      return res.status(404).json({ message: 'User not found' });

    res.json(user);
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/profile
// @desc    Update user profile (text fields + optional image upload)
// @access  Private
router.put('/', protect, upload.single('avatar'), async (req, res) => {
  try {
    const updates = { ...req.body };

    // If user uploads a profile picture, save its path
    if (req.file) {
      updates.avatar = `/uploads/avatars/${req.file.filename}`;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser)
      return res.status(404).json({ message: 'User not found' });

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/profile/upload-picture
// @desc    Upload profile picture only
// @access  Private
router.post(
  '/upload-picture',
  protect,
  upload.single('avatar'),
  async (req, res) => {
    try {
      if (!req.file)
        return res.status(400).json({ message: 'No file uploaded' });

      const updatedUser = await User.findByIdAndUpdate(
        req.user.id,
        { avatar: `/uploads/avatars/${req.file.filename}` },
        { new: true }
      ).select('-password');

      res.json({
        message: 'Profile picture updated successfully',
        user: updatedUser
      });
    } catch (error) {
      res
        .status(500)
        .json({ message: 'Server error', error: error.message });
    }
  }
);

module.exports = router;



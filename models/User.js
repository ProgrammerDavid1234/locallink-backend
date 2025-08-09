const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
    select: false
  },
  role: {
    type: String,
    enum: ['user', 'service_provider', 'admin'],
    default: 'user'
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  services: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create geospatial index
UserSchema.index({ location: '2dsphere' });

// Hash password before saving
UserSchema.pre('save', async function(next) {
  // Only hash if password was modified
  if (!this.isModified('password')) return next();
  
  try {
    // Hash password with cost factor of 12
    this.password = await bcrypt.hash(this.password, 12);
    next();
  } catch (err) {
    next(err);
  }
});

// Instance method to compare passwords
UserSchema.methods.correctPassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);


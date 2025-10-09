// models/ServiceProvider.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const serviceProviderSchema = new mongoose.Schema({
    businessName: {
        type: String,
        required: [true, 'Please provide your business name']
    },
    email: {
        type: String,
        required: [true, 'Please provide your email'],
        unique: true,
        lowercase: true
    },
    image: {
        type: String,
        default: null
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: 8,
        select: false
    },
    phoneNumber: {
        type: String
    },
    serviceType: {
        type: String
    },
    description: {
        type: String
    },
    availableDates: {
        type: [Date]
    },
    availableTimes: {
        type: [String]
    },
    location: {
        type: String
    },
    // ✅ NEW: Availability status
    isOnline: {
        type: Boolean,
        default: true
    },
    lastActive: {
        type: Date,
        default: Date.now
    },
    // ✅ NEW: Earnings tracking
    earnings: {
        today: {
            type: Number,
            default: 0
        },
        total: {
            type: Number,
            default: 0
        },
        lastUpdated: {
            type: Date,
            default: Date.now
        }
    },
    // ✅ NEW: Rating and reviews
    rating: {
        average: {
            type: Number,
            default: 0,
            min: 0,
            max: 5
        },
        totalReviews: {
            type: Number,
            default: 0
        }
    },
    // ✅ NEW: Stats
    completedJobs: {
        type: Number,
        default: 0
    },
    cancelledJobs: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Hash password before saving
serviceProviderSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

// Password check method
serviceProviderSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
};

// Method to update daily earnings
serviceProviderSchema.methods.updateTodayEarnings = async function (amount) {
    this.earnings.today += amount;
    this.earnings.total += amount;
    this.earnings.lastUpdated = Date.now();
    return await this.save();
};

// Method to reset daily earnings (call at midnight)
serviceProviderSchema.methods.resetDailyEarnings = async function () {
    this.earnings.today = 0;
    return await this.save();
};

const ServiceProvider = mongoose.model('ServiceProvider', serviceProviderSchema);
module.exports = ServiceProvider;
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
        type: String, // store URL or file path
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
        type: [Date] // array of available dates
    },
    availableTimes: {
        type: [String] // e.g., ["9:00 AM - 12:00 PM", "1:00 PM - 4:00 PM"]
    },
    location: {
        type: String
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

const ServiceProvider = mongoose.model('ServiceProvider', serviceProviderSchema);
module.exports = ServiceProvider;

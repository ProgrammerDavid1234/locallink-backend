// models/ServiceProviderJob.js
const mongoose = require('mongoose');

const serviceProviderJobSchema = new mongoose.Schema({
    // Service provider who posted the job/request
    serviceProvider: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ServiceProvider',
        required: [true, 'Service provider is required']
    },
    serviceProviderName: {
        type: String,
        required: [true, 'Service provider name is required']
    },
    serviceProviderEmail: {
        type: String,
        required: [true, 'Service provider email is required']
    },
    serviceProviderPhone: {
        type: String
    },

    // Job details
    title: {
        type: String,
        required: [true, 'Job title is required']
    },
    description: {
        type: String,
        required: [true, 'Job description is required']
    },
    category: {
        type: String,
        required: [true, 'Category is required']
    },
    price: {
        type: Number,
        required: [true, 'Price is required'],
        min: 0
    },
    logo: {
        type: String,
        default: null
    },

    // Status tracking
    status: {
        type: String,
        enum: ['pending', 'active', 'completed', 'cancelled'],
        default: 'pending'
    },

    // Scheduling
    scheduledDate: {
        type: Date,
        default: null
    },
    scheduledTime: {
        type: String,
        default: null
    },
    location: {
        type: String,
        default: null
    },

    // Pricing
    postingCost: {
        type: Number,
        default: 50 // Credits deducted for posting
    },

    // Additional details
    notes: {
        type: String,
        default: null
    },

    completedAt: {
        type: Date,
        default: null
    },

    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Index for faster queries
serviceProviderJobSchema.index({ serviceProvider: 1, status: 1 });
serviceProviderJobSchema.index({ category: 1 });
serviceProviderJobSchema.index({ createdAt: -1 });

const ServiceProviderJob = mongoose.model('ServiceProviderJob', serviceProviderJobSchema);
module.exports = ServiceProviderJob;
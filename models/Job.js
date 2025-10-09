// models/Job.js
const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
    clientName: {
        type: String,
        required: [true, 'Client name is required']
    },
    clientEmail: {
        type: String,
        required: [true, 'Client email is required']
    },
    clientPhone: {
        type: String
    },
    clientImage: {
        type: String,
        default: null
    },
    serviceProvider: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ServiceProvider',
        required: [true, 'Service provider is required']
    },
    serviceType: {
        type: String,
        required: [true, 'Service type is required']
    },
    description: {
        type: String
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'in-progress', 'completed', 'cancelled'],
        default: 'pending'
    },
    scheduledDate: {
        type: Date,
        required: [true, 'Scheduled date is required']
    },
    scheduledTime: {
        type: String,
        required: [true, 'Scheduled time is required']
    },
    location: {
        type: String,
        required: [true, 'Location is required']
    },
    budget: {
        type: Number,
        required: [true, 'Budget is required']
    },
    actualCost: {
        type: Number,
        default: null
    },
    notes: {
        type: String
    },
    rating: {
        score: {
            type: Number,
            min: 1,
            max: 5
        },
        review: String
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
jobSchema.index({ serviceProvider: 1, status: 1 });
jobSchema.index({ createdAt: -1 });

const Job = mongoose.model('Job', jobSchema);
module.exports = Job;
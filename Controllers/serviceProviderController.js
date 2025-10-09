// Controllers/serviceProviderController.js
const jwt = require('jsonwebtoken');
const ServiceProvider = require('../models/ServiceProvider');
const Job = require('../models/Job');
const ServiceProviderJob = require('../models/ServiceProviderJob');
const bcrypt = require('bcryptjs');

const signToken = id => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
};

// 📌 Signup
exports.signup = async (req, res) => {
    try {
        const {
            businessName, email, password, phoneNumber, serviceType, description,
            availableDates, availableTimes, location
        } = req.body;

        const image = req.file ? req.file.path : null;

        const newServiceProvider = await ServiceProvider.create({
            businessName,
            email,
            password,
            phoneNumber,
            serviceType,
            description,
            availableDates,
            availableTimes,
            location,
            image
        });

        const token = signToken(newServiceProvider._id);
        res.status(201).json({
            status: 'success',
            token,
            data: {
                serviceProvider: newServiceProvider
            }
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
};

// 📌 Login
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                status: 'fail',
                message: 'Please provide email and password'
            });
        }

        const serviceProvider = await ServiceProvider.findOne({ email }).select('+password');

        if (!serviceProvider || !(await serviceProvider.correctPassword(password, serviceProvider.password))) {
            return res.status(401).json({
                status: 'fail',
                message: 'Incorrect email or password'
            });
        }

        const token = signToken(serviceProvider._id);
        res.status(200).json({
            status: 'success',
            token,
            data: {
                serviceProvider
            }
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            message: err.message
        });
    }
};

// 📌 Get Dashboard Data
exports.getDashboard = async (req, res) => {
    try {
        const serviceProviderId = req.userId;

        const serviceProvider = await ServiceProvider.findById(serviceProviderId);

        if (!serviceProvider) {
            return res.status(404).json({
                status: 'fail',
                message: 'Service provider not found'
            });
        }

        // Get pending jobs count
        const pendingJobsCount = await Job.countDocuments({
            serviceProvider: serviceProviderId,
            status: 'pending'
        });

        res.status(200).json({
            status: 'success',
            data: {
                isOnline: serviceProvider.isOnline,
                lastActive: serviceProvider.lastActive,
                earningsToday: serviceProvider.earnings.today,
                earningsTotal: serviceProvider.earnings.total,
                pendingJobsCount,
                completedJobs: serviceProvider.completedJobs,
                cancelledJobs: serviceProvider.cancelledJobs,
                rating: serviceProvider.rating
            }
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            message: err.message
        });
    }
};

// 📌 Get Pending Jobs (Jobs assigned to provider by clients)
exports.getPendingJobs = async (req, res) => {
    try {
        const serviceProviderId = req.userId;
        const { status = 'pending', limit = 10, page = 1 } = req.query;

        const jobs = await Job.find({
            serviceProvider: serviceProviderId,
            status: status
        })
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Job.countDocuments({
            serviceProvider: serviceProviderId,
            status: status
        });

        res.status(200).json({
            status: 'success',
            count: jobs.length,
            total,
            page,
            pages: Math.ceil(total / limit),
            data: jobs.map(job => ({
                id: job._id,
                clientName: job.clientName,
                clientEmail: job.clientEmail,
                clientImage: job.clientImage,
                serviceType: job.serviceType,
                status: job.status,
                scheduledDate: job.scheduledDate,
                scheduledTime: job.scheduledTime,
                location: job.location,
                budget: job.budget,
                description: job.description
            }))
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            message: err.message
        });
    }
};

// 📌 Get Job Details
exports.getJobDetails = async (req, res) => {
    try {
        const { jobId } = req.params;
        const serviceProviderId = req.userId;

        const job = await Job.findOne({
            _id: jobId,
            serviceProvider: serviceProviderId
        });

        if (!job) {
            return res.status(404).json({
                status: 'fail',
                message: 'Job not found'
            });
        }

        res.status(200).json({
            status: 'success',
            data: job
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            message: err.message
        });
    }
};

// 📌 Get Earnings Summary
exports.getEarnings = async (req, res) => {
    try {
        const serviceProviderId = req.userId;
        const { period = 'all' } = req.query;

        const serviceProvider = await ServiceProvider.findById(serviceProviderId);

        if (!serviceProvider) {
            return res.status(404).json({
                status: 'fail',
                message: 'Service provider not found'
            });
        }

        const completedJobs = await Job.find({
            serviceProvider: serviceProviderId,
            status: 'completed'
        }).select('actualCost createdAt');

        let earningsByDate = {};
        completedJobs.forEach(job => {
            if (job.actualCost) {
                const date = new Date(job.createdAt).toLocaleDateString();
                earningsByDate[date] = (earningsByDate[date] || 0) + job.actualCost;
            }
        });

        res.status(200).json({
            status: 'success',
            data: {
                earningsToday: serviceProvider.earnings.today,
                earningsTotal: serviceProvider.earnings.total,
                completedJobs: serviceProvider.completedJobs,
                earningsByDate,
                lastUpdated: serviceProvider.earnings.lastUpdated
            }
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            message: err.message
        });
    }
};

// 📌 Update Availability Status
exports.updateAvailability = async (req, res) => {
    try {
        const serviceProviderId = req.userId;
        const { isOnline } = req.body;

        const serviceProvider = await ServiceProvider.findByIdAndUpdate(
            serviceProviderId,
            {
                isOnline,
                lastActive: Date.now()
            },
            { new: true }
        );

        res.status(200).json({
            status: 'success',
            data: {
                isOnline: serviceProvider.isOnline,
                lastActive: serviceProvider.lastActive
            }
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            message: err.message
        });
    }
};

// 📌 Accept Job (from client)
exports.acceptJob = async (req, res) => {
    try {
        const { jobId } = req.params;
        const serviceProviderId = req.userId;

        const job = await Job.findOneAndUpdate(
            {
                _id: jobId,
                serviceProvider: serviceProviderId,
                status: 'pending'
            },
            { status: 'accepted', updatedAt: Date.now() },
            { new: true }
        );

        if (!job) {
            return res.status(404).json({
                status: 'fail',
                message: 'Job not found or already accepted'
            });
        }

        res.status(200).json({
            status: 'success',
            message: 'Job accepted successfully',
            data: job
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            message: err.message
        });
    }
};

// 📌 Complete Job (from client)
exports.completeJob = async (req, res) => {
    try {
        const { jobId } = req.params;
        const { actualCost } = req.body;
        const serviceProviderId = req.userId;

        const job = await Job.findOneAndUpdate(
            {
                _id: jobId,
                serviceProvider: serviceProviderId,
                status: { $in: ['accepted', 'in-progress'] }
            },
            {
                status: 'completed',
                actualCost,
                updatedAt: Date.now()
            },
            { new: true }
        );

        if (!job) {
            return res.status(404).json({
                status: 'fail',
                message: 'Job not found or cannot be completed'
            });
        }

        // Update service provider earnings
        const serviceProvider = await ServiceProvider.findById(serviceProviderId);
        serviceProvider.completedJobs += 1;
        await serviceProvider.updateTodayEarnings(actualCost);

        res.status(200).json({
            status: 'success',
            message: 'Job completed successfully',
            data: job
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            message: err.message
        });
    }
};

// 📌 Cancel Job (from client)
exports.cancelJob = async (req, res) => {
    try {
        const { jobId } = req.params;
        const { reason } = req.body;
        const serviceProviderId = req.userId;

        const job = await Job.findOneAndUpdate(
            {
                _id: jobId,
                serviceProvider: serviceProviderId,
                status: { $in: ['pending', 'accepted'] }
            },
            {
                status: 'cancelled',
                notes: reason,
                updatedAt: Date.now()
            },
            { new: true }
        );

        if (!job) {
            return res.status(404).json({
                status: 'fail',
                message: 'Job not found or cannot be cancelled'
            });
        }

        // Update service provider
        const serviceProvider = await ServiceProvider.findById(serviceProviderId);
        serviceProvider.cancelledJobs += 1;
        await serviceProvider.save();

        res.status(200).json({
            status: 'success',
            message: 'Job cancelled successfully',
            data: job
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            message: err.message
        });
    }
};

// ✨ ===== NEW: SERVICE PROVIDER JOB POSTING ENDPOINTS =====

// 📌 Post a Job/Request (Service Provider posts what they're offering/looking for)
exports.postProviderJob = async (req, res) => {
    try {
        const serviceProviderId = req.userId;
        const {
            title, description, category, price, 
            scheduledDate, scheduledTime, location, notes
        } = req.body;

        // Get service provider details
        const serviceProvider = await ServiceProvider.findById(serviceProviderId);

        if (!serviceProvider) {
            return res.status(404).json({
                status: 'fail',
                message: 'Service provider not found'
            });
        }

        // Check if provider has enough credits
        if (serviceProvider.credits.available < 50) {
            return res.status(400).json({
                status: 'fail',
                message: 'Insufficient credits. You need at least 50 credits to post a job.'
            });
        }

        const logo = req.file ? req.file.path : null;

        // Create service provider job
        const newJob = await ServiceProviderJob.create({
            serviceProvider: serviceProviderId,
            serviceProviderName: serviceProvider.businessName,
            serviceProviderEmail: serviceProvider.email,
            serviceProviderPhone: serviceProvider.phoneNumber,
            title,
            description,
            category,
            price,
            logo,
            scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
            scheduledTime: scheduledTime || null,
            location: location || serviceProvider.location,
            notes: notes || null,
            postingCost: 50
        });

        // Deduct credits from service provider
        serviceProvider.credits.available -= 50;
        serviceProvider.credits.spent += 50;
        serviceProvider.credits.lastUpdated = Date.now();
        await serviceProvider.save();

        res.status(201).json({
            status: 'success',
            message: 'Job posted successfully',
            data: {
                job: newJob,
                creditsRemaining: serviceProvider.credits.available
            }
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
};

// 📌 Get Service Provider's Posted Jobs
exports.getProviderPostedJobs = async (req, res) => {
    try {
        const serviceProviderId = req.userId;
        const { status = 'pending', limit = 10, page = 1 } = req.query;

        const jobs = await ServiceProviderJob.find({
            serviceProvider: serviceProviderId,
            ...(status && { status })
        })
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await ServiceProviderJob.countDocuments({
            serviceProvider: serviceProviderId,
            ...(status && { status })
        });

        res.status(200).json({
            status: 'success',
            count: jobs.length,
            total,
            page,
            pages: Math.ceil(total / limit),
            data: jobs.map(job => ({
                id: job._id,
                title: job.title,
                description: job.description,
                category: job.category,
                price: job.price,
                status: job.status,
                scheduledDate: job.scheduledDate,
                scheduledTime: job.scheduledTime,
                location: job.location,
                createdAt: job.createdAt,
                logo: job.logo
            }))
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            message: err.message
        });
    }
};

// 📌 Get Provider Job Details
exports.getProviderJobDetails = async (req, res) => {
    try {
        const { jobId } = req.params;
        const serviceProviderId = req.userId;

        const job = await ServiceProviderJob.findOne({
            _id: jobId,
            serviceProvider: serviceProviderId
        });

        if (!job) {
            return res.status(404).json({
                status: 'fail',
                message: 'Job not found'
            });
        }

        res.status(200).json({
            status: 'success',
            data: job
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            message: err.message
        });
    }
};

// 📌 Update Provider Job
exports.updateProviderJob = async (req, res) => {
    try {
        const { jobId } = req.params;
        const serviceProviderId = req.userId;
        const { title, description, category, price, scheduledDate, scheduledTime, location, notes } = req.body;

        const job = await ServiceProviderJob.findOneAndUpdate(
            {
                _id: jobId,
                serviceProvider: serviceProviderId,
                status: 'pending'
            },
            {
                title,
                description,
                category,
                price,
                scheduledDate: scheduledDate ? new Date(scheduledDate) : job.scheduledDate,
                scheduledTime,
                location,
                notes,
                updatedAt: Date.now()
            },
            { new: true }
        );

        if (!job) {
            return res.status(404).json({
                status: 'fail',
                message: 'Job not found or cannot be updated'
            });
        }

        res.status(200).json({
            status: 'success',
            message: 'Job updated successfully',
            data: job
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            message: err.message
        });
    }
};

// 📌 Cancel Provider Job
exports.cancelProviderJob = async (req, res) => {
    try {
        const { jobId } = req.params;
        const serviceProviderId = req.userId;

        const job = await ServiceProviderJob.findOneAndUpdate(
            {
                _id: jobId,
                serviceProvider: serviceProviderId,
                status: { $in: ['pending', 'active'] }
            },
            {
                status: 'cancelled',
                updatedAt: Date.now()
            },
            { new: true }
        );

        if (!job) {
            return res.status(404).json({
                status: 'fail',
                message: 'Job not found or cannot be cancelled'
            });
        }

        // Refund credits if job is pending
        if (job.status === 'pending') {
            const serviceProvider = await ServiceProvider.findById(serviceProviderId);
            serviceProvider.credits.available += 50;
            serviceProvider.credits.spent -= 50;
            await serviceProvider.save();
        }

        res.status(200).json({
            status: 'success',
            message: 'Job cancelled successfully',
            data: job
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            message: err.message
        });
    }
};

// 📌 Get All Service Providers
exports.getAllServiceProviders = async (req, res) => {
    try {
        const serviceProviders = await ServiceProvider.find().select('-password');
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
};
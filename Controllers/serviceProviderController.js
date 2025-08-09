const jwt = require('jsonwebtoken');
const ServiceProvider = require('../models/ServiceProvider');
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

        const image = req.file ? req.file.path : null; // if using multer for uploads

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

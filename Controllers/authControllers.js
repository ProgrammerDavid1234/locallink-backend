const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');

const signToken = id => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
};

exports.register = async (req, res) => {
    try {
        const newUser = await User.create({
            username: req.body.username,
            email: req.body.email,
            password: req.body.password,
            role: req.body.role,
            location: {
                type: 'Point',
                coordinates: [req.body.longitude, req.body.latitude]
            }
        });

        const token = signToken(newUser._id);

        res.status(201).json({
            status: 'success',
            token,
            data: {
                user: newUser
            }
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1) Check if email and password exist
        if (!email || !password) {
            return res.status(400).json({
                status: 'fail',
                message: 'Please provide email and password'
            });
        }

        // 2) Check if user exists and password is correct
        const user = await User.findOne({ email }).select('+password');
        if (!user || !(await user.correctPassword(password, user.password))) {
            return res.status(401).json({
                status: 'fail',
                message: 'Incorrect email or password'
            });
        }

        // 3) If everything is okay, send token to client
        const token = signToken(user._id);

        // Optional: remove password from output
        user.password = undefined;

        res.status(200).json({
            status: 'success',
            token,
            data: {
                user
            }
        });

    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong while logging in'
        });
    }
};
exports.protect = async (req, res, next) => {
    try {
        // 1) Getting token and check if it's there
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            throw new Error('You are not logged in! Please log in to get access');
        }

        // 2) Verification token
        const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

        // 3) Check if user still exists
        const currentUser = await User.findById(decoded.id);
        if (!currentUser) {
            throw new Error('The user belonging to this token does no longer exist');
        }

        // GRANT ACCESS TO PROTECTED ROUTE
        req.user = currentUser;
        next();
    } catch (err) {
        res.status(401).json({
            status: 'fail',
            message: err.message
        });
    }
};
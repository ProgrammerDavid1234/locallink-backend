// middlesware/authMiddleware.js
const jwt = require('jsonwebtoken');
const ServiceProvider = require('../models/ServiceProvider');

exports.protect = async (req, res, next) => {
    try {
        let token;

        // 1. Get token from headers
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        // 2. Check if token exists
        if (!token) {
            return res.status(401).json({
                status: 'fail',
                message: 'You are not logged in! Please log in to get access.'
            });
        }

        // 3. Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 4. Check if service provider still exists
        const currentServiceProvider = await ServiceProvider.findById(decoded.id);
        if (!currentServiceProvider) {
            return res.status(401).json({
                status: 'fail',
                message: 'The service provider belonging to this token no longer exists.'
            });
        }

        // 5. Grant access to protected route
        req.user = currentServiceProvider;
        req.userId = decoded.id;
        next();
    } catch (err) {
        return res.status(401).json({
            status: 'fail',
            message: 'Invalid token or session expired'
        });
    }
};

exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                status: 'fail',
                message: 'You do not have permission to perform this action'
            });
        }
        next();
    };
};
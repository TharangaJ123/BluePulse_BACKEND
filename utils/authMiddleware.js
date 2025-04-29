const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
    console.log('Authenticating token...');
    const authHeader = req.headers['authorization'];
    console.log('Auth header:', authHeader);
    
    const token = authHeader && authHeader.split(' ')[1];
    console.log('Extracted token:', token ? 'Token exists' : 'No token');

    if (!token) {
        console.log('No token provided');
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    try {
        console.log('Verifying token...');
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Token verified. User data:', verified);
        req.user = verified;
        next();
    } catch (err) {
        console.error('Token verification failed:', err);
        res.status(400).json({ error: 'Invalid token' });
    }
};

// Middleware to check user role
const checkRole = (roles) => {
    return (req, res, next) => {
        console.log('Checking user role...');
        if (!req.user) {
            console.log('No user data found');
            return res.status(401).json({ error: 'Access denied. No token provided.' });
        }

        console.log('User role:', req.user.role);
        console.log('Required roles:', roles);
        
        if (!roles.includes(req.user.role)) {
            console.log('Insufficient permissions');
            return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
        }

        console.log('Role check passed');
        next();
    };
};

// Middleware to get user profile
const getUserProfile = async (req, res, next) => {
    try {
        console.log('Getting user profile...');
        console.log('User ID from token:', req.user.id);
        
        const user = await User.findById(req.user.id).select('-password_hash');
        if (!user) {
            console.log('User not found in database');
            return res.status(404).json({ error: 'User not found' });
        }
        
        console.log('User profile found:', user._id);
        req.userProfile = user;
        next();
    } catch (err) {
        console.error('Error getting user profile:', err);
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = {
    authenticateToken,
    checkRole,
    getUserProfile
}; 
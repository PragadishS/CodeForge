const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to authenticate user
exports.authenticate = async (req, res, next) => {
  try {
    // Getting token from header
    const token = req.header('x-auth-token');

    // Checking if token exists
    if (!token) {
      return res.status(401).json({ error: 'No token, authorization denied' });
    }

    // Verifing token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Finding user by id
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    req.user = user;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err.message);
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    res.status(500).json({ error: 'Server error' });
  }
};

// Middleware to check if user is admin
exports.isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ error: 'Access denied. Admin role required.' });
};

// Middleware to check if user is owner of the resource
exports.isOwnerOrAdmin = (resource, idParam = 'id') => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params[idParam];
      const Model = require(`../models/${resource}`);
      
      const item = await Model.findById(resourceId);
      
      if (!item) {
        return res.status(404).json({ error: `${resource} not found` });
      }
      
      // Allowing if admin or owner
      if (
        req.user.role === 'admin' || 
        (item.author && item.author.toString() === req.user._id.toString()) ||
        (item.user && item.user.toString() === req.user._id.toString())
      ) {
        req.resourceItem = item; // Attaching resource to request for later use
        return next();
      }
      
      return res.status(403).json({ error: 'Not authorized to access this resource' });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Server error' });
    }
  };
};
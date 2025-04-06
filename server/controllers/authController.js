const { validationResult } = require('express-validator');
const User = require('../models/User');

// @route   POST api/auth/register
// @desc    Registering a new user
// @access  Public
exports.register = async (req, res) => {
  // Validating request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, email, password } = req.body;

  try {
    // Checking if user already exists
    let userByEmail = await User.findOne({ email });
    if (userByEmail) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    let userByUsername = await User.findOne({ username });
    if (userByUsername) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    // Creating new user
    const user = new User({
      username,
      email,
      password
    });

    // Saving user to database
    await user.save();

    // Generating JWT token
    const token = user.generateAuthToken();

    res.status(201).json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @route   POST api/auth/login
// @desc    Authenticating user & getting token
// @access  Public
exports.login = async (req, res) => {
  // Validating request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    // Checking if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Checking password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Generating JWT token
    const token = user.generateAuthToken();

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
        bio: user.bio
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @route   GET api/auth/me
// @desc    Getting current user
// @access  Private
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @route   PUT api/auth/profile
// @desc    Updating user profile
// @access  Private
exports.updateProfile = async (req, res) => {
  const { bio, profileImage } = req.body;

  try {
    const user = await User.findById(req.user.id);
    
    if (bio !== undefined) user.bio = bio;
    if (profileImage !== undefined) user.profileImage = profileImage;
    
    await user.save();
    
    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
        bio: user.bio
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};
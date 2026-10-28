/**
 * FreshCart - Auth Controller
 * User Authentication & Session Management
 */

const { isMongo, store } = require('../config/db');
const User = require('../models/User');

// Helper to generate simple token (works even if jwt package is absent)
const generateAuthToken = (user) => {
  try {
    const jwt = require('jsonwebtoken');
    return jwt.sign(
      { id: user.id || user._id, role: user.role, email: user.email },
      process.env.JWT_SECRET || 'freshcart_secret_2026',
      { expiresIn: '7d' }
    );
  } catch (err) {
    // Zero-dependency token generator
    return Buffer.from(JSON.stringify({
      id: user.id || user._id,
      email: user.email,
      role: user.role,
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000
    })).toString('base64');
  }
};

// @desc    Register a new customer
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Please provide name, email, and password' });
    }

    if (isMongo() && User) {
      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(400).json({ success: false, error: 'User already exists with this email' });
      }

      const user = await User.create({
        name,
        email,
        password,
        phone: phone || '9876543210',
        role: role || 'customer'
      });

      const token = generateAuthToken(user);
      return res.status(201).json({
        success: true,
        token,
        user: { id: user._id, name: user.name, email: user.email, role: user.role }
      });
    }

    const existing = store.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return res.status(400).json({ success: false, error: 'User already exists with this email' });
    }

    const newUser = {
      id: `usr_${Date.now()}`,
      name,
      email,
      password, // In full production, hashed with bcryptjs
      phone: phone || '9876543210',
      role: role || 'customer',
      createdAt: new Date().toISOString()
    };

    store.data.users.push(newUser);
    store.persist();

    const token = generateAuthToken(newUser);
    res.status(201).json({
      success: true,
      token,
      user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Login user & get token
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Please provide email and password' });
    }

    // Default admin mock credentials for quick demo
    if (email === 'admin@freshcart.com' && password === 'admin123') {
      const adminUser = {
        id: 'usr_admin',
        name: 'Store Manager (Admin)',
        email: 'admin@freshcart.com',
        role: 'admin'
      };
      const token = generateAuthToken(adminUser);
      return res.status(200).json({ success: true, token, user: adminUser });
    }

    if (isMongo() && User) {
      const user = await User.findOne({ email }).select('+password');
      if (!user || user.password !== password) {
        return res.status(401).json({ success: false, error: 'Invalid email or password' });
      }

      const token = generateAuthToken(user);
      return res.status(200).json({
        success: true,
        token,
        user: { id: user._id, name: user.name, email: user.email, role: user.role }
      });
    }

    const user = store.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user || user.password !== password) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const token = generateAuthToken(user);
    res.status(200).json({
      success: true,
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Get currently logged in user profile
// @route   GET /api/auth/me
// @access  Public / Demo
exports.getMe = async (req, res) => {
  res.status(200).json({
    success: true,
    user: {
      id: 'usr_demo',
      name: 'Yashas',
      email: 'yashas@freshcart.com',
      role: 'customer'
    }
  });
};

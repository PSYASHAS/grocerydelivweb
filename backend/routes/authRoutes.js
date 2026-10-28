/**
 * FreshCart - Auth Routes
 * Day 3: User Authentication REST endpoints
 */

const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe
} = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.get('/me', getMe);

module.exports = router;

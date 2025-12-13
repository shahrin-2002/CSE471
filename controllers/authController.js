/**
 * Auth Controller - Handles authentication business logic
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const sendEmail = require('../utils/emailService');
const crypto = require('crypto'); // Built-in Node module

class AuthController {
  /**
   * User registration
   */
  async signup(req, res) {
    try {
      const { name, email, password, role, phone, address, gender, date_of_birth } = req.body;

      // Validation
      if (!name || !email || !password || !role) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Name, email, password, and role are required'
        });
      }

      // Validate role
      const validRoles = ['patient', 'doctor', 'admin'];
      if (!validRoles.includes(role.toLowerCase())) {
        return res.status(400).json({
          error: 'Invalid Role',
          message: 'Role must be one of: patient, doctor, admin'
        });
      }

      // Check if email already exists
      const emailExists = await User.emailExists(email);
      if (emailExists) {
        return res.status(409).json({
          error: 'Email Already Exists',
          message: 'A user with this email already exists'
        });
      }

      // Create user (password will be hashed automatically by the pre-save hook)
      const newUser = await User.create({
        name,
        email,
        password,
        role: role.toLowerCase(),
        phone,
        address,
        gender,
        date_of_birth
      });

      // Convert to JSON to remove password
      const userResponse = newUser.toJSON();

      res.status(201).json({
        message: 'User registered successfully',
        user: userResponse
      });

    } catch (error) {
      console.error('Signup error:', error);

      // Handle Mongoose validation errors
      if (error.name === 'ValidationError') {
        return res.status(400).json({
          error: 'Validation Error',
          message: Object.values(error.errors).map(e => e.message).join(', ')
        });
      }

      // Handle duplicate email error
      if (error.code === 11000) {
        return res.status(409).json({
          error: 'Email Already Exists',
          message: 'A user with this email already exists'
        });
      }

      res.status(500).json({
        error: 'Internal Server Error',
        message: 'An error occurred during registration'
      });
    }
  }

  /**
   * User login
   */
  async login(req, res) {
    try {
      const { email, password } = req.body;

      // 1. Validate input
      if (!email || !password) {
        return res.status(400).json({ error: 'Validation Error', message: 'Email and password required' });
      }

      // 2. Find user
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'Auth Failed', message: 'Invalid credentials' });
      }

      // 3. Verify password
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ error: 'Auth Failed', message: 'Invalid credentials' });
      }

      // Check if OTP is disabled (SKIP_OTP=true in .env)
      if (process.env.SKIP_OTP === 'true') {
        // Skip OTP - directly generate token and return
        const token = jwt.sign(
          { id: user._id, email: user.email, role: user.role },
          process.env.JWT_SECRET,
          { expiresIn: '24h' }
        );

        return res.status(200).json({
          message: 'Login successful',
          token,
          user: user.toJSON()
        });
      }

      // 4. Generate OTP (6 digits)
      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      // 5. Save OTP to DB (valid for 10 minutes)
      user.otp = otp;
      user.otpExpires = Date.now() + 10 * 60 * 1000;
      await user.save();

      // 6. Send Email
      await sendEmail(
        user.email,
        'Your Login Code',
        `Your verification code is: ${otp}. It expires in 10 minutes.`
      );

      // 7. Respond to client (Tell them to check their email)
      res.status(200).json({
        message: 'OTP sent to email',
        requiresOtp: true,
        email: user.email // sending back email to help frontend state
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Server Error', message: error.message });
    }
  }

  /**
   * Get user profile
   */
  async getProfile(req, res) {
    try {
      const userId = req.user.id;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          error: 'User Not Found',
          message: 'User profile not found'
        });
      }

      // Convert to JSON to remove password
      const userResponse = user.toJSON();

      res.status(200).json({
        message: 'Profile retrieved successfully',
        user: userResponse
      });

    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'An error occurred while fetching profile'
      });
    }
  }

  async verifyOtp(req, res) {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: 'Validation Error', message: 'Email and OTP required' });
    }

    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(404).json({ error: 'Not Found', message: 'User not found' });
    }

    // Check if OTP matches and hasn't expired
    if (user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ error: 'Invalid OTP', message: 'Code is invalid or expired' });
    }

    // Clear OTP fields
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    // Generate Token (This is the logic that used to be in login)
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      user: user.toJSON()
    });

  } catch (error) {
    console.error('OTP Verify error:', error);
    res.status(500).json({ error: 'Server Error', message: error.message });
    }
  }
}

module.exports = AuthController;

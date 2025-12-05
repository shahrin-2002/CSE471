/**
 * Auth Controller - Handles authentication business logic
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

class AuthController {
  constructor(pool) {
    this.userModel = new User(pool);
  }

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
      const validRoles = ['Patient', 'Doctor', 'Hospital_Admin'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({
          error: 'Invalid Role',
          message: 'Role must be one of: Patient, Doctor, Hospital_Admin'
        });
      }

      // Check if email already exists
      const emailExists = await this.userModel.emailExists(email);
      if (emailExists) {
        return res.status(409).json({
          error: 'Email Already Exists',
          message: 'A user with this email already exists'
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const newUser = await this.userModel.create({
        name,
        email,
        password: hashedPassword,
        role,
        phone,
        address,
        gender,
        date_of_birth
      });

      res.status(201).json({
        message: 'User registered successfully',
        user: newUser
      });

    } catch (error) {
      console.error('Signup error:', error);
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

      // Validation
      if (!email || !password) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Email and password are required'
        });
      }

      // Find user by email
      const user = await this.userModel.findByEmail(email);
      if (!user) {
        return res.status(401).json({
          error: 'Authentication Failed',
          message: 'Invalid email or password'
        });
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          error: 'Authentication Failed',
          message: 'Invalid email or password'
        });
      }

      // Generate JWT token
      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Return token and user info (without password)
      const { password: _, ...userWithoutPassword } = user;

      res.status(200).json({
        message: 'Login successful',
        token,
        user: userWithoutPassword
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'An error occurred during login'
      });
    }
  }

  /**
   * Get user profile
   */
  async getProfile(req, res) {
    try {
      const userId = req.user.id;

      const user = await this.userModel.findById(userId);
      if (!user) {
        return res.status(404).json({
          error: 'User Not Found',
          message: 'User profile not found'
        });
      }

      res.status(200).json({
        message: 'Profile retrieved successfully',
        user
      });

    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'An error occurred while fetching profile'
      });
    }
  }
}

module.exports = AuthController;

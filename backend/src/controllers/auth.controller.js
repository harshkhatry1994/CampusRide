import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { generateToken } from '../services/token.service.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendWelcomeEmail } from '../services/email.service.js';

/**
 * @desc    Register a new user
 * @route   POST /api/auth/signup
 * @access  Public
 */
export const signup = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  // Validation
  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide name, email, and password',
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters',
    });
  }

  // Check if email already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(409).json({
      success: false,
      message: 'Email already exists',
    });
  }

  // Hash password and create user
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ name, email, passwordHash });

  // Send welcome email
  await sendWelcomeEmail(user);

  const token = generateToken({ id: user._id, role: user.role, email: user.email });

  res.status(201).json({
    success: true,
    message: 'Account created successfully',
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
    },
  });
});

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide email and password',
    });
  }

  const user = await User.findOne({ email });
  if (!user || !user.passwordHash) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password',
    });
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password',
    });
  }

  const token = generateToken({ id: user._id, role: user.role, email: user.email });

  res.json({
    success: true,
    message: 'Login successful',
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
    },
  });
});

/**
 * @desc    Google OAuth login/register
 * @route   POST /api/auth/google
 * @access  Public
 */
export const googleAuth = asyncHandler(async (req, res) => {
  const { name, email, googleId, avatar } = req.body;

  if (!email || !googleId) {
    return res.status(400).json({
      success: false,
      message: 'Google authentication data is required',
    });
  }

  let user = await User.findOne({ email });

  if (user) {
    // Update googleId if not set
    if (!user.googleId) {
      user.googleId = googleId;
      if (avatar) user.avatar = avatar;
      await user.save();
    }
  } else {
    // Create new user
    user = await User.create({
      name,
      email,
      googleId,
      avatar: avatar || '',
      role: 'customer',
    });

    // Send welcome email for new Google user
    await sendWelcomeEmail(user);
  }

  const token = generateToken({ id: user._id, role: user.role, email: user.email });

  res.json({
    success: true,
    message: 'Google authentication successful',
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
    },
  });
});

/**
 * @desc    Handle Google OAuth callback
 * @route   GET /api/auth/google/callback
 * @access  Public
 */
export const googleCallback = asyncHandler(async (req, res) => {
  const user = req.user;
  const token = generateToken({ id: user._id, role: user.role, email: user.email });

  // Construct the client-side user object
  const userData = {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
  };

  // HTML to send token and user data to the frontend via window.opener or redirect
  // For simplicity, we'll redirect back to the frontend with the token in the URL
  // and the frontend will pick it up, store it, and redirect to dashboard.
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const redirectUrl = `${frontendUrl}/login?token=${token}&user=${encodeURIComponent(JSON.stringify(userData))}`;
  
  res.redirect(redirectUrl);
});

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('-passwordHash');
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  res.json({ success: true, user });
});

/**
 * @desc    Update user profile
 * @route   PUT /api/auth/profile
 * @access  Private
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone } = req.body;
  const user = await User.findById(req.user.id);

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  if (name) user.name = name;
  if (phone) user.phone = phone;
  await user.save();

  res.json({
    success: true,
    message: 'Profile updated',
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      avatar: user.avatar,
    },
  });
});

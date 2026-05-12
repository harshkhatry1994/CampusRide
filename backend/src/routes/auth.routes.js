import express from 'express';
import { signup, login, googleAuth, getMe, updateProfile, googleCallback } from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import passport from 'passport';

const router = express.Router();

// Public routes
router.post('/signup', signup);
router.post('/login', login);
router.post('/google', googleAuth); // Keep the POST for SDK-based flows if needed

// Google OAuth redirect flow
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', passport.authenticate('google', { session: false }), googleCallback);

// Protected routes
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

export default router;

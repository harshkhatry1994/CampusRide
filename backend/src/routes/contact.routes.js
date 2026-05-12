import express from 'express';
import { submitContactForm, getAllMessages, updateMessageStatus } from '../controllers/contact.controller.js';
import { protect, adminOnly } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public route
router.post('/', submitContactForm);

// Admin routes
router.get('/all', protect, adminOnly, getAllMessages);
router.patch('/:id/status', protect, adminOnly, updateMessageStatus);

export default router;

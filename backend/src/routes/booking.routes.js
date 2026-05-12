import express from 'express';
import {
  createBooking,
  getMyBookings,
  getAllBookings,
  updateBookingStatus,
  getBookingDetails,
  uploadDocuments,
  confirmPayment
} from '../controllers/booking.controller.js';
import { protect, adminOnly } from '../middleware/auth.middleware.js';
import { riderDocumentsUpload } from '../middleware/upload.middleware.js';

const router = express.Router();

// Admin routes
router.get('/all', protect, adminOnly, getAllBookings);

// Customer routes
router.post('/', protect, riderDocumentsUpload, createBooking);
router.get('/my', protect, getMyBookings);
router.get('/:id', protect, getBookingDetails);
router.patch('/:id/documents', protect, riderDocumentsUpload, uploadDocuments);
router.patch('/:id/payment', protect, confirmPayment);

router.patch('/:id/status', protect, adminOnly, updateBookingStatus);

export default router;

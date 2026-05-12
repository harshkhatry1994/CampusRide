import express from 'express';
import { protect, adminOnly } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/upload.middleware.js';
import {
  getAdminStats,
  createBike,
  updateBike,
  deleteBike,
  getAllUsers,
  getAllBookingsAdmin,
  approveBooking,
  rejectBooking,
  completeBooking,
  updateBookingStatus,
  updatePaymentStatus,
  deleteBooking,
  toggleBikeAvailability,
  toggleUserStatus,
  deleteUser,
} from '../controllers/admin.controller.js';

const router = express.Router();

// Apply protection to all admin routes
router.use(protect);
router.use(adminOnly);

// ── Stats ──────────────────────────────────────────────
router.get('/stats', getAdminStats);

// ── Users ──────────────────────────────────────────────
router.get('/users', getAllUsers);
router.patch('/users/:id/status', toggleUserStatus);
router.delete('/users/:id', deleteUser);

// ── Bike Management ────────────────────────────────────
router.post('/bikes', upload.single('image'), createBike);
router.put('/bikes/:id', upload.single('image'), updateBike);
router.delete('/bikes/:id', deleteBike);
router.patch('/bikes/:id/availability', toggleBikeAvailability);

// ── Booking Management ─────────────────────────────────
router.get('/bookings', getAllBookingsAdmin);
router.patch('/bookings/:id/approve', approveBooking);
router.patch('/bookings/:id/reject', rejectBooking);
router.patch('/bookings/:id/complete', completeBooking);
router.patch('/bookings/:id/status', updateBookingStatus);
router.patch('/bookings/:id/payment', updatePaymentStatus);
router.delete('/bookings/:id', deleteBooking);

export default router;

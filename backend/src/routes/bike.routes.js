import express from 'express';
import {
  getBikes,
  getBike,
  createBike,
  updateBike,
  deleteBike,
} from '../controllers/bike.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { adminOnly } from '../middleware/admin.middleware.js';

const router = express.Router();

// Public routes
router.get('/', getBikes);
router.get('/:id', getBike);

// Admin routes
router.post('/', protect, adminOnly, createBike);
router.put('/:id', protect, adminOnly, updateBike);
router.delete('/:id', protect, adminOnly, deleteBike);

export default router;

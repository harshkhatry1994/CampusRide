import express from 'express';
import { generateInvoice, getInvoiceByBooking, emailInvoice, getAllInvoices, getMyInvoices } from '../controllers/invoice.controller.js';
import { protect, adminOnly } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.post('/generate', generateInvoice);
router.get('/my', getMyInvoices);
router.get('/booking/:bookingId', getInvoiceByBooking);
router.post('/:id/email', emailInvoice);

// Admin routes
router.get('/all', adminOnly, getAllInvoices);

export default router;

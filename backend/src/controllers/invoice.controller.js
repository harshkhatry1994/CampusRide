import Invoice from '../models/Invoice.js';
import Booking from '../models/Booking.js';
import { sendInvoiceEmail } from '../services/email.service.js';

/**
 * Generate an invoice for a booking
 */
export const generateInvoice = async (req, res) => {
  try {
    const { bookingId } = req.body;
    const booking = await Booking.findById(bookingId).populate('user').populate('bike');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Check if invoice already exists
    let invoice = await Invoice.findOne({ booking: bookingId });

    if (!invoice) {
      const invoiceNumber = `INV-${booking.bookingId || booking._id.toString().slice(-6).toUpperCase()}`;
      invoice = await Invoice.create({
        booking: bookingId,
        user: booking.user._id,
        invoiceNumber,
        amount: booking.pricing.totalAmount,
        status: booking.payment.status === 'paid' ? 'paid' : 'unpaid',
      });
    }

    res.status(201).json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get invoice by booking ID
 */
export const getInvoiceByBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const invoice = await Invoice.findOne({ booking: bookingId })
      .populate('user')
      .populate({
        path: 'booking',
        populate: { path: 'bike' }
      });

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    // Permission check: Owner or Admin
    const isOwner = invoice.user._id.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Unauthorized access to invoice' });
    }

    // Access logic: Only confirmed/completed bookings (unless Admin)
    const allowedStatuses = ['confirmed', 'completed', 'active']; // assuming 'active' exists or just confirmed/completed
    if (!isAdmin && !allowedStatuses.includes(invoice.booking.status)) {
       return res.status(403).json({ success: false, message: 'Invoice is only available for confirmed or completed rides' });
    }

    if (req.query.download === 'true') {
      invoice.downloadCount = (invoice.downloadCount || 0) + 1;
      await invoice.save();
    }

    res.status(200).json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Send invoice email
 */
export const emailInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const { pdfData } = req.body; // Base64 PDF data from frontend

    const invoice = await Invoice.findById(id).populate('booking').populate('user');
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });

    // Send email with attachment logic here
    // For now, we use the email service which we will update
    await sendInvoiceEmail(invoice.booking, invoice.user, pdfData);

    invoice.sentAt = new Date();
    await invoice.save();

    res.status(200).json({
      success: true,
      message: 'Invoice emailed successfully',
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get all invoices for the logged-in user
 */
export const getMyInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find({ user: req.user.id })
      .populate('booking')
      .sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: invoices,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get all invoices (Admin only)
 */
export const getAllInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find().populate('user').populate('booking').sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: invoices,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

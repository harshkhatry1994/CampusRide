import Booking from '../models/Booking.js';
import Bike from '../models/Bike.js';
import User from '../models/User.js';
import { sendBookingConfirmation } from '../services/email.service.js';
import asyncHandler from '../utils/asyncHandler.js';
// No extra imports needed for fetch in Node 18+

/**
 * @desc    Initialize a booking (Step 1)
 * @route   POST /api/bookings
 * @access  Private (Customer)
 */
export const createBooking = asyncHandler(async (req, res) => {
  const { 
    bikeId, startDate, endDate, startTime, returnTime,
    riderDetails, pricing
  } = req.body;

  // Handle uploaded files (New Fields)
  const files = req.files || {};
  const drivingLicense = files.drivingLicense ? `/uploads/${files.drivingLicense[0].filename}` : (files.licence ? `/uploads/${files.licence[0].filename}` : null);
  const idProof = files.idProof ? `/uploads/${files.idProof[0].filename}` : (files.aadhaar ? `/uploads/${files.aadhaar[0].filename}` : null);
  const selfieImage = files.selfieImage ? `/uploads/${files.selfieImage[0].filename}` : (files.selfie ? `/uploads/${files.selfie[0].filename}` : null);
  const paymentProof = files.paymentProof ? `/uploads/${files.paymentProof[0].filename}` : null;
  
  // Keep legacy variables for older schema logic if needed
  const licenceUrl = drivingLicense;
  const aadhaarUrl = idProof;
  const selfieUrl = selfieImage;
  const additionalDocUrl = files.additional ? `/uploads/${files.additional[0].filename}` : null;

  if (!bikeId || !startDate || !endDate) {
    return res.status(400).json({ success: false, message: 'Missing core booking details' });
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  // Check Availability
  const bike = await Bike.findById(bikeId);
  if (!bike || !bike.available) {
    return res.status(400).json({ success: false, message: 'Bike is unavailable' });
  }

  // Parse riderDetails if it's sent as a string (common with FormData)
  const parsedRiderDetails = typeof riderDetails === 'string' ? JSON.parse(riderDetails) : riderDetails;
  const parsedPricing = typeof pricing === 'string' ? JSON.parse(pricing) : pricing;

  const booking = await Booking.create({
    user: req.user.id,
    bike: bikeId,
    startDate: start,
    endDate: end,
    pickupTime: startTime,
    returnTime: returnTime,
    riderDetails: parsedRiderDetails,
    pricing: parsedPricing,
    drivingLicense,
    idProof,
    selfieImage,
    paymentProof,
    licenceUrl,
    aadhaarUrl,
    selfieUrl,
    additionalDocUrl,
    status: 'pending'
  });

  res.status(201).json({
    success: true,
    message: 'Booking initialized',
    data: booking
  });
});

/**
 * @desc    Upload documents for booking (Step 2)
 * @route   PATCH /api/bookings/:id/documents
 * @access  Private (Customer)
 */
export const uploadDocuments = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

  // Ensure user owns the booking
  if (booking.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Unauthorized' });
  }

  const files = req.files || {};
  if (files.drivingLicense) booking.drivingLicense = `/uploads/${files.drivingLicense[0].filename}`;
  if (files.idProof) booking.idProof = `/uploads/${files.idProof[0].filename}`;
  if (files.selfieImage) booking.selfieImage = `/uploads/${files.selfieImage[0].filename}`;
  if (files.paymentProof) booking.paymentProof = `/uploads/${files.paymentProof[0].filename}`;

  // Legacy sync
  if (files.licence) {
    booking.licenceUrl = `/uploads/${files.licence[0].filename}`;
    booking.drivingLicense = booking.licenceUrl;
  }
  if (files.aadhaar) {
    booking.aadhaarUrl = `/uploads/${files.aadhaar[0].filename}`;
    booking.idProof = booking.aadhaarUrl;
  }
  if (files.selfie) {
    booking.selfieUrl = `/uploads/${files.selfie[0].filename}`;
    booking.selfieImage = booking.selfieUrl;
  }
  if (files.additional) booking.additionalDocUrl = `/uploads/${files.additional[0].filename}`;

  await booking.save();

  res.json({
    success: true,
    message: 'Documents uploaded successfully',
    data: booking
  });
});

/**
 * @desc    Confirm payment for booking (Step 3)
 * @route   PATCH /api/bookings/:id/payment
 * @access  Private (Customer)
 */
export const confirmPayment = asyncHandler(async (req, res) => {
  const { transactionId, method } = req.body;
  const booking = await Booking.findById(req.params.id);
  
  if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

  booking.payment = {
    status: 'paid',
    method: method || 'UPI',
    transactionId: transactionId,
    paidAt: new Date()
  };
  
  // Update overall status to confirmed once payment is submitted
  // Admin will still need to verify documents to move it to 'completed'
  booking.status = 'confirmed';
  
  await booking.save();

  // Send confirmation email
  const user = await User.findById(req.user.id);
  const bike = await Bike.findById(booking.bike);
  sendBookingConfirmation(booking, user, bike);

  res.json({
    success: true,
    message: 'Payment confirmed',
    data: booking
  });
});

/**
 * @desc    Get current user's bookings
 */
export const getMyBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({ user: req.user.id })
    .populate('bike')
    .sort({ createdAt: -1 });
  res.json({ success: true, data: bookings });
});

/**
 * @desc    Get all bookings (admin)
 */
export const getAllBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find()
    .populate('bike')
    .populate('user', 'name email phone')
    .sort({ createdAt: -1 });
  res.json({ success: true, data: bookings });
});

/**
 * @desc    Update status (admin)
 */
export const updateBookingStatus = asyncHandler(async (req, res) => {
  const booking = await Booking.findByIdAndUpdate(
    req.params.id, 
    { $set: req.body }, 
    { new: true }
  ).populate('user').populate('bike');
  
  if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

  // Trigger Automatic Invoice & Email on Completion
  if (req.body.status === 'completed' || req.body.currentMilestone === 'completed') {
    try {
      // Mock req/res for internal controller call or just call logic directly
      // Since generateInvoice expects (req, res), we can call a service-level function
      // For now, we'll implement a helper or just do the logic here
      console.log(`🚀 Ride completed for #${booking.bookingId}. Triggering auto-invoice...`);
      
      // We'll call the generateInvoice logic directly (it handles duplicates)
      const invoiceData = await fetch(`${process.env.VITE_API_URL || 'http://localhost:5000'}/api/invoices/generate`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': req.headers.authorization 
        },
        body: JSON.stringify({ bookingId: booking._id })
      }).then(r => r.json());

      console.log(`✅ Auto-invoice generated: ${invoiceData.data?.invoiceNumber}`);
    } catch (err) {
      console.error('❌ Auto-invoice failed:', err.message);
    }
  }

  res.json({ success: true, data: booking });
});

/**
 * @desc    Get single booking details
 */
export const getBookingDetails = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate('bike')
    .populate('user', 'name email phone');
  
  if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

  // Security check: Only owner or admin
  const isOwner = booking.user._id.toString() === req.user.id;
  const isAdmin = req.user.role === 'admin';
  if (!isOwner && !isAdmin) {
    return res.status(403).json({ success: false, message: 'Unauthorized access to booking details' });
  }

  res.json({ success: true, data: booking });
});

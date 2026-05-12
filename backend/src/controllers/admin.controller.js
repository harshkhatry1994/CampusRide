import Bike from '../models/Bike.js';
import Booking from '../models/Booking.js';
import User from '../models/User.js';
import { generateInvoice } from '../services/invoice.service.js';
import { sendInvoiceEmail } from '../services/email.service.js';

/**
 * Get all stats for admin dashboard
 */
export const getAdminStats = async (req, res) => {
  try {
    const totalBikes = await Bike.countDocuments();
    const totalUsers = await User.countDocuments({ role: 'customer' });
    const totalBookings = await Booking.countDocuments();

    // Bookings by status
    const pendingBookings = await Booking.countDocuments({ status: 'pending' });
    const confirmedBookings = await Booking.countDocuments({ status: 'confirmed' });
    const completedBookings = await Booking.countDocuments({ status: 'completed' });
    const rejectedBookings = await Booking.countDocuments({ status: 'rejected' });

    // Calculate total revenue from completed bookings
    const completedBookingDocs = await Booking.find({ status: 'completed' });
    const totalRevenue = completedBookingDocs.reduce((sum, b) => sum + (b.pricing?.totalAmount || 0), 0);

    // Calculate monthly revenue (current month)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyBookings = await Booking.find({
      status: 'completed',
      createdAt: { $gte: startOfMonth }
    });
    const monthlyRevenue = monthlyBookings.reduce((sum, b) => sum + (b.pricing?.totalAmount || 0), 0);

    // Get recent bookings (last 10)
    const recentBookings = await Booking.find()
      .populate('user', 'name email')
      .populate('bike', 'name brand model imageUrl')
      .sort({ createdAt: -1 })
      .limit(10);

    // Available vs unavailable bikes
    const availableBikes = await Bike.countDocuments({ available: true });

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalBikes,
          availableBikes,
          totalUsers,
          totalBookings,
          totalRevenue,
          monthlyRevenue,
          pendingBookings,
          confirmedBookings,
          completedBookings,
          rejectedBookings,
        },
        recentBookings
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get ALL bookings for admin with search and filter
 * GET /api/admin/bookings?search=&status=&page=&limit=
 */
export const getAllBookingsAdmin = async (req, res) => {
  try {
    const { search = '', status = '', page = 1, limit = 20 } = req.query;

    let filter = {};

    // Filter by status
    if (status && status !== 'all') {
      filter.status = status;
    }

    // Build base query
    let query = Booking.find(filter)
      .populate('user', 'name email phone')
      .populate('bike', 'name brand model imageUrl pricePerDay category')
      .sort({ createdAt: -1 });

    let bookings = await query;

    // Search filter (applied after populate since we need user/bike data)
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      bookings = bookings.filter(b => {
        const customerName = (b.riderDetails?.name || b.user?.name || '').toLowerCase();
        const customerEmail = (b.user?.email || '').toLowerCase();
        const bookingId = (b.bookingId || '').toLowerCase();
        const bikeName = `${b.bike?.brand || ''} ${b.bike?.model || ''}`.toLowerCase();
        return (
          customerName.includes(searchLower) ||
          customerEmail.includes(searchLower) ||
          bookingId.includes(searchLower) ||
          bikeName.includes(searchLower)
        );
      });
    }

    const total = bookings.length;
    const skip = (Number(page) - 1) * Number(limit);
    const paginatedBookings = bookings.slice(skip, skip + Number(limit));

    res.status(200).json({
      success: true,
      data: paginatedBookings,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit))
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Approve a booking (pending → confirmed)
 */
export const approveBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('user')
      .populate('bike');

    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    booking.status = 'confirmed';
    await booking.save();

    // Generate Invoice and Send Email
    if (booking.user && booking.bike) {
      try {
        const invoicePath = await generateInvoice(booking, booking.user, booking.bike);
        booking.invoiceUrl = invoicePath; // Save the mocked path for frontend
        await booking.save();
        await sendInvoiceEmail(booking, booking.user, invoicePath);
      } catch (err) {
        console.error("Invoice/Email generation failed:", err);
      }
    }

    res.status(200).json({ success: true, message: 'Booking approved. Invoice generated & emailed.', data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Reject a booking
 */
export const rejectBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    booking.status = 'rejected';
    await booking.save();

    res.status(200).json({ success: true, message: 'Booking rejected', data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Mark booking as completed
 */
export const completeBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    booking.status = 'completed';
    await booking.save();

    res.status(200).json({ success: true, message: 'Booking marked as completed', data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Generic status update (e.g. to pending)
 */
export const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ['pending', 'confirmed', 'rejected', 'completed', 'cancelled'];
    
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    booking.status = status;
    await booking.save();

    res.status(200).json({ success: true, message: `Booking status updated to ${status}`, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Delete a booking
 */
export const deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    await Booking.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Booking deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update payment status
 */
export const updatePaymentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ['pending', 'paid', 'failed', 'refunded'];
    
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid payment status' });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    booking.payment.status = status;
    if (status === 'paid') {
      booking.payment.paidAt = Date.now();
    }
    
    await booking.save();

    res.status(200).json({ 
      success: true, 
      message: `Payment status updated to ${status}`, 
      data: booking 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Toggle bike availability
 */
export const toggleBikeAvailability = async (req, res) => {
  try {
    const bike = await Bike.findById(req.params.id);
    if (!bike) return res.status(404).json({ success: false, message: 'Bike not found' });

    bike.available = !bike.available;
    await bike.save();

    res.status(200).json({
      success: true,
      message: `Bike marked as ${bike.available ? 'available' : 'unavailable'}`,
      data: bike
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Create bike with image upload
 */
export const createBike = async (req, res) => {
  try {
    const bikeData = {
      ...req.body,
      createdBy: req.user.id,
      imageUrl: req.file ? `/uploads/${req.file.filename}` : (req.body.imageUrl || '')
    };

    // Parse boolean/number fields from FormData strings
    if (bikeData.available !== undefined) {
      bikeData.available = bikeData.available === 'true' || bikeData.available === true;
    }
    if (bikeData.helmetIncluded !== undefined) {
      bikeData.helmetIncluded = bikeData.helmetIncluded === 'true' || bikeData.helmetIncluded === true;
    }
    ['pricePerDay', 'pricePerHour', 'mileage', 'engineCC', 'year', 'securityDeposit', 'topSpeed', 'fuelCapacity'].forEach(field => {
      if (bikeData[field] !== undefined && bikeData[field] !== '') {
        bikeData[field] = Number(bikeData[field]);
      }
    });

    const bike = await Bike.create(bikeData);
    res.status(201).json({ success: true, data: bike });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * Update bike with optional image upload
 */
export const updateBike = async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (req.file) {
      updateData.imageUrl = `/uploads/${req.file.filename}`;
    }

    // Parse boolean/number fields from FormData strings
    if (updateData.available !== undefined) {
      updateData.available = updateData.available === 'true' || updateData.available === true;
    }
    if (updateData.helmetIncluded !== undefined) {
      updateData.helmetIncluded = updateData.helmetIncluded === 'true' || updateData.helmetIncluded === true;
    }
    ['pricePerDay', 'pricePerHour', 'mileage', 'engineCC', 'year', 'securityDeposit', 'topSpeed', 'fuelCapacity'].forEach(field => {
      if (updateData[field] !== undefined && updateData[field] !== '') {
        updateData[field] = Number(updateData[field]);
      }
    });

    const bike = await Bike.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
    if (!bike) return res.status(404).json({ success: false, message: 'Bike not found' });

    res.status(200).json({ success: true, data: bike });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * Delete bike
 */
export const deleteBike = async (req, res) => {
  try {
    const bike = await Bike.findByIdAndDelete(req.params.id);
    if (!bike) return res.status(404).json({ success: false, message: 'Bike not found' });
    res.status(200).json({ success: true, message: 'Bike deleted' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * Get all users (customers)
 */
export const getAllUsers = async (req, res) => {
  try {
    const { search = '' } = req.query;
    let filter = { role: 'customer' };

    if (search.trim()) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(filter).select('-passwordHash').sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Toggle user active/suspended status
 */
export const toggleUserStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.isActive = isActive;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User ${isActive ? 'activated' : 'suspended'} successfully`,
      data: user
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Permanently delete a user
 */
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Check if user has active bookings before deleting?
    // For now, just delete
    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({ success: true, message: 'User removed from system permanently' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

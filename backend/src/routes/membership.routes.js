import express from 'express';
import { protect, adminOnly } from '../middleware/auth.middleware.js';
import MembershipRequest from '../models/MembershipRequest.js';
import User from '../models/User.js';

const router = express.Router();

// @desc    Submit a membership request
// @route   POST /api/membership/request
// @access  Private
router.post('/request', protect, async (req, res) => {
  try {
    const { transactionId, plan, amount } = req.body;
    console.log('Membership Request Received:', { transactionId, plan, amount, userId: req.user._id });

    if (!transactionId) {
      return res.status(400).json({ success: false, message: 'Transaction ID is required' });
    }

    // Check if a request already exists for this transaction ID
    const existingTx = await MembershipRequest.findOne({ transactionId });
    if (existingTx) {
      return res.status(400).json({ success: false, message: 'This transaction ID has already been submitted' });
    }

    const request = await MembershipRequest.create({
      user: req.user._id,
      transactionId,
      plan: plan || 'annual',
      amount: amount || 999,
      paymentStatus: 'pending'
    });

    res.status(201).json({
      success: true,
      message: 'Membership request submitted successfully',
      data: request,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get all pending membership requests (Admin only)
// @route   GET /api/membership/admin/requests
// @access  Private/Admin
router.get('/admin/requests', protect, adminOnly, async (req, res) => {
  try {
    const requests = await MembershipRequest.find()
      .populate('user', 'name email avatar phone')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Approve or reject membership request (Admin only)
// @route   PATCH /api/membership/admin/requests/:id
// @access  Private/Admin
router.patch('/admin/requests/:id', protect, adminOnly, async (req, res) => {
  try {
    const { status, reviewNote } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const request = await MembershipRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Request has already been processed' });
    }

    request.status = status;
    request.reviewNote = reviewNote;
    request.reviewedBy = req.user._id;
    await request.save();

    if (status === 'approved') {
      // Upgrade user to premium
      await User.findByIdAndUpdate(request.user, { role: 'premium' });
    }

    res.json({
      success: true,
      message: `Membership request ${status} successfully`,
      data: request,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

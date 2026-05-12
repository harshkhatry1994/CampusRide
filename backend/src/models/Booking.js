import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    bike: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bike',
      required: true,
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    pickupTime: {
      type: String,
      required: [true, 'Pickup time is required'],
    },
    returnTime: {
      type: String,
      required: [true, 'Return time is required'],
    },
    
    // Rider Verification Documents
    drivingLicense: { type: String }, // User requested
    idProof: { type: String },        // User requested
    selfieImage: { type: String },    // User requested
    paymentProof: { type: String },   // User requested
    
    // Legacy fields for compatibility
    licenceUrl: { type: String },
    aadhaarUrl: { type: String },
    selfieUrl: { type: String },
    passportUrl: { type: String },
    additionalDocUrl: { type: String },
    
    documentVerificationStatus: { 
      type: String, 
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending'
    },

    // Contact Details
    riderDetails: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      email: { type: String, required: true },
      emergencyContact: { type: String },
      address: { type: String }
    },

    // Pricing Breakdown
    pricing: {
      basePrice: { type: Number, required: true },
      securityDeposit: { type: Number, default: 0 },
      platformFee: { type: Number, default: 49 },
      gst: { type: Number, default: 0 },
      totalAmount: { type: Number, required: true }
    },

    // Payment Tracking
    payment: {
      status: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'refunded'],
        default: 'pending'
      },
      method: { type: String },
      transactionId: { type: String },
      paidAt: { type: Date }
    },

    status: {
      type: String,
      enum: ['pending', 'confirmed', 'rejected', 'completed', 'cancelled'],
      default: 'pending',
    },
    bookingId: {
      type: String,
      unique: true,
      default: () => 'CR' + Math.random().toString(36).substr(2, 9).toUpperCase()
    },
    currentMilestone: {
      type: String,
      enum: ['booked', 'picked_up', 'on_ride', 'near_completion', 'completed'],
      default: 'booked'
    },
    rewardPoints: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

export default mongoose.model('Booking', bookingSchema);

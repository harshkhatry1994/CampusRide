import mongoose from 'mongoose';

const membershipRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    transactionId: {
      type: String,
      required: true,
      unique: true,
    },
    plan: {
      type: String,
      required: true,
      default: 'annual',
    },
    amount: {
      type: Number,
      required: true,
      default: 999,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending',
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewNote: {
      type: String,
    }
  },
  { timestamps: true }
);

export default mongoose.model('MembershipRequest', membershipRequestSchema);

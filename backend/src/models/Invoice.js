import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['unpaid', 'paid', 'cancelled'],
      default: 'unpaid',
    },
    pdfUrl: {
      type: String,
    },
    downloadCount: {
      type: Number,
      default: 0,
    },
    metadata: {
      type: Map,
      of: String,
    },
    sentAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Invoice', invoiceSchema);

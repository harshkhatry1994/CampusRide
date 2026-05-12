import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    passwordHash: {
      type: String,
      // Not required for Google OAuth users
    },
    role: {
      type: String,
      enum: ['customer', 'admin', 'premium'],
      default: 'customer',
    },
    phone: {
      type: String,
      trim: true,
    },
    googleId: {
      type: String,
    },
    avatar: {
      type: String,
      default: '',
    },
    licenceUrl: {
      type: String,
      default: '',
    },
    bookingHistory: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking'
    }],
    isVerified: {
      type: Boolean,
      default: false,
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);

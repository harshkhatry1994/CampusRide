import mongoose from 'mongoose';

const bikeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Bike name is required'],
      trim: true,
    },
    brand: {
      type: String,
      required: [true, 'Brand is required'],
      trim: true,
    },
    model: {
      type: String,
      required: [true, 'Model is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: ['Cruiser', 'Sports', 'Street', 'Adventure', 'Scooter'],
      required: true,
    },
    pricePerHour: {
      type: Number,
      required: [true, 'Price per hour is required'],
      min: 0,
    },
    pricePerDay: {
      type: Number,
      required: [true, 'Price per day is required'],
      min: 0,
    },
    mileage: {
      type: Number,
      required: true,
      min: 0,
    },
    fuelType: {
      type: String,
      enum: ['Petrol', 'Electric', 'Hybrid'],
      required: true,
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    description: {
      type: String,
      default: '',
    },
    imageUrl: {
      type: String,
      default: '',
    },
    available: {
      type: Boolean,
      default: true,
    },
    year: {
      type: Number,
    },
    color: {
      type: String,
      default: '',
    },
    engineCC: {
      type: Number,
    },
    
    // Advanced Rental Details
    securityDeposit: { type: Number, default: 1000 },
    helmetIncluded: { type: Boolean, default: true },
    features: [{ type: String }],
    pickupLocation: { type: String, default: "Campus Hub Main Gate" },
    topSpeed: { type: Number },
    fuelCapacity: { type: Number },
    
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

// Text index for search
bikeSchema.index({ name: 'text', brand: 'text', model: 'text', description: 'text' });

export default mongoose.model('Bike', bikeSchema);

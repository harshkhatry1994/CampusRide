import Bike from '../models/Bike.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * @desc    Get all bikes with pagination, search, and filters
 * @route   GET /api/bikes
 * @access  Public
 */
export const getBikes = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 12,
    search = '',
    fuel,
    minPrice,
    maxPrice,
    sort = '-createdAt',
    available,
  } = req.query;

  const filter = {};

  // Search by brand or model
  if (search) {
    filter.$or = [
      { brand: { $regex: search, $options: 'i' } },
      { model: { $regex: search, $options: 'i' } },
    ];
  }

  // Filter by fuel type
  if (fuel) {
    filter.fuelType = fuel;
  }

  // Filter by price range
  if (minPrice || maxPrice) {
    filter.pricePerDay = {};
    if (minPrice) filter.pricePerDay.$gte = Number(minPrice);
    if (maxPrice) filter.pricePerDay.$lte = Number(maxPrice);
  }

  // Filter by availability
  if (available !== undefined) {
    filter.available = available === 'true';
  }

  const total = await Bike.countDocuments(filter);
  const bikes = await Bike.find(filter)
    .sort(sort)
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit));

  res.json({
    success: true,
    data: {
      bikes,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    },
  });
});

/**
 * @desc    Get single bike by ID
 * @route   GET /api/bikes/:id
 * @access  Public
 */
export const getBike = asyncHandler(async (req, res) => {
  const bike = await Bike.findById(req.params.id);
  if (!bike) {
    return res.status(404).json({ success: false, message: 'Bike not found' });
  }
  res.json({ success: true, data: bike });
});

/**
 * @desc    Create a new bike
 * @route   POST /api/bikes
 * @access  Admin
 */
export const createBike = asyncHandler(async (req, res) => {
  const bike = await Bike.create(req.body);
  res.status(201).json({
    success: true,
    message: 'Bike added successfully',
    data: bike,
  });
});

/**
 * @desc    Update a bike
 * @route   PUT /api/bikes/:id
 * @access  Admin
 */
export const updateBike = asyncHandler(async (req, res) => {
  const bike = await Bike.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!bike) {
    return res.status(404).json({ success: false, message: 'Bike not found' });
  }
  res.json({
    success: true,
    message: 'Bike updated successfully',
    data: bike,
  });
});

/**
 * @desc    Delete a bike
 * @route   DELETE /api/bikes/:id
 * @access  Admin
 */
export const deleteBike = asyncHandler(async (req, res) => {
  const bike = await Bike.findByIdAndDelete(req.params.id);
  if (!bike) {
    return res.status(404).json({ success: false, message: 'Bike not found' });
  }
  res.json({
    success: true,
    message: 'Bike deleted successfully',
  });
});

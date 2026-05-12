import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import connectDB from './config/db.js';
import User from './models/User.js';
import Bike from './models/Bike.js';

dotenv.config();

const seedData = async () => {
  try {
    await connectDB();

    // Clear existing data
    await User.deleteMany({});
    await Bike.deleteMany({});

    console.log('🗑️  Cleared existing data');

    // Create admin user
    const adminPass = await bcrypt.hash('Admin@123', 12);
    const admin = await User.create({
      name: 'CampusRide Admin',
      email: 'admin@campusride.com',
      passwordHash: adminPass,
      role: 'admin',
    });
    console.log('👤 Admin user created (admin@campusride.com / Admin@123)');

    // Create sample customer
    const customerPass = await bcrypt.hash('Customer@123', 12);
    await User.create({
      name: 'Harsh Kumar',
      email: 'harsh@campusride.com',
      passwordHash: customerPass,
      role: 'customer',
    });
    console.log('👤 Sample customer created (harsh@campusride.com / Customer@123)');

    // Create sample bikes
    const bikes = [
      {
        name: 'Electric Beast',
        brand: 'Ather',
        model: '450X Gen 3',
        category: 'Scooter',
        pricePerHour: 50,
        pricePerDay: 399,
        mileage: 85,
        fuelType: 'Electric',
        rating: 4.8,
        description: 'The future of campus mobility. Silent, powerful, and packed with smart features. Perfect for eco-friendly commuting.',
        imageUrl: 'https://images.unsplash.com/photo-1622185135505-2d795003994a?w=600',
        available: true,
        year: 2024,
        color: 'Space Grey',
        engineCC: 0,
        securityDeposit: 500,
        helmetIncluded: true,
        features: ['Smart Dashboard', 'Reverse Mode', 'Bluetooth Connectivity'],
        pickupLocation: 'South Campus Hub',
        topSpeed: 90,
        fuelCapacity: 0,
        createdBy: admin._id,
      },
      {
        name: 'Street Fighter',
        brand: 'KTM',
        model: 'Duke 200',
        category: 'Street',
        pricePerHour: 85,
        pricePerDay: 649,
        mileage: 35,
        fuelType: 'Petrol',
        rating: 4.7,
        description: 'Lightweight performance with a punchy motor. Built for the urban jungle. Extremely agile and responsive.',
        imageUrl: 'https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?w=600',
        available: true,
        year: 2024,
        color: 'Electronic Orange',
        engineCC: 199,
        securityDeposit: 1500,
        helmetIncluded: true,
        features: ['Dual Channel ABS', 'Liquid Cooling', 'LED Lighting'],
        pickupLocation: 'Main Gate Hub',
        topSpeed: 142,
        fuelCapacity: 13.5,
        createdBy: admin._id,
      },
      {
        name: 'The Retro King',
        brand: 'Royal Enfield',
        model: 'Classic 350',
        category: 'Cruiser',
        pricePerHour: 90,
        pricePerDay: 699,
        mileage: 38,
        fuelType: 'Petrol',
        rating: 4.6,
        description: 'Timeless design meets modern reliability. Experience the legendary thump on your next weekend trip.',
        imageUrl: 'https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=600',
        available: true,
        year: 2023,
        color: 'Stealth Black',
        engineCC: 349,
        securityDeposit: 2000,
        helmetIncluded: true,
        features: ['Tripper Navigation', 'Comfort Seats', 'Classic Exhaust'],
        pickupLocation: 'Hostel Block 4 Hub',
        topSpeed: 114,
        fuelCapacity: 13,
        createdBy: admin._id,
      },
      {
        name: 'Track Weapon',
        brand: 'Yamaha',
        model: 'YZF-R15 V4',
        category: 'Sports',
        pricePerHour: 80,
        pricePerDay: 599,
        mileage: 42,
        fuelType: 'Petrol',
        rating: 4.9,
        description: 'R-series DNA in a 155cc package. Aerodynamic, sharp, and ready to lean. The ultimate sportbike for campus.',
        imageUrl: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=600',
        available: true,
        year: 2024,
        color: 'Racing Blue',
        engineCC: 155,
        securityDeposit: 1000,
        helmetIncluded: true,
        features: ['Quick Shifter', 'Traction Control', 'Aerodynamic Design'],
        pickupLocation: 'Main Gate Hub',
        topSpeed: 150,
        fuelCapacity: 11,
        createdBy: admin._id,
      },
      {
        name: 'Urban Cruiser',
        brand: 'Honda',
        model: 'CBR250R',
        category: 'Sports',
        pricePerHour: 100,
        pricePerDay: 749,
        mileage: 35,
        fuelType: 'Petrol',
        rating: 4.7,
        description: 'Reliable Japanese engineering. Comfortable for both city and highway. Smooth power delivery for all riders.',
        imageUrl: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=600',
        available: true,
        year: 2024,
        color: 'Grand Prix Red',
        engineCC: 249,
        securityDeposit: 1500,
        helmetIncluded: true,
        features: ['ABS', 'Combined Braking', 'Liquid Cooled'],
        pickupLocation: 'Library Hub',
        topSpeed: 145,
        fuelCapacity: 13,
        createdBy: admin._id,
      }
    ];

    await Bike.insertMany(bikes);
    console.log(`🏍️  ${bikes.length} sample bikes inserted`);

    console.log('\n✅ Seed complete!');
    console.log('\n📋 Login Credentials:');
    console.log('   Admin:    admin@campusride.com / Admin@123');
    console.log('   Customer: harsh@campusride.com / Customer@123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error.message);
    process.exit(1);
  }
};

seedData();

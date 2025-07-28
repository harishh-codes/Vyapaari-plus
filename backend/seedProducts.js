import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from './models/Product.js';
import Supplier from './models/Supplier.js';

// Load environment variables
dotenv.config({ path: './config.env' });

const sampleProducts = [
  {
    name: 'Onions',
    category: 'Vegetables',
    description: 'Fresh red onions, perfect for cooking',
    image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400',
    unit: 'kg',
    supplierPrices: []
  },
  {
    name: 'Tomatoes',
    category: 'Vegetables',
    description: 'Ripe red tomatoes for your recipes',
    image: 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=400',
    unit: 'kg',
    supplierPrices: []
  },
  {
    name: 'Potatoes',
    category: 'Vegetables',
    description: 'Fresh potatoes for all your cooking needs',
    image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400',
    unit: 'kg',
    supplierPrices: []
  },
  {
    name: 'Rice',
    category: 'Grains',
    description: 'Premium quality rice for your business',
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400',
    unit: 'kg',
    supplierPrices: []
  },
  {
    name: 'Wheat Flour',
    category: 'Grains',
    description: 'Fine wheat flour for baking',
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400',
    unit: 'kg',
    supplierPrices: []
  },
  {
    name: 'Cooking Oil',
    category: 'Oils',
    description: 'Pure cooking oil for your kitchen',
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400',
    unit: 'l',
    supplierPrices: []
  },
  {
    name: 'Turmeric Powder',
    category: 'Spices',
    description: 'Pure turmeric powder for authentic taste',
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400',
    unit: 'kg',
    supplierPrices: []
  },
  {
    name: 'Red Chili Powder',
    category: 'Spices',
    description: 'Spicy red chili powder for your dishes',
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400',
    unit: 'kg',
    supplierPrices: []
  },
  {
    name: 'Ginger',
    category: 'Vegetables',
    description: 'Fresh ginger for your recipes',
    image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400',
    unit: 'kg',
    supplierPrices: []
  },
  {
    name: 'Garlic',
    category: 'Vegetables',
    description: 'Fresh garlic cloves for cooking',
    image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400',
    unit: 'kg',
    supplierPrices: []
  }
];

const seedProducts = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing products
    await Product.deleteMany({});
    console.log('Cleared existing products');

    // Create sample suppliers if they don't exist
    let supplier1 = await Supplier.findOne({ phone: '1234567890' });
    if (!supplier1) {
      supplier1 = new Supplier({
        name: 'Fresh Foods Supplier',
        phone: '1234567890',
        role: 'supplier',
        businessName: 'Fresh Foods Supplier',
        businessType: 'Vegetables',
        isOnboarded: true
      });
      await supplier1.save();
    }

    let supplier2 = await Supplier.findOne({ phone: '9876543210' });
    if (!supplier2) {
      supplier2 = new Supplier({
        name: 'Spice World',
        phone: '9876543210',
        role: 'supplier',
        businessName: 'Spice World',
        businessType: 'Spices',
        isOnboarded: true
      });
      await supplier2.save();
    }

    // Add products with supplier prices
    for (const productData of sampleProducts) {
      const product = new Product({
        ...productData,
        supplierPrices: [
          {
            supplierId: supplier1._id,
            pricePerKg: Math.floor(Math.random() * 50) + 20, // Random price between 20-70
            stock: Math.floor(Math.random() * 100) + 50,
            pickupSlots: ['7-9 AM', '3-5 PM'],
            rating: Math.floor(Math.random() * 5) + 1,
            isAvailable: true
          },
          {
            supplierId: supplier2._id,
            pricePerKg: Math.floor(Math.random() * 50) + 20, // Random price between 20-70
            stock: Math.floor(Math.random() * 100) + 50,
            pickupSlots: ['9-11 AM', '1-3 PM'],
            rating: Math.floor(Math.random() * 5) + 1,
            isAvailable: true
          }
        ]
      });
      await product.save();
    }

    console.log('Sample products seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding products:', error);
    process.exit(1);
  }
};

seedProducts(); 
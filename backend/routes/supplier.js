import express from 'express';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';

import Supplier from '../models/Supplier.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';

const router = express.Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token required'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'supplier') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Supplier role required.'
      });
    }
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

// Supplier onboarding
router.post('/onboarding', authenticateToken, [
  body('name').notEmpty().withMessage('Name is required'),
  body('businessName').notEmpty().withMessage('Business name is required'),
  body('businessType').isIn(['Vegetables', 'Oil', 'Spices', 'Grains', 'Other']).withMessage('Invalid business type'),
  body('address.street').optional().trim(),
  body('address.city').optional().trim(),
  body('address.state').optional().trim(),
  body('address.pincode').optional().trim(),
  body('pickupSlots').isArray().withMessage('Pickup slots must be an array'),
  body('pickupSlots.*').isIn(['7-9 AM', '4-6 PM', '9-11 AM', '2-4 PM']).withMessage('Invalid pickup slot value')
], async (req, res) => {
  try {
    console.log('🔍 Backend: Supplier onboarding request received:', req.body);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Backend: Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const supplier = await Supplier.findById(req.user.userId);
    if (!supplier) {
      console.log('❌ Backend: Supplier not found for ID:', req.user.userId);
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    console.log('✅ Backend: Supplier found:', supplier.name);

    const updateData = {
      ...req.body,
      isOnboarded: true
    };

    console.log('🔍 Backend: Updating supplier with data:', updateData);

    const updatedSupplier = await Supplier.findByIdAndUpdate(
      req.user.userId,
      updateData,
      { new: true, runValidators: true }
    );

    console.log('✅ Backend: Supplier updated successfully');

    res.json({
      success: true,
      message: 'Onboarding completed successfully',
      supplier: {
        id: updatedSupplier._id,
        name: updatedSupplier.name,
        businessName: updatedSupplier.businessName,
        businessType: updatedSupplier.businessType,
        isOnboarded: updatedSupplier.isOnboarded
      }
    });

  } catch (error) {
    console.error('❌ Backend: Onboarding error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get supplier dashboard
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 Backend: Supplier dashboard request received for user:', req.user.userId);
    
    const supplier = await Supplier.findById(req.user.userId)
      .populate('products');

    if (!supplier) {
      console.log('❌ Backend: Supplier not found for ID:', req.user.userId);
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    console.log('✅ Backend: Supplier found:', supplier.name);

    // Get recent orders
    const recentOrders = await Order.find({ supplierId: req.user.userId })
      .populate('vendorId', 'name businessName')
      .populate('items.productId', 'name image')
      .sort({ createdAt: -1 })
      .limit(5);

    console.log('✅ Backend: Recent orders fetched:', recentOrders.length);

    // Get analytics
    const totalOrders = await Order.countDocuments({ supplierId: req.user.userId });
    const pendingOrders = await Order.countDocuments({ 
      supplierId: req.user.userId, 
      status: { $in: ['Pending', 'Confirmed', 'Ready'] } 
    });
    const totalRevenue = await Order.aggregate([
      { $match: { supplierId: supplier._id, status: 'Completed' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    console.log('✅ Backend: Analytics calculated - Total orders:', totalOrders, 'Pending:', pendingOrders, 'Revenue:', totalRevenue[0]?.total || 0);

    const responseData = {
      success: true,
      supplier: {
        id: supplier._id,
        name: supplier.name,
        businessName: supplier.businessName,
        businessType: supplier.businessType,
        isOnboarded: supplier.isOnboarded,
        averageRating: supplier.averageRating,
        totalRatings: supplier.totalRatings,
        products: supplier.products || []
      },
      analytics: {
        totalOrders,
        pendingOrders,
        totalRevenue: totalRevenue[0]?.total || 0
      },
      recentOrders
    };

    console.log('✅ Backend: Dashboard response prepared');
    res.json(responseData);

  } catch (error) {
    console.error('❌ Backend: Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Add product
router.post('/products', authenticateToken, [
  body('name').notEmpty().withMessage('Product name is required'),
  body('category').isIn(['Vegetables', 'Fruits', 'Grains', 'Spices', 'Oils', 'Dairy', 'Meat', 'Seafood', 'Beverages', 'Snacks', 'Other']).withMessage('Invalid category'),
  body('pricePerKg').isFloat({ min: 0 }).withMessage('Valid price required'),
  body('stock').isInt({ min: 0 }).withMessage('Valid stock quantity required'),
  body('image').notEmpty().withMessage('Product image is required'),
  body('pickupSlots').isArray().withMessage('Pickup slots must be an array'),
  body('unit').optional().isIn(['kg', 'g', 'l', 'ml', 'piece', 'dozen', 'pack'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const {
      name,
      category,
      subcategory,
      description,
      image,
      pricePerKg,
      stock,
      pickupSlots,
      unit = 'kg'
    } = req.body;

    // Check if product already exists
    let product = await Product.findOne({ name, category });
    
    if (product) {
      // Add supplier price to existing product
      const existingSupplierPrice = product.supplierPrices.find(
        sp => sp.supplierId.toString() === req.user.userId
      );

      if (existingSupplierPrice) {
        return res.status(400).json({
          success: false,
          message: 'You already have this product listed'
        });
      }

      product.supplierPrices.push({
        supplierId: req.user.userId,
        pricePerKg,
        stock,
        pickupSlots,
        isAvailable: true
      });
    } else {
      // Create new product
      product = new Product({
        name,
        category,
        subcategory,
        description,
        image,
        unit,
        supplierPrices: [{
          supplierId: req.user.userId,
          pricePerKg,
          stock,
          pickupSlots,
          isAvailable: true
        }]
      });
    }

    await product.save();

    // Add product to supplier's products list
    const supplier = await Supplier.findById(req.user.userId);
    if (!supplier.products.includes(product._id)) {
      supplier.products.push(product._id);
      await supplier.save();
    }

    res.json({
      success: true,
      message: 'Product added successfully',
      product
    });

  } catch (error) {
    console.error('Add product error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update product
router.put('/products/:productId', authenticateToken, [
  body('pricePerKg').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be a positive integer'),
  body('pickupSlots').optional().isArray().withMessage('Pickup slots must be an array'),
  body('pickupSlots.*').optional().isIn(['7-9 AM', '9-11 AM', '11-1 PM', '1-3 PM', '3-5 PM', '5-7 PM', '7-9 PM']).withMessage('Invalid pickup slot'),
  body('isAvailable').optional().isBoolean().withMessage('Availability must be a boolean')
], async (req, res) => {
  try {
    console.log('🔍 Backend: Update product request received:', req.params, req.body);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Backend: Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { productId } = req.params;
    const updateData = req.body;

    // Validate that we have at least one field to update
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      console.log('❌ Backend: Product not found:', productId);
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    console.log('✅ Backend: Product found:', product.name);

    // Find and update supplier price
    const supplierPriceIndex = product.supplierPrices.findIndex(
      sp => sp.supplierId.toString() === req.user.userId
    );

    if (supplierPriceIndex === -1) {
      console.log('❌ Backend: Supplier price not found for supplier:', req.user.userId);
      return res.status(404).json({
        success: false,
        message: 'Product not found in your inventory'
      });
    }

    console.log('✅ Backend: Found supplier price at index:', supplierPriceIndex);

    // Get the existing supplier price
    const existingSupplierPrice = product.supplierPrices[supplierPriceIndex];
    
    // Create updated supplier price, preserving required fields
    const updatedSupplierPrice = {
      supplierId: existingSupplierPrice.supplierId, // Preserve required field
      pricePerKg: updateData.pricePerKg !== undefined ? parseFloat(updateData.pricePerKg) : existingSupplierPrice.pricePerKg, // Preserve required field
      stock: updateData.stock !== undefined ? parseInt(updateData.stock) : existingSupplierPrice.stock,
      pickupSlots: updateData.pickupSlots || existingSupplierPrice.pickupSlots,
      isAvailable: updateData.isAvailable !== undefined ? Boolean(updateData.isAvailable) : existingSupplierPrice.isAvailable,
      lastUpdated: new Date()
    };

    console.log('🔍 Backend: Updated supplier price:', updatedSupplierPrice);

    // Validate the updated supplier price
    if (updatedSupplierPrice.pricePerKg < 0) {
      return res.status(400).json({
        success: false,
        message: 'Price must be a positive number'
      });
    }

    if (updatedSupplierPrice.stock < 0) {
      return res.status(400).json({
        success: false,
        message: 'Stock must be a positive number'
      });
    }

    // Update the supplier price in the array
    product.supplierPrices[supplierPriceIndex] = updatedSupplierPrice;

    console.log('💾 Backend: Saving product with updated supplier prices');
    await product.save();

    console.log('✅ Backend: Product updated successfully');

    res.json({
      success: true,
      message: 'Product updated successfully',
      product
    });

  } catch (error) {
    console.error('❌ Backend: Update product error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete product (remove supplier from product)
router.delete('/products/:productId', authenticateToken, async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Remove supplier price from product
    product.supplierPrices = product.supplierPrices.filter(
      sp => sp.supplierId.toString() !== req.user.userId
    );

    // If no more suppliers, delete the product entirely
    if (product.supplierPrices.length === 0) {
      await Product.findByIdAndDelete(productId);
    } else {
      await product.save();
    }

    // Remove product from supplier's products list
    const supplier = await Supplier.findById(req.user.userId);
    if (supplier) {
      supplier.products = supplier.products.filter(
        p => p.toString() !== productId
      );
      await supplier.save();
    }

    res.json({
      success: true,
      message: 'Product removed successfully'
    });

  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get supplier products
router.get('/products', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 Backend: Get supplier products request received for user:', req.user.userId);
    
    const supplier = await Supplier.findById(req.user.userId)
      .populate({
        path: 'products',
        populate: {
          path: 'supplierPrices.supplierId',
          select: 'businessName'
        }
      });

    if (!supplier) {
      console.log('❌ Backend: Supplier not found for ID:', req.user.userId);
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    console.log('✅ Backend: Supplier found with products:', supplier.products?.length || 0);

    // Filter products to show only this supplier's prices
    const products = supplier.products.map(product => {
      const supplierPrice = product.supplierPrices.find(
        sp => sp.supplierId._id.toString() === req.user.userId
      );
      
      return {
        ...product.toObject(),
        supplierId: req.user.userId, // Add supplierId for frontend reference
        supplierPrice // Keep the single supplierPrice for frontend compatibility
      };
    });

    console.log('✅ Backend: Products processed successfully:', products.length);

    res.json({
      success: true,
      products
    });

  } catch (error) {
    console.error('❌ Backend: Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get supplier orders
router.get('/orders', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    console.log('🔍 Backend: Supplier orders request received:', { page, limit, status, userId: req.user.userId });
    
    const query = { supplierId: req.user.userId };
    if (status) {
      query.status = status;
    }

    const orders = await Order.find(query)
      .populate('vendorId', 'name businessName phone')
      .populate('items.productId', 'name image')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Order.countDocuments(query);

    console.log('✅ Backend: Orders fetched successfully:', { count: orders.length, total, page, limit });

    res.json({
      success: true,
      orders,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });

  } catch (error) {
    console.error('❌ Backend: Get orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update order status
router.patch('/orders/:orderId/status', authenticateToken, [
  body('status').isIn(['Confirmed', 'Ready', 'Completed', 'Cancelled']).withMessage('Invalid status')
], async (req, res) => {
  try {
    console.log('🔍 Backend: Update order status request received:', { orderId: req.params.orderId, status: req.body.status, userId: req.user.userId });
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Backend: Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { orderId } = req.params;
    const { status } = req.body;

    const order = await Order.findOne({
      _id: orderId,
      supplierId: req.user.userId
    });

    if (!order) {
      console.log('❌ Backend: Order not found for ID:', orderId);
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    console.log('✅ Backend: Order found, updating status from', order.status, 'to', status);
    
    // Validate status transitions
    const validTransitions = {
      'Pending': ['Confirmed', 'Cancelled'],
      'Confirmed': ['Ready', 'Cancelled'],
      'Ready': ['Completed', 'Cancelled'],
      'Completed': [], // No further transitions
      'Cancelled': [] // No further transitions
    };

    if (!validTransitions[order.status].includes(status)) {
      console.log('❌ Backend: Invalid status transition from', order.status, 'to', status);
      return res.status(400).json({
        success: false,
        message: `Cannot change status from ${order.status} to ${status}`
      });
    }
    
    order.status = status;
    await order.save();

    console.log('✅ Backend: Order status updated successfully');

    res.json({
      success: true,
      message: 'Order status updated successfully',
      order
    });

  } catch (error) {
    console.error('❌ Backend: Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update pickup slots
router.put('/pickup-slots', authenticateToken, [
  body('pickupSlots').isArray().withMessage('Pickup slots must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { pickupSlots } = req.body;

    const supplier = await Supplier.findByIdAndUpdate(
      req.user.userId,
      { pickupSlots },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Pickup slots updated successfully',
      pickupSlots: supplier.pickupSlots
    });

  } catch (error) {
    console.error('Update pickup slots error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Upload image to Cloudinary
router.post('/upload-image', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    console.log('🔍 Backend: Image upload request received');
    
    // Check Cloudinary configuration
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.error('❌ Backend: Cloudinary not properly configured');
      return res.status(500).json({
        success: false,
        message: 'Image upload service not configured'
      });
    }
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    console.log('✅ Backend: File received:', {
      filename: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });

    // Convert buffer to base64
    const b64 = Buffer.from(req.file.buffer).toString('base64');
    const dataURI = `data:${req.file.mimetype};base64,${b64}`;

    console.log('🔍 Backend: Attempting Cloudinary upload...');

    // Upload to Cloudinary with retry logic
    let result;
    try {
      result = await cloudinary.uploader.upload(dataURI, {
        folder: 'vyapaari-products',
        resource_type: 'image',
        transformation: [
          { width: 800, height: 600, crop: 'limit' },
          { quality: 'auto' }
        ]
      });
    } catch (uploadError) {
      console.error('❌ Backend: Cloudinary upload failed:', uploadError);
      
      // Check if it's a configuration error
      if (uploadError.message.includes('api_key') || uploadError.message.includes('api_secret')) {
        return res.status(500).json({
          success: false,
          message: 'Image upload service configuration error. Please contact support.'
        });
      }
      
      throw uploadError;
    }

    console.log('✅ Backend: Image uploaded to Cloudinary:', result.secure_url);

    res.json({
      success: true,
      message: 'Image uploaded successfully',
      imageUrl: result.secure_url,
      publicId: result.public_id
    });

  } catch (error) {
    console.error('❌ Backend: Image upload error:', error);
    console.error('❌ Backend: Error details:', {
      message: error.message,
      code: error.code,
      http_code: error.http_code
    });
    
    // Provide more specific error messages
    let errorMessage = 'Failed to upload image';
    if (error.message.includes('api_key')) {
      errorMessage = 'Cloudinary API key configuration error';
    } else if (error.message.includes('api_secret')) {
      errorMessage = 'Cloudinary API secret configuration error';
    } else if (error.message.includes('cloud_name')) {
      errorMessage = 'Cloudinary cloud name configuration error';
    }
    
    res.status(500).json({
      success: false,
      message: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Test Cloudinary configuration
router.get('/test-cloudinary', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 Backend: Testing Cloudinary configuration');
    
    const config = {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    };
    
    console.log('🔍 Backend: Cloudinary config:', {
      cloud_name: config.cloud_name,
      api_key: config.api_key ? 'Present' : 'Missing',
      api_secret: config.api_secret ? 'Present' : 'Missing'
    });
    
    if (!config.cloud_name || !config.api_key || !config.api_secret) {
      return res.status(500).json({
        success: false,
        message: 'Cloudinary configuration incomplete',
        config: {
          cloud_name: !!config.cloud_name,
          api_key: !!config.api_key,
          api_secret: !!config.api_secret
        }
      });
    }
    
    // Test Cloudinary connection
    const result = await cloudinary.api.ping();
    
    res.json({
      success: true,
      message: 'Cloudinary configuration is working',
      ping: result
    });
    
  } catch (error) {
    console.error('❌ Backend: Cloudinary test error:', error);
    res.status(500).json({
      success: false,
      message: 'Cloudinary configuration error',
      error: error.message
    });
  }
});

// Health check for Cloudinary configuration
router.get('/cloudinary-health', authenticateToken, async (req, res) => {
  try {
    const configStatus = {
      cloud_name: !!process.env.CLOUDINARY_CLOUD_NAME,
      api_key: !!process.env.CLOUDINARY_API_KEY,
      api_secret: !!process.env.CLOUDINARY_API_SECRET,
      all_present: !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET)
    };
    
    res.json({
      success: true,
      cloudinary_configured: configStatus.all_present,
      config_status: configStatus
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: error.message
    });
  }
});

// Get supplier business name by ID (public route)
router.get('/:supplierId/name', async (req, res) => {
  try {
    const { supplierId } = req.params;
    
    const supplier = await Supplier.findById(supplierId).select('businessName');
    
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    res.json({
      success: true,
      businessName: supplier.businessName
    });

  } catch (error) {
    console.error('Get supplier name error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router; 
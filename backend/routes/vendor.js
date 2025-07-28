import express from 'express';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';

import Vendor from '../models/Vendor.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import Supplier from '../models/Supplier.js';

const router = express.Router();

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
    if (decoded.role !== 'vendor') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Vendor role required.'
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

// Vendor onboarding
router.post('/onboarding', authenticateToken, [
  body('name').notEmpty().withMessage('Name is required'),
  body('vendorType').isIn(['Dosa', 'Vadapav', 'Juice', 'Other']).withMessage('Invalid vendor type'),
  body('businessName').optional().trim(),
  body('address.street').optional().trim(),
  body('address.city').optional().trim(),
  body('address.state').optional().trim(),
  body('address.pincode').optional().trim()
], async (req, res) => {
  try {
    console.log('🔍 Backend: Vendor onboarding request received:', req.body);
    console.log('🔍 Backend: User ID:', req.user.userId);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Backend: Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const vendor = await Vendor.findById(req.user.userId);
    if (!vendor) {
      console.log('❌ Backend: Vendor not found for ID:', req.user.userId);
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    console.log('✅ Backend: Vendor found:', vendor.name);

    const updateData = {
      ...req.body,
      isOnboarded: true
    };

    console.log('🔍 Backend: Updating vendor with data:', updateData);

    const updatedVendor = await Vendor.findByIdAndUpdate(
      req.user.userId,
      updateData,
      { new: true, runValidators: true }
    );

    console.log('✅ Backend: Vendor updated successfully');

    res.json({
      success: true,
      message: 'Onboarding completed successfully',
      vendor: {
        id: updatedVendor._id,
        name: updatedVendor.name,
        vendorType: updatedVendor.vendorType,
        businessName: updatedVendor.businessName,
        isOnboarded: updatedVendor.isOnboarded
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

// Get vendor dashboard data
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 Backend: Vendor dashboard request received for user:', req.user.userId);
    
    const vendor = await Vendor.findById(req.user.userId)
      .populate('savedKit')
      .populate({
        path: 'orderHistory',
        options: { limit: 5, sort: { createdAt: -1 } }
      });

    if (!vendor) {
      console.log('❌ Backend: Vendor not found for ID:', req.user.userId);
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    console.log('✅ Backend: Vendor found:', vendor.name);

    // Get recent orders
    const recentOrders = await Order.find({ vendorId: req.user.userId })
      .populate('supplierId', 'businessName')
      .sort({ createdAt: -1 })
      .limit(5);

    // Calculate analytics
    const allOrders = await Order.find({ vendorId: req.user.userId });
    
    const totalSpent = allOrders
      .filter(order => order.status === 'Completed')
      .reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    
    const pendingOrders = allOrders.filter(order => 
      ['Pending', 'Confirmed', 'Ready'].includes(order.status)
    ).length;

    console.log('✅ Backend: Analytics calculated - Total spent:', totalSpent, 'Pending orders:', pendingOrders);

    res.json({
      success: true,
      vendor: {
        id: vendor._id,
        name: vendor.name,
        vendorType: vendor.vendorType,
        businessName: vendor.businessName,
        isOnboarded: vendor.isOnboarded,
        savedKit: vendor.savedKit || []
      },
      recentOrders: recentOrders,
      totalSpent: totalSpent,
      pendingOrders: pendingOrders,
      totalOrders: allOrders.length
    });

  } catch (error) {
    console.error('❌ Backend: Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get saved kit
router.get('/saved-kit', authenticateToken, async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.user.userId)
      .populate({
        path: 'savedKit',
        populate: {
          path: 'supplierPrices.supplierId',
          select: 'businessName'
        }
      });

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    res.json({
      success: true,
      savedKit: vendor.savedKit || []
    });

  } catch (error) {
    console.error('Get saved kit error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Add product to saved kit
router.post('/saved-kit/add', authenticateToken, [
  body('productId').notEmpty().withMessage('Product ID is required')
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

    const { productId } = req.body;

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Add to saved kit if not already present
    const vendor = await Vendor.findById(req.user.userId);
    if (!vendor.savedKit.includes(productId)) {
      vendor.savedKit.push(productId);
      await vendor.save();
    }

    res.json({
      success: true,
      message: 'Product added to saved kit'
    });

  } catch (error) {
    console.error('Add to saved kit error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Remove product from saved kit
router.delete('/saved-kit/remove/:productId', authenticateToken, async (req, res) => {
  try {
    const { productId } = req.params;

    const vendor = await Vendor.findById(req.user.userId);
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    // Remove from saved kit
    vendor.savedKit = vendor.savedKit.filter(id => id.toString() !== productId);
    await vendor.save();

    res.json({
      success: true,
      message: 'Product removed from saved kit'
    });

  } catch (error) {
    console.error('Remove from saved kit error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Compare prices for a product
router.get('/compare/:productId', authenticateToken, async (req, res) => {
  try {
    const { productId } = req.params;
    
    const product = await Product.findById(productId)
      .populate({
        path: 'supplierPrices.supplierId',
        select: 'businessName averageRating pickupSlots'
      });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Sort suppliers by price (lowest first)
    const sortedSuppliers = product.supplierPrices
      .filter(sp => sp.isAvailable && sp.stock > 0)
      .sort((a, b) => a.pricePerKg - b.pricePerKg);

    res.json({
      success: true,
      product: {
        id: product._id,
        name: product.name,
        category: product.category,
        image: product.image,
        unit: product.unit,
        averagePrice: product.averagePrice,
        minPrice: product.minPrice,
        maxPrice: product.maxPrice
      },
      suppliers: sortedSuppliers
    });

  } catch (error) {
    console.error('Compare prices error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get vendor orders
router.get('/orders', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    const query = { vendorId: req.user.userId };
    if (status) {
      query.status = status;
    }

    const orders = await Order.find(query)
      .populate('supplierId', 'businessName averageRating totalRatings')
      .populate('items.productId', 'name image')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      orders,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });

  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get specific order
router.get('/orders/:orderId', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const order = await Order.findOne({
      _id: orderId,
      vendorId: req.user.userId
    })
    .populate('supplierId', 'businessName phone address averageRating totalRatings')
    .populate('items.productId', 'name image unit');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      order
    });

  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Rate order
router.post('/orders/:orderId/rate', authenticateToken, [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('review').optional().trim()
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

    const { orderId } = req.params;
    const { rating, review } = req.body;

    const order = await Order.findOne({
      _id: orderId,
      vendorId: req.user.userId,
      status: 'Completed'
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or not completed'
      });
    }

    if (order.rating && order.rating.rating && typeof order.rating.rating === 'number' && order.rating.rating > 0) {
      console.log('❌ Backend: Order already rated. Rating data:', order.rating);
      return res.status(400).json({
        success: false,
        message: 'Order already rated'
      });
    }

    order.rating = { rating, review };
    await order.save();

    // Update supplier rating - add to both ratings array and reviews array
    const supplier = await Supplier.findById(order.supplierId);
    supplier.ratings.push(rating); // Add rating number to ratings array
    supplier.reviews.push({
      rating,
      review,
      vendorId: req.user.userId
    }); // Add detailed review to reviews array
    await supplier.save();

    res.json({
      success: true,
      message: 'Order rated successfully'
    });

  } catch (error) {
    console.error('Rate order error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update order status (vendor can only cancel orders)
router.patch('/orders/:orderId/status', authenticateToken, [
  body('status').isIn(['Cancelled']).withMessage('Vendors can only cancel orders')
], async (req, res) => {
  try {
    console.log('🔍 Backend: Vendor update order status request received:', { orderId: req.params.orderId, status: req.body.status, userId: req.user.userId });
    
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
      vendorId: req.user.userId
    });

    if (!order) {
      console.log('❌ Backend: Order not found for ID:', orderId);
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    console.log('✅ Backend: Order found, updating status from', order.status, 'to', status);
    
    // Vendors can only cancel orders that are not completed
    if (order.status === 'Completed') {
      console.log('❌ Backend: Cannot cancel completed order');
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel completed order'
      });
    }
    
    order.status = status;
    await order.save();

    console.log('✅ Backend: Order status updated successfully');

    res.json({
      success: true,
      message: 'Order cancelled successfully',
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

// Get supplier ratings and details
router.get('/suppliers/:supplierId', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 Backend: Get supplier details request received:', { supplierId: req.params.supplierId });
    
    const { supplierId } = req.params;

    const supplier = await Supplier.findById(supplierId)
      .select('businessName businessType address averageRating totalRatings ratings reviews pickupSlots')
      .populate('reviews.vendorId', 'name businessName');

    if (!supplier) {
      console.log('❌ Backend: Supplier not found for ID:', supplierId);
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    console.log('✅ Backend: Supplier found:', supplier.businessName);

    res.json({
      success: true,
      supplier: {
        id: supplier._id,
        businessName: supplier.businessName,
        businessType: supplier.businessType,
        address: supplier.address,
        averageRating: supplier.averageRating,
        totalRatings: supplier.ratings?.length || 0,
        pickupSlots: supplier.pickupSlots,
        recentReviews: supplier.reviews?.slice(-5) || [] // Last 5 reviews with details
      }
    });

  } catch (error) {
    console.error('❌ Backend: Get supplier details error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router; 
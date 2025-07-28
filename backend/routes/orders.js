import express from 'express';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';

import Order from '../models/Order.js';
import Vendor from '../models/Vendor.js';
import Supplier from '../models/Supplier.js';
import Product from '../models/Product.js';

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
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

// Place order (vendor only)
router.post('/place', authenticateToken, [
  body('items').isArray({ min: 1 }).withMessage('At least one item required'),
  body('items.*.productId').isMongoId().withMessage('Valid product ID required'),
  body('items.*.quantity').isFloat({ min: 0.1 }).withMessage('Valid quantity required'),
  body('items.*.supplierId').isMongoId().withMessage('Valid supplier ID required'),
  body('pickupSlot').isIn(['7-9 AM', '9-11 AM', '11-1 PM', '1-3 PM', '3-5 PM', '5-7 PM', '7-9 PM']).withMessage('Valid pickup slot required'),
  body('pickupDate').isISO8601().withMessage('Valid pickup date required'),
  body('paymentMethod').isIn(['UPI', 'Cash', 'Card']).withMessage('Valid payment method required'),
  body('notes').optional().trim()
], async (req, res) => {
  try {
    console.log('🔍 Backend: Place order request received:', req.body);
    console.log('🔍 Backend: User:', req.user);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Backend: Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    if (req.user.role !== 'vendor') {
      console.log('❌ Backend: Non-vendor trying to place order');
      return res.status(403).json({
        success: false,
        message: 'Only vendors can place orders'
      });
    }

    const {
      items,
      pickupSlot,
      pickupDate,
      paymentMethod,
      notes
    } = req.body;

    // Validate vendor exists
    const vendor = await Vendor.findById(req.user.userId);
    if (!vendor) {
      console.log('❌ Backend: Vendor not found for ID:', req.user.userId);
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    // Group items by supplierId
    const itemsBySupplier = {};
    for (const item of items) {
      if (!itemsBySupplier[item.supplierId]) itemsBySupplier[item.supplierId] = [];
      itemsBySupplier[item.supplierId].push(item);
    }

    const createdOrders = [];
    for (const supplierId of Object.keys(itemsBySupplier)) {
      const supplierItems = itemsBySupplier[supplierId];
      const orderItems = [];
      let totalAmount = 0;

      for (const item of supplierItems) {
        const product = await Product.findById(item.productId);
        if (!product) {
          return res.status(404).json({
            success: false,
            message: `Product ${item.productId} not found`
          });
        }
        const supplierPrice = product.supplierPrices.find(
          sp => sp.supplierId.toString() === item.supplierId
        );
        if (!supplierPrice) {
          return res.status(404).json({
            success: false,
            message: `Supplier ${item.supplierId} not found for product ${product.name}`
          });
        }
        if (!supplierPrice.isAvailable || supplierPrice.stock < item.quantity) {
          return res.status(400).json({
            success: false,
            message: `Insufficient stock for ${product.name}`
          });
        }
        if (!supplierPrice.pickupSlots.includes(pickupSlot)) {
          return res.status(400).json({
            success: false,
            message: `Pickup slot ${pickupSlot} not available for ${product.name}`
          });
        }
        const totalPrice = supplierPrice.pricePerKg * item.quantity;
        totalAmount += totalPrice;
        orderItems.push({
          productId: item.productId,
          quantity: item.quantity,
          supplierId: item.supplierId,
          price: supplierPrice.pricePerKg,
          unit: product.unit,
          totalPrice
        });
      }

      // Create order for this supplier
      const order = new Order({
        vendorId: req.user.userId,
        items: orderItems,
        pickupSlot,
        pickupDate: new Date(pickupDate),
        paymentMethod,
        totalAmount,
        supplierId,
        notes
      });
      await order.save();
      vendor.orderHistory.push(order._id);
      // Update product stock for this supplier's items
      for (const item of supplierItems) {
        const product = await Product.findById(item.productId);
        const supplierPriceIndex = product.supplierPrices.findIndex(
          sp => sp.supplierId.toString() === item.supplierId
        );
        product.supplierPrices[supplierPriceIndex].stock -= item.quantity;
        await product.save();
      }
      await order.populate([
        { path: 'supplierId', select: 'businessName phone address' },
        { path: 'items.productId', select: 'name image unit' }
      ]);
      createdOrders.push(order);
    }
    await vendor.save();
    console.log('✅ Backend: Orders placed successfully:', createdOrders.map(o => o._id));
    res.status(201).json({
      success: true,
      message: 'Orders placed successfully',
      orders: createdOrders
    });
  } catch (error) {
    console.error('❌ Backend: Place order error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get order by ID
router.get('/:orderId', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.params;

    let query = { _id: orderId };
    
    // Filter by user role
    if (req.user.role === 'vendor') {
      query.vendorId = req.user.userId;
    } else if (req.user.role === 'supplier') {
      query.supplierId = req.user.userId;
    }

    const order = await Order.findOne(query)
      .populate('vendorId', 'name businessName phone')
      .populate('supplierId', 'businessName phone address')
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

// Cancel order
router.patch('/:orderId/cancel', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.params;

    let query = { _id: orderId };
    
    // Filter by user role
    if (req.user.role === 'vendor') {
      query.vendorId = req.user.userId;
    } else if (req.user.role === 'supplier') {
      query.supplierId = req.user.userId;
    }

    const order = await Order.findOne(query);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Only allow cancellation if order is pending or confirmed
    if (!['Pending', 'Confirmed'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: 'Order cannot be cancelled at this stage'
      });
    }

    order.status = 'Cancelled';
    await order.save();

    // Restore product stock if vendor cancels
    if (req.user.role === 'vendor') {
      for (const item of order.items) {
        const product = await Product.findById(item.productId);
        const supplierPriceIndex = product.supplierPrices.findIndex(
          sp => sp.supplierId.toString() === item.supplierId
        );
        product.supplierPrices[supplierPriceIndex].stock += item.quantity;
        await product.save();
      }
    }

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      order
    });

  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update order status (supplier only)
router.patch('/:orderId/status', authenticateToken, [
  body('status').isIn(['Confirmed', 'Preparing', 'Ready', 'Completed', 'Cancelled']).withMessage('Invalid status')
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

    if (req.user.role !== 'supplier') {
      return res.status(403).json({
        success: false,
        message: 'Only suppliers can update order status'
      });
    }

    const { orderId } = req.params;
    const { status } = req.body;

    const order = await Order.findOne({
      _id: orderId,
      supplierId: req.user.userId
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    order.status = status;
    await order.save();

    res.json({
      success: true,
      message: 'Order status updated successfully',
      order
    });

  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get order analytics
router.get('/analytics/summary', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let query = {};
    if (req.user.role === 'vendor') {
      query.vendorId = req.user.userId;
    } else if (req.user.role === 'supplier') {
      query.supplierId = req.user.userId;
    }

    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const totalOrders = await Order.countDocuments(query);
    const completedOrders = await Order.countDocuments({ ...query, status: 'Completed' });
    const pendingOrders = await Order.countDocuments({ 
      ...query, 
      status: { $in: ['Pending', 'Confirmed', 'Preparing'] } 
    });

    const revenue = await Order.aggregate([
      { $match: { ...query, status: 'Completed' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    const averageOrderValue = await Order.aggregate([
      { $match: { ...query, status: 'Completed' } },
      { $group: { _id: null, average: { $avg: '$totalAmount' } } }
    ]);

    res.json({
      success: true,
      analytics: {
        totalOrders,
        completedOrders,
        pendingOrders,
        totalRevenue: revenue[0]?.total || 0,
        averageOrderValue: averageOrderValue[0]?.average || 0,
        completionRate: totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0
      }
    });

  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router; 
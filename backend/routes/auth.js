import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';

import Vendor from '../models/Vendor.js';
import Supplier from '../models/Supplier.js';

const router = express.Router();

// Simple OTP system - fixed OTP for everyone
const FIXED_OTP = '123456';

// Request OTP (simulated)
router.post('/request-otp', [
  body('phone').isLength({ min: 10, max: 10 }).withMessage('Phone number must be 10 digits'),
  body('role').isIn(['vendor', 'supplier']).withMessage('Role must be vendor or supplier')
], async (req, res) => {
  try {
    console.log('🔍 Backend: Request OTP received:', req.body);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Backend: Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { phone, role } = req.body;
    console.log('🔍 Backend: Processing OTP request for phone:', phone, 'role:', role);

    // Check if user already exists
    let user = null;
    if (role === 'vendor') {
      user = await Vendor.findOne({ phone });
    } else {
      user = await Supplier.findOne({ phone });
    }

    console.log('🔍 Backend: User exists:', !!user);

    // Don't create user here, just send OTP
    // User will be created during OTP verification if they don't exist

    console.log('✅ Backend: OTP sent successfully');
    res.json({
      success: true,
      message: 'OTP sent successfully',
      otp: FIXED_OTP // In real app, this would be sent via SMS
    });

  } catch (error) {
    console.error('❌ Backend: Request OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Verify OTP
router.post('/verify-otp', [
  body('phone').isLength({ min: 10, max: 10 }).withMessage('Phone number must be 10 digits'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
  body('role').isIn(['vendor', 'supplier']).withMessage('Role must be vendor or supplier')
], async (req, res) => {
  try {
    console.log('🔍 Backend: Verify OTP received:', req.body);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Backend: Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { phone, otp, role } = req.body;
    console.log('🔍 Backend: Processing OTP verification for phone:', phone, 'role:', role);

    // Verify OTP
    if (otp !== FIXED_OTP) {
      console.log('❌ Backend: Invalid OTP provided:', otp);
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }

    console.log('✅ Backend: OTP verified successfully');

    // Find user
    let user = null;
    if (role === 'vendor') {
      user = await Vendor.findOne({ phone });
    } else {
      user = await Supplier.findOne({ phone });
    }

    console.log('🔍 Backend: User exists:', !!user);

    // If user doesn't exist, create new user with default name
    if (!user) {
      if (role === 'vendor') {
        user = new Vendor({
          phone,
          role,
          name: `Vendor_${phone.slice(-4)}`, // Default name
          isOnboarded: false
        });
      } else {
        user = new Supplier({
          phone,
          role,
          name: `Supplier_${phone.slice(-4)}`, // Default name
          businessName: `Supplier_${phone.slice(-4)}`, // Default business name
          isOnboarded: false
        });
      }
      await user.save();
      console.log('✅ Backend: New user created:', user._id);
    }

    // Generate JWT token
    const tokenPayload = { 
      userId: user._id, 
      phone: user.phone, 
      role: user.role 
    };
    console.log('🔍 Backend: Generating JWT with payload:', tokenPayload);
    
    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '7d' });
    console.log('✅ Backend: JWT token generated');

    const responseData = {
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        phone: user.phone,
        name: user.name,
        role: user.role,
        isOnboarded: user.isOnboarded
      }
    };

    console.log('✅ Backend: Sending response:', responseData);
    res.json(responseData);

  } catch (error) {
    console.error('❌ Backend: Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
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
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 Backend: Profile request received for user:', req.user.userId, 'role:', req.user.role);
    
    let user = null;
    
    if (req.user.role === 'vendor') {
      user = await Vendor.findById(req.user.userId).select('-__v');
    } else if (req.user.role === 'supplier') {
      user = await Supplier.findById(req.user.userId).select('-__v');
    }
    
    if (!user) {
      console.log('❌ Backend: User not found for ID:', req.user.userId);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    console.log('✅ Backend: User profile found:', user.name);
    
    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        isOnboarded: user.isOnboarded,
        businessName: user.businessName,
        vendorType: user.vendorType,
        businessType: user.businessType,
        address: user.address
      }
    });
    
  } catch (error) {
    console.error('❌ Backend: Profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router; 
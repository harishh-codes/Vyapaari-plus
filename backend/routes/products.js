import express from 'express';
import { body, validationResult } from 'express-validator';

import Product from '../models/Product.js';

const router = express.Router();

// Get all products with filters
router.get('/', async (req, res) => {
  try {
    console.log('🔍 Backend: Fetching products with query:', req.query);
    
    const { 
      category, 
      search, 
      minPrice, 
      maxPrice, 
      page = 1, 
      limit = 20,
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;

    const query = { $or: [{ isActive: true }, { isActive: { $exists: false } }] };

    // Category filter
    if (category) {
      query.category = category;
    }

    // Search filter
    if (search) {
      query.$text = { $search: search };
    }

    // Price filters
    if (minPrice || maxPrice) {
      query.averagePrice = {};
      if (minPrice) query.averagePrice.$gte = parseFloat(minPrice);
      if (maxPrice) query.averagePrice.$lte = parseFloat(maxPrice);
    }

    console.log('🔍 Backend: Final query:', JSON.stringify(query, null, 2));

    // Sort options
    const sortOptions = {};
    if (sortBy === 'price') {
      sortOptions.averagePrice = sortOrder === 'desc' ? -1 : 1;
    } else if (sortBy === 'name') {
      sortOptions.name = sortOrder === 'desc' ? -1 : 1;
    }

    const products = await Product.find(query)
      .populate({
        path: 'supplierPrices.supplierId',
        select: 'businessName averageRating pickupSlots'
      })
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Product.countDocuments(query);

    console.log('✅ Backend: Found', products.length, 'products out of', total);

    res.json({
      success: true,
      products,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });

  } catch (error) {
    console.error('❌ Backend: Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get product categories - MUST BE BEFORE /:productId route
router.get('/categories/list', async (req, res) => {
  try {
    console.log('🔍 Backend: Fetching product categories');
    
    const categories = await Product.distinct('category', { 
      $or: [{ isActive: true }, { isActive: { $exists: false } }] 
    });
    
    console.log('✅ Backend: Categories found:', categories);
    
    res.json({
      success: true,
      categories
    });

  } catch (error) {
    console.error('❌ Backend: Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get products by category - MUST BE BEFORE /:productId route
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const query = { 
      category, 
      $or: [{ isActive: true }, { isActive: { $exists: false } }] 
    };

    const products = await Product.find(query)
    .populate({
      path: 'supplierPrices.supplierId',
      select: 'businessName averageRating'
    })
    .sort({ averagePrice: 1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    const total = await Product.countDocuments(query);

    res.json({
      success: true,
      products,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });

  } catch (error) {
    console.error('Get products by category error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Search products - MUST BE BEFORE /:productId route
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const searchQuery = {
      $text: { $search: query },
      $or: [{ isActive: true }, { isActive: { $exists: false } }]
    };

    const products = await Product.find(searchQuery)
    .populate({
      path: 'supplierPrices.supplierId',
      select: 'businessName averageRating'
    })
    .sort({ score: { $meta: 'textScore' } })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    const total = await Product.countDocuments(searchQuery);

    res.json({
      success: true,
      products,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });

  } catch (error) {
    console.error('Search products error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get product by ID - MUST BE AFTER specific routes
router.get('/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    console.log('🔍 Backend: Fetching product by ID:', productId);

    const product = await Product.findById(productId)
      .populate({
        path: 'supplierPrices.supplierId',
        select: 'businessName averageRating pickupSlots address'
      });

    if (!product) {
      console.log('❌ Backend: Product not found for ID:', productId);
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    console.log('✅ Backend: Product found:', product.name);

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
        subcategory: product.subcategory,
        description: product.description,
        image: product.image,
        unit: product.unit,
        averagePrice: product.averagePrice,
        minPrice: product.minPrice,
        maxPrice: product.maxPrice,
        tags: product.tags
      },
      suppliers: sortedSuppliers
    });

  } catch (error) {
    console.error('❌ Backend: Get product error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get price trends for a product
router.get('/:productId/price-trends', async (req, res) => {
  try {
    const { productId } = req.params;
    const { days = 30 } = req.query;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // For now, return current price stats
    // In a real app, you'd store historical price data
    const priceStats = {
      currentPrice: product.averagePrice,
      minPrice: product.minPrice,
      maxPrice: product.maxPrice,
      priceRange: product.maxPrice - product.minPrice,
      suppliersCount: product.supplierPrices.length
    };

    res.json({
      success: true,
      priceStats
    });

  } catch (error) {
    console.error('Get price trends error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get similar products
router.get('/:productId/similar', async (req, res) => {
  try {
    const { productId } = req.params;
    const { limit = 5 } = req.query;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const similarProducts = await Product.find({
      category: product.category,
      _id: { $ne: productId },
      $or: [{ isActive: true }, { isActive: { $exists: false } }]
    })
    .populate({
      path: 'supplierPrices.supplierId',
      select: 'businessName averageRating'
    })
    .limit(parseInt(limit));

    res.json({
      success: true,
      similarProducts
    });

  } catch (error) {
    console.error('Get similar products error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router; 
import mongoose from 'mongoose';

const supplierPriceSchema = new mongoose.Schema({
  supplierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: true
  },
  pricePerKg: {
    type: Number,
    required: true,
    min: 0
  },
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  pickupSlots: [{
    type: String,
    enum: ['7-9 AM', '9-11 AM', '11-1 PM', '1-3 PM', '3-5 PM', '5-7 PM', '7-9 PM']
  }],
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
      'Vegetables',
      'Fruits',
      'Grains',
      'Spices',
      'Oils',
      'Dairy',
      'Meat',
      'Seafood',
      'Beverages',
      'Snacks',
      'Other'
    ]
  },
  subcategory: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  image: {
    type: String,
    required: false // Made optional to allow updates without image
  },
  unit: {
    type: String,
    default: 'kg',
    enum: ['kg', 'g', 'l', 'ml', 'piece', 'dozen', 'pack']
  },
  supplierPrices: [supplierPriceSchema],
  averagePrice: {
    type: Number,
    default: 0
  },
  minPrice: {
    type: Number,
    default: 0
  },
  maxPrice: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  tags: [String],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better query performance
productSchema.index({ name: 'text', category: 1 });
productSchema.index({ category: 1, isActive: 1 });

// Calculate average, min, and max prices when supplier prices change
productSchema.pre('save', function(next) {
  if (this.supplierPrices.length > 0) {
    const prices = this.supplierPrices
      .filter(sp => sp.isAvailable)
      .map(sp => sp.pricePerKg);
    
    if (prices.length > 0) {
      this.averagePrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
      this.minPrice = Math.min(...prices);
      this.maxPrice = Math.max(...prices);
    }
  }
  next();
});

const Product = mongoose.model('Product', productSchema);

export default Product; 
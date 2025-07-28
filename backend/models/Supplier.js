import mongoose from 'mongoose';

const supplierSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  role: {
    type: String,
    default: 'supplier',
    enum: ['supplier']
  },
  businessName: {
    type: String,
    required: true,
    trim: true
  },
  businessType: {
    type: String,
    enum: ['Vegetables', 'Oil', 'Spices', 'Grains', 'Other'],
    required: false
  },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String
  },
  products: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  pickupSlots: [{
    type: String,
    enum: ['7-9 AM', '4-6 PM', '9-11 AM', '2-4 PM']
  }],
  ratings: [{
    type: Number,
    min: 1,
    max: 5
  }],
  reviews: [{
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },
    review: {
      type: String,
      trim: true
    },
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  averageRating: {
    type: Number,
    default: 0
  },
  isOnboarded: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Calculate average rating before saving
supplierSchema.pre('save', function(next) {
  if (this.ratings.length > 0) {
    this.averageRating = this.ratings.reduce((sum, rating) => sum + rating, 0) / this.ratings.length;
  }
  next();
});

// Create index for phone field
supplierSchema.index({ phone: 1 });

export default mongoose.model('Supplier', supplierSchema); 
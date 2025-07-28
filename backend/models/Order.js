import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  supplierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  unit: {
    type: String,
    default: 'kg'
  },
  totalPrice: {
    type: Number,
    required: true
  }
});

const orderSchema = new mongoose.Schema({
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true
  },
  items: [orderItemSchema],
  pickupSlot: {
    type: String,
    required: true
  },
  pickupDate: {
    type: Date,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['UPI', 'Cash', 'Card'],
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Confirmed', 'Ready', 'Completed', 'Cancelled'],
    default: 'Pending'
  },
  totalAmount: {
    type: Number,
    required: true
  },
  supplierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: true
  },
  orderNumber: {
    type: String,
    unique: true
  },
  notes: {
    type: String,
    trim: true
  },
  rating: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    review: {
      type: String,
      trim: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }
}, {
  timestamps: true
});

// Generate order number before saving
orderSchema.pre('save', function(next) {
  if (!this.orderNumber) {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.orderNumber = `VY${timestamp}${random}`;
  }
  
  // Calculate total amount
  if (this.items && this.items.length > 0) {
    this.totalAmount = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }
  
  next();
});

// Create index for orderNumber field
orderSchema.index({ orderNumber: 1 });

export default mongoose.model('Order', orderSchema); 
import mongoose from 'mongoose';

const vendorSchema = new mongoose.Schema({
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
    default: 'vendor',
    enum: ['vendor']
  },
  vendorType: {
    type: String,
    enum: ['Dosa', 'Vadapav', 'Juice', 'Other'],
    required: false
  },
  businessName: {
    type: String,
    trim: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String
  },
  savedKit: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  orderHistory: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  }],
  isOnboarded: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Create index for phone field
vendorSchema.index({ phone: 1 });

export default mongoose.model('Vendor', vendorSchema); 
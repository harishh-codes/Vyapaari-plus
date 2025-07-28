import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { v2 as cloudinary } from 'cloudinary';

// Load environment variables first
dotenv.config({ path: './config.env' });

// Configure Cloudinary
console.log('🔍 Server: Loading Cloudinary configuration...');
const cloudinaryConfig = {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME?.trim(),
  api_key: process.env.CLOUDINARY_API_KEY?.trim(),
  api_secret: process.env.CLOUDINARY_API_SECRET?.trim()
};

console.log('🔍 Server: Cloudinary config check:', {
  cloud_name: cloudinaryConfig.cloud_name,
  api_key: cloudinaryConfig.api_key ? 'Present' : 'Missing',
  api_secret: cloudinaryConfig.api_secret ? 'Present' : 'Missing'
});

if (!cloudinaryConfig.cloud_name || !cloudinaryConfig.api_key || !cloudinaryConfig.api_secret) {
  console.error('❌ Server: Cloudinary environment variables are missing!');
  console.error('❌ Server: Please check your config.env file');
} else {
  try {
    cloudinary.config(cloudinaryConfig);
    console.log('✅ Server: Cloudinary configured successfully');
  } catch (error) {
    console.error('❌ Server: Cloudinary configuration error:', error);
  }
}

// Import routes
import authRoutes from './routes/auth.js';
import vendorRoutes from './routes/vendor.js';
import supplierRoutes from './routes/supplier.js';
import productRoutes from './routes/products.js';
import orderRoutes from './routes/orders.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173', 
    'http://localhost:3000', 
    'http://127.0.0.1:5173',
    'https://vyapaari-frontend.onrender.com',
    'https://vyapaari-plus.onrender.com',
    'https://vyapaari-plus-app.onrender.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`🔍 Server: ${req.method} ${req.path} - Origin: ${req.headers.origin}`);
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Database connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB Atlas');
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
  });

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/vendor', vendorRoutes);
app.use('/api/supplier', supplierRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Vyapaari+ Backend is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Route not found' 
  });
});

app.listen(PORT, () => {
  console.log(`Vyapaari+ Backend running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
}); 
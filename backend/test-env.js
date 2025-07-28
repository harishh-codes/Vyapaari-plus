import dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';

// Load environment variables
dotenv.config({ path: './config.env' });

console.log('🔍 Testing environment variables...');

const config = {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
};

console.log('Environment variables:');
console.log('CLOUDINARY_CLOUD_NAME:', config.cloud_name ? `"${config.cloud_name}"` : 'undefined');
console.log('CLOUDINARY_API_KEY:', config.api_key ? `"${config.api_key}"` : 'undefined');
console.log('CLOUDINARY_API_SECRET:', config.api_secret ? `"${config.api_secret.substring(0, 10)}..."` : 'undefined');

if (!config.cloud_name || !config.api_key || !config.api_secret) {
  console.error('❌ Missing Cloudinary environment variables!');
  process.exit(1);
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: config.cloud_name.trim(),
  api_key: config.api_key.trim(),
  api_secret: config.api_secret.trim()
});

// Test Cloudinary connection
console.log('🔍 Testing Cloudinary connection...');

cloudinary.api.ping()
  .then(result => {
    console.log('✅ Cloudinary connection successful:', result);
  })
  .catch(error => {
    console.error('❌ Cloudinary connection failed:', error);
    process.exit(1);
  }); 
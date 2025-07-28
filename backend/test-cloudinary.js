import dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';

// Load environment variables
dotenv.config({ path: './config.env' });

console.log('🔍 Testing Cloudinary configuration...');

// Check environment variables
const envVars = {
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET
};

console.log('Environment variables:');
Object.entries(envVars).forEach(([key, value]) => {
  if (value) {
    console.log(`✅ ${key}: "${value}"`);
  } else {
    console.log(`❌ ${key}: undefined`);
  }
});

// Check if all required variables are present
const allPresent = Object.values(envVars).every(v => v);
console.log(`\nAll variables present: ${allPresent ? '✅ Yes' : '❌ No'}`);

if (!allPresent) {
  console.error('\n❌ Missing environment variables!');
  process.exit(1);
}

// Configure Cloudinary
const config = {
  cloud_name: envVars.CLOUDINARY_CLOUD_NAME.trim(),
  api_key: envVars.CLOUDINARY_API_KEY.trim(),
  api_secret: envVars.CLOUDINARY_API_SECRET.trim()
};

console.log('\n🔍 Configuring Cloudinary...');
cloudinary.config(config);

// Test connection
console.log('🔍 Testing Cloudinary connection...');

cloudinary.api.ping()
  .then(result => {
    console.log('✅ Cloudinary connection successful!');
    console.log('Result:', result);
  })
  .catch(error => {
    console.error('❌ Cloudinary connection failed:', error.message);
    process.exit(1);
  }); 
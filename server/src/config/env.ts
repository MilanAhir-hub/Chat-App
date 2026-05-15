import dotenv from 'dotenv';

dotenv.config();

const ONE_WEEK_IN_MS = 7 * 24 * 60 * 60 * 1000;

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: Number(process.env.PORT || 5000),
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/chat-app',
  JWT_SECRET: process.env.JWT_SECRET || 'replace-this-secret-in-production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  COOKIE_NAME: process.env.COOKIE_NAME || 'chat_app_token',
  COOKIE_MAX_AGE_MS: Number(process.env.COOKIE_MAX_AGE_MS || ONE_WEEK_IN_MS),
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  MAX_FILE_SIZE_BYTES: Number(process.env.MAX_FILE_SIZE_BYTES || 5242880),
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
  IMAGE_ENCRYPTION_KEY: process.env.IMAGE_ENCRYPTION_KEY || '',
  SERVER_ORIGIN: process.env.SERVER_ORIGIN || `http://localhost:${Number(process.env.PORT || 5000)}`,
};

export const isProduction = env.NODE_ENV === 'production';

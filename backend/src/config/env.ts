/**
 * Environment Configuration
 */

import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server
  port: parseInt(process.env.PORT || '3001'),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    name: process.env.DB_NAME || 'guardian',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres'
  },

  // Redis
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  },

  // API Keys
  apiKeys: {
    virusTotal: process.env.VIRUSTOTAL_API_KEY || '',
    safeBrowsing: process.env.SAFE_BROWSING_API_KEY || '',
    openai: process.env.OPENAI_API_KEY || '',
  },

  // Security
  security: {
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '60'), // seconds
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100')
  },

  // Cache TTL (seconds)
  cache: {
    scanResultTTL: parseInt(process.env.CACHE_SCAN_TTL || '3600'), // 1 hour
    threatIntelTTL: parseInt(process.env.CACHE_THREAT_TTL || '7200'), // 2 hours
  }
};

export default config;

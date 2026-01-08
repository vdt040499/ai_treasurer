/**
 * Application configuration.
 * 
 * Environment variables in Vite must be prefixed with VITE_
 * Create a .env file in the frontend directory with:
 * VITE_API_URL=http://localhost:8000
 */

// Get API URL from environment variable, fallback to default
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Validate that API_URL is set
if (!import.meta.env.VITE_API_URL && import.meta.env.DEV) {
  console.warn(
    'VITE_API_URL is not set. Using default: http://localhost:8000\n' +
    'Please create a .env file with VITE_API_URL=your_api_url'
  );
}


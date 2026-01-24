import { DuckColor } from './types';

// Duck colors - vibrant colors for each duck
export const DUCK_COLORS: DuckColor[] = [
  { body: '#FFD700', beak: '#FF8C00', wing: '#FFA500', label: 'bg-yellow-500' },    // Yellow
  { body: '#FF7F50', beak: '#FF4500', wing: '#FF6347', label: 'bg-orange-500' },    // Orange
  { body: '#FF6B6B', beak: '#DC143C', wing: '#FF4757', label: 'bg-red-500' },       // Red
  { body: '#32CD32', beak: '#228B22', wing: '#3CB371', label: 'bg-green-500' },     // Green
  { body: '#4DA6FF', beak: '#0066CC', wing: '#5DADE2', label: 'bg-blue-500' },      // Blue
  { body: '#9B59B6', beak: '#8E44AD', wing: '#A569BD', label: 'bg-purple-500' },    // Purple
  { body: '#FF69B4', beak: '#FF1493', wing: '#FF85C1', label: 'bg-pink-500' },      // Pink
  { body: '#20B2AA', beak: '#008B8B', wing: '#48D1CC', label: 'bg-teal-500' },      // Teal
];

// Storage key for history
export const HISTORY_KEY = 'duck_race_history';

// Race duration options in milliseconds
export const RACE_DURATIONS = [
  { label: '3s', value: 3000 },
  { label: '5s', value: 5000 },
  { label: '10s', value: 10000 },
  { label: '15s', value: 15000 },
];

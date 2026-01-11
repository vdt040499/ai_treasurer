import { getCurrentYear } from '@/utils/time';
import axios from 'axios';

const getApiUrl = (): string => {
  const metaEnv = (import.meta as any).env as Record<string, string | undefined>;
  return metaEnv?.VITE_API_URL || (process.env as any).API_URL || 'http://localhost:8000';
};

const API_URL = getApiUrl();

export const getTransactions = async () => {
  const response = await axios.get(`${API_URL}/api/transactions`, {
    params: {
      start_date: `${getCurrentYear()}-01-01`,
      end_date: `${getCurrentYear()}-12-31`
    }
  });

  return response.data;
};

export const getDashboardStats = async () => {
  const response = await axios.get(`${API_URL}/api/transactions/dashboard-stats`);
  return response.data;
};

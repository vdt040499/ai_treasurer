import { getCurrentYear } from '@/utils/time';
import axios from 'axios';

const getApiUrl = (): string => {
  const metaEnv = (import.meta as any).env as Record<string, string | undefined>;
  return metaEnv?.VITE_API_URL || (process.env as any).API_URL || 'http://localhost:8000';
};

const API_URL = getApiUrl();

export const getUsersWithContributions = async () => {
  const response = await axios.get(`${API_URL}/api/users/get-users-with-contributions`, {
    params: {
      year: getCurrentYear()
    }
  });

  return response.data;
};
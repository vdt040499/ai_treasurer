import axios from 'axios';

const getApiUrl = (): string => {
  const metaEnv = (import.meta as any).env as Record<string, string | undefined>;
  return metaEnv?.VITE_API_URL || (process.env as any).API_URL || 'http://localhost:8000';
};

const API_URL = getApiUrl();

export const getDebts = async (isFullyPaid?: boolean) => {
  const params: Record<string, any> = {};
  if (isFullyPaid !== undefined) {
    params.is_fully_paid = isFullyPaid;
  }

  const response = await axios.get(`${API_URL}/api/debts`, { params });
  return response.data;
};


import axios from 'axios';

const getApiUrl = (): string => {
  const metaEnv = (import.meta as any).env as Record<string, string | undefined>;
  return metaEnv?.VITE_API_URL || (process.env as any).API_URL || 'http://localhost:8000';
};

const API_URL = getApiUrl();

export interface CreatePaymentRequest {
  amount: number;
  description: string;
  user_id: number;
}

export interface CreatePaymentResponse {
  checkoutUrl: string;
  orderCode: number;
  transaction_id: number;
}

export const createPaymentLink = async (data: CreatePaymentRequest): Promise<CreatePaymentResponse> => {
  const response = await axios.post(`${API_URL}/api/payments/create-link`, data);
  return response.data;
};

import axios from 'axios';
import { API_URL } from '../config';

export const getIncomes = async () => {
  const response = await axios.get(`${API_URL}/api/transactions/get-all-incomes`);
  return response.data;
};
import axios from 'axios';

// Get API URL from environment or use default
const getApiUrl = (): string => {
  const metaEnv = (import.meta as any).env as Record<string, string | undefined>;
  return metaEnv?.VITE_API_URL || (process.env as any).API_URL || 'http://localhost:8000';
};

const API_URL = getApiUrl();

/**
 * Convert base64 string to File object
 */
const base64ToFile = (base64: string, mimeType: string, filename: string = 'image.jpg'): File => {
  // Remove data URL prefix if present
  const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;
  
  // Convert base64 to binary
  const byteCharacters = atob(base64Data);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  
  // Create Blob and then File
  const blob = new Blob([byteArray], { type: mimeType });
  return new File([blob], filename, { type: mimeType });
};

/**
 * Process income image (base64 string) and create transaction
 */
export const topupTransaction = async (base64Data: string, mimeType: string = 'image/jpeg') => {
  // Convert base64 to File
  const file = base64ToFile(base64Data, mimeType, 'income-image.jpg');
  
  // Create FormData to send file
  const formData = new FormData();
  formData.append('file', file);
  
  // Send as multipart/form-data
  const response = await axios.post(
    `${API_URL}/api/ai/process-income-image`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  
  return response.data;
};

/**
 * Process expense image (base64 string) and create transaction(s)
 */
export const processExpenseImage = async (base64Data: string, mimeType: string = 'image/jpeg') => {
  // Convert base64 to File
  const file = base64ToFile(base64Data, mimeType, 'expense-image.jpg');
  
  // Create FormData to send file
  const formData = new FormData();
  formData.append('file', file);
  
  // Send as multipart/form-data
  const response = await axios.post(
    `${API_URL}/api/ai/process-expense-image`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  
  return response.data;
};  
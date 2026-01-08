
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { TransactionType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export const extractTransactionFromImage = async (base64Data: string, mimeType: string, hint?: 'INCOME' | 'EXPENSE') => {
  const model = 'gemini-3-flash-preview';
  
  const systemInstruction = `
    Bạn là một trợ lý kế toán thông minh. Nhiệm vụ của bạn là phân tích hình ảnh (bill thanh toán, chuyển khoản ngân hàng, hóa đơn) và trích xuất thông tin giao dịch.
    ${hint ? `Gợi ý: Đây có khả năng cao là giao dịch loại ${hint}.` : ''}
    
    Hãy xác định:
    1. Loại giao dịch: INCOME (nếu là tiền vào/đóng quỹ) hoặc EXPENSE (nếu là hóa đơn chi tiêu).
    2. Số tiền: Trích xuất con số chính xác.
    3. Ngày: Định dạng YYYY-MM-DD.
    4. Mô tả: Nội dung giao dịch.
    5. Hạng mục: Chọn từ [Đóng quỹ, Ăn uống, Văn phòng phẩm, Du lịch, Sự kiện, Khác].
    6. Tên người liên quan: Nếu là đóng quỹ, hãy tìm tên người chuyển.
  `;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      type: { type: Type.STRING, description: "INCOME or EXPENSE" },
      amount: { type: Type.NUMBER },
      date: { type: Type.STRING, description: "YYYY-MM-DD" },
      description: { type: Type.STRING },
      category: { type: Type.STRING },
      personName: { type: Type.STRING, nullable: true }
    },
    required: ["type", "amount", "date", "description", "category"],
  };

  const imagePart = {
    inlineData: {
      data: base64Data.split(',')[1],
      mimeType: mimeType,
    },
  };

  const textPart = {
    text: "Phân tích hình ảnh này và trích xuất thông tin giao dịch dưới dạng JSON."
  };

  try {
    const result = await ai.models.generateContent({
      model,
      contents: { parts: [imagePart, textPart] },
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema,
      },
    });

    return JSON.parse(result.text);
  } catch (error) {
    console.error("Error extracting data:", error);
    throw error;
  }
};

export const getFoodSuggestion = async () => {
  const model = 'gemini-3-flash-preview';
  try {
    const response = await ai.models.generateContent({
      model,
      contents: "Gợi ý 3 món ăn trưa hấp dẫn và phổ biến cho dân văn phòng tại Việt Nam hôm nay. Kèm theo lý do ngắn gọn tại sao nên ăn món đó. Trả về định dạng Markdown ngắn gọn.",
    });
    return response.text;
  } catch (error) {
    return "Hôm nay ăn Cơm Tấm cho chắc bụng nhé!";
  }
};

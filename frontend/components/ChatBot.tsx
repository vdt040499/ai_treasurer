
import React, { useState, useRef } from 'react';
import { extractTransactionFromImage } from '../services/geminiService';
import { Transaction } from '../types';

interface ChatBotProps {
  onNewTransaction: (t: Transaction) => void;
}

const ChatBot: React.FC<ChatBotProps> = ({ onNewTransaction }) => {
  const [messages, setMessages] = useState<{role: 'user' | 'ai', text: string, image?: string}[]>([
    { role: 'ai', text: 'Xin chào! Tôi là trợ lý quản lý quỹ. Bạn có thể gửi ảnh biên lai hoặc màn hình chuyển khoản để tôi tự động cập nhật nhé!' }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64Data = e.target?.result as string;
      
      // Add user message with image preview
      setMessages(prev => [...prev, { role: 'user', text: 'Đã gửi một hình ảnh.', image: base64Data }]);
      setIsProcessing(true);

      try {
        const extracted = await extractTransactionFromImage(base64Data, file.type);
        
        const newTransaction: Transaction = {
          id: Date.now().toString(),
          ...extracted
        };

        onNewTransaction(newTransaction);

        setMessages(prev => [...prev, { 
          role: 'ai', 
          text: `Đã hiểu! Tôi đã cập nhật giao dịch: ${extracted.description} (${extracted.type === 'INCOME' ? 'Thu' : 'Chi'} ${new Intl.NumberFormat('vi-VN').format(extracted.amount)} VNĐ)` 
        }]);
      } catch (err) {
        setMessages(prev => [...prev, { role: 'ai', text: 'Rất tiếc, tôi không thể đọc được thông tin từ ảnh này. Bạn hãy thử chụp rõ hơn nhé!' }]);
      } finally {
        setIsProcessing(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col h-full glass rounded-3xl overflow-hidden shadow-2xl border border-white/40">
      <div className="p-5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold">AI Assistant</h3>
            <p className="text-[10px] text-blue-100 uppercase tracking-widest font-semibold">Online & Ready</p>
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/30">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-3 rounded-2xl shadow-sm text-sm ${
              m.role === 'user' 
                ? 'bg-blue-600 text-white rounded-tr-none' 
                : 'bg-white text-slate-700 rounded-tl-none border border-slate-100'
            }`}>
              {m.image && (
                <img src={m.image} alt="uploaded" className="mb-2 rounded-lg max-h-48 w-full object-cover border border-white/20" />
              )}
              {m.text}
            </div>
          </div>
        ))}
        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-slate-100 flex items-center gap-2">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
              <span className="text-xs text-slate-500 font-medium">Đang xử lý ảnh...</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-white border-t border-slate-100">
        <div className="flex gap-2">
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            ref={fileInputRef}
            onChange={handleFileUpload}
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold rounded-xl transition-all border border-slate-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Tải ảnh giao dịch
          </button>
          <button className="w-12 h-12 flex items-center justify-center bg-blue-600 text-white rounded-xl shadow-lg hover:shadow-blue-200 transition-all">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatBot;

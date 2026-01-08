
import React, { useState, useRef } from 'react';
import { extractTransactionFromImage, getFoodSuggestion } from '../services/geminiService';
import { Transaction } from '../types';
import { topupTransaction, processExpenseImage } from '@/services/chatBotService';

interface ChatBotProps {
  onNewTransaction: (t: Transaction) => void;
}

const ChatBot: React.FC<ChatBotProps> = ({ onNewTransaction }) => {
  const [messages, setMessages] = useState<{role: 'user' | 'ai', text: string, image?: string}[]>([
    { role: 'ai', text: 'Xin chào! Tôi là trợ lý quản lý quỹ. Bạn có thể gửi ảnh biên lai hoặc màn hình chuyển khoản để tôi tự động cập nhật nhé!' }
  ]);
  const [inputText, setInputText] = useState('');
  const [stagedFile, setStagedFile] = useState<{data: string, type: string} | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setStagedFile({
        data: e.target?.result as string,
        type: file.type
      });
    };
    reader.readAsDataURL(file);
  };

  const processImage = async (hint: 'INCOME' | 'EXPENSE') => {
    if (!stagedFile) return;
    
    const base64Data = stagedFile.data;
    const mimeType = stagedFile.type;
    
    setMessages(prev => [...prev, { role: 'user', text: `Phân tích ${hint === 'INCOME' ? 'chuyển khoản đóng quỹ' : 'hóa đơn chi tiêu'}.`, image: base64Data }]);
    setIsProcessing(true);
    const fileData = { ...stagedFile }; // Save file data before clearing
    setStagedFile(null);

    try {
      if (hint === 'INCOME') {
        const extracted = await topupTransaction(fileData.data, fileData.type);
        const newTransaction: Transaction = {
          id: Date.now().toString(),
          ...extracted
        };
        onNewTransaction(newTransaction);
        setMessages(prev => [...prev, { 
          role: 'ai', 
          text: `✅ Đã xong! Tôi đã ghi nhận: ${extracted.user_name || 'Giao dịch'}. Số tiền: ${new Intl.NumberFormat('vi-VN').format(extracted.amount)} VNĐ.` 
        }]);
      } else {
        const extracted = await processExpenseImage(fileData.data, fileData.type);
        // await new Promise(resolve => setTimeout(resolve, 3000));
      //   const extracted = [
      //     {
      //         "id": 21,
      //         "created_at": "2026-01-08T23:34:16.781724+00:00",
      //         "type": "EXPENSE",
      //         "amount": 63000,
      //         "user_id": null,
      //         "image_url": null,
      //         "description": "Thiên Food - Bánh Đúc Lá Dứa - Cao Thắng",
      //         "transaction_date": "2026-01-02T00:00:00",
      //         "status": "COMPLETED",
      //         "err_message": null
      //     },
      //     {
      //         "id": 22,
      //         "created_at": "2026-01-08T23:34:16.781724+00:00",
      //         "type": "EXPENSE",
      //         "amount": 272150,
      //         "user_id": null,
      //         "image_url": null,
      //         "description": "Chè Bưởi Vĩnh Long - Tô Hiến Thành",
      //         "transaction_date": "2025-12-31T00:00:00",
      //         "status": "COMPLETED",
      //         "err_message": null
      //     }
      // ]
        // extracted can be an array of transactions
        const transactions = Array.isArray(extracted) ? extracted : [extracted];
        const totalAmount = transactions.reduce((sum: number, tx: any) => sum + (tx.amount || 0), 0);
        
        // Prepare messages for each bill
        const billMessages = transactions.map((tx: any, index: number) => {
          const newTransaction: Transaction = {
            id: Date.now().toString() + Math.random(),
            ...tx
          };
          onNewTransaction(newTransaction);
          
          // Create a separate message for each bill
          return {
            role: 'ai' as const,
            text: `📄 Hóa đơn ${index + 1}: ${tx.description || 'Không có mô tả'}\n💰 Số tiền: ${new Intl.NumberFormat('vi-VN').format(tx.amount || 0)} VNĐ`
          };
        });
        
        // Add all bill messages and summary message at once
        setMessages(prev => [
          ...prev,
          ...billMessages,
          {
            role: 'ai' as const,
            text: `✅ Đã ghi nhận ${transactions.length} hóa đơn. Tổng tiền: ${new Intl.NumberFormat('vi-VN').format(totalAmount)} VNĐ.`
          }
        ]);
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'ai', text: '❌ Lỗi rồi! Tôi không đọc được ảnh này, bạn kiểm tra lại hoặc nhập tay nhé.' }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendText = async () => {
    if (!inputText.trim()) return;
    const text = inputText;
    setInputText('');
    setMessages(prev => [...prev, { role: 'user', text }]);
    
    // Check if it's a food suggestion request
    if (text.toLowerCase().includes('ăn gì') || text.toLowerCase().includes('gợi ý')) {
      setIsProcessing(true);
      const suggestion = await getFoodSuggestion();
      setMessages(prev => [...prev, { role: 'ai', text: suggestion }]);
      setIsProcessing(false);
    } else {
      setMessages(prev => [...prev, { role: 'ai', text: 'Tôi là AI trích xuất hóa đơn. Hiện tại tôi chưa hỗ trợ trả lời câu hỏi tự do, nhưng bạn có thể hỏi "Hôm nay ăn gì?" nhé!' }]);
    }
  };

  const triggerFoodSuggestion = async () => {
    setIsProcessing(true);
    const suggestion = await getFoodSuggestion();
    setMessages(prev => [...prev, { role: 'ai', text: suggestion }]);
    setIsProcessing(false);
  };

  return (
    <div className="flex flex-col h-full glass rounded-3xl overflow-hidden shadow-2xl border border-white/40">
      <div className="p-5 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md ring-2 ring-white/30">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold">Gemini Finance AI</h3>
            <p className="text-[10px] text-white/70 uppercase tracking-widest font-black">Powered by Google</p>
          </div>
        </div>
        <button 
          onClick={triggerFoodSuggestion}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors group relative"
          title="Gợi ý món ăn"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          <span className="absolute -bottom-8 right-0 bg-slate-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity">Gợi ý món ăn</span>
        </button>
      </div>

      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50 scroll-smooth">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-3 rounded-2xl shadow-sm text-sm ${
              m.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-tr-none' 
                : 'bg-white text-slate-700 rounded-tl-none border border-slate-100'
            }`}>
              {m.image && (
                <img src={m.image} alt="uploaded" className="mb-2 rounded-lg max-h-48 w-full object-cover border border-white/20" />
              )}
              <div className="prose prose-sm max-w-none prose-slate">
                {m.text.split('\n').map((line, idx) => <p key={idx}>{line}</p>)}
              </div>
            </div>
          </div>
        ))}
        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-slate-100 flex items-center gap-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
              <span className="text-xs text-slate-500 font-bold italic">Gemini đang suy nghĩ...</span>
            </div>
          </div>
        )}
      </div>

      {stagedFile && (
        <div className="p-3 bg-indigo-50 border-t border-indigo-100 flex items-center gap-3 animate-slide-up">
           <div className="relative">
             <img src={stagedFile.data} className="w-16 h-16 object-cover rounded-lg border-2 border-white shadow-sm" alt="staged" />
             <button onClick={() => setStagedFile(null)} className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 shadow-md">
               <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
             </button>
           </div>
           <div className="flex-1 grid grid-cols-2 gap-2">
             <button 
              onClick={() => processImage('INCOME')}
              className="py-2 px-3 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-lg hover:bg-emerald-700 transition-all flex items-center justify-center gap-1"
             >
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
               Đóng Quỹ
             </button>
             <button 
              onClick={() => processImage('EXPENSE')}
              className="py-2 px-3 bg-rose-600 text-white rounded-xl text-xs font-bold shadow-lg hover:bg-rose-700 transition-all flex items-center justify-center gap-1"
             >
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
               Chi Tiêu
             </button>
           </div>
        </div>
      )}

      <div className="p-4 bg-white border-t border-slate-100">
        <div className="flex gap-2 items-center">
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            ref={fileInputRef}
            onChange={handleFileChange}
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-2xl border border-slate-200 transition-all"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>
          
          <input 
            type="text"
            placeholder="Nhập tin nhắn hoặc hỏi 'Ăn gì?'..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendText()}
            className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700"
          />

          <button 
            onClick={handleSendText}
            disabled={!inputText.trim()}
            className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-all shadow-lg ${
              inputText.trim() 
                ? 'bg-indigo-600 text-white hover:scale-105 active:scale-95' 
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <svg className="w-5 h-5 rotate-90" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatBot;


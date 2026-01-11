
import React, { useState, useRef } from 'react';
import { extractTransactionFromImage, getFoodSuggestion } from '../services/geminiService';
import { Transaction } from '../types';
import { topupTransaction, processExpenseImage } from '@/services/chatBotService';

interface ChatBotProps {
  onNewTransaction: (t: Transaction) => void;
}

const ChatBot: React.FC<ChatBotProps> = () => {
  const [messages, setMessages] = useState<{role: 'user' | 'ai', text: string, image?: string, isSample?: boolean}[]>([
    { 
      role: 'ai', 
      text: 'Xin chào! Tôi là APPFUND Assistant - trợ lý quản lý quỹ. Bạn có thể gửi ảnh màn hình chuyển khoản và hoá đơn để tôi tự động cập nhật dữ liệu nhé!' 
    },
    {
      role: 'user',
      text: '',
      image: 'https://res.cloudinary.com/dqxrwqict/image/upload/v1768122283/IMG_5442_vjugcp.png',
      isSample: true
    },
    {
      role: 'ai',
      text: '✅ Đã xong! Tôi đã ghi nhận: Võ Duy Tân. Số tiền: 200.000 VNĐ.'
    },
    {
      role: 'user',
      text: '',
      image: 'https://res.cloudinary.com/dqxrwqict/image/upload/v1768124121/IMG_5443_q84kph.jpg',
      isSample: true
    },
    {
      role: 'ai',
      text: '📄 Hóa đơn 1: Chè Bưởi Vĩnh Long - Tô Hiến Thành\n💰 Số tiền: 272.150 VNĐ'
    },
    {
      role: 'ai',
      text: '📄 Hóa đơn 2: Cá Viên Chiên Nước Mắm & Kem Kẹp Singapore\n💰 Số tiền: 207.800 VNĐ'
    },
    {
      role: 'ai',
      text: '✅ Đã xong! Tôi đã ghi nhận: 2 hóa đơn. Tổng tiền: 479.950 VNĐ.'
    }
  ]);
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [stagedFile, setStagedFile] = useState<{data: string, type: string} | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      // Reset input value to allow selecting the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMessages(prev => [...prev, { 
        role: 'ai', 
        text: '❌ Vui lòng chọn file hình ảnh (jpg, png, etc.)' 
      }]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setMessages(prev => [...prev, { 
        role: 'ai', 
        text: '❌ File quá lớn! Vui lòng chọn file nhỏ hơn 10MB' 
      }]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    const reader = new FileReader();
    
    reader.onload = (e) => {
      const result = e.target?.result;
      if (result && typeof result === 'string') {
        setStagedFile({
          data: result,
          type: file.type
        });
      } else {
        setMessages(prev => [...prev, { 
          role: 'ai', 
          text: '❌ Lỗi khi đọc file. Vui lòng thử lại.' 
        }]);
      }
      // Reset input value to allow selecting the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };

    reader.onerror = () => {
      setMessages(prev => [...prev, { 
        role: 'ai', 
        text: '❌ Lỗi khi đọc file. Vui lòng thử lại.' 
      }]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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
        // onNewTransaction(newTransaction);
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
          // onNewTransaction(newTransaction);
          
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
      setMessages(prev => [...prev, { role: 'ai', text: `❌ ${err.message}` }]);
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
      <div className="p-5 bg-gradient-to-r from-blue-600 via-blue-500 to-orange-500 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md ring-2 ring-white/30">
            {/* <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg> */}
            <img src="https://res.cloudinary.com/dqxrwqict/image/upload/v1767975904/Gemini_Generated_Image_duz4cduz4cduz4cd_ga2zve.png" alt="profile" className="w-full h-10 rounded-full object-cover object-center" />
          </div>
          <div>
            <h3 className="font-bold">APPFUND Assistant</h3>
            <p className="text-[10px] text-white/70 tracking-widest font-black">Application Fund Tracker</p>
          </div>
        </div>
        {/* <button 
          onClick={triggerFoodSuggestion}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors group relative"
          title="Gợi ý món ăn"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          <span className="absolute -bottom-8 right-0 bg-slate-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity">Gợi ý món ăn</span>
        </button> */}
      </div>

      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50 scroll-smooth">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-3 rounded-2xl shadow-sm text-sm ${
              m.role === 'user' 
                ? 'bg-blue-600 text-white rounded-tr-none' 
                : 'bg-white text-slate-700 rounded-tl-none border border-slate-100'
            }`}>
              {m.image && (
                <div className="mb-2">
                  {m.isSample ? (
                    <img 
                      src={m.image} 
                      alt="sample" 
                      className="rounded-lg max-h-32 w-auto object-contain border border-white/20 cursor-pointer hover:opacity-80 transition-opacity shadow-sm" 
                      onClick={() => setEnlargedImage(m.image!)}
                    />
                  ) : (
                    <img src={m.image} alt="uploaded" className="rounded-lg max-h-48 w-full object-cover border border-white/20" />
                  )}
                </div>
              )}
              {m.text && (
                <div className={`prose prose-sm max-w-none ${m.role === 'user' ? 'prose-invert' : 'prose-slate'}`}>
                  {m.text.split('\n').map((line, idx) => <p key={idx}>{line}</p>)}
                </div>
              )}
            </div>
          </div>
        ))}
        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-slate-100 flex items-center gap-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
              <span className="text-xs text-slate-500 font-bold italic">AppFund đang xử lý...</span>
            </div>
          </div>
        )}
      </div>

      {/* Enlarged Image Modal */}
      {enlargedImage && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setEnlargedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full">
            <button
              onClick={() => setEnlargedImage(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img 
              src={enlargedImage} 
              alt="enlarged" 
              className="w-full h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {stagedFile && (
        <div className="p-3 bg-blue-50 border-t border-blue-100 flex items-center gap-3 animate-slide-up">
           <div className="relative">
             <img src={stagedFile.data} className="w-16 h-16 object-cover rounded-lg border-2 border-white shadow-sm" alt="staged" />
             <button onClick={() => setStagedFile(null)} className="absolute -top-2 -right-2 bg-orange-500 text-white rounded-full p-1 shadow-md">
               <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
             </button>
           </div>
           <div className="flex-1 grid grid-cols-2 gap-2">
             <button 
              onClick={() => processImage('INCOME')}
              className="py-2 px-3 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-1"
             >
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
               Đóng Quỹ
             </button>
             <button 
              onClick={() => processImage('EXPENSE')}
              className="py-2 px-3 bg-orange-600 text-white rounded-xl text-xs font-bold shadow-lg hover:bg-orange-700 transition-all flex items-center justify-center gap-1"
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
            className="flex-1 flex items-center justify-center gap-3 bg-white border-2 border-transparent bg-clip-padding rounded-2xl px-4 py-3 transition-all shadow-md hover:shadow-lg font-medium text-sm relative group"
            style={{
              backgroundImage: 'linear-gradient(white, white), linear-gradient(to right, #2563eb, #f97316)',
              backgroundOrigin: 'border-box',
              backgroundClip: 'padding-box, border-box'
            }}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24">
              <defs>
                <linearGradient id="iconGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#2563eb" />
                  <stop offset="100%" stopColor="#f97316" />
                </linearGradient>
              </defs>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" stroke="url(#iconGradient)" />
            </svg>
            <span className="bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent font-semibold">Tải hình màn hình chuyển khoản tại đây</span>
          </button>
          
          {/* <input 
            type="text"
            placeholder="Nhập tin nhắn hoặc hỏi 'Ăn gì?'..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendText()}
            className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700"
          /> */}

          {/* <button 
            onClick={handleSendText}
            disabled={!inputText.trim()}
            className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-all shadow-lg ${
              inputText.trim() 
                ? 'bg-blue-600 text-white hover:scale-105 active:scale-95' 
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <svg className="w-5 h-5 rotate-90" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </button> */}
        </div>
      </div>
    </div>
  );
};

export default ChatBot;


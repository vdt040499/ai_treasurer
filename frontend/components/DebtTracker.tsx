
import React, { useMemo, useState } from 'react';
import { Member, Transaction } from '../types';
import { MONTHS, MONTHLY_FEE } from '../constants';
import { getCurrentMonth } from '../utils/time';
import { createPaymentLink } from '../services/paymentService';

interface DebtTrackerProps {
  members: Member[];
  transactions: Transaction[];
  isLoading?: boolean;
}

const DebtTracker: React.FC<DebtTrackerProps> = ({ members, isLoading = false }) => {
  const currentMonth = new Date().toISOString().substring(0, 7);
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);

  const debts = useMemo(() => {
    return members.map(member => {
      const unpaidMonths = MONTHS.filter(m => m <= currentMonth && !member.contributions.includes(m));

      const totalDebt = -member.debt_amount;
      const debtDescription = member.debt_description;

      return {
        ...member,
        unpaidMonths,
        totalDebt,
        debtDescription
      };
    }).filter(d => d.totalDebt > 0).sort((a, b) => b.totalDebt - a.totalDebt);
  }, [members, currentMonth]);

  console.log(debts);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  const handlePayment = async (debtor: any) => {
    try {
      setProcessingPayment(debtor.id);
      
      const description = `${debtor.name} chuyển`;
      
      const response = await createPaymentLink({
        amount: debtor.totalDebt,
        description: description,
        user_id: parseInt(debtor.id)
      });

      // Mở cửa sổ mới để thanh toán PayOS
      window.open(response.checkoutUrl, '_blank');
      
      // Hoặc redirect trực tiếp:
      // window.location.href = response.checkoutUrl;
      
    } catch (error: any) {
      console.error('Error creating payment link:', error);
      alert(error.response?.data?.detail || 'Có lỗi xảy ra khi tạo link thanh toán. Vui lòng thử lại.');
    } finally {
      setProcessingPayment(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6">
      <div className="p-5 border-b border-slate-100 bg-orange-50/30 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h3 className="font-bold text-slate-800 text-lg">Danh sách "Nợ" quỹ</h3>
          <p className="text-sm text-slate-500 font-medium">Thành viên chưa đóng quỹ tháng {getCurrentMonth()}</p>
        </div>
      </div>
      {isLoading ? (
        <div className="p-12 flex flex-col items-center justify-center">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin"></div>
          </div>
          <p className="mt-4 text-slate-600 text-sm font-medium">Đang tải dữ liệu...</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {debts.length > 0 ? debts.map(debtor => (
            <div key={debtor.id} className="p-4 hover:bg-slate-50 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-4 flex-1">
                  <img src={debtor.avatar} alt={debtor.name} className="w-12 h-12 rounded-full border-2 border-white shadow-sm" />
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-800">{debtor.name}</h4>
                    <p className="text-xs text-slate-500">
                      Thiếu Quỹ tháng {debtor.unpaidMonths.map(m => m.split('-')[1]).join(', ')}
                      {debtor.debtDescription && ` và tiền ${debtor.debtDescription}`}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="text-orange-600 font-black text-lg">{formatCurrency(debtor.totalDebt)}</div>
                  <button
                    onClick={() => handlePayment(debtor)}
                    disabled={processingPayment === debtor.id}
                    className="py-1.5 px-3 bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white font-semibold text-xs rounded-lg transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 whitespace-nowrap"
                  >
                    {processingPayment === debtor.id ? (
                      <>
                        <svg className="animate-spin h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                        <span>Thanh toán</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )) : (
            <div className="p-10 text-center text-slate-400 font-medium">
               🎉 Tuyệt vời! Tất cả thành viên đã đóng quỹ đầy đủ.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DebtTracker;

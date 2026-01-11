
import React, { useMemo } from 'react';
import { Member, Transaction } from '../types';
import { MONTHS, MONTHLY_FEE } from '../constants';
import { getCurrentMonth } from '../utils/time';

interface DebtTrackerProps {
  members: Member[];
  transactions: Transaction[];
  isLoading?: boolean;
}

const DebtTracker: React.FC<DebtTrackerProps> = ({ members, isLoading = false }) => {
  const currentMonth = new Date().toISOString().substring(0, 7);

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
            <div key={debtor.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-4">
                <img src={debtor.avatar} alt={debtor.name} className="w-12 h-12 rounded-full border-2 border-white shadow-sm" />
                <div>
                  <h4 className="font-bold text-slate-800">{debtor.name}</h4>
                  <p className="text-xs text-slate-500">
                    Thiếu Quỹ tháng {debtor.unpaidMonths.map(m => m.split('-')[1]).join(', ')}
                    {debtor.debtDescription && ` và tiền ${debtor.debtDescription}`}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-orange-600 font-black text-lg">{formatCurrency(debtor.totalDebt)}</div>
                {/* <span className="inline-block px-2 py-0.5 bg-orange-100 text-orange-600 text-[10px] font-bold rounded uppercase">Cần nhắc nhở</span> */}
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

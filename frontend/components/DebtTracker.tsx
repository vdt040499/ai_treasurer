
import React, { useMemo } from 'react';
import { Member } from '../types';
import { MONTHS, MONTHLY_FEE } from '../constants';

interface DebtTrackerProps {
  members: Member[];
}

const DebtTracker: React.FC<DebtTrackerProps> = ({ members }) => {
  const currentMonth = new Date().toISOString().substring(0, 7);

  const debts = useMemo(() => {
    return members.map(member => {
      // Find months that should have been paid up to current month
      const unpaidMonths = MONTHS.filter(m => m <= currentMonth && !member.contributions.includes(m));
      const totalDebt = unpaidMonths.length * MONTHLY_FEE;
      return {
        ...member,
        unpaidMonths,
        totalDebt
      };
    }).filter(d => d.totalDebt > 0).sort((a, b) => b.totalDebt - a.totalDebt);
  }, [members, currentMonth]);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6">
      <div className="p-5 border-b border-slate-100 bg-rose-50/30 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h3 className="font-bold text-slate-800 text-lg">Danh sách "Nợ" quỹ</h3>
          <p className="text-sm text-slate-500 font-medium">Thành viên chưa hoàn thành đóng góp</p>
        </div>
      </div>
      <div className="divide-y divide-slate-100">
        {debts.length > 0 ? debts.map(debtor => (
          <div key={debtor.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-4">
              <img src={debtor.avatar} alt={debtor.name} className="w-12 h-12 rounded-full border-2 border-white shadow-sm" />
              <div>
                <h4 className="font-bold text-slate-800">{debtor.name}</h4>
                <p className="text-xs text-slate-500">Thiếu: {debtor.unpaidMonths.join(', ')}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-rose-600 font-black text-lg">{formatCurrency(debtor.totalDebt)}</div>
              <span className="inline-block px-2 py-0.5 bg-rose-100 text-rose-600 text-[10px] font-bold rounded uppercase">Cần nhắc nhở</span>
            </div>
          </div>
        )) : (
          <div className="p-10 text-center text-slate-400 font-medium">
             🎉 Tuyệt vời! Tất cả thành viên đã đóng quỹ đầy đủ.
          </div>
        )}
      </div>
    </div>
  );
};

export default DebtTracker;

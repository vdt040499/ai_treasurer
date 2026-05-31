import React, { useMemo } from 'react';
import { Transaction } from '../types';
import { getMonths } from '../utils/time';

interface BonusIncomeTrackerProps {
  transactions: Transaction[];
  isLoading?: boolean;
}

const MONTHS = getMonths();

const BonusIncomeTracker: React.FC<BonusIncomeTrackerProps> = ({
  transactions,
  isLoading = false
}) => {
  const bonusRows = useMemo(() => {
    return [...transactions]
      .sort((a, b) => {
        const dateA = new Date(a.transaction_date || a.created_at).getTime();
        const dateB = new Date(b.transaction_date || b.created_at).getTime();
        return dateA - dateB;
      })
      .map((transaction, index) => {
        const rawDate = transaction.transaction_date || transaction.created_at;
        const month = rawDate?.substring(0, 7);

        return {
          ...transaction,
          displayIndex: index + 1,
          month
        };
      });
  }, [transactions]);

  const totalBonus = useMemo(() => {
    return transactions.reduce((sum, transaction) => sum + (transaction.amount || 0), 0);
  }, [transactions]);

  const monthlyTotals = useMemo(() => {
    return transactions.reduce<Record<string, number>>((totals, transaction) => {
      const month = (transaction.transaction_date || transaction.created_at)?.substring(0, 7);
      if (!month) {
        return totals;
      }

      totals[month] = (totals[month] || 0) + (transaction.amount || 0);
      return totals;
    }, {});
  }, [transactions]);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  return (
    <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-blue-50 flex items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-slate-800 text-lg">Tiền thưởng / Tiền tài trợ</h3>
          <p className="text-xs text-slate-500 mt-0.5">Các khoản phát sinh ngoài khoản thu quỹ</p>
        </div>
        <div className="px-4 py-2 rounded-xl bg-emerald-600 text-white shadow-sm text-right">
          <p className="text-[10px] uppercase tracking-wider font-bold text-emerald-100">Tổng</p>
          <p className="text-lg font-black">{formatCurrency(totalBonus)}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="p-10 text-center text-slate-500 text-sm font-medium">Đang tải dữ liệu...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider font-bold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 min-w-[220px]">Sự kiện</th>
                {MONTHS.map(month => (
                  <th key={month} className="px-3 py-3 text-center min-w-[86px]">{month.split('-')[1]}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bonusRows.map(transaction => (
                <tr key={transaction.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-black">
                        {transaction.displayIndex}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 whitespace-nowrap">{transaction.description}</p>
                        <p className="text-xs text-slate-400">
                          {new Date(transaction.transaction_date || transaction.created_at).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                    </div>
                  </td>
                  {MONTHS.map(month => {
                    const hasAmount = transaction.month === month;

                    return (
                      <td key={month} className={`px-3 py-3 text-center`}>
                        {hasAmount ? (
                          <span className="inline-flex items-center justify-center rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-700 whitespace-nowrap">
                            +{formatCurrency(transaction.amount)}
                          </span>
                        ) : (
                          <span className="text-slate-200">•</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
              {bonusRows.length > 0 && (
                <tr className="bg-gradient-to-r from-emerald-50 to-blue-50 border-t-2 border-emerald-100">
                  <td className="px-4 py-3 font-black text-slate-800">Tổng theo tháng</td>
                  {MONTHS.map(month => (
                    <td key={month} className="px-3 py-3 text-center">
                      {monthlyTotals[month] ? (
                        <span className="text-xs font-black text-emerald-700 whitespace-nowrap">
                          {formatCurrency(monthlyTotals[month])}
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                  ))}
                </tr>
              )}
            </tbody>
          </table>
          {bonusRows.length === 0 && (
            <div className="p-10 text-center text-slate-400 text-sm font-medium">
              Chưa có khoản tài trợ nào.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BonusIncomeTracker;

import React, { useMemo } from 'react';
import { Transaction, TransactionType } from '../types';

interface TransactionListProps {
  transactions: Transaction[];
  isLoading?: boolean;
}

const TransactionList: React.FC<TransactionListProps> = ({ transactions, isLoading = false }) => {
  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  const sortedTransactions = useMemo(() => {
    return transactions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [transactions]);

  return (isLoading ? (
    <div className="p-12 flex flex-col items-center justify-center">
      <div className="relative">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
      <p className="mt-4 text-slate-600 text-sm font-medium">Đang tải dữ liệu...</p>
    </div>
  ) : (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mt-6">
      <div className="p-4 border-b border-slate-100 bg-slate-50/50">
        <h3 className="font-semibold text-slate-800">Lịch sử giao dịch</h3>
      </div>
      <div className="max-h-[500px] overflow-y-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-600 font-bold sticky top-0">
            <tr>
              <th className="px-6 py-3">Ngày</th>
              <th className="px-6 py-3">Mô tả</th>
              <th className="px-6 py-3">Hạng mục</th>
              <th className="px-6 py-3 text-right">Số tiền</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedTransactions.map(t => (
              <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 text-slate-500 whitespace-nowrap">{new Date(t.created_at).toLocaleDateString('vi-VN')}</td>
                <td className="px-6 py-4">
                  <div>
                    <p className="font-medium text-slate-800">{t.description}</p>
                    {t?.user?.name && <p className="text-xs text-slate-400 mt-0.5">Người nộp: {t?.user?.name}</p>}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                    {t.type === TransactionType.INCOME ? 'Đóng quỹ' : 'Chi tiêu'}
                  </span>
                </td>
                <td className={`px-6 py-4 text-right font-semibold ${
                  t.type === TransactionType.INCOME ? 'text-green-600' : 'text-red-600'
                }`}>
                  {t.type === TransactionType.INCOME ? '+' : '-'}{formatCurrency(t.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {sortedTransactions.length === 0 && (
          <div className="p-12 text-center text-slate-400">Chưa có giao dịch nào được ghi lại.</div>
        )}
      </div>
    </div>
  ));
};

export default TransactionList;

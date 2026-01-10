import React, { useMemo, useState } from 'react';
import { Transaction, TransactionType, Member } from '../types';

interface TransactionListProps {
  transactions: Transaction[];
  members?: Member[];
  isLoading?: boolean;
}

const TransactionList: React.FC<TransactionListProps> = ({ transactions, members = [], isLoading = false }) => {
  const [selectedUserId, setSelectedUserId] = useState<string>('all');
  
  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  // Filter transactions by selected user and exclude EXPENSE
  const filteredTransactions = useMemo(() => {
    // First filter out EXPENSE transactions
    const nonExpenseTransactions = transactions.filter(t => t.type !== TransactionType.EXPENSE);
    
    if (selectedUserId === 'all') {
      return nonExpenseTransactions;
    }
    return nonExpenseTransactions.filter(t => {
      // Check both user_id (if transaction has it) and user?.id
      const userId = (t as any).user_id || t.user?.id;
      return String(userId) === String(selectedUserId);
    });
  }, [transactions, selectedUserId]);

  // Calculate totals based on filteredTransactions (for accurate summary)
  const totals = useMemo(() => {
    const income = filteredTransactions
      .filter(t => t.type === TransactionType.INCOME)
      .reduce((sum, t) => sum + t.amount, 0);
    
    const debt = filteredTransactions
      .filter(t => t.type === TransactionType.DEBT)
      .reduce((sum, t) => sum + t.amount, 0);
    
    return {
      income,
      debt,
      net: income - debt
    };
  }, [filteredTransactions]);

  // Display transactions: hide DEBT when showing all members, show all when filtering individual member
  const sortedTransactions = useMemo(() => {
    let transactionsToDisplay = [...filteredTransactions];
    
    // When filtering "all", hide DEBT transactions but still calculate totals
    if (selectedUserId === 'all') {
      transactionsToDisplay = transactionsToDisplay.filter(t => t.type !== TransactionType.DEBT);
    }
    
    return transactionsToDisplay.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [filteredTransactions, selectedUserId]);

  return (isLoading ? (
    <div className="p-12 flex flex-col items-center justify-center">
      <div className="relative">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
      <p className="mt-4 text-slate-600 text-sm font-medium">Đang tải dữ liệu...</p>
    </div>
  ) : (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mt-6">
      <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-blue-50/30 flex items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-slate-800 text-lg">Lịch sử giao dịch</h3>
          <p className="text-xs text-slate-500 mt-0.5">Chi tiết các giao dịch và khoản nợ</p>
        </div>
        {members.length > 0 && (
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
          >
            <option value="all">Tất cả thành viên</option>
            {members.map(member => (
              <option key={member.id} value={member.id}>{member.name}</option>
            ))}
          </select>
        )}
      </div>
      <div className="flex flex-col max-h-[500px] relative">
        <div className="overflow-y-auto flex-1">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600 font-bold sticky top-0 border-b border-slate-200 z-10">
              <tr>
                <th className="px-6 py-3">Ngày</th>
                <th className="px-6 py-3">Mô tả</th>
                <th className="px-6 py-3">Loại</th>
                <th className="px-6 py-3 text-right">Số tiền</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedTransactions.map(t => (
                <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                    <div className="text-sm">{new Date(t.created_at).toLocaleDateString('vi-VN')}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{new Date(t.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-slate-800">{t.description}</p>
                      {t?.user?.name && (
                        <p className="text-xs text-slate-400 mt-0.5">
                          {t.type === TransactionType.DEBT ? 'Người nợ' : 'Người nộp'}: {t?.user?.name}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 ${
                      t.type === TransactionType.INCOME 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {t.type === TransactionType.INCOME ? (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                          Đóng quỹ
                        </>
                      ) : (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                          Nợ
                        </>
                      )}
                    </span>
                  </td>
                  <td className={`px-6 py-4 text-right font-semibold ${
                    t.type === TransactionType.INCOME 
                      ? 'text-blue-600' 
                      : 'text-red-600'
                  }`}>
                    <div className="flex items-center justify-end gap-1">
                      {t.type === TransactionType.INCOME ? '+' : '-'}
                      {formatCurrency(t.amount)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {sortedTransactions.length === 0 && (
            <div className="p-12 text-center text-slate-400">
              <svg className="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm font-medium">Chưa có giao dịch nào được ghi lại.</p>
            </div>
          )}
        </div>
        {/* Summary rows - sticky at bottom */}
        {filteredTransactions.length > 0 && (
          <div className="sticky bottom-0 bg-white border-t-2 border-slate-200 shadow-lg z-10">
            <table className="w-full text-xs">
              <tbody>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <td colSpan={3} className="px-6 py-2 text-slate-700 font-medium">
                    Tổng tiền thành viên đã chuyển khoản
                  </td>
                  <td className="px-6 py-2 text-right font-semibold text-blue-600">
                    +{formatCurrency(totals.income)}
                  </td>
                </tr>
                {totals.debt > 0 && (
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <td colSpan={3} className="px-6 py-2 text-slate-700 font-medium">
                      Tổng tiền thanh toán nợ
                    </td>
                    <td className="px-6 py-2 text-right font-semibold text-red-600">
                      -{formatCurrency(totals.debt)}
                    </td>
                  </tr>
                )}
                <tr className="bg-gradient-to-r from-blue-50 to-emerald-50 font-semibold">
                  <td colSpan={3} className="px-6 py-2.5 text-slate-800">
                    <div>
                      <div className="text-sm font-semibold">Quỹ thực nhận</div>
                      {/* {selectedUserId === 'all' && (
                        <div className="text-xs text-slate-500 font-normal mt-0.5">Đã trừ ra các khoản nợ</div>
                      )} */}
                    </div>
                  </td>
                  <td className={`px-6 py-2.5 text-right font-bold text-base ${
                    totals.net >= 0 ? 'text-emerald-600' : 'text-red-600'
                  }`}>
                    {totals.net >= 0 ? '+' : ''}{formatCurrency(totals.net)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  ));
};

export default TransactionList;

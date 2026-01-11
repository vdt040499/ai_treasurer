
import React, { useState, useMemo } from 'react';
import { Transaction, TransactionType } from '../types';
import { getMonths } from '../utils/time';

const MONTHS = getMonths();

interface FoodExpenseTrackerProps {
  transactions: Transaction[];
  onAddExpense: (t: Transaction) => void;
}

const FoodExpenseTracker: React.FC<FoodExpenseTrackerProps> = ({ transactions, isLoading }) => {
  const [selectedMonth, setSelectedMonth] = useState(MONTHS[0]);
  // const [itemName, setItemName] = useState('');
  // const [amount, setAmount] = useState('');

  // const handleAddItem = (e: React.FormEvent) => {
  //   e.preventDefault();
  //   if (!itemName || !amount) return;

  //   const newExpense: Transaction = {
  //     id: Date.now().toString(),
  //     type: TransactionType.EXPENSE,
  //     amount: parseFloat(amount),
  //     date: `${selectedMonth}-01`, // Default to 1st of selected month for quick entry
  //     description: itemName,
  //     category: 'Ăn uống',
  //   };

  //   onAddExpense(newExpense);
  //   setItemName('');
  //   setAmount('');
  // };

  const filteredExpenses = useMemo(() => {
    return transactions.filter(t => 
      t.transaction_date.startsWith(selectedMonth)
    ).sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime());
  }, [transactions, selectedMonth]);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mt-6 mb-10">
      <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="font-bold text-slate-800 text-lg">Chi tiết chi tiêu món ăn</h3>
          <p className="text-sm text-slate-500 font-medium">Quản lý chi tiết các khoản ăn uống hàng tháng</p>
        </div>
        
        <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200">
          <span className="pl-3 text-xs font-bold text-slate-400 uppercase">Tháng:</span>
          <select 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-transparent text-sm font-semibold text-slate-700 outline-none pr-3 py-1 cursor-pointer"
          >
            {MONTHS.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="p-6">
        {/* <form onSubmit={handleAddItem} className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-8">
          <div className="md:col-span-7">
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">Tên món ăn / Dịch vụ</label>
            <input 
              type="text" 
              placeholder="Ví dụ: Cơm trưa văn phòng, Trà sữa..."
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none text-slate-700 font-medium"
            />
          </div>
          <div className="md:col-span-3">
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">Số tiền (VNĐ)</label>
            <input 
              type="number" 
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none text-slate-700 font-medium"
            />
          </div>
          <div className="md:col-span-2 flex items-end">
            <button 
              type="submit"
              className="w-full py-3 bg-slate-900 hover:bg-black text-white font-bold rounded-xl transition-all shadow-lg shadow-slate-200 active:scale-95"
            >
              Thêm món
            </button>
          </div>
        </form> */}

        <div className="overflow-hidden border border-slate-100 rounded-xl">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-6 py-3">Tên món ăn</th>
                <th className="px-6 py-3">Ngày mua</th>
                <th className="px-6 py-3 text-right">Số tiền</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={2} className="px-6 py-10 text-center text-slate-400 italic">
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : filteredExpenses.map(item => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-700">{item.description}</td>
                  <td className="px-6 py-4 text-slate-500 whitespace-nowrap">{new Date(item.transaction_date).toLocaleDateString('vi-VN')}</td>
                  <td className="px-6 py-4 text-right font-bold text-orange-500">{formatCurrency(item.amount)}</td>
                </tr>
              ))}
              {filteredExpenses.length === 0 && (
                <tr>
                  <td colSpan={2} className="px-6 py-10 text-center text-slate-400 italic">
                    Chưa có dữ liệu chi tiêu món ăn trong tháng {selectedMonth}
                  </td>
                </tr>
              )}
            </tbody>
            {filteredExpenses.length > 0 && (
              <tfoot className="bg-slate-50/50">
                <tr>
                  <td className="px-6 py-4 font-bold text-slate-800">Tổng chi tiêu tháng {selectedMonth.split('-')[1].slice(1, 2)}</td>
                  <td className="px-6 py-4 text-slate-500 whitespace-nowrap"></td>
                  <td className="px-6 py-4 text-right font-black text-slate-900 text-lg">
                    {formatCurrency(transactions.reduce((sum, i) => sum + i.amount, 0))}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};

export default FoodExpenseTracker;

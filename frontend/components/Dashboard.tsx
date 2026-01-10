
import React, { useMemo } from 'react';
import { Transaction, TransactionType } from '../types';
import { MONTHLY_FEE } from '../constants';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface DashboardProps {
  transactions: Transaction[];
}

const Dashboard: React.FC<DashboardProps> = ({ transactions }) => {
  const stats = useMemo(() => {
    // Tính số tháng hiện tại (từ đầu năm đến tháng hiện tại)
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1; // 1-12
    const monthCount = currentMonth;

    // Group transactions theo user_id
    const userTransactions: { [userId: string]: { income: number; debt: number } } = {};
    let incomeWithoutUser = 0; // Income không có user_id (cộng trực tiếp)
    
    transactions.forEach(t => {
      const userId = (t as any).user_id || t.user?.id;
      
      if (t.type === TransactionType.INCOME) {
        if (userId) {
          if (!userTransactions[userId]) {
            userTransactions[userId] = { income: 0, debt: 0 };
          }
          userTransactions[userId].income += t.amount;
        } else {
          // Income không có user_id thì cộng trực tiếp
          incomeWithoutUser += t.amount;
        }
      } else if (t.type === TransactionType.DEBT) {
        if (userId) {
          if (!userTransactions[userId]) {
            userTransactions[userId] = { income: 0, debt: 0 };
          }
          userTransactions[userId].debt += t.amount;
        }
        // Debt không có user_id thì bỏ qua (không xử lý)
      }
    });

    // Tính tổng thu theo từng thành viên
    let totalNetIncome = incomeWithoutUser; // Bắt đầu với income không có user

    Object.entries(userTransactions).forEach(([userId, userData]) => {
      const { income, debt } = userData;
      const requiredAmount = monthCount * MONTHLY_FEE + debt;
      
      // Nếu income > (số tháng * MONTHLY_FEE + debt) thì mới trừ debt
      if (income > requiredAmount) {
        totalNetIncome += income - debt;
      } else {
        // Không trừ debt
        totalNetIncome += income;
      }
    });

    const totalExpense = transactions
      .filter(t => t.type === TransactionType.EXPENSE)
      .reduce((sum, t) => sum + t.amount, 0);
    
    return {
      balance: totalNetIncome - totalExpense,
      income: totalNetIncome, // Tổng thu đã trừ nợ (theo điều kiện)
      expense: totalExpense
    };
  }, [transactions]);

  const chartData = useMemo(() => {
    return [
      { name: 'Thu nhập', value: stats.income, color: '#2563eb' },
      { name: 'Chi tiêu', value: stats.expense, color: '#f97316' }
    ];
  }, [stats]);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-500 to-orange-500 text-white shadow-lg">
          <p className="text-blue-100 text-sm font-medium">Dư quỹ hiện tại</p>
          <h3 className="text-3xl font-bold mt-1">{formatCurrency(stats.balance)}</h3>
        </div>
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <p className="text-slate-500 text-sm font-medium">Tổng thu</p>
          <h3 className="text-3xl font-bold mt-1 text-blue-600">{formatCurrency(stats.income)}</h3>
        </div>
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <p className="text-slate-500 text-sm font-medium">Tổng chi</p>
          <h3 className="text-3xl font-bold mt-1 text-orange-600">{formatCurrency(stats.expense)}</h3>
        </div>
      </div>

      {/* <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm h-64">
        <h4 className="text-sm font-semibold text-slate-700 mb-4">Tổng quan Thu/Chi</h4>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip 
              cursor={{ fill: '#f8fafc' }}
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={60}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div> */}
    </div>
  );
};

export default Dashboard;

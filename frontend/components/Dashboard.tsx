
import React, { useMemo } from 'react';
import { Transaction, TransactionType } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface DashboardProps {
  transactions: Transaction[];
}

const Dashboard: React.FC<DashboardProps> = ({ transactions }) => {
  const stats = useMemo(() => {
    const totalIncome = transactions
      .filter(t => t.type === TransactionType.INCOME)
      .reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = transactions
      .filter(t => t.type === TransactionType.EXPENSE)
      .reduce((sum, t) => sum + t.amount, 0);
    
    return {
      balance: totalIncome - totalExpense,
      income: totalIncome,
      expense: totalExpense
    };
  }, [transactions]);

  const chartData = useMemo(() => {
    return [
      { name: 'Thu nhập', value: stats.income, color: '#22c55e' },
      { name: 'Chi tiêu', value: stats.expense, color: '#ef4444' }
    ];
  }, [stats]);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg">
          <p className="text-blue-100 text-sm font-medium">Dư quỹ hiện tại</p>
          <h3 className="text-3xl font-bold mt-1">{formatCurrency(stats.balance)}</h3>
        </div>
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <p className="text-slate-500 text-sm font-medium">Tổng thu</p>
          <h3 className="text-3xl font-bold mt-1 text-green-600">{formatCurrency(stats.income)}</h3>
        </div>
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <p className="text-slate-500 text-sm font-medium">Tổng chi</p>
          <h3 className="text-3xl font-bold mt-1 text-red-600">{formatCurrency(stats.expense)}</h3>
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

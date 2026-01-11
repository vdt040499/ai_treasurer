
import React, { useEffect, useState } from 'react';
import { getDashboardStats } from '../services/transactionService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface DashboardStats {
  total_income: number;
  total_expense: number;
  balance: number;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    total_income: 0,
    total_expense: 0,
    balance: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        const data = await getDashboardStats();
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
    
    // Refresh every 60 seconds
    const intervalId = setInterval(fetchStats, 60000);
    return () => clearInterval(intervalId);
  }, []);

  const chartData = [
    { name: 'Thu nhập', value: stats.total_income, color: '#2563eb' },
    { name: 'Chi tiêu', value: stats.total_expense, color: '#f97316' }
  ];

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-24 mb-2"></div>
              <div className="h-8 bg-slate-200 rounded w-32"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-500 to-orange-500 text-white shadow-lg">
          <p className="text-blue-100 text-sm font-medium">Dư quỹ hiện tại</p>
          <h3 className="text-3xl font-bold mt-1">{formatCurrency(stats.balance)}</h3>
        </div>
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <p className="text-slate-500 text-sm font-medium">Tổng thu</p>
          <h3 className="text-3xl font-bold mt-1 text-blue-600">{formatCurrency(stats.total_income)}</h3>
        </div>
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <p className="text-slate-500 text-sm font-medium">Tổng chi</p>
          <h3 className="text-3xl font-bold mt-1 text-orange-600">{formatCurrency(stats.total_expense)}</h3>
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


import React, { useEffect, useState } from 'react';
import { Member } from '../types';
import { MONTHS } from '../constants';
import { getIncomes } from '../services/transactionService';

interface MemberStatusProps {
  members: Member[];
}

interface Income {
  transaction_date: string;
  amount: number;
  users: {
    id: number;
    name: string;
    email: string;
    active: boolean;
    created_at: string;
  };
}

const MemberStatus: React.FC<MemberStatusProps> = ({ members }) => {
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    const fetchIncomes = async () => {
      try {
        const data = await getIncomes();
        setIncomes(data);
        setLastUpdated(new Date());
      } catch (error) {
        console.error('Failed to fetch incomes:', error);
      }
    };
    fetchIncomes();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchIncomes, 30000);
    return () => clearInterval(interval);
  }, []);

  // Group incomes by member and month (YYYY-MM format)
  const getMemberContributions = (memberId: string): string[] => {
    return incomes
      .filter(income => income.users && income.users.id.toString() === memberId)
      .map(income => {
        const date = new Date(income.transaction_date);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        return `${year}-${month}`;
      })
      .filter((month, index, self) => self.indexOf(month) === index); // Remove duplicates
  };

  // Helper function to get amount for a specific member and month
  const getAmountForMonth = (memberId: string, month: string): number | null => {
    const [year, monthNum] = month.split('-');
    const matchingIncome = incomes.find(income => {
      if (!income.users || income.users.id.toString() !== memberId) return false;
      const date = new Date(income.transaction_date);
      const incomeYear = date.getFullYear();
      const incomeMonth = String(date.getMonth() + 1).padStart(2, '0');
      return incomeYear.toString() === year && incomeMonth === monthNum;
    });
    return matchingIncome ? matchingIncome.amount : null;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <h3 className="font-semibold text-slate-800">Theo dõi đóng quỹ 2024</h3>
        <span className="text-xs text-slate-500 font-medium">Cập nhật lúc: {lastUpdated.toLocaleTimeString()}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider font-bold">
            <tr>
              <th className="px-4 py-3">Thành viên</th>
              {MONTHS.map(m => (
                <th key={m} className="px-3 py-3 text-center min-w-[60px]">{m.split('-')[1]}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {members.map(member => {
              const contributions = getMemberContributions(member.id);
              return (
                <tr key={member.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img src={member.avatar} alt={member.name} className="w-8 h-8 rounded-full border border-slate-200" />
                      <span className="font-medium text-slate-700 whitespace-nowrap">{member.name}</span>
                    </div>
                  </td>
                  {MONTHS.map(month => {
                    const hasPaid = contributions.includes(month);
                    const amount = getAmountForMonth(member.id, month);
                    return (
                      <td key={month} className="px-3 py-3 text-center">
                        {hasPaid ? (
                          <div className="flex flex-col items-center gap-1">
                            <div className="mx-auto w-5 h-5 rounded-full flex items-center justify-center bg-green-100 text-green-600">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                            {amount && (
                              <span className="text-[9px] text-green-700 font-medium">
                                {new Intl.NumberFormat('vi-VN').format(amount)}đ
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="mx-auto w-5 h-5 rounded-full flex items-center justify-center bg-slate-100 text-slate-300">
                            <span className="text-[10px]">•</span>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MemberStatus;

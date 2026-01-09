
import React from 'react';
import { Member } from '../types';

interface MemberStatusProps {
  members: Member[];
  isLoading?: boolean;
}

const getMonths = () => {
  const currentYear = new Date().getFullYear();
  const months = [];
  for (let i = 1; i <= 12; i++) {
    months.push(`${currentYear}-${String(i).padStart(2, '0')}`);
  }
  return months;
}

const MONTHS = getMonths();

const MemberStatus: React.FC<MemberStatusProps> = ({ members, isLoading = false }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <h3 className="font-semibold text-slate-800">Theo dõi đóng quỹ 2026</h3>
        <span className="text-xs text-slate-500 font-medium">Cập nhật lúc: {new Date().toLocaleTimeString()}</span>
      </div>
      {isLoading ? (
        <div className="p-12 flex flex-col items-center justify-center">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          </div>
          <p className="mt-4 text-slate-600 text-sm font-medium">Đang tải dữ liệu...</p>
        </div>
      ) : (
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
              {members.length === 0 ? (
                <tr>
                  <td colSpan={MONTHS.length + 1} className="px-4 py-8 text-center text-slate-500">
                    Không có dữ liệu thành viên
                  </td>
                </tr>
              ) : (
                members.map(member => (
                  <tr key={member.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {member.avatar ? (
                          <img src={member.avatar} alt={member.name} className="w-8 h-8 rounded-full border border-slate-200" />
                        ) : (
                          <div className="w-8 h-8 rounded-full border border-slate-200 bg-slate-100 flex items-center justify-center">
                            <span className="text-xs font-semibold text-slate-500">
                              {member.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <span className="font-medium text-slate-700 whitespace-nowrap">{member.name}</span>
                      </div>
                    </td>
                    {MONTHS.map(m => {
                      const hasPaid = member.contributions?.includes(m) || false;
                      return (
                        <td key={m} className="px-3 py-3 text-center">
                          <div className={`mx-auto w-5 h-5 rounded-full flex items-center justify-center ${
                            hasPaid ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-300'
                          }`}>
                            {hasPaid ? (
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            ) : (
                              <span className="text-[10px]">•</span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MemberStatus;

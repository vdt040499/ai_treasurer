
import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import TransactionList from './components/TransactionList';
import MemberStatus from './components/MemberStatus';
import ChatBot from './components/ChatBot';
import FoodExpenseTracker from './components/FoodExpenseTracker';
import DebtTracker from './components/DebtTracker';
import { Transaction, Member, TransactionType } from './types';
import { INITIAL_MEMBERS, INITIAL_TRANSACTIONS } from './constants';
import { getUsersWithContributions } from './services/userService';
import { getTransactions } from './services/transactionService';

const App: React.FC = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState<boolean>(true);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState<boolean>(true);

  useEffect(() => {
    const fetchUsersWithContributions = async () => {
      try {
        setIsLoadingMembers(true);
        const users = await getUsersWithContributions();
        setMembers(users);
      } catch (error) {
        console.error('Failed to fetch users:', error);
      } finally {
        setIsLoadingMembers(false);
      }
    };

    const fetchTransactions = async () => {
      try {
        setIsLoadingTransactions(true);
        const transactions = await getTransactions();
        setTransactions(transactions);
      } catch (error) {
        console.error('Failed to fetch transactions:', error);
      } finally {
        setIsLoadingTransactions(false);
      }
    };

    fetchUsersWithContributions();
    fetchTransactions();
  }, []);

  const handleNewTransaction = (t: Transaction) => {
    setTransactions(prev => [...prev, t]);

    if (t.type === TransactionType.INCOME && t.category === 'Đóng quỹ' && t.personName) {
      const monthFromDate = t.date.substring(0, 7);
      setMembers(prevMembers => prevMembers.map(m => {
        if (m.name.toLowerCase().includes(t.personName!.toLowerCase())) {
          return {
            ...m,
            contributions: m.contributions.includes(monthFromDate) 
              ? m.contributions 
              : [...m.contributions, monthFromDate]
          };
        }
        return m;
      }));
    }
  };

  return (
    <div className="min-h-screen bg-[#f1f5f9] flex flex-col lg:flex-row p-4 md:p-6 gap-6 max-w-[1600px] mx-auto">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col gap-6 order-2 lg:order-1">
        <header className="flex justify-between items-center mb-2 px-2">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-200">
                 <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                 </svg>
              </div>
              <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none">TEAMFUND</h1>
                <p className="text-slate-500 font-bold text-xs uppercase tracking-tighter mt-1">AI-Powered Finance Control</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="hidden sm:flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-2xl border border-emerald-100 font-bold text-xs">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
                Đóng quỹ nè mọi người ơi !!!
             </div>
             <img src="https://i.pravatar.cc/150?u=me" className="w-10 h-10 rounded-full border-2 border-white shadow-md cursor-pointer hover:scale-105 transition-transform" alt="profile" />
          </div>
        </header>

        <Dashboard transactions={transactions} />
        
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 flex flex-col gap-6">
            <MemberStatus members={members} isLoading={isLoadingMembers} />
            <FoodExpenseTracker 
              transactions={transactions} 
              onAddExpense={handleNewTransaction} 
            />
            <TransactionList transactions={transactions} isLoading={isLoadingTransactions} />
          </div>
          <div className="flex flex-col gap-6">
             <DebtTracker members={members} />
             <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-600 to-purple-700 text-white shadow-xl">
                <h3 className="text-xl font-bold mb-2">Mẹo tiết kiệm 💡</h3>
                <p className="text-white/80 text-sm leading-relaxed mb-4">
                  Sử dụng Gemini AI để tự động đọc bill giúp team bạn giảm thiểu sai sót lên đến 99% so với nhập tay.
                </p>
                <button className="w-full py-2 bg-white/20 hover:bg-white/30 rounded-xl font-bold transition-all text-sm">
                  Xem báo cáo chi tiết
                </button>
             </div>
          </div>
        </div>
      </div>

      {/* AI Assistant Sidebar */}
      <aside className="w-full lg:w-96 flex-shrink-0 lg:sticky lg:top-6 self-start order-1 lg:order-2" style={{ height: 'calc(100vh - 48px)' }}>
        <ChatBot onNewTransaction={handleNewTransaction} />
      </aside>
    </div>
  );
};

export default App;

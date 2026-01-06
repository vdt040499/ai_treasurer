
import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import TransactionList from './components/TransactionList';
import MemberStatus from './components/MemberStatus';
import ChatBot from './components/ChatBot';
import FoodExpenseTracker from './components/FoodExpenseTracker';
import { Transaction, Member, TransactionType } from './types';
import { INITIAL_MEMBERS, INITIAL_TRANSACTIONS } from './constants';

const App: React.FC = () => {
  const [members, setMembers] = useState<Member[]>(INITIAL_MEMBERS);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);

  const handleNewTransaction = (t: Transaction) => {
    setTransactions(prev => [...prev, t]);

    // If it's an income related to a member contribution, update member status
    if (t.type === TransactionType.INCOME && t.category === 'Đóng quỹ' && t.personName) {
      const monthFromDate = t.date.substring(0, 7); // YYYY-MM
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
    <div className="min-h-screen bg-[#f1f5f9] flex flex-col md:flex-row p-4 md:p-6 gap-6">
      {/* Main Content */}
      <main className="flex-1 flex flex-col gap-6 max-w-5xl mx-auto w-full">
        <header className="flex justify-between items-center mb-2">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Team Fund Tracker</h1>
            <p className="text-slate-500 font-medium">Quản lý quỹ nhóm thông minh với AI</p>
          </div>
          <div className="hidden sm:flex items-center gap-2 bg-white px-4 py-2 rounded-2xl shadow-sm border border-slate-200">
             <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
             <span className="text-xs font-bold text-slate-700">Sync Active</span>
          </div>
        </header>

        <Dashboard transactions={transactions} />
        
        <MemberStatus members={members} />

        <FoodExpenseTracker 
          transactions={transactions} 
          onAddExpense={handleNewTransaction} 
        />

        <TransactionList transactions={transactions} />
      </main>

      {/* Side Panel AI Bot */}
      <aside className="w-full md:w-96 flex-shrink-0 sticky top-6 self-start" style={{ height: 'calc(100vh - 48px)' }}>
        <ChatBot onNewTransaction={handleNewTransaction} />
      </aside>
    </div>
  );
};

export default App;

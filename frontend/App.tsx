
import React, { useState, useEffect, useMemo } from 'react';
import Dashboard from './components/Dashboard';
import TransactionList from './components/TransactionList';
import MemberStatus from './components/MemberStatus';
import ChatBot from './components/ChatBot';
import FoodExpenseTracker from './components/FoodExpenseTracker';
import DebtTracker from './components/DebtTracker';
import DuckRaceModal from './components/DuckRaceModal';
import { Transaction, Member, TransactionType } from './types';
import { getUsersWithContributions } from './services/userService';
import { getTransactions } from './services/transactionService';
import { getDebts } from './services/debtService';
import { getCurrentMonth, getCurrentYear } from './utils/time';
import { MONTHS } from './constants';

const App: React.FC = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [incomeTransactions, setIncomeTransactions] = useState<Transaction[]>([]);
  const [expenseTransactions, setExpenseTransactions] = useState<Transaction[]>([]);
  const [debtTransactions, setDebtTransactions] = useState<Transaction[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState<boolean>(true);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState<boolean>(true);
  const [isDuckRaceOpen, setIsDuckRaceOpen] = useState<boolean>(false);

  const currentMonth = new Date().toISOString().substring(0, 7);

  useEffect(() => {
    let isFirstLoad = true;

    const fetchUsersWithContributions = async (showLoading: boolean = true) => {
      try {
        if (showLoading) {
          setIsLoadingMembers(true);
        }
        const users = await getUsersWithContributions();
        setMembers(users);
      } catch (error) {
        console.error('Failed to fetch users:', error);
      } finally {
        if (showLoading) {
          setIsLoadingMembers(false);
        }
      }
    };

    const fetchTransactions = async (showLoading: boolean = true) => {
      try {
        if (showLoading) {
          setIsLoadingTransactions(true);
        }
        const transactions = await getTransactions();
        const debts = await getDebts(true); // Get fully paid debts (is_fully_paid = true)

        const incomeTransactions = transactions.filter(t => t.type === TransactionType.INCOME);
        const expenseTransactions = transactions.filter(t => t.type === TransactionType.EXPENSE);

        // Map debts to transactions format
        const debtTransactions: Transaction[] = debts.map((debt: any) => ({
          id: String(debt.id || ''),
          type: TransactionType.DEBT,
          amount: debt.amount || 0,
          date: debt.created_at || '',
          description: debt.description || '',
          category: '',
          user: debt.user || null,
          created_at: debt.created_at || ''
        }));

        // Chỉ update state nếu data thay đổi để tránh re-render không cần thiết
        setIncomeTransactions(prev => {
          const prevIds = new Set(prev.map(t => t.id));
          const newIds = new Set(incomeTransactions.map(t => t.id));
          if (prevIds.size === newIds.size && [...prevIds].every(id => newIds.has(id))) {
            return prev; // Không đổi nếu IDs giống nhau
          }
          return incomeTransactions;
        });

        setExpenseTransactions(prev => {
          const prevIds = new Set(prev.map(t => t.id));
          const newIds = new Set(expenseTransactions.map(t => t.id));
          if (prevIds.size === newIds.size && [...prevIds].every(id => newIds.has(id))) {
            return prev;
          }
          return expenseTransactions;
        });

        setDebtTransactions(prev => {
          const prevIds = new Set<string>(prev.map(t => t.id));
          const newIds = new Set<string>(debtTransactions.map(t => t.id));
          if (prevIds.size === newIds.size && [...prevIds].every((id: string) => newIds.has(id))) {
            return prev;
          }
          return debtTransactions;
        });
      } catch (error) {
        console.error('Failed to fetch transactions:', error);
      } finally {
        if (showLoading) {
          setIsLoadingTransactions(false);
        }
      }
    };

    // Lần đầu load với loading state
    fetchUsersWithContributions(true);
    fetchTransactions(true);
    isFirstLoad = false;

    // Interval reload không set loading để tránh UI bị dựt
    const intervalId = setInterval(() => {
      fetchUsersWithContributions(false);
      fetchTransactions(false);
    }, 60000);

    // Cleanup interval on unmount
    return () => {
      clearInterval(intervalId);
    };
  }, []);

  const debts = useMemo(() => {
    return members.map(member => {
      const unpaidMonths = MONTHS.filter(m => m <= currentMonth && !member.contributions.includes(m) && !member.exempts.includes(m));

      const totalDebt = -member.debt_amount;
      const debtDescription = member.debt_description;

      return {
        ...member,
        unpaidMonths,
        totalDebt,
        debtDescription
      };
    }).filter(d => d.totalDebt > 0).sort((a, b) => b.totalDebt - a.totalDebt);
  }, [members, currentMonth]);

  return (
    <div className="min-h-screen relative flex flex-col lg:flex-row p-4 md:p-6 gap-6 max-w-[1600px] mx-auto">
      {/* Background với gradient và pattern */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-blue-50 via-white to-orange-50"></div>
      <div
        className="fixed inset-0 -z-10 opacity-30"
        style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, rgba(37, 99, 235, 0.15) 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }}
      ></div>
      {/* Gradient orbs để tạo depth */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="fixed top-0 right-1/4 w-96 h-96 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="fixed -bottom-8 left-1/2 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col gap-6 order-2 lg:order-1 relative z-0">
        <header className="flex justify-between items-center mb-2 px-2">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-orange-500 flex items-center justify-center text-white shadow-xl shadow-blue-200">
                {/* <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                 </svg> */}
                <img src="https://res.cloudinary.com/dqxrwqict/image/upload/v1767975904/Gemini_Generated_Image_duz4cduz4cduz4cd_ga2zve.png" alt="profile" className="w-full h-16 rounded-2xl object-cover object-center" />
              </div>
              <div>
                <h1 className="text-4xl font-black tracking-tight leading-none bg-gradient-to-r from-blue-600 via-blue-500 to-orange-500 bg-clip-text text-transparent drop-shadow-sm">
                  APPFUND
                </h1>
                <p className="text-slate-500 font-bold text-xs uppercase tracking-tighter mt-1">Application Fund Tracker</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-2xl border border-emerald-100 font-bold text-xs">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
              {debts.length === 0 ? <span>Cảm ơn tất cả mọi người đã đóng đầy đủ quỹ THÁNG {getCurrentMonth()} !!!</span> : <span>Đóng quỹ THÁNG {getCurrentMonth()} nè mọi người ơi !!!</span>}
            </div>
            <img src="https://res.cloudinary.com/dqxrwqict/image/upload/v1767952876/558059282_4215333502071903_3524589644306170946_n_jnxikb.jpg" className="w-10 h-10 rounded-full border-2 border-white shadow-md cursor-pointer hover:scale-105 transition-transform" alt="profile" />
          </div>
        </header>

        <Dashboard />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 flex flex-col gap-6">
            <MemberStatus members={members} isLoading={isLoadingMembers} />
            <FoodExpenseTracker
              isLoading={isLoadingTransactions}
              transactions={expenseTransactions}
            />
            <TransactionList
              transactions={[...incomeTransactions, ...debtTransactions]}
              members={members}
              isLoading={isLoadingTransactions}
            />
          </div>
          <div className="flex flex-col gap-6">
            <DebtTracker members={members} isLoading={isLoadingMembers} />
            <div className="p-6 rounded-3xl bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-xl">
              <h3 className="text-xl font-bold mb-2">Hôm nay ăn gì ? 🦆</h3>
              <p className="text-white/80 text-sm leading-relaxed mb-4">
                Khó chọn món? Để mấy con vịt quyết định giúp bạn!
              </p>
              <button
                onClick={() => setIsDuckRaceOpen(true)}
                className="w-full py-3 bg-white/20 hover:bg-white/30 rounded-xl font-bold transition-all text-sm hover:scale-[1.02] active:scale-[0.98]"
              >
                🏁 Đua Vịt Chọn Món
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* AI Assistant Sidebar */}
      <aside className="w-full lg:w-96 flex-shrink-0 lg:sticky lg:top-6 self-start order-1 lg:order-2 relative z-0" style={{ height: 'calc(100vh - 48px)' }}>
        <ChatBot />
      </aside>

      {/* Duck Race Modal */}
      <DuckRaceModal
        isOpen={isDuckRaceOpen}
        onClose={() => setIsDuckRaceOpen(false)}
      />
    </div>
  );
};

export default App;

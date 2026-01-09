
export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
  DEBT = 'DEBT'
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  date: string;
  description: string;
  category: string;
  user: Member;
  created_at: string;
}

export interface Member {
  id: string;
  name: string;
  avatar: string;
  created_at: string;
  contributions: string[];
}

export interface FundStats {
  totalBalance: number;
  totalIncome: number;
  totalExpense: number;
}


export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE'
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  date: string;
  description: string;
  category: string;
  personName?: string;
}

export interface Member {
  id: string;
  name: string;
  avatar: string;
  joinedDate: string;
  contributions: string[]; // List of YYYY-MM
}

export interface FundStats {
  totalBalance: number;
  totalIncome: number;
  totalExpense: number;
}

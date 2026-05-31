
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
  transaction_date?: string;
  description: string;
  category: string;
  food_name?: string | null;
  restaurant_name?: string | null;
  source_url?: string | null;
  image_url?: string | null;
  user?: Member | null;
  user_id?: number | null;
  created_at: string;
}

export interface Member {
  id: string;
  name: string;
  avatar: string;
  created_at: string;
  contributions: string[];
  exempts?: string[];
  monthly_fee?: number;
  fee_by_month?: Record<string, number>;
  debt_amount?: number;
  debt_description?: string;
}

export interface FundStats {
  totalBalance: number;
  totalIncome: number;
  totalExpense: number;
}

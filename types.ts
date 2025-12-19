
export type TransactionType = 'DEBIT' | 'CREDIT';

export interface Transaction {
  id: string;
  customerId: string;
  date: string;
  description: string;
  type: TransactionType;
  amount: number;
}

export interface Customer {
  id: string;
  companyId: string;
  name: string;
  phone: string;
  address: string;
  openingBalance: number;
}

export interface Company {
  id: string;
  name: string;
  address: string;
  gst?: string;
  financialYear: string;
}

export interface DashboardStats {
  totalBalance: number;
  totalDebit: number;
  totalCredit: number;
  activeCompanies: number;
  activeCustomers: number;
}

export type TransactionCategory = 'Revenue' | 'Expense' | 'Asset' | 'Liability' | 'Equity';

export interface Transaction {
  id: string;
  date: string;
  description: string;
  category: TransactionCategory;
  amount: number; // Positive for inflow (Revenue), Negative for outflow (Expense/Asset Purchase) typically, but handled via logic
  reference: string;
  contraAccount?: string; // e.g., 'Cash', 'Accounts Payable'
}

export interface JournalLine {
  accountId: string;
  accountName: string;
  debit: number;
  credit: number;
}

export interface JournalEntry {
  id: string;
  date: string;
  reference: string;
  description: string;
  lines: JournalLine[];
}

export type BikeStatus = 'Available' | 'Rented' | 'Maintenance' | 'Overdue';

export interface Bike {
  id: string;
  model: string;
  plateNumber: string;
  status: BikeStatus;
  mileage: number;
  nextServiceDue: number;
  dailyRate: number;
}

export interface KPIData {
  totalRevenue: number;
  netProfit: number;
  utilizationRate: number;
  maintenanceAlerts: number;
}

export interface ChartData {
  name: string;
  revenue: number;
  expenses: number;
}

import { Bike, Transaction } from './types';

export const INITIAL_BIKES: Bike[] = [
  { id: 'B001', model: 'Honda Vario 160', plateNumber: 'DK 1234 XY', status: 'Available', mileage: 12500, nextServiceDue: 15000, dailyRate: 150000 },
  { id: 'B002', model: 'Yamaha NMAX 155', plateNumber: 'DK 5678 AB', status: 'Rented', mileage: 8200, nextServiceDue: 10000, dailyRate: 180000 },
  { id: 'B003', model: 'Honda Scoopy', plateNumber: 'DK 9012 ZZ', status: 'Maintenance', mileage: 19800, nextServiceDue: 19500, dailyRate: 100000 },
  { id: 'B004', model: 'Vespa Sprint', plateNumber: 'DK 3344 VV', status: 'Available', mileage: 500, nextServiceDue: 5000, dailyRate: 250000 },
  { id: 'B005', model: 'Yamaha XMAX', plateNumber: 'DK 7788 XX', status: 'Overdue', mileage: 25000, nextServiceDue: 24000, dailyRate: 350000 },
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: 'T001', date: '2023-10-01', description: 'Rental - B002 NMAX', category: 'Revenue', amount: 540000, reference: 'INV-1001', contraAccount: 'Cash' },
  { id: 'T002', date: '2023-10-02', description: 'Oil Change - B003', category: 'Expense', amount: -150000, reference: 'EXP-502', contraAccount: 'Cash' },
  { id: 'T003', date: '2023-10-03', description: 'Rental - B001 Vario', category: 'Revenue', amount: 300000, reference: 'INV-1002', contraAccount: 'Bank Transfer' },
  { id: 'T004', date: '2023-10-05', description: 'Shop Rent October', category: 'Expense', amount: -5000000, reference: 'EXP-503', contraAccount: 'Bank Transfer' },
  { id: 'T005', date: '2023-10-06', description: 'New Helmet Purchase', category: 'Asset', amount: -750000, reference: 'AST-001', contraAccount: 'Cash' },
];

export const CHART_OF_ACCOUNTS = [
  { code: '1000', name: 'Assets', type: 'Header' },
  { code: '1001', name: 'Cash on Hand', type: 'Asset' },
  { code: '1002', name: 'Bank Central Asia', type: 'Asset' },
  { code: '1200', name: 'Fixed Assets - Bikes', type: 'Asset' },
  { code: '2000', name: 'Liabilities', type: 'Header' },
  { code: '2001', name: 'Accounts Payable', type: 'Liability' },
  { code: '3000', name: 'Equity', type: 'Header' },
  { code: '3001', name: 'Owner Capital', type: 'Equity' },
  { code: '4000', name: 'Revenue', type: 'Header' },
  { code: '4001', name: 'Rental Income', type: 'Revenue' },
  { code: '5000', name: 'Expenses', type: 'Header' },
  { code: '5001', name: 'Maintenance Expense', type: 'Expense' },
  { code: '5002', name: 'Rent Expense', type: 'Expense' },
  { code: '5003', name: 'General & Admin', type: 'Expense' },
];

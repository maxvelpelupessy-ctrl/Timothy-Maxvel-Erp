import React, { useState, useMemo } from 'react';
import { Transaction, JournalEntry } from '../types';
import { CHART_OF_ACCOUNTS } from '../constants';
import { FileText, BookOpen, Layers } from 'lucide-react';

interface AccountingViewProps {
  transactions: Transaction[];
}

const AccountingView: React.FC<AccountingViewProps> = ({ transactions }) => {
  const [activeTab, setActiveTab] = useState<'journal' | 'income' | 'balance'>('income');

  // Core Engine: Convert Transactions to Journal Entries
  const journalEntries: JournalEntry[] = useMemo(() => {
    return transactions.map(t => {
      const lines = [];
      const absAmount = Math.abs(t.amount);

      if (t.category === 'Revenue') {
        // Dr Asset (Bank/Cash) | Cr Income
        lines.push({ accountId: '1002', accountName: t.contraAccount || 'Bank BCA', debit: absAmount, credit: 0 });
        lines.push({ accountId: '4001', accountName: 'Rental Income', debit: 0, credit: absAmount });
      } else if (t.category === 'Expense') {
        // Dr Expense | Cr Asset (Bank/Cash)
        lines.push({ accountId: '5001', accountName: t.description.includes('Rent') ? 'Rent Expense' : 'Maintenance Expense', debit: absAmount, credit: 0 });
        lines.push({ accountId: '1002', accountName: t.contraAccount || 'Bank BCA', debit: 0, credit: absAmount });
      } else if (t.category === 'Asset') {
        // Dr Fixed Asset | Cr Bank
        lines.push({ accountId: '1200', accountName: 'Fixed Assets', debit: absAmount, credit: 0 });
        lines.push({ accountId: '1001', accountName: 'Cash', debit: 0, credit: absAmount });
      }

      return {
        id: t.id,
        date: t.date,
        reference: t.reference,
        description: t.description,
        lines
      };
    });
  }, [transactions]);

  // Report Calculations
  const incomeStatement = useMemo(() => {
    let revenue = 0;
    let expenses = 0;
    
    journalEntries.forEach(entry => {
      entry.lines.forEach(line => {
        if (line.accountId.startsWith('4')) revenue += line.credit;
        if (line.accountId.startsWith('5')) expenses += line.debit;
      });
    });

    return { revenue, expenses, netIncome: revenue - expenses };
  }, [journalEntries]);

  const balanceSheet = useMemo(() => {
    let assets = 0;
    let liabilities = 0;
    let equity = 0; // Initial equity

    journalEntries.forEach(entry => {
        entry.lines.forEach(line => {
            if (line.accountId.startsWith('1')) assets += (line.debit - line.credit);
            if (line.accountId.startsWith('2')) liabilities += (line.credit - line.debit);
            if (line.accountId.startsWith('3')) equity += (line.credit - line.debit);
        });
    });

    // Add Retained Earnings (Net Income) to Equity
    equity += incomeStatement.netIncome;

    return { assets, liabilities, equity };
  }, [journalEntries, incomeStatement]);


  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg w-fit">
        {[
          { id: 'journal', label: 'General Journal', icon: <BookOpen className="w-4 h-4"/> },
          { id: 'income', label: 'Income Statement', icon: <FileText className="w-4 h-4"/> },
          { id: 'balance', label: 'Balance Sheet', icon: <Layers className="w-4 h-4"/> },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition
              ${activeTab === tab.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 min-h-[500px] p-6">
        
        {activeTab === 'journal' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                <tr>
                  <th className="px-4 py-2">Date</th>
                  <th className="px-4 py-2">Account</th>
                  <th className="px-4 py-2 text-right">Debit</th>
                  <th className="px-4 py-2 text-right">Credit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {journalEntries.map(entry => (
                  <React.Fragment key={entry.id}>
                    {/* Header Row for Entry */}
                    <tr className="bg-slate-50/50">
                      <td colSpan={4} className="px-4 py-2 text-xs font-semibold text-slate-500 border-t border-slate-200 mt-2">
                        {entry.date} - {entry.description} <span className="text-slate-400 font-normal">({entry.reference})</span>
                      </td>
                    </tr>
                    {/* Lines */}
                    {entry.lines.map((line, idx) => (
                      <tr key={`${entry.id}-${idx}`}>
                        <td className="px-4 py-1"></td>
                        <td className="px-4 py-1 font-mono text-slate-700">{line.accountId} - {line.accountName}</td>
                        <td className="px-4 py-1 text-right text-slate-600">{line.debit > 0 ? line.debit.toLocaleString() : '-'}</td>
                        <td className="px-4 py-1 text-right text-slate-600">{line.credit > 0 ? line.credit.toLocaleString() : '-'}</td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'income' && (
          <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
            <div className="text-center border-b border-slate-200 pb-4">
              <h2 className="text-2xl font-bold text-slate-800">Income Statement</h2>
              <p className="text-slate-500 text-sm">For the period ending today</p>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-slate-400 uppercase">Revenue</h3>
              <div className="flex justify-between text-slate-700">
                <span>Total Revenue</span>
                <span>{incomeStatement.revenue.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}</span>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-bold text-slate-400 uppercase">Operating Expenses</h3>
              <div className="flex justify-between text-slate-700">
                <span>Total Expenses</span>
                <span>({incomeStatement.expenses.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })})</span>
              </div>
            </div>

            <div className="border-t-2 border-slate-800 pt-4 flex justify-between items-center">
              <span className="text-lg font-bold text-slate-900">Net Income</span>
              <span className={`text-xl font-bold ${incomeStatement.netIncome >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {incomeStatement.netIncome.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}
              </span>
            </div>
          </div>
        )}

        {activeTab === 'balance' && (
          <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
             <div className="text-center border-b border-slate-200 pb-4">
              <h2 className="text-2xl font-bold text-slate-800">Balance Sheet</h2>
              <p className="text-slate-500 text-sm">As of today</p>
            </div>

            <div className="grid grid-cols-2 gap-12">
              <div>
                <h3 className="text-sm font-bold text-slate-400 uppercase border-b border-slate-200 mb-4 pb-1">Assets</h3>
                <div className="flex justify-between text-slate-700 py-2">
                  <span>Current Assets</span>
                  <span>{balanceSheet.assets.toLocaleString()}</span>
                </div>
                <div className="mt-8 border-t border-slate-300 pt-2 flex justify-between font-bold text-slate-900">
                  <span>Total Assets</span>
                  <span>{balanceSheet.assets.toLocaleString()}</span>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-400 uppercase border-b border-slate-200 mb-4 pb-1">Liabilities & Equity</h3>
                <div className="flex justify-between text-slate-700 py-1">
                  <span>Liabilities</span>
                  <span>{balanceSheet.liabilities.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-700 py-1">
                  <span>Equity</span>
                  <span>{balanceSheet.equity.toLocaleString()}</span>
                </div>
                 <div className="mt-8 border-t border-slate-300 pt-2 flex justify-between font-bold text-slate-900">
                  <span>Total L & E</span>
                  <span>{(balanceSheet.liabilities + balanceSheet.equity).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AccountingView;

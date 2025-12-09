import React, { useState, useRef } from 'react';
import { Transaction } from '../types';
import { Upload, Plus, Trash2, Search, AlertCircle, CheckCircle2 } from 'lucide-react';

interface TransactionManagerProps {
  transactions: Transaction[];
  onAddTransaction: (t: Transaction) => void;
  onImportTransactions: (t: Transaction[]) => void;
  onDeleteTransaction: (id: string) => void;
}

const TransactionManager: React.FC<TransactionManagerProps> = ({ transactions, onAddTransaction, onImportTransactions, onDeleteTransaction }) => {
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [newTx, setNewTx] = useState<Partial<Transaction>>({
    category: 'Revenue',
    date: new Date().toISOString().split('T')[0]
  });

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTx.description || !newTx.amount) return;

    const tx: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      date: newTx.date!,
      description: newTx.description,
      category: newTx.category as any,
      amount: Number(newTx.amount),
      reference: newTx.reference || `REF-${Math.floor(Math.random()*1000)}`,
      contraAccount: newTx.contraAccount || 'Cash'
    };
    onAddTransaction(tx);
    setNewTx({ ...newTx, description: '', amount: 0, reference: '' });
  };

  const parseCurrency = (val: string): number => {
    // Remove Currency Symbols (Rp, IDR, $)
    let clean = val.replace(/[Rp\sA-Za-z$]/g, '').trim();
    
    // Check for negative parenthesis (5000) -> -5000
    const isNegative = clean.startsWith('(') && clean.endsWith(')');
    if (isNegative) {
      clean = clean.replace(/[()]/g, '');
    }

    // Handle 10.000,00 vs 10,000.00
    // If string has a dot and a comma
    if (clean.includes('.') && clean.includes(',')) {
      const lastDot = clean.lastIndexOf('.');
      const lastComma = clean.lastIndexOf(',');
      
      if (lastDot < lastComma) {
        // European/Indo style: 10.000,00 -> remove dots, replace comma with dot
        clean = clean.replace(/\./g, '').replace(',', '.');
      } else {
        // US style: 10,000.00 -> remove commas
        clean = clean.replace(/,/g, '');
      }
    } else if (clean.includes('.')) {
      // If only dots (e.g. 10.000), assume thousands separator if > 3 digits after dot logic implies it, 
      // but for IDR usually 10.000 is 10k.
      // Simple heuristic: if more than one dot, it's thousands. If 3 digits exactly, ambiguous but assume thousands in Indo context.
      const parts = clean.split('.');
      if (parts.length > 1) {
         clean = clean.replace(/\./g, '');
      }
    } else if (clean.includes(',')) {
        // 10000,00
        clean = clean.replace(',', '.');
    }

    let num = parseFloat(clean);
    return isNegative ? -num : num;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      processCSV(text);
    };
    reader.readAsText(file);
  };

  const processCSV = (csvText: string) => {
    const lines = csvText.split(/\r\n|\n/).filter(line => line.trim() !== '');
    if (lines.length < 2) return;

    const headerLine = lines[0].toLowerCase();
    
    // Detect Delimiter
    let delimiter = ',';
    if ((headerLine.match(/;/g) || []).length > (headerLine.match(/,/g) || []).length) delimiter = ';';
    if ((headerLine.match(/\t/g) || []).length > (headerLine.match(/,/g) || []).length) delimiter = '\t';

    const headers = headerLine.split(delimiter).map(h => h.trim().replace(/"/g, ''));
    
    // Map Columns
    const dateIdx = headers.findIndex(h => h.includes('date') || h.includes('tgl'));
    const descIdx = headers.findIndex(h => h.includes('desc') || h.includes('keterangan'));
    const refIdx = headers.findIndex(h => h.includes('ref') || h.includes('no'));
    const debitIdx = headers.findIndex(h => h.includes('debit') || h.includes('in'));
    const creditIdx = headers.findIndex(h => h.includes('credit') || h.includes('out'));
    const amountIdx = headers.findIndex(h => h.includes('amount') || h.includes('jumlah') || h.includes('saldo'));

    const parsedTransactions: Transaction[] = [];

    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(delimiter).map(c => c.trim().replace(/"/g, ''));
      if (row.length < headers.length) continue;

      try {
        const dateVal = row[dateIdx] || new Date().toISOString().split('T')[0];
        const descVal = descIdx > -1 ? row[descIdx] : 'Imported Transaction';
        const refVal = refIdx > -1 ? row[refIdx] : `CSV-${i}`;

        let amount = 0;
        let category: any = 'Revenue'; // Default

        if (debitIdx > -1 && creditIdx > -1) {
          const debit = parseCurrency(row[debitIdx] || '0');
          const credit = parseCurrency(row[creditIdx] || '0');
          
          if (credit > 0) {
            amount = credit;
            category = 'Revenue';
          } else if (debit > 0) {
            amount = -debit; // Store expenses as negative internally? Or handle via category logic? 
            // App state convention: Revenue +, Expense -. 
            // If Category is Expense, we usually display positive but store negative or calculate.
            // Let's stick to: Revenue (Positive Amount), Expense (Negative Amount).
            category = 'Expense';
            amount = -debit;
          }
        } else if (amountIdx > -1) {
          const rawAmt = parseCurrency(row[amountIdx]);
          amount = rawAmt;
          category = rawAmt >= 0 ? 'Revenue' : 'Expense';
        }

        if (amount !== 0) {
            parsedTransactions.push({
                id: `IMP-${Math.random().toString(36).substr(2, 6)}`,
                date: dateVal, // Ideally parse date format here too, but skipping for brevity
                description: descVal,
                category,
                amount,
                reference: refVal,
                contraAccount: 'Bank' // Default for imports
            });
        }
      } catch (err) {
        console.error(`Failed to parse row ${i}`, err);
      }
    }

    if (parsedTransactions.length > 0) {
        onImportTransactions(parsedTransactions);
        alert(`Successfully imported ${parsedTransactions.length} transactions.`);
    } else {
        alert('Could not parse any transactions. Check CSV format.');
    }
    
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const filteredTransactions = transactions.filter(t => 
    t.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.reference.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="flex gap-2">
           <button 
             onClick={() => fileInputRef.current?.click()}
             className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition text-sm font-medium"
           >
             <Upload className="w-4 h-4" />
             Import CSV
           </button>
           <input 
             type="file" 
             ref={fileInputRef} 
             hidden 
             accept=".csv,.txt"
             onChange={handleFileUpload}
           />
        </div>
      </div>

      {/* Manual Entry Form */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wide mb-4">New Transaction</h3>
        <form onSubmit={handleManualSubmit} className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
          <div className="md:col-span-1">
            <label className="block text-xs font-medium text-slate-500 mb-1">Date</label>
            <input type="date" required value={newTx.date} onChange={e => setNewTx({...newTx, date: e.target.value})} className="w-full p-2 text-sm border rounded-lg" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-500 mb-1">Description</label>
            <input type="text" required value={newTx.description || ''} onChange={e => setNewTx({...newTx, description: e.target.value})} placeholder="e.g. Service B001" className="w-full p-2 text-sm border rounded-lg" />
          </div>
          <div className="md:col-span-1">
             <label className="block text-xs font-medium text-slate-500 mb-1">Category</label>
             <select value={newTx.category} onChange={e => setNewTx({...newTx, category: e.target.value as any})} className="w-full p-2 text-sm border rounded-lg">
                <option value="Revenue">Revenue</option>
                <option value="Expense">Expense</option>
                <option value="Asset">Asset Purchase</option>
             </select>
          </div>
          <div className="md:col-span-1">
            <label className="block text-xs font-medium text-slate-500 mb-1">Amount (IDR)</label>
            <input type="number" required value={newTx.amount || ''} onChange={e => setNewTx({...newTx, amount: Number(e.target.value)})} className="w-full p-2 text-sm border rounded-lg" />
          </div>
          <button type="submit" className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition md:col-span-1 h-[38px]">
            <Plus className="w-4 h-4" /> Add
          </button>
        </form>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
              <tr>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Ref</th>
                <th className="px-6 py-3">Description</th>
                <th className="px-6 py-3">Category</th>
                <th className="px-6 py-3 text-right">Amount</th>
                <th className="px-6 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.map(t => (
                <tr key={t.id} className="hover:bg-slate-50 transition">
                  <td className="px-6 py-3 text-slate-600 whitespace-nowrap">{t.date}</td>
                  <td className="px-6 py-3 text-slate-500 font-mono text-xs">{t.reference}</td>
                  <td className="px-6 py-3 text-slate-800 font-medium">{t.description}</td>
                  <td className="px-6 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${t.category === 'Revenue' ? 'bg-emerald-100 text-emerald-800' : 
                        t.category === 'Expense' ? 'bg-rose-100 text-rose-800' : 'bg-blue-100 text-blue-800'}`}>
                      {t.category}
                    </span>
                  </td>
                  <td className={`px-6 py-3 text-right font-medium ${t.amount >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {t.amount.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}
                  </td>
                  <td className="px-6 py-3 text-center">
                    <button onClick={() => onDeleteTransaction(t.id)} className="text-slate-400 hover:text-rose-500 transition">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <AlertCircle className="w-8 h-8 opacity-50" />
                      <p>No transactions found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TransactionManager;

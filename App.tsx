import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import TransactionManager from './components/TransactionManager';
import AccountingView from './components/AccountingView';
import FleetManager from './components/FleetManager';
import VoiceAgent from './components/VoiceAgent';
import { INITIAL_TRANSACTIONS, INITIAL_BIKES } from './constants';
import { Transaction, Bike } from './types';
import { LayoutDashboard, FileSpreadsheet, Calculator, Bike as BikeIcon, Menu } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Central State
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [bikes, setBikes] = useState<Bike[]>(INITIAL_BIKES);

  const handleAddTransaction = (newTx: Transaction) => {
    setTransactions(prev => [newTx, ...prev]);
  };

  const handleImportTransactions = (importedTxs: Transaction[]) => {
    setTransactions(prev => [...importedTxs, ...prev]);
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const renderContent = () => {
    switch(activeTab) {
      case 'dashboard': return <Dashboard transactions={transactions} bikes={bikes} />;
      case 'transactions': return (
        <TransactionManager 
          transactions={transactions} 
          onAddTransaction={handleAddTransaction}
          onImportTransactions={handleImportTransactions}
          onDeleteTransaction={handleDeleteTransaction}
        />
      );
      case 'accounting': return <AccountingView transactions={transactions} />;
      case 'fleet': return <FleetManager bikes={bikes} />;
      default: return <Dashboard transactions={transactions} bikes={bikes} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-40 bg-slate-900 text-slate-300 transition-all duration-300 transform 
        ${isSidebarOpen ? 'w-64 translate-x-0' : 'w-20 translate-x-0'} `}
      >
        <div className="h-16 flex items-center justify-center border-b border-slate-800">
           {isSidebarOpen ? (
             <h1 className="text-xl font-bold text-white tracking-wider">MOTORENT<span className="text-indigo-500">ERP</span></h1>
           ) : (
             <span className="text-xl font-bold text-indigo-500">M</span>
           )}
        </div>
        
        <nav className="mt-8 px-4 space-y-2">
          <NavButton 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
            icon={<LayoutDashboard />} 
            label="Dashboard" 
            expanded={isSidebarOpen} 
          />
          <NavButton 
            active={activeTab === 'transactions'} 
            onClick={() => setActiveTab('transactions')} 
            icon={<FileSpreadsheet />} 
            label="Transactions" 
            expanded={isSidebarOpen} 
          />
          <NavButton 
            active={activeTab === 'accounting'} 
            onClick={() => setActiveTab('accounting')} 
            icon={<Calculator />} 
            label="Accounting" 
            expanded={isSidebarOpen} 
          />
          <NavButton 
            active={activeTab === 'fleet'} 
            onClick={() => setActiveTab('fleet')} 
            icon={<BikeIcon />} 
            label="Fleet" 
            expanded={isSidebarOpen} 
          />
        </nav>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm">
           <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg">
             <Menu className="w-5 h-5" />
           </button>
           <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-slate-800">Admin User</p>
                <p className="text-xs text-slate-500">Head Office</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold border border-indigo-200">
                A
              </div>
           </div>
        </header>
        
        <div className="p-8">
          {renderContent()}
        </div>
      </main>

      {/* Floating Voice Agent */}
      <VoiceAgent transactions={transactions} bikes={bikes} />
    </div>
  );
};

const NavButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string; expanded: boolean }> = ({ active, onClick, icon, label, expanded }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200
      ${active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'hover:bg-slate-800 hover:text-white'}`}
  >
    <div className={`${active ? 'text-white' : 'text-slate-400'}`}>
      {icon}
    </div>
    {expanded && <span className="font-medium text-sm">{label}</span>}
  </button>
);

export default App;

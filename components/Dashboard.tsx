import React, { useState, useEffect } from 'react';
import { Transaction, Bike, KPIData, ChartData } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { DollarSign, Activity, Wrench, TrendingUp, Sparkles, Loader2 } from 'lucide-react';
import { generateText } from '../services/geminiService';

interface DashboardProps {
  transactions: Transaction[];
  bikes: Bike[];
}

const Dashboard: React.FC<DashboardProps> = ({ transactions, bikes }) => {
  const [insight, setInsight] = useState<string>('');
  const [loadingInsight, setLoadingInsight] = useState<boolean>(false);

  // Calculate KPIs
  const revenue = transactions
    .filter(t => t.category === 'Revenue')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const expenses = transactions
    .filter(t => t.category === 'Expense')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const netProfit = revenue - expenses;

  const rentedBikes = bikes.filter(b => b.status === 'Rented').length;
  const utilization = bikes.length > 0 ? Math.round((rentedBikes / bikes.length) * 100) : 0;
  const maintenanceAlerts = bikes.filter(b => b.mileage >= b.nextServiceDue).length;

  // Prepare Chart Data (Group by Month - Simplified for demo)
  const chartData: ChartData[] = [
    { name: 'Aug', revenue: revenue * 0.8, expenses: expenses * 0.9 },
    { name: 'Sep', revenue: revenue * 0.9, expenses: expenses * 0.95 },
    { name: 'Oct', revenue: revenue, expenses: expenses },
  ];

  const generateInsight = async () => {
    setLoadingInsight(true);
    const prompt = `
      Act as a CFO for a motorcycle rental business.
      Analyze these stats:
      Revenue: ${revenue}, Expenses: ${expenses}, Net Profit: ${netProfit}.
      Fleet Utilization: ${utilization}%.
      Maintenance Alerts: ${maintenanceAlerts}.
      
      Provide a brief, strategic advice paragraph (max 3 sentences) focusing on profitability and fleet health.
    `;
    const text = await generateText(prompt);
    setInsight(text);
    setLoadingInsight(false);
  };

  useEffect(() => {
    // Generate insight on mount if empty
    if (!insight && process.env.API_KEY) {
      generateInsight();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Executive Dashboard</h2>
        <button 
          onClick={generateInsight}
          disabled={loadingInsight}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
        >
          {loadingInsight ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          Refresh AI Insight
        </button>
      </div>

      {/* AI Insight Card */}
      {insight && (
        <div className="bg-gradient-to-r from-indigo-50 to-slate-50 border border-indigo-100 p-4 rounded-xl shadow-sm">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-indigo-900">AI Financial Analysis</h3>
              <p className="text-slate-700 mt-1 text-sm leading-relaxed">{insight}</p>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard 
          title="Total Revenue" 
          value={`Rp ${revenue.toLocaleString()}`} 
          icon={<DollarSign className="w-6 h-6 text-emerald-600" />} 
          trend="+12% vs last month"
        />
        <KpiCard 
          title="Net Profit" 
          value={`Rp ${netProfit.toLocaleString()}`} 
          icon={<TrendingUp className="w-6 h-6 text-blue-600" />} 
          trend={netProfit > 0 ? "Healthy" : "Critical"}
        />
        <KpiCard 
          title="Fleet Utilization" 
          value={`${utilization}%`} 
          icon={<Activity className="w-6 h-6 text-purple-600" />} 
          trend={`${rentedBikes}/${bikes.length} bikes rented`}
        />
        <KpiCard 
          title="Maintenance" 
          value={maintenanceAlerts.toString()} 
          icon={<Wrench className="w-6 h-6 text-orange-600" />} 
          trend="Vehicles need service"
          alert={maintenanceAlerts > 0}
        />
      </div>

      {/* Chart Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-800 mb-6">Financial Performance</h3>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} tickFormatter={(value) => `Rp${value/1000}k`} />
              <Tooltip 
                cursor={{fill: '#f1f5f9'}}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="revenue" name="Revenue" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" name="Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

const KpiCard: React.FC<{ title: string; value: string; icon: React.ReactNode; trend: string; alert?: boolean }> = ({ title, value, icon, trend, alert }) => (
  <div className={`p-6 rounded-xl shadow-sm border bg-white ${alert ? 'border-orange-200 bg-orange-50' : 'border-slate-200'}`}>
    <div className="flex justify-between items-start mb-4">
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <h3 className="text-2xl font-bold text-slate-800 mt-1">{value}</h3>
      </div>
      <div className={`p-2 rounded-lg ${alert ? 'bg-orange-100' : 'bg-slate-100'}`}>
        {icon}
      </div>
    </div>
    <p className={`text-sm ${alert ? 'text-orange-700 font-medium' : 'text-slate-400'}`}>{trend}</p>
  </div>
);

export default Dashboard;

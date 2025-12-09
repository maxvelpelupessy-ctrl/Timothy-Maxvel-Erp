import React, { useState } from 'react';
import { Bike } from '../types';
import { generateText } from '../services/geminiService';
import { Wrench, Gauge, Calendar, AlertTriangle, Sparkles, Loader2 } from 'lucide-react';

interface FleetManagerProps {
  bikes: Bike[];
}

const FleetManager: React.FC<FleetManagerProps> = ({ bikes }) => {
  const [forecast, setForecast] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Rented': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Maintenance': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'Overdue': return 'bg-rose-100 text-rose-700 border-rose-200';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getMaintenanceForecast = async () => {
    setLoading(true);
    const bikeData = bikes.map(b => `${b.model} (${b.mileage}km / Due ${b.nextServiceDue}km)`).join(', ');
    const prompt = `
      Analyze this fleet mileage data: ${bikeData}.
      Which specific bikes are closest to needing service? 
      Are there any models showing higher usage? 
      Provide a maintenance prioritization list.
    `;
    const text = await generateText(prompt);
    setForecast(text);
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800">Fleet Management</h2>
        <button 
          onClick={getMaintenanceForecast}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Sparkles className="w-4 h-4" />}
          AI Maintenance Forecast
        </button>
      </div>

      {forecast && (
        <div className="p-4 bg-white border-l-4 border-indigo-500 rounded-r-xl shadow-sm animate-fade-in">
          <h4 className="font-semibold text-indigo-900 mb-2 flex items-center gap-2">
            <Wrench className="w-4 h-4"/> Maintenance Strategy
          </h4>
          <p className="text-slate-600 text-sm whitespace-pre-line">{forecast}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bikes.map(bike => {
          const servicePct = Math.min((bike.mileage / bike.nextServiceDue) * 100, 100);
          const isCritical = servicePct > 90;

          return (
            <div key={bike.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-slate-800">{bike.model}</h3>
                  <p className="text-xs text-slate-400 font-mono">{bike.plateNumber}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-semibold rounded-md border ${getStatusColor(bike.status)}`}>
                  {bike.status}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <Gauge className="w-4 h-4 text-slate-400" />
                    <span>Mileage</span>
                  </div>
                  <span className="font-medium">{bike.mileage.toLocaleString()} km</span>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Service Progress</span>
                    <span className={isCritical ? 'text-rose-600 font-bold' : ''}>
                      {bike.nextServiceDue.toLocaleString()} km Due
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${isCritical ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                      style={{ width: `${servicePct}%` }}
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-sm">
                   <div className="flex items-center gap-2 text-slate-500">
                      <Calendar className="w-4 h-4" />
                      <span>Rp {bike.dailyRate.toLocaleString()}/day</span>
                   </div>
                   {isCritical && <AlertTriangle className="w-4 h-4 text-rose-500" />}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FleetManager;

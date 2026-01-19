import React, { useState, useMemo } from 'react';
import { useProducts } from '../contexts/ProductContext';
import { calculateSMA, calculateSafetyStock } from '../utils';
import { Edit2, Save, X } from 'lucide-react';

const PurchasePlan: React.FC = () => {
  const { products, updateProductStock } = useProducts();
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [editValues, setEditValues] = useState<{current: string, safety: string}>({ current: '0', safety: '0' });

  // Target periode berdasarkan data terakhir + 1 bulan
  const targetPeriodLabel = useMemo(() => {
    if (products.length === 0 || !products[0].data || products[0].data.length === 0) return '-';
    const lastData = products[0].data[products[0].data.length - 1];
    const monthsMap: Record<string, number> = { 'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'Mei': 4, 'Jun': 5, 'Jul': 6, 'Agt': 7, 'Sep': 8, 'Okt': 9, 'Nov': 10, 'Des': 11 };
    const lastMonthIndex = monthsMap[lastData.month] ?? 0;
    const targetDate = new Date(lastData.year, lastMonthIndex + 1);
    return targetDate.toLocaleString('id-ID', { month: 'long', year: 'numeric' });
  }, [products]);

  const startEditing = (id: string, current: number, safety: number) => {
    setEditingId(id);
    setEditValues({ 
      current: current.toString(), 
      safety: safety.toString() 
    });
  };

  const cancelEditing = () => setEditingId(null);

  const saveEditing = (id: string) => {
    const currentNum = parseInt(editValues.current) || 0;
    const safetyNum = parseInt(editValues.safety) || 0;
    updateProductStock(id, currentNum, safetyNum);
    setEditingId(null);
  };

  const planData = products.map(product => {
    const n = product.bestN || 4;
    const { nextPeriodForecast } = calculateSMA(product.data, n);
    const demands = product.data.map(d => d.demand);
    const dynamicSafetyStock = calculateSafetyStock(demands);
    const forecastRounded = Math.ceil(nextPeriodForecast);
    
    // RUMUS: Kebutuhan Stok - Stok Gudang Saat Ini
    const orderQuantity = (forecastRounded + dynamicSafetyStock) - product.stock.currentStock;

    return {
      ...product,
      forecast: forecastRounded,
      calculatedSafety: dynamicSafetyStock,
      orderQuantity: Math.max(0, orderQuantity) 
    };
  });

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
         <div>
            <h1 className="text-3xl md:text-5xl font-heading font-extrabold text-slate-900 tracking-tighter leading-none uppercase">Rencana Beli</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-3">Target Stok: {targetPeriodLabel}</p>
         </div>
      </div>

      <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {planData.map((item) => {
          const isEditing = editingId === item.id;

          return (
            <div key={item.id} className={`flex flex-col rounded-[2.5rem] bg-white shadow-sm border-2 transition-all duration-300 ${isEditing ? 'border-indigo-600 shadow-xl ring-4 ring-indigo-50' : 'border-slate-100'}`}>
              <div className="p-8 flex-1 flex flex-col">
                  <div className="flex items-start justify-between mb-8">
                    <div>
                        <h3 className="font-heading font-extrabold text-slate-900 text-2xl tracking-tighter leading-none uppercase">{item.name}</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">{item.unit}</p>
                    </div>
                    <div className="flex gap-2">
                        {!isEditing && (
                          <button 
                            onClick={() => startEditing(item.id, item.stock.currentStock, item.calculatedSafety)} 
                            className="p-3 rounded-xl bg-white text-slate-400 hover:bg-slate-50 hover:text-slate-900 transition-all border border-slate-200"
                          >
                              <Edit2 className="h-4 w-4" />
                          </button>
                        )}
                        {isEditing && (
                          <div className="flex gap-2">
                              <button onClick={() => saveEditing(item.id)} className="p-3 rounded-xl bg-green-50 text-green-600 hover:bg-green-100 transition-colors border border-green-200 shadow-sm"><Save className="h-4 w-4" /></button>
                              <button onClick={cancelEditing} className="p-3 rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-100 transition-colors border border-slate-200 shadow-sm"><X className="h-4 w-4" /></button>
                          </div>
                        )}
                    </div>
                  </div>
                  
                  <div className="space-y-4 flex-1">
                    <div className="p-6 rounded-3xl bg-slate-50/50 border border-slate-100 flex justify-between items-center">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 font-sans">Ramalan Kebutuhan</span>
                        <span className="font-heading font-extrabold text-slate-900 text-4xl tracking-tighter tabular-nums">{item.forecast}</span>
                    </div>
                    
                    <div className="p-6 rounded-3xl bg-indigo-50/30 border border-indigo-50/50 flex justify-between items-center">
                        <div className="flex flex-col">
                           <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 font-sans">Safety Stock</span>
                           <span className="text-[8px] text-indigo-300 font-bold uppercase mt-1">Stok Pengaman</span>
                        </div>
                        <span className="font-heading font-extrabold text-4xl tracking-tighter tabular-nums text-indigo-600">+{item.calculatedSafety}</span>
                    </div>
                    
                    <div className="px-6 py-6 flex justify-between items-center">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 font-sans">Stok Gudang</span>
                        {isEditing ? (
                          <div className="relative group/input">
                            <input 
                              type="number" 
                              className="w-32 px-4 py-3 text-right font-heading font-extrabold text-4xl border-2 border-indigo-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none bg-indigo-600 text-white selection:bg-indigo-400 shadow-lg shadow-indigo-100 transition-all" 
                              value={editValues.current} 
                              onChange={(e) => setEditValues({...editValues, current: e.target.value})}
                              onFocus={(e) => e.target.select()}
                              autoFocus
                            />
                          </div>
                        ) : (
                          <div className="px-8 py-4 rounded-2xl border-2 border-slate-200 bg-white font-heading font-extrabold text-3xl tracking-tighter min-w-[100px] text-right text-slate-900 shadow-sm">
                            {item.stock.currentStock}
                          </div>
                        )}
                    </div>
                  </div>
              </div>

              <div className="border-t border-slate-100 rounded-b-[2.5rem] p-8 bg-white transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900 font-sans">Rekomendasi Order</span>
                    <span className="text-5xl font-heading font-extrabold tracking-tighter tabular-nums text-slate-900">{item.orderQuantity}</span>
                  </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PurchasePlan;

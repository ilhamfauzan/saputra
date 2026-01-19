
import React, { useMemo } from 'react';
import { useProducts } from '../contexts/ProductContext';
import { calculateSMA, calculateSafetyStock } from '../utils';
import { Package, ShoppingCart, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { products } = useProducts();

  const analysis = useMemo(() => {
    return products.map(product => {
      // 1. Ambil ramalan berdasarkan N terbaik (bestN)
      const { nextPeriodForecast, metrics } = calculateSMA(product.data, product.bestN);
      
      // 2. Hitung Safety Stock dinamis
      const demands = product.data.map(d => d.demand);
      const dynamicSafety = calculateSafetyStock(demands);
      
      // 3. Rekomendasi Beli: (Ramalan + SS) - Stok Gudang Saat Ini
      const forecastRounded = Math.ceil(nextPeriodForecast);
      const orderQuantity = Math.max(0, (forecastRounded + dynamicSafety) - product.stock.currentStock);

      // 4. Tentukan label target ramalan secara dinamis
      const lastData = product.data[product.data.length - 1];
      
      let targetLabel = 'Periode Berikutnya';
      if (lastData) {
        const monthsMap: Record<string, number> = { 'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'Mei': 4, 'Jun': 5, 'Jul': 6, 'Agt': 7, 'Sep': 8, 'Okt': 9, 'Nov': 10, 'Des': 11 };
        const lastMonthIndex = monthsMap[lastData.month] || 0;
        const targetMonthDate = new Date(lastData.year, lastMonthIndex + 1);
        targetLabel = targetMonthDate.toLocaleString('id-ID', { month: 'long', year: 'numeric' });
      }

      return {
        ...product,
        forecast: forecastRounded,
        calculatedSafety: dynamicSafety,
        mape: metrics.mape,
        orderQuantity,
        targetLabel,
        status: product.stock.currentStock < dynamicSafety ? 'low' : 'ok'
      };
    });
  }, [products]);

  // Global metrics
  const criticalCount = analysis.filter(p => p.status !== 'ok').length;
  const targetPeriod = analysis.length > 0 ? analysis[0].targetLabel : '-';

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-top-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-5xl font-heading font-extrabold text-slate-900 tracking-tighter leading-none uppercase">Dashboard</h1>
          <p className="text-slate-400 mt-3 text-[10px] font-bold uppercase tracking-[0.3em]">Status Persediaan & Ramalan {targetPeriod}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
         {[
           { label: 'Total Produk', val: products.length, unit: 'SKU', icon: Package },
           { label: 'Kondisi Kritis', val: criticalCount, unit: 'SKU', icon: ShieldAlert, isCritical: criticalCount > 0 },
           { label: 'Estimasi Order', val: analysis.reduce((a, b) => a + b.orderQuantity, 0), unit: 'UNIT', icon: ShoppingCart, dark: true },
         ].map((kpi, idx) => (
            <div key={idx} className={`${kpi.dark ? 'bg-[#0F172A] border-slate-800 shadow-xl' : 'bg-white border-slate-200 shadow-sm'} p-8 rounded-[2rem] border transition-all`}>
               <div className={`flex items-center gap-3 ${kpi.dark ? 'text-indigo-400' : 'text-slate-400'} mb-5`}>
                  <kpi.icon className="h-4 w-4" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em]">{kpi.label}</span>
               </div>
               <div className={`text-4xl font-heading font-extrabold ${kpi.dark ? 'text-white' : kpi.isCritical ? 'text-red-500' : 'text-slate-900'} tracking-tighter`}>
                 {kpi.val} <span className={`text-[10px] font-bold uppercase tracking-widest ${kpi.dark ? 'text-slate-500' : 'text-slate-300'}`}>{kpi.unit}</span>
               </div>
            </div>
         ))}
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
         <div className="p-10 border-b border-slate-50 flex items-center justify-between">
            <div>
              <h3 className="font-heading font-extrabold text-slate-900 text-2xl tracking-tighter uppercase">Rekomendasi Reorder</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Berdasarkan data histori terakhir</p>
            </div>
         </div>
         
         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead className="bg-slate-50/50 text-slate-400">
                  <tr>
                     <th className="px-10 py-6 text-[10px] font-bold uppercase tracking-widest">Produk</th>
                     <th className="px-6 py-6 text-right text-[10px] font-bold uppercase tracking-widest">Gudang</th>
                     <th className="px-6 py-6 text-right text-[10px] font-bold uppercase tracking-widest">Safety Stock</th>
                     <th className="px-6 py-6 text-right text-[10px] font-bold uppercase tracking-widest">Ramalan ({targetPeriod})</th>
                     <th className="px-10 py-6 text-right text-indigo-600 text-[10px] font-bold uppercase tracking-widest bg-indigo-50/10">Beli</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                  {analysis.map((item) => (
                     <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="px-10 py-7">
                           <div className="font-heading font-extrabold text-slate-900 text-lg tracking-tighter uppercase">{item.name}</div>
                           <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{item.unit}</div>
                        </td>
                        <td className={`px-6 py-7 text-right font-heading font-extrabold text-lg tabular-nums ${item.status === 'low' ? 'text-red-500' : 'text-slate-900'}`}>
                           {item.stock.currentStock}
                        </td>
                        <td className="px-6 py-7 text-right text-slate-400 font-bold tabular-nums">
                           {item.calculatedSafety}
                        </td>
                        <td className="px-6 py-7 text-right text-slate-400 font-bold tabular-nums">
                           {item.forecast}
                        </td>
                        <td className="px-10 py-7 text-right tabular-nums text-indigo-600 font-heading font-black bg-indigo-50/5 text-2xl tracking-tighter">
                           {item.orderQuantity}
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
};

export default Dashboard;

import React, { useMemo, useState } from 'react';
import { useProducts } from '../contexts/ProductContext';
import { useTransactions } from '../contexts/TransactionContext';
import { useSuppliers } from '../contexts/SupplierContext';
import { calculateSMA, calculateSafetyStock, aggregateTransactionsToMonthly } from '../utils';
import { Search, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];

const PurchasePlan: React.FC = () => {
  const { products } = useProducts();
  const { transactions } = useTransactions();
  const { suppliers } = useSuppliers();
  const [searchQuery, setSearchQuery] = useState('');

  // Default: bulan depan dari sekarang
  const now = new Date();
  const defaultTargetMonth = now.getMonth() + 1; // 0-indexed + 1 = next month
  const defaultTargetYear = defaultTargetMonth > 11 ? now.getFullYear() + 1 : now.getFullYear();
  const adjustedDefaultMonth = defaultTargetMonth > 11 ? 0 : defaultTargetMonth;

  const [targetMonth, setTargetMonth] = useState(adjustedDefaultMonth); // 0-indexed
  const [targetYear, setTargetYear] = useState(defaultTargetYear);

  // Generate year options (current year - 2 to current year + 2)
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
  }, []);

  // Target periode label
  const targetPeriodLabel = `${MONTHS[targetMonth]} ${targetYear}`;

  // Data range label (24 bulan kebelakang dari target)
  const dataRangeLabel = useMemo(() => {
    const targetDate = new Date(targetYear, targetMonth, 1);
    const startDate = new Date(targetYear, targetMonth - 24, 1);
    const endDate = new Date(targetYear, targetMonth - 1, 1);

    const startLabel = `${MONTHS_SHORT[startDate.getMonth()]}-${startDate.getFullYear().toString().slice(-2)}`;
    const endLabel = `${MONTHS_SHORT[endDate.getMonth()]}-${endDate.getFullYear().toString().slice(-2)}`;

    return `Data: ${startLabel} s/d ${endLabel}`;
  }, [targetMonth, targetYear]);

  // Navigate month
  const goToPreviousMonth = () => {
    if (targetMonth === 0) {
      setTargetMonth(11);
      setTargetYear(targetYear - 1);
    } else {
      setTargetMonth(targetMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (targetMonth === 11) {
      setTargetMonth(0);
      setTargetYear(targetYear + 1);
    } else {
      setTargetMonth(targetMonth + 1);
    }
  };

  const planData = useMemo(() => {
    // Filter transaksi untuk 24 bulan kebelakang dari target month
    const targetDate = new Date(targetYear, targetMonth, 1);
    const startDate = new Date(targetYear, targetMonth - 24, 1);
    const endDate = new Date(targetYear, targetMonth - 1, 28); // End of previous month

    return products.map(product => {
      // Filter transactions within the 24 month range
      const productTransactions = transactions.filter(transaction => {
        const transDate = new Date(transaction.date);
        return transDate >= startDate && transDate <= endDate &&
          transaction.items.some(item => item.productId === product.id);
      });

      const monthlyData = aggregateTransactionsToMonthly(productTransactions);

      const n = product.bestN || 4;
      const { nextPeriodForecast } = calculateSMA(monthlyData, n);
      const demands = monthlyData.map(d => d.demand);
      const dynamicSafetyStock = calculateSafetyStock(demands);
      const forecastRounded = Math.ceil(nextPeriodForecast);

      const orderQuantity = (forecastRounded + dynamicSafetyStock) - product.stock.currentStock;

      const supplier = suppliers.find(s => s.id === product.supplierId);

      return {
        ...product,
        supplier,
        forecast: forecastRounded,
        calculatedSafety: dynamicSafetyStock,
        orderQuantity: Math.max(0, orderQuantity),
        dataMonths: monthlyData.length // Jumlah bulan data yang tersedia
      };
    });
  }, [products, transactions, suppliers, targetMonth, targetYear]);

  // Filter berdasarkan search query dan sort by orderQuantity (saran beli) descending
  const filteredPlanData = useMemo(() => {
    let data = planData;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      data = data.filter(item =>
        item.name.toLowerCase().includes(query) ||
        item.supplier?.name.toLowerCase().includes(query) ||
        item.unit.toLowerCase().includes(query)
      );
    }

    // Sort by orderQuantity (saran beli) from highest to lowest
    return [...data].sort((a, b) => b.orderQuantity - a.orderQuantity);
  }, [planData, searchQuery]);

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-5xl font-heading font-extrabold text-slate-900 tracking-tighter leading-none uppercase">Rencana Beli</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-3">
              Target Stok: {targetPeriodLabel} • {dataRangeLabel}
            </p>
          </div>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari produk atau supplier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 pr-4 py-3 w-full md:w-72 rounded-2xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Filter Periode Target */}
        <div className="flex flex-wrap items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-indigo-500" />
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Periode Target:</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={goToPreviousMonth}
              className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all"
            >
              <ChevronLeft className="h-4 w-4 text-slate-600" />
            </button>

            <select
              value={targetMonth}
              onChange={(e) => setTargetMonth(parseInt(e.target.value))}
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer"
            >
              {MONTHS.map((month, index) => (
                <option key={index} value={index}>{month}</option>
              ))}
            </select>

            <select
              value={targetYear}
              onChange={(e) => setTargetYear(parseInt(e.target.value))}
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer"
            >
              {yearOptions.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>

            <button
              onClick={goToNextMonth}
              className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all"
            >
              <ChevronRight className="h-4 w-4 text-slate-600" />
            </button>
          </div>

          <div className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider ml-auto">
            Menggunakan 24 bulan data kebelakang
          </div>
        </div>
      </div>

      <div className="rounded-[2rem] md:rounded-[2.5rem] border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-auto max-h-[600px]">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 text-slate-400 sticky top-0 z-10">
              <tr>
                <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-widest">Nama Produk</th>
                <th className="px-6 py-6 text-[10px] font-bold uppercase tracking-widest text-right">Satuan</th>
                <th className="px-6 py-6 text-[10px] font-bold uppercase tracking-widest text-right">Ramalan Kebutuhan</th>
                <th className="px-6 py-6 text-[10px] font-bold uppercase tracking-widest text-right">Safety Stock</th>
                <th className="px-6 py-6 text-[10px] font-bold uppercase tracking-widest text-right">Stok Gudang</th>
                <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-widest text-right bg-indigo-50/50 text-indigo-600">Rekomendasi Order</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPlanData.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50">
                  <td className="px-8 py-6">
                    <div className="font-bold text-slate-900 text-[11px] uppercase tracking-widest">{item.name}</div>
                    {item.supplier && (
                      <div className="text-[9px] text-slate-400 mt-1">Supplier: {item.supplier.name}</div>
                    )}
                    {item.dataMonths < 3 && (
                      <div className="text-[9px] text-amber-500 mt-1">⚠️ Data hanya {item.dataMonths} bulan</div>
                    )}
                  </td>
                  <td className="px-6 py-6 text-right text-slate-600 font-bold text-[11px] tabular-nums">{item.unit}</td>
                  <td className="px-6 py-6 text-right text-slate-600 font-bold text-[11px] tabular-nums">{item.forecast}</td>
                  <td className="px-6 py-6 text-right text-indigo-600 font-bold text-[11px] tabular-nums">+{item.calculatedSafety}</td>
                  <td className="px-6 py-6 text-right text-slate-900 font-bold text-[11px] tabular-nums">{item.stock.currentStock}</td>
                  <td className="px-8 py-6 text-right bg-indigo-50/30">
                    <span className={`font-heading font-extrabold text-xl tabular-nums ${item.orderQuantity > 0 ? 'text-indigo-600' : 'text-slate-400'}`}>
                      {item.orderQuantity}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredPlanData.length === 0 && (
          <div className="text-center py-16">
            <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">
              {searchQuery ? 'Tidak ada produk yang cocok' : 'Belum ada produk'}
            </p>
            <p className="text-slate-300 text-xs mt-1">
              {searchQuery ? 'Coba kata kunci lain' : 'Tambahkan produk di Data Master'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PurchasePlan;

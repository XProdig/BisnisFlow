import React, { useState, useMemo } from 'react';
import { TrendingUp, DollarSign, Wallet, Target, PieChart, Box, ArrowUpRight, ArrowDownRight, CreditCard, Download, BarChart2, Calendar, Filter } from 'lucide-react';
import { Transaction, Expense } from '../types';

interface FinancialRecapProps {
  transactions: Transaction[];
  expenses: Expense[];
}

export const FinancialRecap: React.FC<FinancialRecapProps> = ({ transactions, expenses }) => {
  const [activeTab, setActiveTab] = useState<'general' | 'product'>('general');
  
  // --- DATE FILTER STATE ---
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 8) + '01'); 
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));

  // --- QUICK FILTER LOGIC ---
  const setFilter = (type: 'today' | 'yesterday' | 'thisMonth' | 'thisYear' | 'all') => {
    const now = new Date();
    let start = new Date();
    let end = new Date();

    if (type === 'today') {
      // already set
    } else if (type === 'yesterday') {
      start.setDate(now.getDate() - 1);
      end.setDate(now.getDate() - 1);
    } else if (type === 'thisMonth') {
      start.setDate(1);
    } else if (type === 'thisYear') {
      start.setMonth(0, 1);
      end.setMonth(11, 31);
    } else if (type === 'all') {
      start = new Date('2020-01-01');
    }

    setStartDate(start.toISOString().slice(0, 10));
    setEndDate(end.toISOString().slice(0, 10));
  };

  // --- FILTERING LOGIC ---
  const filteredTransactions = transactions.filter(t => {
    const d = new Date(t.date).getTime();
    const start = new Date(startDate).setHours(0,0,0,0);
    const end = new Date(endDate).setHours(23,59,59,999);
    return d >= start && d <= end;
  });

  const filteredExpenses = expenses.filter(e => {
    const d = new Date(e.date).getTime();
    const start = new Date(startDate).setHours(0,0,0,0);
    const end = new Date(endDate).setHours(23,59,59,999);
    return d >= start && d <= end;
  });

  // --- Kumpulan Rumus Profitabilitas (General) ---
  const totalRevenue = filteredTransactions.reduce((acc, t) => acc + t.totalRevenue, 0);
  const totalHPP = filteredTransactions.reduce((acc, t) => acc + t.totalCost, 0);
  const grossProfit = totalRevenue - totalHPP;
  
  const adSpend = filteredExpenses
    .filter(e => e.category === 'Marketing')
    .reduce((acc, e) => acc + e.amount, 0);
  
  const otherExpenses = filteredExpenses
    .filter(e => e.category !== 'Marketing')
    .reduce((acc, e) => acc + e.amount, 0);
  
  const platformFees = filteredTransactions.reduce((acc, t) => acc + (t.platformFee || 0) + (t.codFee || 0) + (t.shippingCost || 0) + (t.packingCost || 0), 0);
  
  const netProfit = grossProfit - adSpend - otherExpenses - platformFees;
  const roas = adSpend > 0 ? totalRevenue / adSpend : 0;
  const margin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  // --- Rumus Analisa Per Produk (Filtered) ---
  const productPerformance = useMemo(() => {
    const stats: Record<string, { name: string; qty: number; revenue: number; profit: number; count: number }> = {};

    filteredTransactions.forEach(t => {
      t.items.forEach(item => {
        if (!stats[item.productId]) {
          stats[item.productId] = { 
            name: item.productName, 
            qty: 0, 
            revenue: 0, 
            profit: 0,
            count: 0
          };
        }
        stats[item.productId].qty += item.quantity;
        stats[item.productId].revenue += (item.quantity * item.priceAtSale);
        
        // Estimasi profit kotor per item
        const itemGrossProfit = (item.quantity * item.priceAtSale) - (item.quantity * item.hppAtSale);
        stats[item.productId].profit += itemGrossProfit;
        stats[item.productId].count += 1;
      });
    });

    return Object.values(stats).sort((a, b) => b.revenue - a.revenue);
  }, [filteredTransactions]);

  const maxRevenue = Math.max(...productPerformance.map(p => p.revenue), 0);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const handleDownloadReport = () => {
    let csvContent = "data:text/csv;charset=utf-8,";

    if (activeTab === 'general') {
        const rows = [
            ["Periode", `${startDate} s/d ${endDate}`],
            ["Metric", "Value"],
            ["Total Omzet", totalRevenue],
            ["Total HPP", totalHPP],
            ["Gross Profit", grossProfit],
            ["Ad Spend", adSpend],
            ["Biaya Platform & Lainnya", platformFees + otherExpenses],
            ["Net Profit", netProfit],
            ["ROAS", roas.toFixed(2)],
            ["Margin %", margin.toFixed(2) + "%"]
        ];
        csvContent += rows.map(e => e.join(",")).join("\n");
    } else {
        const headers = ["Nama Produk", "Qty Terjual", "Omzet", "Gross Profit", "Frekuensi Transaksi"];
        const rows = productPerformance.map(p => [
            `"${p.name}"`, p.qty, p.revenue, p.profit, p.count
        ]);
        csvContent += [headers.join(","), ...rows.join("\n")].join("\n");
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Laporan_${activeTab}_${startDate}_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const MetricCard = ({ title, value, subtext, icon: Icon, color, isNegative = false }: any) => (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-lg ${color} bg-opacity-10 text-opacity-100`}>
          <Icon size={24} className={color.replace('bg-', 'text-')} />
        </div>
        {title === 'Net Profit' || title === 'Margin' ? (
             <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${isNegative ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                {isNegative ? <ArrowDownRight size={12} /> : <ArrowUpRight size={12} />}
                {isNegative ? 'Loss' : 'Profit'}
             </div>
        ) : null}
      </div>
      <div>
        <h3 className="text-gray-500 text-sm font-medium mb-1">{title}</h3>
        <p className={`text-2xl font-bold ${isNegative ? 'text-red-600' : 'text-gray-900'}`}>
          {value}
        </p>
        {subtext && <p className="text-xs text-gray-400 mt-2">{subtext}</p>}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col lg:flex-row justify-between lg:items-end gap-6">
        <div className="flex-1">
           <h2 className="text-2xl font-bold text-gray-800">Laporan Profitabilitas</h2>
           <p className="text-gray-500 text-sm mt-1 mb-2">Analisa performa keuangan berdasarkan periode waktu.</p>
           
           {/* Quick Filters */}
           <div className="flex flex-wrap gap-2 items-center">
             <span className="text-xs font-bold text-gray-400 uppercase tracking-wide flex items-center gap-1 mr-1">
                <Filter size={12} /> Filter:
             </span>
             {['today', 'yesterday', 'thisMonth', 'thisYear', 'all'].map((filter) => (
                <button 
                  key={filter}
                  onClick={() => setFilter(filter as any)} 
                  className="px-3 py-1.5 text-xs font-medium bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-gray-600 transition-all active:scale-95"
                >
                  {filter === 'today' && 'Hari Ini'}
                  {filter === 'yesterday' && 'Kemarin'}
                  {filter === 'thisMonth' && 'Bulan Ini'}
                  {filter === 'thisYear' && 'Tahun Ini'}
                  {filter === 'all' && 'Semua'}
                </button>
             ))}
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end w-full lg:w-auto">
            {/* Styled Date Pickers */}
            <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-xl border border-gray-200">
                <div className="relative group cursor-pointer">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Calendar size={14} className="text-gray-500" />
                    </div>
                    <input 
                        type="date" 
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        onClick={(e) => {
                          try {
                            // FORCE showPicker call
                            (e.currentTarget as any).showPicker();
                          } catch (err) {
                            // ignore if not supported
                          }
                        }}
                        className="pl-9 pr-2 py-2 bg-white border border-gray-300 rounded-lg text-sm font-bold text-gray-700 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none shadow-sm cursor-pointer hover:border-emerald-400 w-full sm:w-auto"
                    />
                    <label className="absolute -top-2.5 left-2 bg-white px-1 text-[10px] font-bold text-emerald-600 uppercase tracking-wider rounded border border-gray-100 shadow-sm pointer-events-none">Dari</label>
                </div>
                
                <span className="text-gray-400 font-bold px-1">-</span>
                
                <div className="relative group cursor-pointer">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Calendar size={14} className="text-gray-500" />
                    </div>
                    <input 
                        type="date" 
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        onClick={(e) => {
                          try {
                            // FORCE showPicker call
                            (e.currentTarget as any).showPicker();
                          } catch (err) {
                            // ignore if not supported
                          }
                        }}
                        className="pl-9 pr-2 py-2 bg-white border border-gray-300 rounded-lg text-sm font-bold text-gray-700 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none shadow-sm cursor-pointer hover:border-emerald-400 w-full sm:w-auto"
                    />
                    <label className="absolute -top-2.5 left-2 bg-white px-1 text-[10px] font-bold text-emerald-600 uppercase tracking-wider rounded border border-gray-100 shadow-sm pointer-events-none">Sampai</label>
                </div>
            </div>

            <button 
                onClick={handleDownloadReport}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200 h-[42px]"
            >
                <Download size={18} /> Unduh
            </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
            <button
                onClick={() => setActiveTab('general')}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                    activeTab === 'general'
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
                <PieChart size={18} /> Ringkasan Profit
            </button>
            <button
                onClick={() => setActiveTab('product')}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                    activeTab === 'product'
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
                <BarChart2 size={18} /> Analisa Produk (Best Seller)
            </button>
        </nav>
      </div>

      {activeTab === 'general' ? (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {/* Kolom 1: Iklan & Omzet */}
                <MetricCard
                title="Ad Spend (Iklan)"
                value={formatRupiah(adSpend)}
                subtext="Total pengeluaran Marketing"
                icon={Target}
                color="bg-rose-500 text-rose-600"
                />
                
                <MetricCard
                title="Total Omzet"
                value={formatRupiah(totalRevenue)}
                subtext={`${filteredTransactions.length} Transaksi terjual`}
                icon={DollarSign}
                color="bg-emerald-500 text-emerald-600"
                />

                {/* Kolom 2: Profit Kasar & HPP */}
                <MetricCard
                title="Total Biaya HPP"
                value={formatRupiah(totalHPP)}
                subtext="Modal pokok produk terjual"
                icon={Box}
                color="bg-amber-500 text-amber-600"
                />

                <MetricCard
                title="Gross Profit"
                value={formatRupiah(grossProfit)}
                subtext="Omzet - HPP (Laba Kotor)"
                icon={TrendingUp}
                color="bg-blue-500 text-blue-600"
                />

                {/* Kolom 3: Metrik Kunci */}
                <MetricCard
                title="ROAS"
                value={`${roas.toFixed(2)}x`}
                subtext="Return on Ad Spend"
                icon={PieChart}
                color="bg-purple-500 text-purple-600"
                />

                <MetricCard
                title="Margin Bersih"
                value={`${margin.toFixed(2)}%`}
                subtext="Persentase Net Profit / Omzet"
                icon={Wallet}
                color={netProfit >= 0 ? "bg-teal-500 text-teal-600" : "bg-red-500 text-red-600"}
                isNegative={netProfit < 0}
                />

                {/* Kolom 4: Hasil Akhir & Biaya Lain */}
                <MetricCard
                title="Biaya Platform & Ops"
                value={formatRupiah(platformFees + otherExpenses)}
                subtext="Admin Marketplace + Operasional"
                icon={CreditCard}
                color="bg-gray-500 text-gray-600"
                />

                <MetricCard
                title="Net Profit"
                value={formatRupiah(netProfit)}
                subtext="Keuntungan Bersih (Bottom Line)"
                icon={DollarSign}
                color={netProfit >= 0 ? "bg-indigo-500 text-indigo-600" : "bg-red-500 text-red-600"}
                isNegative={netProfit < 0}
                />
            </div>

            {/* Tabel Ringkas Breakdown */}
            <div className="mt-8 bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="p-4 bg-gray-50 border-b border-gray-200">
                <h3 className="font-bold text-gray-700">Breakdown Perhitungan Profit ({startDate} - {endDate})</h3>
                </div>
                <div className="p-6">
                <div className="space-y-3 max-w-2xl">
                    <div className="flex justify-between items-center text-gray-600">
                        <span>(+) Total Omzet Penjualan</span>
                        <span className="font-medium text-gray-900">{formatRupiah(totalRevenue)}</span>
                    </div>
                    <div className="flex justify-between items-center text-gray-600">
                        <span>(-) Total Harga Pokok Penjualan (HPP)</span>
                        <span className="font-medium text-red-500">{formatRupiah(totalHPP)}</span>
                    </div>
                    <div className="my-2 border-t border-gray-200"></div>
                    <div className="flex justify-between items-center text-blue-600 font-bold bg-blue-50 p-2 rounded">
                        <span>(=) Gross Profit (Laba Kotor)</span>
                        <span>{formatRupiah(grossProfit)}</span>
                    </div>
                    <div className="my-2"></div>
                    <div className="flex justify-between items-center text-gray-600">
                        <span>(-) Ad Spend (Biaya Iklan)</span>
                        <span className="font-medium text-red-500">{formatRupiah(adSpend)}</span>
                    </div>
                    <div className="flex justify-between items-center text-gray-600">
                        <span>(-) Biaya Admin Marketplace & Transaksi</span>
                        <span className="font-medium text-red-500">{formatRupiah(platformFees)}</span>
                    </div>
                    <div className="flex justify-between items-center text-gray-600">
                        <span>(-) Beban Operasional Lainnya</span>
                        <span className="font-medium text-red-500">{formatRupiah(otherExpenses)}</span>
                    </div>
                    <div className="my-2 border-t border-gray-200 border-dashed"></div>
                    <div className={`flex justify-between items-center text-xl font-bold p-3 rounded-lg ${netProfit >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                        <span>(=) Net Profit (Laba Bersih)</span>
                        <span>{formatRupiah(netProfit)}</span>
                    </div>
                </div>
                </div>
            </div>
        </>
      ) : (
        <div className="space-y-6">
            {/* Chart Area */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="font-bold text-gray-700 mb-6">Grafik Omzet Produk (Top Products)</h3>
                <div className="space-y-4">
                    {productPerformance.slice(0, 5).map((p, index) => (
                        <div key={index} className="space-y-1">
                            <div className="flex justify-between text-sm">
                                <span className="font-medium text-gray-700">{p.name}</span>
                                <span className="text-gray-500">{formatRupiah(p.revenue)}</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                                <div 
                                    className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500" 
                                    style={{ width: `${(p.revenue / maxRevenue) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    ))}
                    {productPerformance.length === 0 && <p className="text-gray-400 text-center py-4">Belum ada data penjualan pada periode ini.</p>}
                </div>
            </div>

            {/* Detailed Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                    <h3 className="font-bold text-gray-700">Tabel Performa Produk Lengkap</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500">
                            <tr>
                                <th className="px-6 py-3 font-medium">Nama Produk</th>
                                <th className="px-6 py-3 font-medium text-center">Qty Terjual</th>
                                <th className="px-6 py-3 font-medium text-right">Omzet Total</th>
                                <th className="px-6 py-3 font-medium text-right">Gross Profit Estimasi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {productPerformance.map((p, idx) => (
                                <tr key={idx} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900">{p.name}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded-full">{p.qty} pcs</span>
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold text-emerald-600">{formatRupiah(p.revenue)}</td>
                                    <td className="px-6 py-4 text-right text-gray-600">{formatRupiah(p.profit)}</td>
                                </tr>
                            ))}
                            {productPerformance.length === 0 && (
                                <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-400">Data tidak tersedia untuk periode ini</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
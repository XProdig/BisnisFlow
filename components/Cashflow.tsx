import React, { useState } from 'react';
import { PlusCircle, ArrowDownCircle, ArrowUpCircle, Trash2, Download, Calendar, Filter } from 'lucide-react';
import { Transaction, Expense } from '../types';

interface CashflowProps {
  transactions: Transaction[];
  expenses: Expense[];
  onAddExpense: (expense: Expense) => void;
  onDeleteTransaction: (id: string) => void;
  onDeleteExpense: (id: string) => void;
}

export const Cashflow: React.FC<CashflowProps> = ({ 
  transactions, 
  expenses, 
  onAddExpense, 
  onDeleteTransaction, 
  onDeleteExpense 
}) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'add_expense'>('summary');
  
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

  // Form State
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Expense['category']>('Operational');
  const [description, setDescription] = useState('');

  const handleSubmitExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description) return;

    const newExpense: Expense = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      amount: Number(amount),
      category,
      description
    };

    onAddExpense(newExpense);
    setAmount('');
    setDescription('');
    setActiveTab('summary');
  };

  const handleDeleteItem = (id: string, type: 'income' | 'expense') => {
    if (type === 'income') {
      onDeleteTransaction(id);
    } else {
      onDeleteExpense(id);
    }
  };

  // Combine and Sort Data for Timeline (With Filter)
  const timelineData = [
    ...transactions.map(t => ({
      id: t.id,
      date: t.date,
      type: 'income' as const,
      amount: t.totalRevenue,
      title: `Penjualan ${t.source}`,
      subtitle: `${t.items.length} Items`
    })),
    ...expenses.map(e => ({
      id: e.id,
      date: e.date,
      type: 'expense' as const,
      amount: e.amount,
      title: e.description,
      subtitle: e.category
    }))
  ]
  .filter(item => {
    const d = new Date(item.date).getTime();
    const start = new Date(startDate).setHours(0,0,0,0);
    const end = new Date(endDate).setHours(23,59,59,999);
    return d >= start && d <= end;
  })
  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Hitung Saldo Periode Ini
  const totalIncome = timelineData.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = timelineData.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const netCashflow = totalIncome - totalExpense;

  const handleDownload = () => {
    const headers = ["Tanggal", "Jam", "Tipe", "Kategori/Sumber", "Deskripsi", "Jumlah (Rp)"];
    const rows = timelineData.map(item => {
        const d = new Date(item.date);
        return [
            d.toLocaleDateString('id-ID'),
            d.toLocaleTimeString('id-ID'),
            item.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
            item.subtitle,
            `"${item.title}"`,
            item.type === 'income' ? item.amount : -item.amount
        ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Cashflow_Report_${startDate}_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header & Controls */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col xl:flex-row justify-between items-start xl:items-end gap-4">
        <div className="w-full xl:w-auto">
           <h2 className="text-2xl font-bold text-gray-800">Laporan Arus Kas</h2>
           <p className="text-gray-500 text-sm mt-1 mb-2">Pantau uang masuk dan keluar.</p>
           
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
        
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end w-full xl:w-auto">
            {/* Styled Date Pickers - Safe Click */}
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

            <div className="flex gap-2 h-[42px]">
                <button
                    onClick={handleDownload}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 text-sm h-full shadow-sm"
                    title="Export CSV"
                >
                    <Download size={18} />
                </button>
                <button
                    onClick={() => setActiveTab(activeTab === 'summary' ? 'add_expense' : 'summary')}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors text-sm font-medium whitespace-nowrap h-full shadow-lg shadow-emerald-200"
                >
                    {activeTab === 'summary' ? <><PlusCircle size={18} /> Catat Pengeluaran</> : 'Kembali ke Laporan'}
                </button>
            </div>
        </div>
      </div>

      {activeTab === 'add_expense' ? (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm max-w-2xl mx-auto mt-8">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Input Pengeluaran Baru</h3>
          <form onSubmit={handleSubmitExpense} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah (Rp)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="0"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 bg-white"
              >
                <option value="Operational">Operasional (Listrik, Air, Gas)</option>
                <option value="Marketing">Marketing / Iklan</option>
                <option value="Salary">Gaji Karyawan</option>
                <option value="Rent">Sewa Tempat</option>
                <option value="Other">Lain-lain</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Contoh: Bayar Iklan Instagram"
                required
              />
            </div>

            <div className="pt-4">
              <button
                type="submit"
                className="w-full py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
              >
                Simpan Pengeluaran
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="space-y-6">
           {/* Summary Cards */}
           <div className="grid grid-cols-3 gap-4">
              <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                  <p className="text-xs text-emerald-600 font-bold uppercase">Total Masuk</p>
                  <p className="text-xl font-bold text-emerald-800">+ Rp {totalIncome.toLocaleString()}</p>
              </div>
              <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                  <p className="text-xs text-red-600 font-bold uppercase">Total Keluar</p>
                  <p className="text-xl font-bold text-red-800">- Rp {totalExpense.toLocaleString()}</p>
              </div>
              <div className={`p-4 rounded-xl border ${netCashflow >= 0 ? 'bg-blue-50 border-blue-100' : 'bg-orange-50 border-orange-100'}`}>
                  <p className={`text-xs font-bold uppercase ${netCashflow >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>Net Cashflow</p>
                  <p className={`text-xl font-bold ${netCashflow >= 0 ? 'text-blue-800' : 'text-orange-800'}`}>Rp {netCashflow.toLocaleString()}</p>
              </div>
           </div>

           <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="font-semibold text-gray-700">Riwayat Mutasi</h3>
                    <span className="text-xs text-gray-500">Menampilkan {timelineData.length} transaksi</span>
                </div>
                <div className="divide-y divide-gray-100">
                    {timelineData.map((item) => (
                    <div key={item.id} className="p-4 hover:bg-gray-50 flex items-center justify-between group relative">
                        <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-full ${item.type === 'income' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                            {item.type === 'income' ? <ArrowDownCircle size={24} /> : <ArrowUpCircle size={24} />}
                            </div>
                            <div>
                            <h4 className="font-medium text-gray-900">{item.title}</h4>
                            <p className="text-sm text-gray-500">
                                {new Date(item.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} • {new Date(item.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} • {item.subtitle}
                            </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className={`text-right font-bold ${item.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>
                            {item.type === 'income' ? '+' : '-'} Rp {item.amount.toLocaleString()}
                            </div>
                            <button 
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation(); // Mencegah klik tembus
                                handleDeleteItem(item.id, item.type);
                            }}
                            className="relative z-50 p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-50 transition-all bg-white border border-gray-200 shadow-sm cursor-pointer"
                            title="Hapus Data"
                            >
                            <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                    ))}
                    {timelineData.length === 0 && (
                    <div className="p-12 text-center text-gray-400 italic">
                        Tidak ada data mutasi pada periode {startDate} s/d {endDate}
                    </div>
                    )}
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
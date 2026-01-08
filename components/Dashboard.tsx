import React, { useState } from 'react';
import { DollarSign, Wallet, Store, Globe, Package, Activity, Box, Truck, CheckCircle, Clock, Download, Calendar, Filter, Upload, Trash2 } from 'lucide-react';
import { Transaction, Expense, Product, BusinessMode } from '../types';

interface DashboardProps {
  transactions: Transaction[];
  expenses: Expense[];
  products: Product[];
  businessMode?: BusinessMode;
  onNavigate: (tab: string) => void;
  onDeleteTransaction: (id: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ transactions, expenses, products, businessMode = 'Retail', onNavigate, onDeleteTransaction }) => {
  // --- STATE TANGGAL ---
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

  // --- FILTER TRANSAKSI ---
  const filteredTransactions = transactions.filter(t => {
    const tDate = new Date(t.date).getTime();
    const start = new Date(startDate).setHours(0, 0, 0, 0);
    const end = new Date(endDate).setHours(23, 59, 59, 999);
    
    // Filter by Mode AND Date
    return t.mode === businessMode && tDate >= start && tDate <= end;
  });

  // --- PERHITUNGAN (Menggunakan data yang sudah difilter) ---
  
  // Total Revenue (Gross) - Menghitung SEMUA yang valid (tidak cancel)
  const validTransactions = filteredTransactions.filter(t => t.status !== 'Cancelled');
  const totalRevenue = validTransactions.reduce((acc, t) => acc + t.totalRevenue, 0);
  
  // Net Profit: Hanya menghitung yang SUDAH SELESAI (Uang Cair) untuk Online, atau Semua untuk Retail
  // Ini penting agar user tidak mengira profit padahal barang masih di jalan
  const completedTransactions = validTransactions.filter(t => 
    businessMode === 'Retail' || t.status === 'Completed'
  );
  const totalNetProfit = completedTransactions.reduce((acc, t) => acc + t.netProfit, 0);

  // --- METRIK KHUSUS ONLINE ---
  const pendingOrders = filteredTransactions.filter(t => t.status === 'Pending' || t.status === 'Packing').length;
  const sentOrders = filteredTransactions.filter(t => t.status === 'Sent').length; // Dalam perjalanan
  const completedOrders = filteredTransactions.filter(t => t.status === 'Completed').length; // Selesai
  const cancelledOrders = filteredTransactions.filter(t => t.status === 'Cancelled').length; // Retur/Batal

  const potentialRevenue = validTransactions
    .filter(t => t.status === 'Sent' || t.status === 'Pending' || t.status === 'Packing')
    .reduce((acc, t) => acc + t.totalRevenue, 0); // Uang tertahan

  const totalPackingCost = validTransactions.reduce((acc, t) => acc + (t.packingCost || 0), 0);
  const totalPlatformFees = validTransactions.reduce((acc, t) => acc + (t.platformFee || 0), 0);

  // --- METRIK KHUSUS RETAIL ---
  const cashTransactions = filteredTransactions.filter(t => t.paymentMethod === 'Cash');
  const cashInDrawer = cashTransactions.reduce((acc, t) => acc + t.totalRevenue, 0);
  const qrisTransactions = filteredTransactions.filter(t => t.paymentMethod === 'QRIS');
  const qrisTotal = qrisTransactions.reduce((acc, t) => acc + t.totalRevenue, 0);

  // --- DOWNLOAD HANDLER ---
  const handleDownloadCSV = () => {
    if (filteredTransactions.length === 0) return alert("Tidak ada data pada periode ini untuk diunduh.");
    
    const headers = [
      "ID Transaksi", "Tanggal", "Jam", "Mode", "Sumber", "Item", 
      "Omzet", "HPP", "Fee Platform", "Ongkir", "Packing", "Net Profit", 
      "Status", "Resi", "Pembayaran"
    ];

    const rows = filteredTransactions.map(t => {
      const dateObj = new Date(t.date);
      const itemsString = t.items.map(i => `${i.productName} (${i.quantity})`).join('; ');
      
      return [
        t.id,
        dateObj.toLocaleDateString('id-ID'),
        dateObj.toLocaleTimeString('id-ID'),
        t.mode,
        t.source,
        `"${itemsString}"`,
        t.totalRevenue,
        t.totalCost,
        t.platformFee || 0,
        t.shippingCost || 0,
        t.packingCost || 0,
        t.netProfit,
        t.status || '-',
        t.resi || '-',
        t.paymentMethod
      ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Laporan_Transaksi_${businessMode}_${startDate}_sd_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const StatCard = ({ title, value, subValue, icon: Icon, colorClass, bgClass }: any) => (
    <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between h-full relative overflow-hidden transition-all hover:shadow-md">
      <div className={`absolute top-0 right-0 p-3 opacity-10 ${colorClass}`}>
        <Icon size={64} />
      </div>
      <div className="flex items-start justify-between mb-4 relative z-10">
        <div className={`p-2.5 rounded-lg ${bgClass} ${colorClass}`}>
          <Icon size={24} />
        </div>
      </div>
      <div className="relative z-10">
        <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
        <h3 className={`text-2xl font-bold ${title.includes('Profit') && typeof value === 'number' && value < 0 ? 'text-red-600' : 'text-gray-800'}`}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </h3>
        {subValue && <p className="text-xs text-gray-400 mt-1">{subValue}</p>}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header & Date Filter */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col lg:flex-row justify-between lg:items-end gap-6">
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2 mb-2">
            {businessMode === 'Retail' ? <Store className="text-emerald-600" /> : <Globe className="text-blue-600" />}
            Dashboard {businessMode === 'Retail' ? 'Toko Fisik' : 'Toko Online'}
          </h2>
          
          <div className="flex flex-wrap gap-2 items-center">
             <span className="text-xs font-bold text-gray-400 uppercase tracking-wide flex items-center gap-1 mr-1">
                <Filter size={12} /> Filter Cepat:
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
        
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto items-stretch sm:items-end">
            {/* Shortcuts Button for Online Mode */}
            {businessMode === 'Online' && (
              <button 
                onClick={() => onNavigate('import')}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 h-[42px] animate-pulse"
                title="Upload file Excel dari Shopee/Tokopedia"
              >
                <Upload size={18} />
                <span>Upload Laporan</span>
              </button>
            )}

            {/* Custom Date Picker Design - Safe Click */}
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
                            (e.currentTarget as any).showPicker();
                          } catch (err) {}
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
                            (e.currentTarget as any).showPicker();
                          } catch (err) {}
                        }}
                        className="pl-9 pr-2 py-2 bg-white border border-gray-300 rounded-lg text-sm font-bold text-gray-700 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none shadow-sm cursor-pointer hover:border-emerald-400 w-full sm:w-auto"
                    />
                    <label className="absolute -top-2.5 left-2 bg-white px-1 text-[10px] font-bold text-emerald-600 uppercase tracking-wider rounded border border-gray-100 shadow-sm pointer-events-none">Sampai</label>
                </div>
            </div>

            <button 
              onClick={handleDownloadCSV}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-all shadow-sm h-[42px]"
              title="Download CSV"
            >
              <Download size={18} />
              <span className="hidden sm:inline">Export</span>
            </button>
        </div>
      </div>

      {/* --- GRID UTAMA --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard 
          title="Total Gross Omzet" 
          value={`Rp ${totalRevenue.toLocaleString()}`}
          subValue={`${validTransactions.length} Transaksi Valid`}
          icon={DollarSign}
          colorClass={businessMode === 'Retail' ? "text-emerald-600" : "text-blue-600"}
          bgClass={businessMode === 'Retail' ? "bg-emerald-50" : "bg-blue-50"}
        />

        <StatCard 
          title={businessMode === 'Online' ? "Profit Real (Selesai)" : "Net Profit (Bersih)"}
          value={`Rp ${totalNetProfit.toLocaleString()}`}
          subValue={businessMode === 'Online' ? "Uang sudah cair dari MP" : "Margin Bersih"}
          icon={Wallet}
          colorClass="text-indigo-600"
          bgClass="bg-indigo-50"
        />

        {businessMode === 'Retail' && (
          <>
            <StatCard 
              title="Uang Tunai (Cash)" 
              value={`Rp ${cashInDrawer.toLocaleString()}`}
              subValue="Total Cash Laci"
              icon={Box}
              colorClass="text-amber-600"
              bgClass="bg-amber-50"
            />
            <StatCard 
              title="Transaksi QRIS" 
              value={`Rp ${qrisTotal.toLocaleString()}`}
              subValue="Total Digital"
              icon={Activity}
              colorClass="text-purple-600"
              bgClass="bg-purple-50"
            />
          </>
        )}

        {businessMode === 'Online' && (
          <>
            <StatCard 
              title="Potensi Omzet (Tertahan)" 
              value={`Rp ${potentialRevenue.toLocaleString()}`}
              subValue="Barang Dikirim/Proses"
              icon={Clock}
              colorClass="text-orange-600"
              bgClass="bg-orange-50"
            />
             <StatCard 
              title="Status Pesanan" 
              value={`${sentOrders} Kirim / ${cancelledOrders} Retur`}
              subValue={`Selesai: ${completedOrders}`}
              icon={Package}
              colorClass="text-rose-600"
              bgClass="bg-rose-50"
            />
          </>
        )}
      </div>

      {/* --- SECTION KEDUA: DETAIL OPERASIONAL (Jika Online) --- */}
      {businessMode === 'Online' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
           <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <h4 className="font-bold text-gray-700 mb-3 flex items-center gap-2"><Truck size={18} /> Ekspedisi (Periode Ini)</h4>
              <p className="text-sm text-gray-500">Menampilkan data berdasarkan {filteredTransactions.length} transaksi yang difilter.</p>
           </div>
           <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <h4 className="font-bold text-gray-700 mb-3 flex items-center gap-2"><DollarSign size={18} /> Potongan Marketplace</h4>
              <div className="text-3xl font-bold text-red-500">Rp {totalPlatformFees.toLocaleString()}</div>
              <p className="text-xs text-gray-500 mt-1">Total Admin Fee periode ini</p>
           </div>
           <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <h4 className="font-bold text-gray-700 mb-3 flex items-center gap-2"><CheckCircle size={18} /> Rasio Sukses</h4>
              <div className="text-3xl font-bold text-emerald-600">{(filteredTransactions.length > 0 ? (completedOrders/filteredTransactions.length * 100) : 0).toFixed(0)}%</div>
              <p className="text-xs text-gray-500 mt-1">Pesanan Selesai / Total Pesanan</p>
           </div>
        </div>
      )}

      {/* --- TABLES --- */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h3 className="font-bold text-gray-800">Riwayat Transaksi</h3>
            <span className="text-xs text-gray-500">Menampilkan {filteredTransactions.length} data</span>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="px-6 py-3 font-medium">Waktu & Tanggal</th>
                  <th className="px-6 py-3 font-medium">Detail Order</th>
                  {businessMode === 'Online' && <th className="px-6 py-3 font-medium">Status & Resi</th>}
                  {businessMode === 'Retail' && <th className="px-6 py-3 font-medium text-center">Metode Bayar</th>}
                  <th className="px-6 py-3 font-medium text-right">Profit Bersih</th>
                  <th className="px-6 py-3 font-medium text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredTransactions.slice().reverse().map((t) => ( // Show newest first
                  <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-gray-500">
                      <div className="font-medium text-gray-900">{new Date(t.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{new Date(t.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-900">
                      <div className="font-semibold">{t.source} {t.customerName ? `(${t.customerName})` : ''}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{t.items.length} Items • Omzet: Rp {t.totalRevenue.toLocaleString()}</div>
                    </td>
                    
                    {businessMode === 'Online' && (
                       <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                            t.status === 'Completed' ? 'bg-green-100 text-green-700' : 
                            t.status === 'Sent' ? 'bg-blue-100 text-blue-700' :
                            t.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                            'bg-orange-100 text-orange-700'
                          }`}>
                             {t.status || 'Pending'}
                          </span>
                          {t.resi && <div className="text-xs text-gray-500 mt-1 font-mono">{t.expedition} - {t.resi}</div>}
                       </td>
                    )}

                    {businessMode === 'Retail' && (
                       <td className="px-6 py-4 text-center">
                          <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-bold border border-gray-200">
                             {t.paymentMethod}
                          </span>
                       </td>
                    )}

                    <td className="px-6 py-4 text-right">
                      <div className={`font-bold ${t.status === 'Cancelled' ? 'text-gray-400 line-through' : 'text-emerald-600'}`}>
                        Rp {t.netProfit.toLocaleString()}
                      </div>
                      {businessMode === 'Online' && t.status !== 'Cancelled' && (
                        <div className="text-xs text-red-400">Fee: Rp {((t.platformFee||0) + (t.packingCost||0)).toLocaleString()}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                onDeleteTransaction(t.id);
                            }}
                            className="p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-50 transition-all"
                            title="Hapus Transaksi"
                        >
                            <Trash2 size={16} />
                        </button>
                    </td>
                  </tr>
                ))}
                {filteredTransactions.length === 0 && (
                   <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400 italic">
                        Tidak ada data transaksi di rentang tanggal {startDate} s/d {endDate}
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
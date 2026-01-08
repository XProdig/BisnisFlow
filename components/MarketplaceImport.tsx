import React, { useState } from 'react';
import { read, utils } from 'xlsx';
import { UploadCloud, FileSpreadsheet, Check, AlertCircle, ArrowRight, Save, Info } from 'lucide-react';
import { Transaction, TransactionItem, BusinessMode } from '../types';

interface MarketplaceImportProps {
  onImport: (transactions: Transaction[]) => void;
}

type MarketplaceType = 'Shopee' | 'TikTok' | 'Tokopedia' | 'Lazada';

export const MarketplaceImport: React.FC<MarketplaceImportProps> = ({ onImport }) => {
  const [file, setFile] = useState<File | null>(null);
  const [marketplace, setMarketplace] = useState<MarketplaceType>('Shopee');
  const [previewData, setPreviewData] = useState<Transaction[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // --- HELPER: Status Mapping (Updated for precision) ---
  const mapStatus = (rawStatus: string, market: MarketplaceType): 'Pending' | 'Packing' | 'Sent' | 'Completed' | 'Cancelled' => {
    const s = rawStatus.toLowerCase().trim();
    
    // PRIORITAS 1: Cek Indikasi Batal/Retur/Refund TERLEBIH DAHULU
    // Ini krusial karena kadang statusnya "Selesai (Pengembalian Dana)"
    if (
        s.includes('batal') || 
        s.includes('cancel') || 
        s.includes('gagal') || 
        s.includes('return') || 
        s.includes('refund') || 
        s.includes('pengembalian') ||
        s.includes('dikembalikan')
    ) {
        return 'Cancelled';
    }

    // PRIORITAS 2: Mapping Status Normal
    if (market === 'Shopee') {
      if (s.includes('selesai') || s.includes('completed')) return 'Completed';
      
      if (s.includes('sedang dikirim') || s.includes('dijemput kurir') || s.includes('dikirim') || s.includes('dalam perjalanan') || s.includes('sedang transit') || s.includes('terkirim')) return 'Sent';
      
      if (s.includes('perlu dikirim') || s.includes('sedang dikemas') || s.includes('siap dikirim') || s.includes('menunggu pengambilan')) return 'Packing';
    } 
    else if (market === 'TikTok') {
      if (s.includes('completed') || s.includes('selesai')) return 'Completed';
      
      if (s.includes('in transit') || s.includes('shipped') || s.includes('dikirim') || s.includes('sedang dikirim') || s.includes('sedang transit')) return 'Sent';
      
      if (s.includes('awaiting shipment') || s.includes('awaiting collection') || s.includes('siap dikirim') || s.includes('menunggu pengambilan')) return 'Packing';
    }
    else if (market === 'Tokopedia') {
      if (s.includes('selesai') || s.includes('pesanan selesai')) return 'Completed';
      
      if (s.includes('sedang dikirim') || s.includes('dalam pengiriman') || s.includes('sampai tujuan') || s.includes('terkirim')) return 'Sent';
      
      if (s.includes('pesanan baru') || s.includes('siap dikirim') || s.includes('diproses penjual') || s.includes('menunggu pengambilan')) return 'Packing';
    }
    else if (market === 'Lazada') {
        if (s.includes('delivered') || s.includes('confirmed')) return 'Completed'; 
        
        if (s.includes('shipped') || s.includes('dalam pengiriman') || s.includes('sedang transit')) return 'Sent';
        
        if (s.includes('ready to ship') || s.includes('diproses') || s.includes('menunggu pengambilan')) return 'Packing';
    }

    return 'Pending';
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setIsProcessing(true);
    setErrorMsg('');
    setPreviewData([]);

    try {
      const data = await uploadedFile.arrayBuffer();
      const workbook = read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData: any[] = utils.sheet_to_json(worksheet, { header: 1 }); // Array of arrays

      if (jsonData.length < 2) throw new Error("File kosong atau format salah");

      // Cari Index Kolom berdasarkan Header
      const headers = jsonData[0].map((h: any) => String(h).toLowerCase());
      
      const transactions: Transaction[] = [];
      
      // LOGIC PARSING BERDASARKAN MARKETPLACE
      let colIdx = {
        orderId: -1,
        status: -1,
        productName: -1,
        qty: -1,
        price: -1,
        totalAmount: -1,
        resi: -1,
      };

      // Auto-detect kolom umum
      if (marketplace === 'Shopee') {
        colIdx.orderId = headers.findIndex((h: string) => h.includes('no. pesanan'));
        colIdx.status = headers.findIndex((h: string) => h.includes('status pesanan'));
        colIdx.productName = headers.findIndex((h: string) => h.includes('nama produk'));
        colIdx.qty = headers.findIndex((h: string) => h.includes('jumlah produk')); 
        colIdx.price = headers.findIndex((h: string) => h.includes('harga awal'));
        colIdx.totalAmount = headers.findIndex((h: string) => h.includes('total pembayaran'));
        colIdx.resi = headers.findIndex((h: string) => h.includes('no. resi'));
      } 
      else if (marketplace === 'TikTok') {
        colIdx.orderId = headers.findIndex((h: string) => h.includes('order id'));
        colIdx.status = headers.findIndex((h: string) => h.includes('order status'));
        colIdx.productName = headers.findIndex((h: string) => h.includes('product name'));
        colIdx.qty = headers.findIndex((h: string) => h.includes('quantity'));
        colIdx.price = headers.findIndex((h: string) => h.includes('unit price'));
        colIdx.totalAmount = headers.findIndex((h: string) => h.includes('order subtotal'));
      }
      else if (marketplace === 'Tokopedia') {
        colIdx.orderId = headers.findIndex((h: string) => h.includes('invoice') || h.includes('nomor invoice'));
        colIdx.status = headers.findIndex((h: string) => h.includes('status'));
        colIdx.productName = headers.findIndex((h: string) => h.includes('nama produk'));
        colIdx.qty = headers.findIndex((h: string) => h.includes('jumlah'));
        colIdx.price = headers.findIndex((h: string) => h.includes('harga jual'));
        colIdx.totalAmount = headers.findIndex((h: string) => h.includes('total harga') || h.includes('nilai total'));
      }
      else if (marketplace === 'Lazada') {
        colIdx.orderId = headers.findIndex((h: string) => h.includes('order item id') || h.includes('order number'));
        colIdx.status = headers.findIndex((h: string) => h.includes('status'));
        colIdx.productName = headers.findIndex((h: string) => h.includes('item name'));
        colIdx.qty = headers.findIndex((h: string) => h.includes('paid price') ? -1 : h.includes('quantity')); 
        colIdx.price = headers.findIndex((h: string) => h.includes('unit price'));
        colIdx.totalAmount = headers.findIndex((h: string) => h.includes('paid price'));
      }

      if (colIdx.orderId === -1 || colIdx.status === -1) {
        throw new Error(`Format kolom tidak dikenali untuk ${marketplace}. Pastikan file export asli.`);
      }

      const tempMap: Record<string, Transaction> = {};

      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!row[colIdx.orderId]) continue;

        const orderId = String(row[colIdx.orderId]);
        const statusRaw = String(row[colIdx.status] || '');
        const mappedStatus = mapStatus(statusRaw, marketplace);
        
        const productName = colIdx.productName > -1 ? String(row[colIdx.productName]) : 'Unknown Product';
        const qty = colIdx.qty > -1 ? Number(row[colIdx.qty]) || 1 : 1;
        const price = colIdx.price > -1 ? Number(String(row[colIdx.price]).replace(/[^0-9.-]+/g,"")) : 0;
        
        // Ambil nominal, hapus currency symbol
        const totalAmt = colIdx.totalAmount > -1 ? Number(String(row[colIdx.totalAmount]).replace(/[^0-9.-]+/g,"")) : (price * qty);
        const resi = colIdx.resi > -1 ? String(row[colIdx.resi]) : '';

        // --- PENTING: LOGIKA KEUANGAN CANCELLED ---
        // Jika status Cancelled/Return, maka Revenue = 0 dan Cost = 0 (karena barang balik atau gak jadi kirim).
        // Excel seringkali menulis nominal refund di kolom Total Amount, kita HARUS mengabaikannya agar seller tidak bingung.
        const isCancelled = mappedStatus === 'Cancelled';
        
        const finalRevenue = isCancelled ? 0 : (totalAmt || (price * qty));
        const finalCost = isCancelled ? 0 : (price * 0.6 * qty); // Estimasi HPP 60%
        const finalPlatformFee = isCancelled ? 0 : (finalRevenue * 0.08); // Estimasi Fee 8%
        const finalPackingCost = isCancelled ? 0 : 2000; // Jika batal, asumsi packing loss minimal atau nol
        
        const newItem: TransactionItem = {
          productId: 'IMP-' + Math.random().toString(36).substr(2, 5),
          productName: productName,
          quantity: qty,
          priceAtSale: price,
          hppAtSale: price * 0.6
        };

        if (tempMap[orderId]) {
          // Merge item ke order yg sama
          tempMap[orderId].items.push(newItem);
          if (!isCancelled) {
              tempMap[orderId].totalRevenue += (price * qty);
              tempMap[orderId].totalCost += (price * 0.6 * qty); 
              tempMap[orderId].platformFee += (price * qty * 0.08);
              // Recalculate Net Profit
              tempMap[orderId].netProfit = tempMap[orderId].totalRevenue - tempMap[orderId].totalCost - tempMap[orderId].platformFee - 2000;
          }
        } else {
          // New Order
          tempMap[orderId] = {
            id: orderId,
            date: new Date().toISOString(),
            mode: 'Online',
            source: marketplace,
            items: [newItem],
            totalRevenue: finalRevenue,
            totalCost: finalCost,
            platformFee: finalPlatformFee,
            codFee: 0,
            shippingCost: 0,
            packingCost: finalPackingCost,
            netProfit: isCancelled ? 0 : (finalRevenue - finalCost - finalPlatformFee - finalPackingCost),
            paymentMethod: 'Marketplace',
            status: mappedStatus,
            resi: resi,
            expedition: 'Standard',
            customerName: 'Marketplace User'
          };
        }
      }

      setPreviewData(Object.values(tempMap));

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Gagal memproses file.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmImport = () => {
    onImport(previewData);
    setPreviewData([]);
    setFile(null);
    alert(`Berhasil mengimpor ${previewData.length} transaksi!`);
  };

  // --- STATISTIK PREVIEW ---
  const countCompleted = previewData.filter(t => t.status === 'Completed').length;
  const countProcess = previewData.filter(t => t.status === 'Sent' || t.status === 'Packing').length;
  const countCancelled = previewData.filter(t => t.status === 'Cancelled').length;
  const totalRevenueEstimasi = previewData.filter(t => t.status !== 'Cancelled').reduce((acc, t) => acc + t.totalRevenue, 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <FileSpreadsheet className="text-emerald-600" /> 
          Upload Data Marketplace
        </h2>
        <p className="text-gray-500 mt-2">
          Upload laporan penjualan (Excel/CSV) dari Shopee, TikTok, atau Tokopedia. <br/>
          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded font-medium">
            Otomatis deteksi: Menunggu Pickup, Transit, Selesai, dan Batal/Retur.
          </span>
        </p>

        {/* Step 1: Select Market */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Pilih Marketplace</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {['Shopee', 'TikTok', 'Tokopedia', 'Lazada'].map((m) => (
              <button
                key={m}
                onClick={() => setMarketplace(m as MarketplaceType)}
                className={`p-3 rounded-lg border text-sm font-bold transition-all ${
                  marketplace === m 
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-700 ring-1 ring-emerald-500' 
                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Upload Area */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Upload File Laporan (.xlsx / .csv)</label>
          <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-8 hover:bg-gray-50 transition-colors text-center cursor-pointer">
            <input 
              type="file" 
              accept=".xlsx, .csv, .xls"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="flex flex-col items-center justify-center">
              <UploadCloud className="w-10 h-10 text-gray-400 mb-3" />
              <p className="text-gray-600 font-medium">{file ? file.name : "Klik atau seret file ke sini"}</p>
              <p className="text-xs text-gray-400 mt-1">Format standard export dari Seller Center</p>
            </div>
          </div>
          {errorMsg && (
            <div className="mt-3 p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-center gap-2">
              <AlertCircle size={16} /> {errorMsg}
            </div>
          )}
        </div>
      </div>

      {/* Step 3: Preview & Confirm */}
      {previewData.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden animate-fade-in">
          <div className="p-4 bg-emerald-50 border-b border-emerald-100 flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
              <h3 className="font-bold text-emerald-800 flex items-center gap-2">
                <Check size={18} /> Preview Data ({previewData.length} Pesanan)
              </h3>
              <p className="text-xs text-emerald-600 mt-1">Pastikan data di bawah ini benar sebelum disimpan.</p>
            </div>
            <button 
              onClick={handleConfirmImport}
              className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition-colors flex items-center gap-2 shadow-sm"
            >
              <Save size={18} /> Simpan ke Database
            </button>
          </div>

          {/* Ringkasan Status */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 border-b border-gray-100 bg-white">
             <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                <p className="text-xs text-gray-500 uppercase font-bold">Total Omzet (Estimasi)</p>
                <p className="text-lg font-bold text-emerald-600">Rp {totalRevenueEstimasi.toLocaleString()}</p>
             </div>
             <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-xs text-blue-500 uppercase font-bold">Selesai (Cair)</p>
                <p className="text-lg font-bold text-blue-700">{countCompleted} Order</p>
             </div>
             <div className="p-3 bg-orange-50 rounded-lg border border-orange-100">
                <p className="text-xs text-orange-500 uppercase font-bold">Proses/Dikirim (Piutang)</p>
                <p className="text-lg font-bold text-orange-700">{countProcess} Order</p>
             </div>
             <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                <p className="text-xs text-red-500 uppercase font-bold">Batal/Retur (Loss)</p>
                <p className="text-lg font-bold text-red-700">{countCancelled} Order</p>
             </div>
          </div>

          {/* Table Preview */}
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3">Order ID</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Produk</th>
                  <th className="px-4 py-3 text-right">Total (Rp)</th>
                  <th className="px-4 py-3 text-right">Fee (Est)</th>
                  <th className="px-4 py-3 text-right">Net Profit (Est)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {previewData.slice(0, 50).map((t, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-mono text-xs text-gray-600">{t.id}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        t.status === 'Completed' ? 'bg-green-100 text-green-700' :
                        t.status === 'Sent' ? 'bg-blue-100 text-blue-700' :
                        t.status === 'Cancelled' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-gray-800 line-clamp-1 max-w-[200px]">
                      {t.items[0]?.productName} {t.items.length > 1 ? `(+${t.items.length-1} more)` : ''}
                    </td>
                    <td className="px-4 py-2 text-right font-medium">
                      {t.status === 'Cancelled' ? (
                          <span className="text-gray-400 line-through decoration-red-500 decoration-2">
                             {t.totalRevenue > 0 ? t.totalRevenue.toLocaleString() : "Rp 0"}
                          </span>
                      ) : (
                          t.totalRevenue.toLocaleString()
                      )}
                    </td>
                    <td className="px-4 py-2 text-right text-red-500 text-xs">
                      {t.status === 'Cancelled' ? '-' : `-${t.platformFee?.toLocaleString()}`}
                    </td>
                    <td className="px-4 py-2 text-right font-bold text-emerald-600">
                      {t.status === 'Cancelled' ? 'Rp 0' : t.netProfit.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {previewData.length > 50 && (
              <div className="p-3 text-center text-xs text-gray-400 bg-gray-50">
                ...dan {previewData.length - 50} data lainnya.
              </div>
            )}
          </div>
          
          <div className="p-4 bg-yellow-50 text-yellow-800 text-xs flex items-start gap-2">
             <Info size={16} className="flex-shrink-0 mt-0.5" />
             <p>
               <strong>Catatan Sistem:</strong> Pesanan dengan status "Batal", "Pengembalian", atau "Refund" otomatis dihitung Rp 0 (Omzet & Profit) meskipun ada angka di laporan Excel, untuk mencegah kesalahan hitung pendapatan seller.
             </p>
          </div>
        </div>
      )}
    </div>
  );
};
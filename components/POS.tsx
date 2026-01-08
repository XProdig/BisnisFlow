import React, { useState, useMemo } from 'react';
import { Search, Minus, Plus, Trash2, ShoppingBag, CreditCard, Banknote, Truck, Globe, Smartphone, Calculator, X, Store, Box, Calendar } from 'lucide-react';
import { Product, Transaction, TransactionItem, BusinessMode } from '../types';

interface POSProps {
  products: Product[];
  onCheckout: (transaction: Transaction) => void;
  businessMode: BusinessMode;
}

export const POS: React.FC<POSProps> = ({ products, onCheckout, businessMode }) => {
  const [cart, setCart] = useState<TransactionItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  // Checkout Modal State
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  
  // Checkout Form State
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().slice(0, 16)); // YYYY-MM-DDTHH:mm
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [customerName, setCustomerName] = useState('');
  const [onlineSource, setOnlineSource] = useState('WhatsApp');
  const [platformFeePercent, setPlatformFeePercent] = useState(0); 
  const [isCOD, setIsCOD] = useState(false);
  const [codFeePercent, setCodFeePercent] = useState(0); 
  const [shippingCost, setShippingCost] = useState(0);
  
  // Retail Specific State
  const [amountPaid, setAmountPaid] = useState<number>(0);

  // Online Specific State
  const [packingCost, setPackingCost] = useState(2000); // Default biaya packing
  const [expedition, setExpedition] = useState('JNE');
  const [resi, setResi] = useState('');
  const [orderStatus, setOrderStatus] = useState<'Pending' | 'Packing' | 'Sent'>('Pending');

  const themeColor = businessMode === 'Retail' ? 'emerald' : 'blue';

  const categories = useMemo(() => ['All', ...Array.from(new Set(products.map(p => p.category)))], [products]);

  const filteredProducts = products.filter(p => 
    (selectedCategory === 'All' || p.category === selectedCategory) &&
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        return prev.map(item => 
          item.productId === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        priceAtSale: product.price,
        hppAtSale: product.hpp
      }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.productId === productId) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  const totalRevenue = cart.reduce((sum, item) => sum + (item.quantity * item.priceAtSale), 0);
  const totalCost = cart.reduce((sum, item) => sum + (item.quantity * item.hppAtSale), 0);

  // Calculations for Checkout
  const calculateFinancials = () => {
    const platformFee = totalRevenue * (platformFeePercent / 100);
    const codFee = isCOD ? (totalRevenue + shippingCost) * (codFeePercent / 100) : 0;
    
    // Net Profit Logic
    // Retail: Revenue - Cost
    // Online: Revenue - Cost - PlatformFee - CODFee - PackingCost
    let netProfit = totalRevenue - totalCost;
    
    if (businessMode === 'Online') {
      netProfit = netProfit - platformFee - codFee - packingCost;
    }
    
    return { platformFee, codFee, netProfit };
  };

  const { platformFee, codFee, netProfit } = calculateFinancials();
  
  // Retail Change Calculation
  const grandTotal = totalRevenue; // Untuk retail biasanya simpel
  const change = amountPaid - grandTotal;

  const handleProcessPayment = () => {
    if (cart.length === 0) return;
    
    // Validasi Retail
    if (businessMode === 'Retail' && paymentMethod === 'Cash' && amountPaid < grandTotal) {
      alert("Uang pembayaran kurang!");
      return;
    }

    const transaction: Transaction = {
      id: Date.now().toString(),
      date: new Date(transactionDate).toISOString(), // Use selected date
      mode: businessMode,
      source: businessMode === 'Retail' ? 'Store' : onlineSource,
      items: cart,
      totalRevenue: totalRevenue,
      totalCost: totalCost,
      
      // Financials
      paymentMethod: isCOD ? 'COD' : paymentMethod,
      customerName: customerName,
      platformFee: businessMode === 'Online' ? platformFee : 0,
      codFee: businessMode === 'Online' ? codFee : 0,
      shippingCost: businessMode === 'Online' ? shippingCost : 0,
      packingCost: businessMode === 'Online' ? packingCost : 0,
      netProfit: netProfit,

      // Retail Specific
      amountPaid: businessMode === 'Retail' ? amountPaid : undefined,
      change: businessMode === 'Retail' ? change : undefined,

      // Online Specific
      status: businessMode === 'Online' ? orderStatus : undefined,
      expedition: businessMode === 'Online' ? expedition : undefined,
      resi: businessMode === 'Online' ? resi : undefined,
    };
    
    onCheckout(transaction);
    setCart([]);
    setIsCheckoutModalOpen(false);
    resetForm();
    alert(`Transaksi ${businessMode} Berhasil Disimpan!`);
  };

  const resetForm = () => {
    setTransactionDate(new Date().toISOString().slice(0, 16));
    setPaymentMethod('Cash');
    setCustomerName('');
    setOnlineSource('WhatsApp');
    setPlatformFeePercent(0);
    setIsCOD(false);
    setCodFeePercent(0);
    setShippingCost(0);
    setAmountPaid(0);
    setPackingCost(2000);
    setResi('');
    setOrderStatus('Pending');
  };

  const presetSources = [
    { name: 'WhatsApp', fee: 0 },
    { name: 'Shopee', fee: 6.5 },
    { name: 'Tokopedia', fee: 5.5 },
    { name: 'TikTok Shop', fee: 4.5 },
    { name: 'Website', fee: 0 },
  ];

  const quickMoneyButtons = [2000, 5000, 10000, 20000, 50000, 100000];

  return (
    <>
      <div className="flex flex-col lg:flex-row h-[calc(100vh-140px)] gap-6">
        {/* Product Catalog Section */}
        <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100 space-y-4 bg-white">
            <div className="flex justify-between items-center">
              <h2 className={`text-lg font-bold text-${themeColor}-800 flex items-center gap-2`}>
                 {businessMode === 'Retail' ? <Store className={`text-${themeColor}-600`} /> : <Globe className={`text-${themeColor}-600`} />}
                 Katalog {businessMode === 'Retail' ? 'Toko Fisik' : 'Online Shop'}
              </h2>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Cari menu / produk..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === cat 
                      ? `bg-${themeColor}-600 text-white` 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map(product => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  disabled={product.stock <= 0}
                  className={`relative flex flex-col items-start p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-all text-left ${
                    product.stock <= 0 ? 'opacity-50 cursor-not-allowed' : `hover:border-${themeColor}-300`
                  }`}
                >
                  <div className={`w-10 h-10 mb-3 rounded-full bg-${themeColor}-100 flex items-center justify-center text-${themeColor}-600 font-bold text-lg`}>
                    {product.name.charAt(0)}
                  </div>
                  <h3 className="font-semibold text-gray-800 line-clamp-2 min-h-[40px]">{product.name}</h3>
                  <p className="text-gray-500 text-sm mb-2">{product.category}</p>
                  <div className="mt-auto w-full flex justify-between items-center">
                    <span className={`font-bold text-${themeColor}-600`}>Rp {product.price.toLocaleString()}</span>
                    <span className={`text-xs px-2 py-1 rounded ${product.stock > product.minStock ? 'bg-gray-100 text-gray-600' : 'bg-red-100 text-red-600'}`}>
                      Stok: {product.stock}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Cart Section */}
        <div className="w-full lg:w-96 flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 h-full">
          <div className="p-4 border-b border-gray-100 bg-gray-50 rounded-t-xl">
            <h2 className="font-bold text-gray-800 flex items-center gap-2">
              <ShoppingBag className={`text-${themeColor}-600`} />
              Keranjang ({cart.length})
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-2 opacity-60">
                <ShoppingBag size={48} />
                <p>Belum ada item dipilih</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.productId} className="flex justify-between items-center">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-800 line-clamp-1">{item.productName}</h4>
                    <p className={`text-${themeColor}-600 text-sm font-semibold`}>Rp {item.priceAtSale.toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center border border-gray-300 rounded-lg">
                      <button 
                        onClick={() => item.quantity === 1 ? removeFromCart(item.productId) : updateQuantity(item.productId, -1)}
                        className="p-1 hover:bg-gray-100 text-gray-600 rounded-l-lg"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="px-2 text-sm font-medium w-8 text-center">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.productId, 1)}
                        className="p-1 hover:bg-gray-100 text-gray-600 rounded-r-lg"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <button 
                      onClick={() => removeFromCart(item.productId)}
                      className="text-red-400 hover:text-red-600 p-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-xl space-y-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between font-bold text-lg text-gray-800 pt-2">
                <span>Total</span>
                <span>Rp {totalRevenue.toLocaleString()}</span>
              </div>
            </div>
            
            <button
              onClick={() => {
                 setAmountPaid(totalRevenue); // Auto fill for ease
                 setTransactionDate(new Date().toISOString().slice(0, 16)); // Set default to now
                 setIsCheckoutModalOpen(true);
              }}
              disabled={cart.length === 0}
              className={`w-full py-3 bg-${themeColor}-600 text-white font-semibold rounded-lg hover:bg-${themeColor}-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-${themeColor}-200`}
            >
              Bayar
            </button>
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      {isCheckoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <h3 className="text-xl font-bold text-gray-800">
                {businessMode === 'Retail' ? 'Kasir Toko (Retail)' : 'Proses Order Online'}
              </h3>
              <button onClick={() => setIsCheckoutModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              
              {/* --- DATE INPUT (BACKDATE FEATURE) --- */}
              <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                 <label className="block text-xs font-bold text-yellow-800 uppercase tracking-wide mb-1 flex items-center gap-1">
                    <Calendar size={12} /> Tanggal & Waktu Transaksi
                 </label>
                 <input 
                   type="datetime-local"
                   value={transactionDate}
                   onChange={(e) => setTransactionDate(e.target.value)}
                   onClick={(e) => {
                      try {
                        // FORCE showPicker call
                        (e.currentTarget as any).showPicker();
                      } catch (err) {
                        // ignore if not supported
                      }
                   }}
                   className="w-full p-2 text-sm border border-yellow-300 rounded focus:ring-yellow-500 bg-white cursor-pointer"
                 />
                 <p className="text-[10px] text-yellow-700 mt-1">Ubah tanggal ini jika Anda mencatat transaksi yang sudah lewat (susulan).</p>
              </div>

              {/* --- RETAIL MODE UI --- */}
              {businessMode === 'Retail' && (
                <div className="space-y-6">
                   {/* 1. Payment Method */}
                   <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Metode Pembayaran</label>
                    <div className="grid grid-cols-3 gap-3">
                      {['Cash', 'QRIS', 'Debit'].map(m => (
                        <button
                          key={m}
                          onClick={() => setPaymentMethod(m)}
                          className={`flex items-center justify-center gap-2 py-3 rounded-lg border text-sm font-bold transition-all ${
                            paymentMethod === m 
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-200' 
                            : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {m === 'Cash' && <Banknote size={18} />}
                          {m === 'QRIS' && <Smartphone size={18} />}
                          {m === 'Debit' && <CreditCard size={18} />}
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 2. Calculator Interface for Cash */}
                  {paymentMethod === 'Cash' && (
                    <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                       <div className="flex justify-between items-end mb-4">
                          <span className="text-gray-600 font-medium">Total Tagihan</span>
                          <span className="text-2xl font-bold text-gray-800">Rp {grandTotal.toLocaleString()}</span>
                       </div>
                       
                       <label className="block text-sm font-medium text-gray-700 mb-2">Uang Diterima</label>
                       <div className="flex gap-2 mb-4">
                          <div className="relative flex-1">
                             <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">Rp</span>
                             <input 
                               type="number" 
                               value={amountPaid}
                               onChange={(e) => setAmountPaid(Number(e.target.value))}
                               className="w-full pl-10 p-3 text-lg font-bold border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                               autoFocus
                             />
                          </div>
                          {/* Quick Buttons */}
                          <div className="flex gap-1 overflow-x-auto pb-1">
                             {quickMoneyButtons.map(amt => (
                               <button 
                                 key={amt}
                                 onClick={() => setAmountPaid(prev => prev + amt)}
                                 className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs font-bold hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 whitespace-nowrap"
                               >
                                 +{amt/1000}k
                               </button>
                             ))}
                             <button onClick={() => setAmountPaid(grandTotal)} className="px-3 py-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg text-xs font-bold">Pas</button>
                          </div>
                       </div>

                       <div className={`p-4 rounded-lg flex justify-between items-center ${change >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                          <span className="font-bold">Kembalian</span>
                          <span className="text-xl font-bold">Rp {change.toLocaleString()}</span>
                       </div>
                    </div>
                  )}

                  {/* 3. Customer Name (Optional) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nama Pelanggan (Opsional)</label>
                    <input 
                      type="text" 
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                      placeholder="Nama pembeli..."
                    />
                  </div>
                </div>
              )}


              {/* --- ONLINE MODE UI --- */}
              {businessMode === 'Online' && (
                <div className="space-y-4">
                  {/* 1. Source & Fees */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Marketplace / Sumber</label>
                      <select 
                        value={onlineSource}
                        onChange={(e) => {
                          setOnlineSource(e.target.value);
                          const preset = presetSources.find(p => p.name === e.target.value);
                          if (preset) setPlatformFeePercent(preset.fee);
                        }}
                        className="w-full p-2 text-sm border border-gray-300 rounded-lg bg-gray-50"
                      >
                        {presetSources.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                        <option value="Other">Lainnya</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Potongan Admin (%)</label>
                      <input 
                        type="number"
                        step="0.1"
                        value={platformFeePercent}
                        onChange={(e) => setPlatformFeePercent(Number(e.target.value))}
                        className="w-full p-2 text-sm border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>

                  {/* 2. Logistics & Packing (Crucial for Online) */}
                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 space-y-4">
                    <h4 className="font-bold text-blue-800 flex items-center gap-2 text-sm">
                       <Box size={16} /> Logistik & Packing
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="block text-xs font-medium text-gray-600 mb-1">Ekspedisi</label>
                           <select 
                             value={expedition}
                             onChange={(e) => setExpedition(e.target.value)}
                             className="w-full p-2 text-sm border border-blue-200 rounded-lg"
                           >
                             <option value="JNE">JNE</option>
                             <option value="J&T">J&T</option>
                             <option value="SiCepat">SiCepat</option>
                             <option value="Shopee Express">Shopee Express</option>
                             <option value="GoSend/Grab">GoSend/Grab</option>
                           </select>
                        </div>
                        <div>
                           <label className="block text-xs font-medium text-gray-600 mb-1">No. Resi (Opsional)</label>
                           <input 
                             type="text" 
                             value={resi}
                             onChange={(e) => setResi(e.target.value)}
                             placeholder="Scan / Ketik Resi"
                             className="w-full p-2 text-sm border border-blue-200 rounded-lg"
                           />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Biaya Packing (Kardus/Bubble)</label>
                        <div className="relative">
                           <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">Rp</span>
                           <input 
                             type="number" 
                             value={packingCost}
                             onChange={(e) => setPackingCost(Number(e.target.value))}
                             className="w-full pl-8 p-2 text-sm border border-blue-200 rounded-lg"
                           />
                        </div>
                        <p className="text-[10px] text-blue-600 mt-1">*Mengurangi profit bersih</p>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Status Pesanan</label>
                        <div className="flex gap-2">
                           {['Pending', 'Packing', 'Sent'].map(s => (
                             <button
                               key={s}
                               onClick={() => setOrderStatus(s as any)}
                               className={`px-3 py-1 rounded text-xs border ${orderStatus === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-500 border-gray-300'}`}
                             >
                               {s}
                             </button>
                           ))}
                        </div>
                    </div>
                  </div>

                  {/* 3. Financials (Ongkir & COD) */}
                  <div className="grid grid-cols-2 gap-4 pt-2">
                      <div className="flex items-center gap-2">
                          <input type="checkbox" checked={isCOD} onChange={(e) => setIsCOD(e.target.checked)} className="rounded text-blue-600" />
                          <label className="text-sm">COD?</label>
                      </div>
                      <div>
                         <label className="block text-xs text-gray-500">Ongkir (Dibayar Buyer)</label>
                         <input type="number" value={shippingCost} onChange={(e) => setShippingCost(Number(e.target.value))} className="w-full p-1 border rounded text-sm" />
                      </div>
                  </div>

                  {/* Profit Preview */}
                  <div className="bg-gray-50 p-3 rounded-lg text-sm space-y-1">
                      <div className="flex justify-between"><span>Omzet (Harga Jual)</span> <span>Rp {totalRevenue.toLocaleString()}</span></div>
                      <div className="flex justify-between text-red-500"><span>- Admin Fee</span> <span>(Rp {platformFee.toLocaleString()})</span></div>
                      <div className="flex justify-between text-red-500"><span>- Packing Cost</span> <span>(Rp {packingCost.toLocaleString()})</span></div>
                      <div className="flex justify-between text-red-500"><span>- HPP Barang</span> <span>(Rp {totalCost.toLocaleString()})</span></div>
                      <div className="border-t pt-1 flex justify-between font-bold text-emerald-600"><span>Net Profit</span> <span>Rp {netProfit.toLocaleString()}</span></div>
                  </div>
                </div>
              )}

            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
              <button
                onClick={handleProcessPayment}
                className={`w-full py-3.5 ${businessMode === 'Retail' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'} text-white font-bold rounded-xl shadow-lg transition-transform active:scale-95`}
              >
                {businessMode === 'Retail' ? 'Bayar & Cetak Struk' : 'Simpan Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
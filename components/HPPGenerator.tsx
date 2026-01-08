import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Calculator, Save, Store, Target, Megaphone, Edit3, XCircle } from 'lucide-react';
import { Product, HPPComponent } from '../types';

interface Section {
  id: string;
  title: string;
  items: HPPComponent[];
}

interface HPPGeneratorProps {
  onSaveProduct: (product: Product) => void;
}

export const HPPGenerator: React.FC<HPPGeneratorProps> = ({ onSaveProduct }) => {
  // --- STATE UTAMA ---
  const [productName, setProductName] = useState('');
  const [categoryName, setCategoryName] = useState('General');
  const [batchSize, setBatchSize] = useState(1);
  
  // State untuk Kolom/Kategori Biaya yang Dinamis
  const [sections, setSections] = useState<Section[]>([
    { 
      id: '1', 
      title: 'Bahan Baku (Raw Material)', 
      items: [{ id: '101', name: '', cost: 0 }] 
    },
    { 
      id: '2', 
      title: 'Packaging & Kemasan', 
      items: [{ id: '201', name: '', cost: 0 }] 
    }
  ]);

  // State Keuntungan & Marketplace
  const [desiredMargin, setDesiredMargin] = useState(30); // % Margin Profit
  const [marketplaceFeePercent, setMarketplaceFeePercent] = useState(0); // % Admin Fee

  // State Target Marketing (ROAS & Omzet)
  const [targetRevenue, setTargetRevenue] = useState(10000000); // Default 10 Juta
  const [targetROAS, setTargetROAS] = useState(5); // Default 5x

  // --- LOGIC SECTION (Kolom Dinamis) ---
  const addSection = () => {
    const newSection: Section = {
      id: Date.now().toString(),
      title: 'Kategori Biaya Baru (Klik untuk ubah)',
      items: [{ id: Date.now().toString() + '1', name: '', cost: 0 }]
    };
    setSections([...sections, newSection]);
  };

  const removeSection = (sectionId: string) => {
    if (confirm('Hapus seluruh kategori biaya ini?')) {
      setSections(sections.filter(s => s.id !== sectionId));
    }
  };

  const updateSectionTitle = (id: string, newTitle: string) => {
    setSections(sections.map(s => s.id === id ? { ...s, title: newTitle } : s));
  };

  // --- LOGIC ITEMS (Isi Biaya) ---
  const addItemToSection = (sectionId: string) => {
    setSections(sections.map(s => {
      if (s.id === sectionId) {
        return {
          ...s,
          items: [...s.items, { id: Date.now().toString(), name: '', cost: 0 }]
        };
      }
      return s;
    }));
  };

  const removeItemFromSection = (sectionId: string, itemId: string) => {
    setSections(sections.map(s => {
      if (s.id === sectionId) {
        return {
          ...s,
          items: s.items.filter(i => i.id !== itemId)
        };
      }
      return s;
    }));
  };

  const updateItem = (sectionId: string, itemId: string, field: keyof HPPComponent, value: string | number) => {
    setSections(sections.map(s => {
      if (s.id === sectionId) {
        const newItems = s.items.map(i => i.id === itemId ? { ...i, [field]: value } : i);
        return { ...s, items: newItems };
      }
      return s;
    }));
  };

  // --- KALKULASI UTAMA ---
  const calculateSectionTotal = (items: HPPComponent[]) => items.reduce((sum, i) => sum + Number(i.cost), 0);

  // 1. Total Biaya Produksi (Semua Section)
  const totalProductionCost = sections.reduce((acc, s) => acc + calculateSectionTotal(s.items), 0);
  
  // 2. HPP Per Unit
  const hppPerUnit = batchSize > 0 ? totalProductionCost / batchSize : 0;

  // 3. Harga Jual & Profit
  // Rumus: Harga Jual = HPP + (HPP * Margin%)
  const suggestedPrice = hppPerUnit + (hppPerUnit * (desiredMargin / 100));
  
  // 4. Potongan Admin
  const adminFee = suggestedPrice * (marketplaceFeePercent / 100);

  // 5. Net Profit (Real) sebelum Iklan
  // Profit = Harga Jual - HPP - Admin Fee
  const netProfitUnit = suggestedPrice - hppPerUnit - adminFee;

  // --- KALKULASI MARKETING & TARGET ---
  
  // Gross Margin % (Setelah HPP & Admin Fee)
  // Ini adalah persentase uang yang tersisa untuk bakar iklan dan profit bersih
  const grossMarginPercentReal = suggestedPrice > 0 ? (netProfitUnit / suggestedPrice) : 0;

  // Break Even ROAS (Minimum ROAS supaya tidak rugi)
  // Rumus: 1 / Gross Margin %
  const breakEvenROAS = grossMarginPercentReal > 0 ? 1 / grossMarginPercentReal : 0;

  // Target Sales Qty
  const targetSalesQty = suggestedPrice > 0 ? Math.ceil(targetRevenue / suggestedPrice) : 0;

  // Max Ad Spend (Budget Iklan Maksimal sesuai Target ROAS)
  const maxAdSpend = targetROAS > 0 ? targetRevenue / targetROAS : 0;

  // Estimasi Profit Bersih Bulanan (Setelah dikurangi Budget Iklan)
  // Profit = (Qty * NetProfitUnit) - AdSpend
  const projectedMonthlyNetProfit = (targetSalesQty * netProfitUnit) - maxAdSpend;

  const handleSave = () => {
    if (!productName) {
      alert("Nama produk harus diisi");
      return;
    }
    const newProduct: Product = {
      id: Date.now().toString(),
      name: productName,
      category: categoryName || 'General',
      hpp: hppPerUnit,
      price: suggestedPrice,
      stock: 0,
      minStock: 10
    };
    onSaveProduct(newProduct);
    // Reset minimal
    setProductName('');
  };

  return (
    <div className="max-w-6xl mx-auto pb-20">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <Calculator className="text-emerald-600 w-8 h-8" />
          HPP & Target Profit Generator
        </h2>
        <p className="text-gray-500 mt-2">
          Hitung HPP dengan kolom dinamis, tentukan harga jual, dan dapatkan strategi ROAS iklan yang aman.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* KOLOM KIRI: INPUT BIAYA (8 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Card Info Produk */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-800 border-b border-gray-100 pb-2">1. Informasi Produk</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Nama Produk</label>
                 <input
                   type="text"
                   value={productName}
                   onChange={(e) => setProductName(e.target.value)}
                   className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-emerald-500"
                   placeholder="Contoh: Hijab Premium"
                 />
              </div>
              <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                 <input
                   type="text"
                   value={categoryName}
                   onChange={(e) => setCategoryName(e.target.value)}
                   className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-emerald-500"
                   placeholder="Fashion / F&B"
                 />
              </div>
              <div className="md:col-span-2">
                 <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah Hasil Produksi per Batch</label>
                 <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={batchSize}
                      onChange={(e) => setBatchSize(Number(e.target.value))}
                      className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-emerald-500"
                      min="1"
                    />
                    <span className="text-gray-500 text-sm whitespace-nowrap">Pcs / Porsi</span>
                 </div>
                 <p className="text-xs text-gray-400 mt-1">Jika menghitung untuk 1 porsi, isi 1. Jika 1 resep jadi 10 porsi, isi 10.</p>
              </div>
            </div>
          </div>

          {/* Card Biaya Dinamis */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-gray-800">2. Komponen Biaya (HPP)</h3>
              <button 
                onClick={addSection}
                className="text-sm flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg transition-colors"
              >
                <Plus size={16} /> Tambah Kategori Biaya
              </button>
            </div>

            {sections.map((section) => {
              const sectionTotal = calculateSectionTotal(section.items);
              return (
                <div key={section.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm relative group">
                  <div className="flex justify-between items-center mb-4">
                     {/* Editable Title */}
                     <div className="flex items-center gap-2 flex-1">
                        <Edit3 size={16} className="text-gray-400" />
                        <input 
                          type="text" 
                          value={section.title}
                          onChange={(e) => updateSectionTitle(section.id, e.target.value)}
                          className="font-semibold text-gray-700 border-none focus:ring-0 p-0 w-full bg-transparent placeholder-gray-400"
                          placeholder="Nama Kategori Biaya (mis: Overhead)"
                        />
                     </div>
                     <div className="flex items-center gap-4">
                        <span className="text-sm font-bold text-gray-700 bg-gray-50 px-2 py-1 rounded">Rp {sectionTotal.toLocaleString()}</span>
                        <button onClick={() => removeSection(section.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                          <XCircle size={20} />
                        </button>
                     </div>
                  </div>

                  <div className="space-y-3 pl-2 border-l-2 border-gray-100">
                    {section.items.map((item) => (
                      <div key={item.id} className="flex gap-2 items-center">
                        <input
                          type="text"
                          placeholder="Nama Item (mis: Listrik, Gaji)"
                          className="flex-1 p-2 text-sm border border-gray-300 rounded focus:border-emerald-500 outline-none"
                          value={item.name}
                          onChange={(e) => updateItem(section.id, item.id, 'name', e.target.value)}
                        />
                        <div className="relative w-32">
                           <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">Rp</span>
                           <input
                             type="number"
                             placeholder="0"
                             className="w-full pl-6 p-2 text-sm border border-gray-300 rounded text-right focus:border-emerald-500 outline-none"
                             value={item.cost || ''}
                             onChange={(e) => updateItem(section.id, item.id, 'cost', Number(e.target.value))}
                           />
                        </div>
                        <button 
                          onClick={() => removeItemFromSection(section.id, item.id)}
                          className="p-2 text-gray-400 hover:text-red-500 rounded"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => addItemToSection(section.id)}
                      className="text-xs flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-medium mt-2"
                    >
                      <Plus size={14} /> Tambah Item
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pricing & Margin Strategy */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
             <h3 className="font-bold text-gray-800 border-b border-gray-100 pb-2">3. Strategi Harga Jual</h3>
             
             {/* Slider Margin */}
             <div>
                <div className="flex justify-between mb-2">
                   <label className="text-sm font-medium text-gray-700">Margin Profit Diinginkan</label>
                   <span className="text-emerald-600 font-bold">{desiredMargin}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="300"
                  value={desiredMargin}
                  onChange={(e) => setDesiredMargin(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
             </div>

             {/* Marketplace Fee */}
             <div className="p-4 bg-orange-50 rounded-lg border border-orange-100">
                <div className="flex items-center gap-2 mb-2">
                   <Store size={18} className="text-orange-600" />
                   <span className="font-semibold text-orange-900 text-sm">Biaya Admin Marketplace / Platform</span>
                </div>
                <div className="flex gap-4 items-center">
                   <div className="flex-1">
                      <label className="text-xs text-orange-800 block mb-1">Persentase Potongan (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={marketplaceFeePercent}
                        onChange={(e) => setMarketplaceFeePercent(Number(e.target.value))}
                        className="w-full p-2 text-sm border border-orange-200 rounded focus:ring-orange-500"
                      />
                   </div>
                   <div className="flex-1">
                      <label className="text-xs text-orange-800 block mb-1">Nominal Potongan</label>
                      <div className="font-bold text-orange-700">Rp {adminFee.toLocaleString()}</div>
                   </div>
                </div>
             </div>

             <div className="flex justify-between items-end pt-4 border-t border-gray-100">
                <div>
                   <p className="text-sm text-gray-500">Rekomendasi Harga Jual</p>
                   <p className="text-3xl font-bold text-gray-900">Rp {suggestedPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                </div>
                <div className="text-right">
                   <p className="text-sm text-gray-500">HPP per Unit</p>
                   <p className="font-medium text-red-600">Rp {hppPerUnit.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                </div>
             </div>
          </div>
        </div>

        {/* KOLOM KANAN: ANALISA & MARKETING (4 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Card Target Marketing */}
          <div className="bg-gradient-to-br from-blue-900 to-blue-800 text-white p-6 rounded-xl shadow-lg sticky top-6">
            <div className="flex items-center gap-2 mb-6">
               <Target className="text-blue-300" />
               <h3 className="font-bold text-lg">Target & Simulasi Iklan</h3>
            </div>

            <div className="space-y-5">
               {/* Input Target Omzet */}
               <div>
                  <label className="block text-blue-200 text-xs font-bold uppercase tracking-wider mb-2">Target Omzet Bulanan</label>
                  <div className="relative">
                     <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-900 font-bold">Rp</span>
                     <input 
                        type="number"
                        value={targetRevenue}
                        onChange={(e) => setTargetRevenue(Number(e.target.value))}
                        className="w-full pl-10 p-3 rounded-lg text-blue-900 font-bold focus:ring-2 focus:ring-blue-400 border-none"
                     />
                  </div>
               </div>

               {/* Input Target ROAS */}
               <div>
                  <label className="block text-blue-200 text-xs font-bold uppercase tracking-wider mb-2">Target ROAS (Return On Ad Spend)</label>
                  <div className="flex items-center gap-2">
                     <input 
                        type="number"
                        step="0.1"
                        value={targetROAS}
                        onChange={(e) => setTargetROAS(Number(e.target.value))}
                        className="w-24 p-3 rounded-lg text-blue-900 font-bold focus:ring-2 focus:ring-blue-400 border-none"
                     />
                     <span className="text-blue-200 text-sm">kali lipat (x)</span>
                  </div>
                  <p className="text-xs text-blue-300 mt-1">Semakin kecil ROAS, semakin agresif iklannya.</p>
               </div>

               <hr className="border-blue-700/50" />

               {/* Hasil Analisa */}
               <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm space-y-3">
                  <div className="flex justify-between items-center">
                     <span className="text-sm text-blue-100">Max Budget Iklan</span>
                     <span className="font-bold text-lg text-white">Rp {maxAdSpend.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  </div>
                  <div className="flex justify-between items-center">
                     <span className="text-sm text-blue-100">Target Penjualan (Qty)</span>
                     <span className="font-bold text-white">{targetSalesQty.toLocaleString()} pcs</span>
                  </div>
               </div>

               {/* SARAN MINIMAL TARGET (BEP ROAS) */}
               <div className={`p-4 rounded-lg border ${targetROAS < breakEvenROAS ? 'bg-red-500/20 border-red-400 text-red-100' : 'bg-emerald-500/20 border-emerald-400 text-emerald-100'}`}>
                  <div className="flex items-start gap-3">
                     <Megaphone size={20} className="mt-1 flex-shrink-0" />
                     <div>
                        <p className="font-bold text-sm mb-1">Saran / Analisa:</p>
                        <p className="text-xs leading-relaxed">
                           Untuk profit, ROAS Anda minimal harus <strong>{breakEvenROAS.toFixed(2)}x</strong>. 
                        </p>
                        {targetROAS < breakEvenROAS ? (
                           <p className="text-xs font-bold mt-2 bg-red-600 px-2 py-1 rounded inline-block">
                              BAHAYA! Target ROAS membuat Anda rugi!
                           </p>
                        ) : (
                           <p className="text-xs font-bold mt-2 bg-emerald-600 px-2 py-1 rounded inline-block">
                              AMAN. Target Profitable.
                           </p>
                        )}
                     </div>
                  </div>
               </div>
            </div>

            <div className="mt-6 pt-4 border-t border-blue-700/50">
               <div className="flex justify-between items-center mb-4">
                  <span className="text-blue-200 text-sm">Estimasi Net Profit Bersih</span>
                  <span className="font-bold text-2xl text-emerald-300">Rp {projectedMonthlyNetProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
               </div>
               <button
                  onClick={handleSave}
                  className="w-full bg-white text-blue-900 font-bold py-3 rounded-lg hover:bg-blue-50 transition-colors flex justify-center items-center gap-2"
               >
                  <Save size={18} /> Simpan Produk
               </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Search, Edit2, AlertTriangle, CheckCircle, Trash2, Download } from 'lucide-react';
import { Product } from '../types';

interface StockManagementProps {
  products: Product[];
  onUpdateStock: (id: string, newStock: number) => void;
  onDeleteProduct: (id: string) => void;
}

export const StockManagement: React.FC<StockManagementProps> = ({ products, onUpdateStock, onDeleteProduct }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<number>(0);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const startEdit = (product: Product) => {
    setEditingId(product.id);
    setEditValue(product.stock);
  };

  const saveEdit = (id: string) => {
    onUpdateStock(id, editValue);
    setEditingId(null);
  };

  const handleDownload = () => {
    const headers = ["ID", "Nama Produk", "Kategori", "HPP", "Harga Jual", "Stok", "Status"];
    const rows = filteredProducts.map(p => [
        p.id,
        `"${p.name}"`,
        p.category,
        p.hpp,
        p.price,
        p.stock,
        p.stock <= p.minStock ? 'Low Stock' : 'Aman'
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Stock_Report_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Manajemen Stok</h2>
        <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                    type="text"
                    placeholder="Cari produk / SKU..."
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <button
                onClick={handleDownload}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600"
                title="Download Data Stok"
            >
                <Download size={20} />
            </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
              <tr>
                <th className="px-6 py-4">Nama Produk</th>
                <th className="px-6 py-4">Kategori</th>
                <th className="px-6 py-4 text-right">Harga Jual</th>
                <th className="px-6 py-4 text-right">HPP</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-center">Stok Saat Ini</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{product.name}</td>
                  <td className="px-6 py-4 text-gray-500">{product.category}</td>
                  <td className="px-6 py-4 text-right">Rp {product.price.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right text-gray-500">Rp {product.hpp.toLocaleString()}</td>
                  <td className="px-6 py-4 text-center">
                    {product.stock <= product.minStock ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <AlertTriangle size={12} /> Low Stock
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle size={12} /> Aman
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {editingId === product.id ? (
                      <input 
                        type="number"
                        className="w-20 p-1 border border-emerald-500 rounded text-center"
                        value={editValue}
                        onChange={(e) => setEditValue(Number(e.target.value))}
                        autoFocus
                      />
                    ) : (
                      <span className="font-semibold">{product.stock}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {editingId === product.id ? (
                      <div className="flex justify-center gap-2">
                         <button onClick={() => saveEdit(product.id)} className="text-emerald-600 font-medium text-xs hover:underline">Simpan</button>
                         <button onClick={() => setEditingId(null)} className="text-gray-500 font-medium text-xs hover:underline">Batal</button>
                      </div>
                    ) : (
                      <div className="flex justify-center gap-3">
                        <button 
                          onClick={() => startEdit(product)}
                          className="text-gray-400 hover:text-emerald-600 transition-colors"
                          title="Edit Stok"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={(e) => {
                             e.stopPropagation();
                             onDeleteProduct(product.id);
                          }}
                          className="text-gray-400 hover:text-red-600 transition-colors"
                          title="Hapus Produk"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-400">Produk tidak ditemukan</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
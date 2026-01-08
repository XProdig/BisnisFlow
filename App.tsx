import React, { useState, useEffect } from 'react';
import { LayoutDashboard, ShoppingCart, Calculator, Package, Wallet, Bot, Menu, X, Store, Globe, PieChart, Upload } from 'lucide-react';
import { HPPGenerator } from './components/HPPGenerator';
import { POS } from './components/POS';
import { AIConsultant } from './components/AIConsultant';
import { Dashboard } from './components/Dashboard';
import { StockManagement } from './components/StockManagement';
import { Cashflow } from './components/Cashflow';
import { FinancialRecap } from './components/FinancialRecap';
import { MarketplaceImport } from './components/MarketplaceImport';
import { Product, Transaction, Expense, BusinessMode } from './types';

// Mock Initial Data
const INITIAL_PRODUCTS: Product[] = [
  { id: '1', name: 'Kopi Susu Gula Aren', category: 'Minuman', hpp: 8500, price: 18000, stock: 45, minStock: 10 },
  { id: '2', name: 'Croissant Butter', category: 'Makanan', hpp: 12000, price: 25000, stock: 12, minStock: 5 },
  { id: '3', name: 'Iced Americano', category: 'Minuman', hpp: 4000, price: 15000, stock: 100, minStock: 20 },
  { id: '4', name: 'Nasi Goreng Spesial', category: 'Makanan', hpp: 15000, price: 32000, stock: 20, minStock: 5 },
];

const INITIAL_TRANSACTIONS: Transaction[] = [
  { 
    id: 't1', date: new Date(Date.now() - 86400000).toISOString(), 
    mode: 'Retail', source: 'Store', paymentMethod: 'Cash',
    totalRevenue: 90000, totalCost: 42500, platformFee: 0, codFee: 0, shippingCost: 0, netProfit: 47500,
    items: [{ productId: '1', productName: 'Kopi Susu Gula Aren', quantity: 5, priceAtSale: 18000, hppAtSale: 8500 }],
    amountPaid: 100000, change: 10000
  },
  { 
    id: 't2', date: new Date().toISOString(), 
    mode: 'Online', source: 'Tokopedia', paymentMethod: 'Wallet',
    totalRevenue: 150000, totalCost: 72000, platformFee: 7500, codFee: 0, shippingCost: 0, packingCost: 2000, netProfit: 68500,
    items: [{ productId: '2', productName: 'Croissant Butter', quantity: 6, priceAtSale: 25000, hppAtSale: 12000 }],
    status: 'Sent', expedition: 'JNE', resi: 'JP123456789'
  }
];

const INITIAL_EXPENSES: Expense[] = [
  { id: 'e1', date: new Date().toISOString(), category: 'Marketing', amount: 500000, description: 'Facebook Ads Harian' },
  { id: 'e2', date: new Date().toISOString(), category: 'Operational', amount: 150000, description: 'Beli Gas Elpiji' }
];

const App = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'recap' | 'pos' | 'import' | 'hpp' | 'stock' | 'cashflow' | 'ai'>('dashboard');
  const [businessMode, setBusinessMode] = useState<BusinessMode>('Retail');
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  
  // Global State
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [expenses, setExpenses] = useState<Expense[]>(INITIAL_EXPENSES);

  // Helper to add product from HPP Generator
  const handleAddProduct = (product: Product) => {
    setProducts(prev => [...prev, product]);
    setActiveTab('stock');
  };

  // Helper to process transaction from POS
  const handleCheckout = (transaction: Transaction) => {
    setTransactions(prev => [transaction, ...prev]);
    
    // Deduct stock
    setProducts(prev => prev.map(p => {
      const itemInCart = transaction.items.find(i => i.productId === p.id);
      if (itemInCart) {
        return { ...p, stock: Math.max(0, p.stock - itemInCart.quantity) };
      }
      return p;
    }));
  };

  // Helper for Marketplace Import (ANTI-DUPLICATE FIX)
  const handleImportTransactions = (newTransactions: Transaction[]) => {
    setTransactions(prev => {
      const existingIds = new Set(prev.map(t => t.id));
      const uniqueNewTransactions = newTransactions.filter(t => !existingIds.has(t.id));
      
      if (uniqueNewTransactions.length < newTransactions.length) {
        alert(`${newTransactions.length - uniqueNewTransactions.length} transaksi duplikat ditemukan dan diabaikan agar data tidak double.`);
      }
      
      if (uniqueNewTransactions.length === 0) {
        alert("Semua data sudah ada di sistem. Tidak ada data baru yang ditambahkan.");
        return prev;
      }
      
      return [...uniqueNewTransactions, ...prev];
    });
    setActiveTab('dashboard'); // Redirect to dashboard to see results
  };

  // Helper to add expense
  const handleAddExpense = (expense: Expense) => {
    setExpenses(prev => [expense, ...prev]);
  };

  // Helper to update stock manually
  const handleUpdateStock = (productId: string, newStock: number) => {
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, stock: newStock } : p));
  };

  // --- DELETE HANDLERS (STRICT MODE) ---
  
  const handleDeleteProduct = (id: string) => {
    if (window.confirm('Yakin HAPUS PRODUK ini?')) {
      setProducts(prev => prev.filter(p => p.id !== id));
    }
  };

  const handleDeleteTransaction = (id: string) => {
    if (window.confirm('Yakin HAPUS TRANSAKSI ini?')) {
      setTransactions(prev => prev.filter(t => t.id !== id));
    }
  };

  const handleDeleteExpense = (id: string) => {
    if (window.confirm('Yakin HAPUS PENGELUARAN ini?')) {
      setExpenses(prev => prev.filter(e => e.id !== id));
    }
  };

  // Generate context for AI
  const getBusinessContext = () => {
    const totalRevenue = transactions.reduce((sum, t) => sum + t.totalRevenue, 0);
    const totalNetProfit = transactions.reduce((sum, t) => sum + t.netProfit, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const finalProfit = totalNetProfit - totalExpenses;
    
    const onlineTx = transactions.filter(t => t.mode === 'Online').length;
    const retailTx = transactions.filter(t => t.mode === 'Retail').length;

    return `
      Data Bisnis Terkini (Mode: ${businessMode}):
      - Total Omzet Kotor: Rp ${totalRevenue.toLocaleString()}
      - Total Profit Bersih (Setelah Potongan Marketplace/HPP): Rp ${totalNetProfit.toLocaleString()}
      - Beban Operasional: Rp ${totalExpenses.toLocaleString()}
      - Net Profit Akhir (Bottom Line): Rp ${finalProfit.toLocaleString()}
      
      Split Penjualan:
      - Online: ${onlineTx} transaksi
      - Retail (Fisik): ${retailTx} transaksi
      
      Stok: ${products.length} SKU aktif.
    `;
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'import', label: 'Upload Data Marketplace', icon: Upload }, 
    { id: 'recap', label: 'Laporan Profit', icon: PieChart },
    { id: 'pos', label: 'Kasir & Order', icon: ShoppingCart },
    { id: 'hpp', label: 'Hitung HPP', icon: Calculator },
    { id: 'stock', label: 'Manajemen Stok', icon: Package },
    { id: 'cashflow', label: 'Arus Kas', icon: Wallet },
    { id: 'ai', label: 'Konsultan AI', icon: Bot },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans">
      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          <div className="p-6 flex justify-between items-center">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
              BisnisFlow
            </h1>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-500">
              <X size={24} />
            </button>
          </div>

          {/* Business Mode Selector */}
          <div className="px-4 mb-6">
            <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Mode Bisnis</p>
            <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-lg">
              <button
                onClick={() => setBusinessMode('Retail')}
                className={`flex flex-col items-center justify-center p-2 rounded-md text-xs font-medium transition-all ${
                  businessMode === 'Retail' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Store size={18} className="mb-1" />
                Toko Fisik
              </button>
              <button
                onClick={() => setBusinessMode('Online')}
                className={`flex flex-col items-center justify-center p-2 rounded-md text-xs font-medium transition-all ${
                  businessMode === 'Online' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Globe size={18} className="mb-1" />
                Online
              </button>
            </div>
          </div>
          
          <nav className="flex-1 px-4 space-y-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id as any);
                  if (window.innerWidth < 1024) setSidebarOpen(false);
                }}
                className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-xl transition-colors ${
                  activeTab === item.id 
                    ? `bg-${businessMode === 'Retail' ? 'emerald' : 'blue'}-50 text-${businessMode === 'Retail' ? 'emerald' : 'blue'}-700` 
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <item.icon className={`w-5 h-5 mr-3 ${activeTab === item.id ? (businessMode === 'Retail' ? 'text-emerald-600' : 'text-blue-600') : 'text-gray-400'}`} />
                {item.label}
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-gray-100">
            <div className="flex items-center gap-3 px-4 py-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${businessMode === 'Retail' ? 'bg-emerald-600' : 'bg-blue-600'}`}>
                {businessMode === 'Retail' ? 'R' : 'O'}
              </div>
              <div className="text-sm">
                <p className="font-medium text-gray-900">Admin</p>
                <p className="text-gray-500 text-xs">{businessMode} Mode</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Header Mobile */}
        <div className="lg:hidden p-4 bg-white border-b border-gray-200 flex items-center gap-4">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-600">
            <Menu size={24} />
          </button>
          <span className="font-semibold text-gray-800 capitalize">
            {navItems.find(n => n.id === activeTab)?.label}
          </span>
        </div>

        <div className="flex-1 overflow-auto p-4 lg:p-8">
          {activeTab === 'dashboard' && (
            <Dashboard 
              transactions={transactions} 
              expenses={expenses} 
              products={products}
              businessMode={businessMode}
              onNavigate={(tab) => setActiveTab(tab as any)}
              onDeleteTransaction={handleDeleteTransaction}
            />
          )}
          {activeTab === 'recap' && (
            <FinancialRecap 
              transactions={transactions}
              expenses={expenses}
            />
          )}
          {activeTab === 'pos' && (
            <POS 
              products={products} 
              onCheckout={handleCheckout} 
              businessMode={businessMode}
            />
          )}
          {activeTab === 'import' && (
            <MarketplaceImport onImport={handleImportTransactions} />
          )}
          {activeTab === 'hpp' && (
            <HPPGenerator onSaveProduct={handleAddProduct} />
          )}
          {activeTab === 'stock' && (
            <StockManagement 
              products={products} 
              onUpdateStock={handleUpdateStock} 
              onDeleteProduct={handleDeleteProduct}
            />
          )}
          {activeTab === 'cashflow' && (
            <Cashflow 
              transactions={transactions} 
              expenses={expenses} 
              onAddExpense={handleAddExpense}
              onDeleteTransaction={handleDeleteTransaction}
              onDeleteExpense={handleDeleteExpense}
            />
          )}
          {activeTab === 'ai' && (
            <AIConsultant businessContext={getBusinessContext()} />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
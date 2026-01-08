export type BusinessMode = 'Retail' | 'Online' | 'F&B';

export interface Product {
  id: string;
  name: string;
  category: string;
  hpp: number; // Harga Pokok Penjualan
  price: number; // Harga Jual
  stock: number;
  minStock: number;
}

export interface TransactionItem {
  productId: string;
  productName: string;
  quantity: number;
  priceAtSale: number;
  hppAtSale: number;
}

export interface Transaction {
  id: string;
  date: string; // ISO String
  mode: BusinessMode; // 'Retail' or 'Online'
  source: string; // 'POS', 'Tokopedia', 'Shopee', 'WhatsApp', etc.
  items: TransactionItem[];
  
  // Financials
  totalRevenue: number; // Gross Omzet (Harga Jual * Qty)
  totalCost: number; // Total HPP
  
  // Specific Deductions & Costs
  platformFee: number; // Biaya Admin Marketplace / MDR QRIS
  codFee: number; // Biaya penanganan COD (Khusus Online)
  shippingCost: number; // Ongkir yang ditanggung penjual (Subsidi) - Optional
  packingCost?: number; // Biaya kardus/bubble wrap per order (Khusus Online)
  
  netProfit: number; // (Revenue - Cost - Fees - Packing)
  
  // Payment & Logistics
  paymentMethod: string; // 'Cash', 'Transfer', 'QRIS', 'COD', 'Wallet'
  customerName?: string;
  notes?: string;

  // Retail Specific
  amountPaid?: number; // Uang yang diterima dari pelanggan
  change?: number; // Uang kembalian

  // Online Specific
  status?: 'Pending' | 'Packing' | 'Sent' | 'Completed' | 'Cancelled';
  resi?: string;
  expedition?: string;
}

export interface Expense {
  id: string;
  date: string;
  category: 'Operational' | 'Marketing' | 'Salary' | 'Rent' | 'Other';
  amount: number;
  description: string;
}

export interface HPPComponent {
  id: string;
  name: string;
  cost: number;
}

export interface HPPCalculation {
  id: string;
  productName: string;
  materials: HPPComponent[];
  labor: HPPComponent[];
  overhead: HPPComponent[];
  batchSize: number; // How many units produced with these costs
  totalCost: number;
  hppPerUnit: number;
  suggestedPrice: number;
  marginPercentage: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}
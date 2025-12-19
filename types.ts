export interface Product {
  id: string;
  name: string;
  brand: string; 
  category: string;
  hsn: string;
  price: number;
  cost: number;
  gstPercent: number;
  stock: number;
  unit: string;
  barcode?: string; 
  availableImeis?: string[]; 
}

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  email: string;
  address: string;
  gstin?: string;
}

export interface CartItem extends Product {
  cartId: string;
  quantity: number;
  discount: number; 
  selectedImei?: string; 
}

export interface Invoice {
  id: string; 
  date: string; 
  customerName: string;
  customerMobile: string;
  items: CartItem[];
  subtotal: number;
  totalDiscount: number;
  totalTax: number;
  totalAmount: number;
  paymentMode: 'Cash' | 'UPI' | 'Card' | 'Credit';
  status: 'Paid' | 'Unpaid' | 'Cancelled';
}

export interface ShopSettings {
  shopName: string;
  address: string;
  phone: string;
  gstin: string;
  footerMessage: string;
  // Communication Templates
  whatsappTemplate?: string;
  emailSubject?: string;
  emailBody?: string;
}

export interface User {
  id: string;
  username: string;
  role: 'ADMIN' | 'STAFF';
  name: string;
}

export type ViewState = 'LOGIN' | 'DASHBOARD' | 'BILLING' | 'INVENTORY' | 'CUSTOMERS' | 'REPORTS' | 'SETTINGS';
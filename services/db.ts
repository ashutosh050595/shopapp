import { Product, Customer, Invoice, ShopSettings, User } from '../types';

const STORAGE_KEYS = {
  PRODUCTS: 'shopflow_products',
  CUSTOMERS: 'shopflow_customers',
  INVOICES: 'shopflow_invoices',
  SETTINGS: 'shopflow_settings',
  SESSION: 'shopflow_session'
};

const DEFAULT_SETTINGS: ShopSettings = {
  shopName: 'TechMobile Electronics',
  address: 'Shop 4, Digital Plaza, Main Road',
  phone: '9876543210',
  gstin: '29ABCDE1234F1Z5',
  footerMessage: 'No warranty on physical damage. Goods once sold not refundable.',
  whatsappTemplate: "Dear {customer}, thank you for purchasing from {shopName}. Your Invoice #{id} of Rs. {total} is generated on {date}. Visit again!",
  emailSubject: "Invoice #{id} from {shopName}",
  emailBody: "Dear {customer},\n\nThank you for your purchase.\n\nInvoice No: {id}\nDate: {date}\nTotal Amount: Rs. {total}\n\nPlease visit us again.\n\nRegards,\n{shopName}"
};

const SEED_PRODUCTS: Product[] = [
  { 
    id: '1', name: 'iPhone 15 128GB', brand: 'Apple', category: 'Mobile', hsn: '8517', 
    price: 79900, cost: 72000, gstPercent: 18, stock: 2, unit: 'pcs', barcode: '190199223344',
    availableImeis: ['354666060011223', '354666060011224']
  },
  { 
    id: '2', name: 'Galaxy S24 Ultra', brand: 'Samsung', category: 'Mobile', hsn: '8517', 
    price: 129999, cost: 115000, gstPercent: 18, stock: 1, unit: 'pcs', barcode: '880123456789',
    availableImeis: ['358889090011222']
  },
  { 
    id: '3', name: 'USB-C Cable 1m', brand: 'Samsung', category: 'Accessories', hsn: '8544', 
    price: 999, cost: 400, gstPercent: 18, stock: 50, unit: 'pcs', barcode: '8809988776655' 
  },
  { 
    id: '4', name: 'AirPods Pro 2', brand: 'Apple', category: 'Audio', hsn: '8518', 
    price: 24900, cost: 20000, gstPercent: 18, stock: 5, unit: 'pcs', barcode: '190199556677',
    availableImeis: ['H34K22L99', 'H34K22L00', 'H34K22L01'] 
  },
  { 
    id: '5', name: 'Tempered Glass', brand: 'Generic', category: 'Accessories', hsn: '7007', 
    price: 299, cost: 50, gstPercent: 18, stock: 100, unit: 'pcs', barcode: '8901122330000' 
  },
];

const SEED_CUSTOMERS: Customer[] = [
  { id: '1', name: 'Walk-in Customer', mobile: '', email: '', address: '' },
  { id: '2', name: 'Rahul Sharma', mobile: '9898989898', email: 'rahul@example.com', address: '45, MG Road' },
];

const USERS: User[] = [
  { id: '1', username: 'admin', role: 'ADMIN', name: 'Store Owner' },
  { id: '2', username: 'staff', role: 'STAFF', name: 'Sales Executive' },
];

export const db = {
  // --- Products ---
  getProducts: (): Product[] => {
    const data = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    return data ? JSON.parse(data) : SEED_PRODUCTS;
  },
  
  saveProducts: (products: Product[]) => {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  },

  // --- Customers ---
  getCustomers: (): Customer[] => {
    const data = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
    return data ? JSON.parse(data) : SEED_CUSTOMERS;
  },

  saveCustomers: (customers: Customer[]) => {
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
  },
  
  addCustomer: (customer: Customer) => {
    const customers = db.getCustomers();
    customers.push(customer);
    db.saveCustomers(customers);
  },

  // --- Invoices ---
  getInvoices: (): Invoice[] => {
    const data = localStorage.getItem(STORAGE_KEYS.INVOICES);
    return data ? JSON.parse(data) : [];
  },

  saveInvoice: (invoice: Invoice) => {
    const invoices = db.getInvoices();
    invoices.unshift(invoice);
    localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
    
    // Update stock and remove sold IMEIs
    const products = db.getProducts();
    invoice.items.forEach(item => {
      const productIndex = products.findIndex(p => p.id === item.id);
      if (productIndex !== -1) {
        // Decrease quantity
        products[productIndex].stock -= item.quantity;
        
        // Remove IMEI if applicable
        if (item.selectedImei && products[productIndex].availableImeis) {
          products[productIndex].availableImeis = products[productIndex].availableImeis!.filter(
            imei => imei !== item.selectedImei
          );
        }
      }
    });
    db.saveProducts(products);
  },

  // --- Settings ---
  getSettings: (): ShopSettings => {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return data ? JSON.parse(data) : DEFAULT_SETTINGS;
  },

  saveSettings: (settings: ShopSettings) => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  },

  // --- Auth ---
  login: (username: string): User | null => {
    const user = USERS.find(u => u.username === username);
    if (user) {
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(user));
      return user;
    }
    return null;
  },

  getCurrentUser: (): User | null => {
    const data = localStorage.getItem(STORAGE_KEYS.SESSION);
    return data ? JSON.parse(data) : null;
  },

  logout: () => {
    localStorage.removeItem(STORAGE_KEYS.SESSION);
  },

  // --- Backup / Restore ---
  createBackup: (): string => {
    const backupData = {
      products: db.getProducts(),
      customers: db.getCustomers(),
      invoices: db.getInvoices(),
      settings: db.getSettings(),
      timestamp: new Date().toISOString()
    };
    return JSON.stringify(backupData);
  },

  restoreBackup: (jsonString: string): boolean => {
    try {
      const data = JSON.parse(jsonString);
      if (data.products) localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(data.products));
      if (data.customers) localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(data.customers));
      if (data.invoices) localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(data.invoices));
      if (data.settings) localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(data.settings));
      return true;
    } catch (e) {
      console.error("Restore failed", e);
      return false;
    }
  }
};
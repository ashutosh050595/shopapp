import React, { useState, useEffect, useMemo, useRef } from 'react';
import { db } from '../services/db';
import { Product, Customer, CartItem, Invoice, ShopSettings } from '../types';
import { Search, Plus, Trash2, Printer, Save, User, CreditCard, RefreshCw, AlertCircle, ScanBarcode, Smartphone, X, CheckCircle, Share2, Mail, MessageSquare } from 'lucide-react';

const BillingPOS: React.FC = () => {
  // Data State
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [settings, setSettings] = useState<ShopSettings>(db.getSettings());
  
  // Transaction State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [paymentMode, setPaymentMode] = useState<Invoice['paymentMode']>('Cash');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  
  // UI State
  const [productSearch, setProductSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [completedInvoice, setCompletedInvoice] = useState<Invoice | null>(null);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  
  // New Customer Form State
  const [newCustomer, setNewCustomer] = useState({ name: '', mobile: '', email: '', address: '' });
  
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
    if (searchInputRef.current) searchInputRef.current.focus();
  }, []);

  const loadData = () => {
    setProducts(db.getProducts());
    setSettings(db.getSettings());
    const loadedCustomers = db.getCustomers();
    setCustomers(loadedCustomers);
    // Default to Walk-in if not selected
    if (!selectedCustomer) {
      const walkIn = loadedCustomers.find(c => c.name === 'Walk-in Customer');
      if (walkIn) setSelectedCustomer(walkIn);
    }
  };

  // --- Cart Management ---

  const addToCart = (product: Product, scannedImei?: string) => {
    if (product.stock <= 0) {
      alert('Product is out of stock!');
      return;
    }

    setCart(prev => {
      // If adding a product via IMEI scan, we treat it as a unique entry if possible
      if (scannedImei) {
          const imeiInCart = prev.find(item => item.selectedImei === scannedImei);
          if (imeiInCart) {
              alert('This specific IMEI is already in the cart.');
              return prev;
          }
          return [...prev, { 
              ...product, 
              cartId: crypto.randomUUID(), 
              quantity: 1, 
              discount: 0,
              selectedImei: scannedImei
          }];
      }

      const existing = prev.find(item => item.id === product.id && !item.selectedImei);
      if (existing) {
        if (existing.quantity >= product.stock) {
          alert(`Cannot add more. Only ${product.stock} in stock.`);
          return prev;
        }
        return prev.map(item => 
          item.cartId === existing.cartId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, cartId: crypto.randomUUID(), quantity: 1, discount: 0 }];
    });
    setProductSearch(''); 
  };

  const updateQuantity = (cartId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.cartId === cartId) {
        if (item.selectedImei && delta > 0) return item; 

        const newQty = Math.max(1, item.quantity + delta);
        if (newQty > item.stock) {
          alert(`Insufficient stock! Available: ${item.stock}`);
          return item;
        }
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const updateDiscount = (cartId: string, discount: number) => {
    setCart(prev => prev.map(item => 
      item.cartId === cartId ? { ...item, discount: Math.min(100, Math.max(0, discount)) } : item
    ));
  };

  const removeFromCart = (cartId: string) => {
    setCart(prev => prev.filter(item => item.cartId !== cartId));
  };

  const clearCart = () => {
    if (window.confirm('Are you sure you want to clear the cart?')) {
      setCart([]);
    }
  };

  // --- Calculations ---
  const totals = useMemo(() => {
    let subtotal = 0;
    let totalTax = 0;
    let totalDiscount = 0;

    cart.forEach(item => {
      const basePrice = item.price * item.quantity;
      const discountAmount = (basePrice * item.discount) / 100;
      const taxableValue = basePrice - discountAmount;
      const taxAmount = (taxableValue * item.gstPercent) / 100;

      subtotal += taxableValue;
      totalDiscount += discountAmount;
      totalTax += taxAmount;
    });

    const netTotal = subtotal + totalTax;
    const roundedTotal = Math.round(netTotal);
    const roundOff = roundedTotal - netTotal;

    return { subtotal, totalTax, totalDiscount, netTotal, roundOff, grandTotal: roundedTotal };
  }, [cart]);

  // --- Checkout ---
  const handleCheckout = () => {
    if (cart.length === 0) return;
    if (!selectedCustomer) {
      alert('Please select a customer');
      return;
    }

    const newInvoice: Invoice = {
      id: `INV-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString(),
      customerName: selectedCustomer.name,
      customerMobile: selectedCustomer.mobile,
      items: cart,
      subtotal: totals.subtotal,
      totalDiscount: totals.totalDiscount,
      totalTax: totals.totalTax,
      totalAmount: totals.grandTotal,
      paymentMode,
      status: 'Paid'
    };

    db.saveInvoice(newInvoice);
    setCompletedInvoice(newInvoice); // Triggers success modal
    
    // Reset Cart
    setCart([]);
    loadData(); 
  };
  
  const handleNewBill = () => {
      setCompletedInvoice(null);
      if (searchInputRef.current) searchInputRef.current.focus();
  };

  // --- Sharing & Printing ---
  const replacePlaceholders = (template: string, invoice: Invoice) => {
      return template
        .replace(/{customer}/g, invoice.customerName)
        .replace(/{id}/g, invoice.id)
        .replace(/{total}/g, invoice.totalAmount.toString())
        .replace(/{date}/g, invoice.date.split('T')[0])
        .replace(/{shopName}/g, settings.shopName);
  };

  const handleShareWhatsapp = () => {
      if (!completedInvoice) return;
      const template = settings.whatsappTemplate || "Hello {customer}, your invoice {id} is generated. Total: {total}";
      const message = replacePlaceholders(template, completedInvoice);
      const url = `https://wa.me/${completedInvoice.customerMobile}?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank');
  };

  const handleShareEmail = () => {
      if (!completedInvoice) return;
      // Find customer email from list if available
      const cust = customers.find(c => c.mobile === completedInvoice.customerMobile);
      const email = cust?.email || '';
      
      const subject = replacePlaceholders(settings.emailSubject || "Invoice {id}", completedInvoice);
      const body = replacePlaceholders(settings.emailBody || "Here is your invoice {id}", completedInvoice);
      
      const url = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.open(url, '_blank');
  };

  const handlePrint = () => {
      window.print();
  };

  // --- Search & Scan Filtering ---
  const filteredProducts = useMemo(() => {
    if (!productSearch) return [];
    const lower = productSearch.toLowerCase();
    return products.filter(p => 
      p.name.toLowerCase().includes(lower) || 
      p.id.toLowerCase().includes(lower) ||
      p.barcode?.toLowerCase().includes(lower) ||
      p.brand?.toLowerCase().includes(lower) ||
      (p.availableImeis && p.availableImeis.some(imei => imei.includes(lower)))
    ).slice(0, 10);
  }, [productSearch, products]);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      
      // 1. Check IMEI exact match
      const imeiMatch = products.find(p => p.availableImeis?.includes(productSearch));
      if (imeiMatch) {
          addToCart(imeiMatch, productSearch);
          return;
      }

      // 2. Barcode/ID Exact match
      const exactMatch = products.find(p => p.barcode === productSearch || p.id === productSearch);
      if (exactMatch) {
        addToCart(exactMatch);
        return;
      }
      
      // 3. Single Result
      if (filteredProducts.length === 1) {
        const p = filteredProducts[0];
        const typedImei = p.availableImeis?.find(i => i === productSearch);
        addToCart(p, typedImei);
      }
    }
  };

  const handleAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.name || !newCustomer.mobile) {
        alert("Name and Mobile are required");
        return;
    }
    const c: Customer = {
        id: crypto.randomUUID(),
        ...newCustomer
    };
    db.addCustomer(c);
    setCustomers(db.getCustomers()); 
    setSelectedCustomer(c);
    setShowAddCustomerModal(false);
    setNewCustomer({ name: '', mobile: '', email: '', address: '' });
  };

  return (
    <div className="flex flex-col h-full p-4 gap-4 animate-fade-in text-sm md:text-base relative">
      
      {/* Styles for Printing */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .invoice-modal, .invoice-modal * { visibility: visible; }
          .invoice-modal { position: fixed; left: 0; top: 0; width: 100%; height: 100%; z-index: 9999; background: white; overflow: visible; }
          .no-print { display: none !important; }
          .print-full-width { width: 100% !important; max-width: none !important; }
        }
      `}</style>

      {/* --- Success / Invoice Modal --- */}
      {completedInvoice && (
         <div className="absolute inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
           <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl flex flex-col max-h-[90vh] invoice-modal">
              
              {/* Header - No Print */}
              <div className="flex justify-between items-center p-4 border-b bg-green-50 no-print rounded-t-xl">
                 <div className="flex items-center gap-2 text-green-700 font-bold text-lg">
                    <CheckCircle size={24} /> Sale Completed Successfully!
                 </div>
                 <button onClick={handleNewBill} className="text-slate-500 hover:text-slate-800">
                    <X size={24} />
                 </button>
              </div>

              {/* Invoice Content - Printable */}
              <div className="p-8 overflow-y-auto flex-1 print-full-width">
                 <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold uppercase tracking-widest text-slate-800">{settings.shopName}</h1>
                    <p className="text-slate-500 whitespace-pre-line text-sm">{settings.address}</p>
                    <p className="text-slate-500 text-sm">Phone: {settings.phone} | GSTIN: {settings.gstin}</p>
                 </div>

                 <div className="flex justify-between mb-6 text-sm border-b pb-4">
                    <div>
                       <p className="text-slate-500">Invoice To:</p>
                       <p className="font-bold text-slate-800 text-lg">{completedInvoice.customerName}</p>
                       <p className="text-slate-600">Mobile: {completedInvoice.customerMobile}</p>
                    </div>
                    <div className="text-right">
                       <p className="font-bold text-slate-800 text-lg">INVOICE #{completedInvoice.id}</p>
                       <p className="text-slate-600">Date: {new Date(completedInvoice.date).toLocaleDateString()}</p>
                       <p className="text-slate-600">Mode: {completedInvoice.paymentMode}</p>
                    </div>
                 </div>

                 <table className="w-full text-left mb-6 text-sm">
                    <thead>
                      <tr className="border-b-2 border-slate-800">
                        <th className="py-2">Item</th>
                        <th className="py-2 text-center">Qty</th>
                        <th className="py-2 text-right">Price</th>
                        <th className="py-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {completedInvoice.items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="py-2">
                             <div className="font-medium">{item.name}</div>
                             {item.selectedImei && <div className="text-xs text-slate-500">IMEI/SN: {item.selectedImei}</div>}
                          </td>
                          <td className="py-2 text-center">{item.quantity}</td>
                          <td className="py-2 text-right">{item.price}</td>
                          <td className="py-2 text-right">{(item.price * item.quantity).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                 </table>

                 <div className="flex justify-end mb-6">
                    <div className="w-48 space-y-2 text-sm">
                       <div className="flex justify-between">
                          <span className="text-slate-600">Subtotal:</span>
                          <span className="font-medium">{completedInvoice.subtotal.toFixed(2)}</span>
                       </div>
                       <div className="flex justify-between">
                          <span className="text-slate-600">Tax (GST):</span>
                          <span className="font-medium">{completedInvoice.totalTax.toFixed(2)}</span>
                       </div>
                       <div className="flex justify-between text-green-600">
                          <span className="">Discount:</span>
                          <span className="font-medium">-{completedInvoice.totalDiscount.toFixed(2)}</span>
                       </div>
                       <div className="flex justify-between text-lg font-bold border-t pt-2 border-slate-300">
                          <span>Total:</span>
                          <span>₹{completedInvoice.totalAmount.toLocaleString()}</span>
                       </div>
                    </div>
                 </div>

                 <div className="text-center text-xs text-slate-400 mt-8 border-t pt-4">
                    <p>{settings.footerMessage}</p>
                    <p className="mt-1">Generated by ShopFlow</p>
                 </div>
              </div>

              {/* Actions Footer - No Print */}
              <div className="p-4 bg-slate-50 border-t flex justify-between items-center no-print rounded-b-xl">
                 <button onClick={handleNewBill} className="text-slate-500 font-medium hover:text-slate-800">
                    Close / New Bill
                 </button>
                 <div className="flex gap-2">
                    <button onClick={handleShareWhatsapp} className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600">
                       <MessageSquare size={18} /> WhatsApp
                    </button>
                    <button onClick={handleShareEmail} className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600">
                       <Mail size={18} /> Email
                    </button>
                    <button onClick={handlePrint} className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-900">
                       <Printer size={18} /> Print Invoice
                    </button>
                 </div>
              </div>

           </div>
         </div>
      )}

      {/* --- Add Customer Modal --- */}
      {showAddCustomerModal && (
          <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center p-4 rounded-xl">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                  <div className="bg-blue-600 p-4 flex justify-between items-center text-white">
                      <h3 className="font-bold text-lg">Add New Customer</h3>
                      <button onClick={() => setShowAddCustomerModal(false)}><X size={20}/></button>
                  </div>
                  <form onSubmit={handleAddCustomer} className="p-6 space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-slate-700">Name *</label>
                          <input type="text" required className="w-full border p-2 rounded" 
                                 value={newCustomer.name} onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-slate-700">Mobile *</label>
                          <input type="tel" required className="w-full border p-2 rounded" 
                                 value={newCustomer.mobile} onChange={e => setNewCustomer({...newCustomer, mobile: e.target.value})} />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-slate-700">Email</label>
                          <input type="email" className="w-full border p-2 rounded" 
                                 value={newCustomer.email} onChange={e => setNewCustomer({...newCustomer, email: e.target.value})} />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-slate-700">Address</label>
                          <textarea className="w-full border p-2 rounded" 
                                 value={newCustomer.address} onChange={e => setNewCustomer({...newCustomer, address: e.target.value})} />
                      </div>
                      <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700">
                          Save Customer
                      </button>
                  </form>
              </div>
          </div>
      )}

      {/* Top Header Row */}
      <div className="flex justify-between items-center bg-white p-3 rounded-lg shadow-sm border border-slate-200">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Printer size={24} className="text-blue-600" /> 
            Billing POS
          </h2>
          <div className="h-6 w-px bg-slate-200"></div>
          <div className="text-slate-500 font-medium">
             Invoice Date: <span className="text-slate-800">{invoiceDate}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 gap-4 overflow-hidden">
        
        {/* Left Side: Product Search & Cart */}
        <div className="flex-1 flex flex-col gap-4">
          
          {/* Product Search / Scan Input */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 relative z-10">
            <div className="relative">
              <ScanBarcode className="absolute left-3 top-3 text-blue-500" size={20} />
              <input 
                ref={searchInputRef}
                type="text" 
                placeholder="Scan IMEI / Barcode or Search Product..." 
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-medium"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                autoFocus
              />
            </div>
            
            {/* Search Results Dropdown */}
            {filteredProducts.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden z-20 max-h-60 overflow-y-auto">
                {filteredProducts.map(product => (
                  <button 
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className={`w-full text-left px-4 py-3 border-b border-slate-100 flex justify-between items-center hover:bg-blue-50 transition-colors ${
                      product.stock <= 0 ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    disabled={product.stock <= 0}
                  >
                    <div>
                      <div className="font-semibold text-slate-800 flex items-center gap-2">
                        {product.name}
                        {product.brand && <span className="text-xs bg-slate-100 text-slate-600 px-1 rounded border">{product.brand}</span>}
                      </div>
                      <div className="text-xs text-slate-500">
                          Stock: {product.stock} | 
                          IMEIs: {product.availableImeis?.length || 0}
                      </div>
                    </div>
                    <div className="font-bold text-slate-700">₹{product.price}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Cart Table */}
          <div className="bg-white flex-1 rounded-lg shadow-sm border border-slate-200 overflow-hidden flex flex-col">
            <div className="overflow-y-auto flex-1 p-2">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase sticky top-0">
                  <tr>
                    <th className="p-3">Product</th>
                    <th className="p-3 text-center">Price</th>
                    <th className="p-3 text-center">Qty</th>
                    <th className="p-3 text-center">Disc %</th>
                    <th className="p-3 text-right">Total</th>
                    <th className="p-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cart.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-slate-400">
                        <div className="flex flex-col items-center">
                          <Smartphone size={48} className="mb-2 opacity-30" />
                          <p>Cart is empty.</p>
                          <p className="text-xs mt-1">Scan IMEI/Barcode to begin.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    cart.map((item) => (
                      <tr key={item.cartId} className="hover:bg-slate-50 group">
                        <td className="p-3">
                          <div className="font-medium text-slate-800">{item.name}</div>
                          <div className="flex gap-2 mt-1">
                              {item.brand && <span className="text-xs text-slate-500 bg-slate-100 px-1 rounded">{item.brand}</span>}
                              {item.selectedImei && <span className="text-xs text-blue-600 bg-blue-50 px-1 rounded font-mono">SN: {item.selectedImei}</span>}
                          </div>
                        </td>
                        <td className="p-3 text-center">₹{item.price}</td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button 
                              onClick={() => updateQuantity(item.cartId, -1)}
                              className="w-6 h-6 bg-slate-200 rounded hover:bg-slate-300 text-slate-600 flex items-center justify-center"
                              disabled={!!item.selectedImei} // Disable qty change for unique items
                            >-</button>
                            <span className="w-8 text-center font-medium">{item.quantity}</span>
                            <button 
                              onClick={() => updateQuantity(item.cartId, 1)}
                              className="w-6 h-6 bg-slate-200 rounded hover:bg-slate-300 text-slate-600 flex items-center justify-center"
                              disabled={!!item.selectedImei}
                            >+</button>
                          </div>
                        </td>
                        <td className="p-3 text-center">
                           <input 
                             type="number" 
                             min="0" max="100"
                             className="w-12 text-center border border-slate-300 rounded p-1 text-sm focus:ring-blue-500"
                             value={item.discount}
                             onChange={(e) => updateDiscount(item.cartId, parseFloat(e.target.value) || 0)}
                           />
                        </td>
                        <td className="p-3 text-right font-bold text-slate-800">
                          ₹{Math.round((item.price * item.quantity * (100 - item.discount) / 100)).toLocaleString()}
                        </td>
                        <td className="p-3 text-center">
                          <button 
                            onClick={() => removeFromCart(item.cartId)}
                            className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Cart Actions */}
            {cart.length > 0 && (
              <div className="p-3 border-t border-slate-100 bg-slate-50 flex justify-end">
                <button 
                  onClick={clearCart}
                  className="text-red-500 text-sm hover:underline flex items-center gap-1"
                >
                  <Trash2 size={16} /> Clear Cart
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Customer & Checkout */}
        <div className="w-96 flex flex-col gap-4">
          
          {/* Customer Selection */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <User size={16} /> Customer
                </h3>
                <button 
                    onClick={() => setShowAddCustomerModal(true)}
                    className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-medium hover:bg-blue-200 flex items-center gap-1"
                >
                    <Plus size={12} /> New
                </button>
            </div>
            
            <div className="relative mb-3">
              <input 
                type="text"
                placeholder="Search Customer..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={customerSearch}
                onChange={(e) => {
                  setCustomerSearch(e.target.value);
                  setShowCustomerDropdown(true);
                }}
                onFocus={() => setShowCustomerDropdown(true)}
              />
              {showCustomerDropdown && customerSearch && (
                 <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-20 max-h-40 overflow-y-auto">
                    {useMemo(() => customers.filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase()) || c.mobile.includes(customerSearch)), [customers, customerSearch]).map(c => (
                      <div 
                        key={c.id} 
                        className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm"
                        onClick={() => {
                          setSelectedCustomer(c);
                          setCustomerSearch('');
                          setShowCustomerDropdown(false);
                        }}
                      >
                        <div className="font-medium">{c.name}</div>
                        <div className="text-xs text-slate-500">{c.mobile}</div>
                      </div>
                    ))}
                 </div>
              )}
            </div>

            {selectedCustomer ? (
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 relative group">
                <div className="font-bold text-slate-800">{selectedCustomer.name}</div>
                <div className="text-sm text-slate-600">{selectedCustomer.mobile || 'No Mobile'}</div>
                {selectedCustomer.address && <div className="text-xs text-slate-500 mt-1">{selectedCustomer.address}</div>}
                
                <button 
                  className="absolute top-2 right-2 text-blue-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => setSelectedCustomer(null)}
                >
                  Change
                </button>
              </div>
            ) : (
              <div className="text-sm text-slate-400 italic text-center p-2">
                No customer selected
              </div>
            )}
          </div>

          {/* Payment Mode */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
             <h3 className="text-sm font-semibold text-slate-500 mb-3 uppercase tracking-wider flex items-center gap-2">
              <CreditCard size={16} /> Payment Mode
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {['Cash', 'UPI', 'Card', 'Credit'].map(mode => (
                <button
                  key={mode}
                  onClick={() => setPaymentMode(mode as any)}
                  className={`py-2 px-4 rounded-lg text-sm font-medium border transition-colors ${
                    paymentMode === mode 
                      ? 'bg-blue-600 text-white border-blue-600' 
                      : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Bill Summary */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex-1 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-500 mb-4 uppercase tracking-wider">Bill Summary</h3>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span>₹{totals.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>- ₹{totals.totalDiscount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Tax (GST)</span>
                  <span>+ ₹{totals.totalTax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-400 text-xs">
                  <span>Round Off</span>
                  <span>{totals.roundOff > 0 ? '+' : ''}{totals.roundOff.toFixed(2)}</span>
                </div>
                
                <div className="h-px bg-slate-200 my-2"></div>
                
                <div className="flex justify-between items-center text-xl font-bold text-slate-800">
                  <span>Grand Total</span>
                  <span>₹{totals.grandTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex flex-col gap-3">
              <button 
                onClick={handleCheckout}
                disabled={cart.length === 0}
                className={`w-full py-4 rounded-lg text-white font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-all ${
                  cart.length === 0 
                    ? 'bg-slate-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700 hover:shadow-xl active:scale-95'
                }`}
              >
                <Save size={20} />
                Save & Print Bill
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default BillingPOS;
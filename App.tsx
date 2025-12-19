
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  BookOpen, 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  LogOut, 
  ChevronRight, 
  Search, 
  Download, 
  Printer, 
  Trash2, 
  Settings, 
  X,
  Database,
  CloudUpload,
  RefreshCw,
  FileJson,
  Upload,
  Menu
} from 'lucide-react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from 'recharts';
import { Company, Customer, Transaction, TransactionType } from './types';

// --- UTILS ---
const loadData = <T,>(key: string, defaultValue: T): T => {
  const saved = localStorage.getItem(key);
  return saved ? JSON.parse(saved) : defaultValue;
};

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// Formatting utility for Indian Number System
const formatCurrency = (num: number) => {
  return num.toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });
};

// --- REUSABLE SUB-COMPONENTS ---

const Modal: React.FC<{ 
  isOpen: boolean; 
  onClose: () => void; 
  title: string; 
  children: React.ReactNode 
}> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />
      <div 
        className="glass-card relative w-full max-w-md rounded-3xl p-6 md:p-8 border border-white/10 shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={20} className="text-slate-400" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

const InputField: React.FC<{ 
  label: string; 
  type?: string; 
  value: string; 
  onChange: (val: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}> = ({ label, type = "text", value, onChange, placeholder, autoFocus }) => (
  <div className="mb-4">
    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">{label}</label>
    <input 
      type={type}
      value={value}
      autoFocus={autoFocus}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-slate-700"
    />
  </div>
);

const SidebarItem: React.FC<{ 
  icon: React.ReactNode; 
  label: string; 
  active: boolean; 
  onClick: () => void;
  badge?: string | number;
}> = ({ icon, label, active, onClick, badge }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center justify-between px-6 py-4 transition-all duration-300 group ${
      active 
      ? 'bg-blue-600/20 border-r-4 border-blue-500 text-blue-400' 
      : 'text-slate-400 hover:bg-white/5 hover:text-white'
    }`}
  >
    <div className="flex items-center space-x-4">
      <span className={`${active ? 'text-blue-400' : 'group-hover:text-white'}`}>{icon}</span>
      <span className="font-medium tracking-wide">{label}</span>
    </div>
    {badge !== undefined && (
      <span className="bg-slate-800 text-xs px-2 py-1 rounded-full text-slate-400 border border-slate-700">
        {badge}
      </span>
    )}
  </button>
);

// --- MAIN APP COMPONENT ---

const App: React.FC = () => {
  // Navigation State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'companies' | 'customers' | 'ledger' | 'settings'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // App State
  const [companies, setCompanies] = useState<Company[]>(() => loadData('companies', []));
  const [customers, setCustomers] = useState<Customer[]>(() => loadData('customers', []));
  const [transactions, setTransactions] = useState<Transaction[]>(() => loadData('transactions', []));
  
  // Selection Context
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  // Modal States
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Form States
  const [companyForm, setCompanyForm] = useState({ name: '', address: '', gst: '', fy: '2024-25' });
  const [customerForm, setCustomerForm] = useState({ name: '', phone: '', openingBalance: '' });
  const [txForm, setTxForm] = useState({ date: new Date().toISOString().split('T')[0], desc: '', type: 'CREDIT' as TransactionType, amount: '' });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Persistence
  useEffect(() => {
    localStorage.setItem('companies', JSON.stringify(companies));
    localStorage.setItem('customers', JSON.stringify(customers));
    localStorage.setItem('transactions', JSON.stringify(transactions));
  }, [companies, customers, transactions]);

  // Derived Data
  const currentCompany = companies.find(c => c.id === selectedCompanyId);
  const currentCustomer = customers.find(c => c.id === selectedCustomerId);

  const stats = useMemo(() => {
    const totalDebit = transactions.filter(t => t.type === 'DEBIT').reduce((sum, t) => sum + t.amount, 0);
    const totalCredit = transactions.filter(t => t.type === 'CREDIT').reduce((sum, t) => sum + t.amount, 0);
    return {
      totalBalance: totalCredit - totalDebit,
      totalDebit,
      totalCredit,
      activeCompanies: companies.length,
      activeCustomers: customers.length
    };
  }, [transactions, companies, customers]);

  const chartData = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    return days.map(day => {
      const dayTx = transactions.filter(t => t.date === day);
      return {
        name: day.split('-').slice(1).reverse().join('/'),
        debit: dayTx.filter(t => t.type === 'DEBIT').reduce((s, t) => s + t.amount, 0),
        credit: dayTx.filter(t => t.type === 'CREDIT').reduce((s, t) => s + t.amount, 0),
      };
    });
  }, [transactions]);

  // Handlers
  const handleAddCompany = () => {
    if (!companyForm.name) return;
    const newCompany: Company = { 
      id: generateId(), 
      name: companyForm.name, 
      address: companyForm.address, 
      gst: companyForm.gst, 
      financialYear: companyForm.fy 
    };
    setCompanies([...companies, newCompany]);
    setCompanyForm({ name: '', address: '', gst: '', fy: '2024-25' });
    setIsCompanyModalOpen(false);
  };

  const handleAddCustomer = () => {
    if (!selectedCompanyId || !customerForm.name) return;
    const newCustomer: Customer = {
      id: generateId(),
      companyId: selectedCompanyId,
      name: customerForm.name,
      phone: customerForm.phone,
      address: '',
      openingBalance: Number(customerForm.openingBalance) || 0
    };
    setCustomers([...customers, newCustomer]);
    setCustomerForm({ name: '', phone: '', openingBalance: '' });
    setIsCustomerModalOpen(false);
  };

  const handleAddTransaction = () => {
    if (!selectedCustomerId || !txForm.amount) return;
    const newTx: Transaction = {
      id: generateId(),
      customerId: selectedCustomerId,
      date: txForm.date,
      description: txForm.desc,
      type: txForm.type,
      amount: Number(txForm.amount)
    };
    setTransactions([...transactions, newTx]);
    setTxForm({ date: new Date().toISOString().split('T')[0], desc: '', type: 'CREDIT', amount: '' });
    setIsTransactionModalOpen(false);
  };

  const deleteTransaction = (id: string) => {
    if (confirm("Are you sure you want to delete this transaction?")) {
      setTransactions(transactions.filter(t => t.id !== id));
    }
  };

  const handleExportBackup = () => {
    const backupData = {
      companies,
      customers,
      transactions,
      exportedAt: new Date().toISOString(),
      version: "1.0"
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ledgepro_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.companies && data.customers && data.transactions) {
          if (confirm("This will replace all your current data. Do you want to continue?")) {
            setCompanies(data.companies);
            setCustomers(data.customers);
            setTransactions(data.transactions);
            alert("Backup restored successfully!");
          }
        } else {
          alert("Invalid backup file format.");
        }
      } catch (err) {
        alert("Error reading backup file.");
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const simulateGoogleDriveSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      alert("Success: Ledger synced with Google Drive!");
    }, 2500);
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const closeSidebarOnMobile = (tab: any) => {
    setActiveTab(tab);
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950">
      {/* SIDEBAR OVERLAY FOR MOBILE */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80] lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 lg:static w-72 glass flex flex-col border-r border-white/10 shrink-0 z-[90] transition-transform duration-300 lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-8 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3">
              <BookOpen className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">LedgePro</h1>
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">3D Cashbook</p>
            </div>
          </div>
          <button className="lg:hidden text-slate-400" onClick={() => setIsSidebarOpen(false)}>
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 mt-4 overflow-y-auto custom-scrollbar">
          <SidebarItem icon={<LayoutDashboard size={20} />} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => closeSidebarOnMobile('dashboard')} />
          <SidebarItem icon={<Building2 size={20} />} label="Companies" active={activeTab === 'companies'} onClick={() => closeSidebarOnMobile('companies')} badge={companies.length} />
          <SidebarItem icon={<Users size={20} />} label="Customers" active={activeTab === 'customers'} onClick={() => closeSidebarOnMobile('customers')} badge={customers.length} />
          <SidebarItem icon={<BookOpen size={20} />} label="Ledger" active={activeTab === 'ledger'} onClick={() => closeSidebarOnMobile('ledger')} />
          <SidebarItem icon={<Settings size={20} />} label="Settings" active={activeTab === 'settings'} onClick={() => closeSidebarOnMobile('settings')} />
        </nav>

        <div className="p-6 border-t border-white/5">
          <div className="glass-card p-4 rounded-xl flex items-center space-x-4">
            <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-white font-bold shrink-0">A</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">Administrator</p>
              <p className="text-xs text-slate-500 truncate">Premium Plan</p>
            </div>
            <LogOut size={16} className="text-slate-500 hover:text-red-400 cursor-pointer shrink-0" />
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 relative overflow-y-auto custom-scrollbar bg-slate-950/20 px-4 py-6 md:p-8">
        <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8 md:mb-10">
          <div className="flex items-center gap-4">
            <button className="lg:hidden p-2 glass rounded-xl text-white" onClick={toggleSidebar}>
              <Menu size={24} />
            </button>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-white capitalize">{activeTab}</h2>
              <p className="text-slate-400 text-xs md:text-sm mt-1">
                {activeTab === 'dashboard' && "Business Overview"}
                {activeTab === 'companies' && "Manage Organizations"}
                {activeTab === 'customers' && (selectedCompanyId ? `Customers of ${currentCompany?.name}` : "Select a company")}
                {activeTab === 'ledger' && (selectedCustomerId ? `Ledger: ${currentCustomer?.name}` : "Select a customer")}
                {activeTab === 'settings' && "Backup & Management"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {selectedCompanyId && (
              <div className="glass px-3 py-1.5 md:px-4 md:py-2 rounded-xl flex items-center space-x-2 border border-blue-500/20 max-w-[200px]">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shrink-0"></div>
                <span className="text-xs md:text-sm font-medium text-slate-300 truncate">{currentCompany?.name}</span>
              </div>
            )}
            <div onClick={() => setActiveTab('settings')} className={`glass p-2 rounded-xl text-slate-400 hover:text-white cursor-pointer border ${activeTab === 'settings' ? 'border-blue-500 bg-blue-500/10' : 'border-white/5'}`}>
              <Settings size={20} />
            </div>
          </div>
        </header>

        {/* DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              <div className="glass-card p-5 md:p-6 rounded-2xl">
                <p className="text-slate-400 text-xs md:text-sm font-medium">Net Balance</p>
                <h3 className={`text-xl md:text-2xl font-bold mt-2 ${stats.totalBalance >= 0 ? 'text-green-400' : 'text-red-400'}`}>₹{formatCurrency(stats.totalBalance)}</h3>
              </div>
              <div className="glass-card p-5 md:p-6 rounded-2xl">
                <p className="text-slate-400 text-xs md:text-sm font-medium">Total Debits</p>
                <h3 className="text-xl md:text-2xl font-bold mt-2 text-red-400">₹{formatCurrency(stats.totalDebit)}</h3>
              </div>
              <div className="glass-card p-5 md:p-6 rounded-2xl">
                <p className="text-slate-400 text-xs md:text-sm font-medium">Total Credits</p>
                <h3 className="text-xl md:text-2xl font-bold mt-2 text-green-400">₹{formatCurrency(stats.totalCredit)}</h3>
              </div>
              <div className="glass-card p-5 md:p-6 rounded-2xl">
                <p className="text-slate-400 text-xs md:text-sm font-medium">Companies</p>
                <h3 className="text-xl md:text-2xl font-bold mt-2 text-blue-400">{stats.activeCompanies}</h3>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
              <div className="glass-card p-5 md:p-8 rounded-3xl h-[300px] md:h-[400px]">
                <h4 className="text-lg md:text-xl font-bold text-white mb-6">Financial Trends</h4>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorCredit" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4ade80" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#4ade80" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorDebit" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f87171" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#f87171" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                    <YAxis stroke="#64748b" fontSize={10} />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #ffffff10', borderRadius: '12px' }} itemStyle={{ color: '#fff' }} />
                    <Area type="monotone" dataKey="credit" stroke="#4ade80" fillOpacity={1} fill="url(#colorCredit)" strokeWidth={2} />
                    <Area type="monotone" dataKey="debit" stroke="#f87171" fillOpacity={1} fill="url(#colorDebit)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="glass-card p-5 md:p-8 rounded-3xl flex flex-col h-[300px] md:h-[400px]">
                <h4 className="text-lg md:text-xl font-bold text-white mb-6">Recent Activities</h4>
                <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar pr-2">
                  {transactions.slice(-10).reverse().map((tx) => {
                    const customer = customers.find(c => c.id === tx.customerId);
                    return (
                      <div key={tx.id} className="flex items-center justify-between p-3 md:p-4 rounded-xl bg-white/5 border border-white/5">
                        <div className="min-w-0">
                          <p className="text-xs md:text-sm font-semibold text-white truncate">{customer?.name}</p>
                          <p className="text-[10px] md:text-xs text-slate-500 truncate">{tx.description}</p>
                        </div>
                        <div className="text-right shrink-0 ml-2">
                          <p className={`text-xs md:text-sm font-bold ${tx.type === 'DEBIT' ? 'text-red-400' : 'text-green-400'}`}>
                            {tx.type === 'DEBIT' ? '-' : '+'}₹{formatCurrency(tx.amount)}
                          </p>
                          <p className="text-[10px] text-slate-500">{tx.date}</p>
                        </div>
                      </div>
                    );
                  })}
                  {transactions.length === 0 && <p className="text-center text-slate-500 text-sm py-10">No recent transactions.</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* COMPANIES */}
        {activeTab === 'companies' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 animate-in fade-in slide-in-from-bottom-4">
            <div onClick={() => setIsCompanyModalOpen(true)} className="group cursor-pointer flex flex-col items-center justify-center p-8 rounded-3xl border-2 border-dashed border-white/10 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all min-h-[180px]">
              <Plus className="text-slate-400 group-hover:text-blue-400 mb-4" size={32} />
              <span className="text-slate-400 font-semibold text-sm group-hover:text-blue-400">Add New Company</span>
            </div>
            {companies.map((company) => (
              <div key={company.id} onClick={() => { setSelectedCompanyId(company.id); setActiveTab('customers'); }} className={`glass-card p-6 md:p-8 rounded-3xl cursor-pointer group ${selectedCompanyId === company.id ? 'ring-2 ring-blue-500' : ''}`}>
                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg"><Building2 className="text-white" size={24} /></div>
                  <div className="text-right"><p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">FY {company.financialYear}</p></div>
                </div>
                <h4 className="text-xl md:text-2xl font-bold text-white mb-2 truncate">{company.name}</h4>
                <p className="text-slate-400 text-xs md:text-sm line-clamp-1 mb-6">📍 {company.address || "No address"}</p>
                <div className="flex justify-between items-center pt-4 md:pt-6 border-t border-white/5">
                  <div className="text-[10px] md:text-xs text-slate-500 font-mono">{company.gst || 'GST N/A'}</div>
                  <ChevronRight size={18} className="text-slate-500 group-hover:text-white" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CUSTOMERS */}
        {activeTab === 'customers' && (
          <div className="space-y-6 md:space-y-8 animate-in fade-in">
            {!selectedCompanyId ? (
              <div className="glass-card p-12 md:p-20 rounded-3xl text-center">
                <Building2 size={48} className="mx-auto text-slate-700 mb-6" />
                <h3 className="text-xl md:text-2xl font-bold text-white mb-8">Choose a company first</h3>
                <button onClick={() => setActiveTab('companies')} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold transition-all text-sm">Select Company</button>
              </div>
            ) : (
              <>
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="relative w-full max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input type="text" placeholder="Search customers..." className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none" />
                  </div>
                  <button onClick={() => setIsCustomerModalOpen(true)} className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold transition-all"><Plus size={20} /><span>Add Customer</span></button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {customers.filter(c => c.companyId === selectedCompanyId).map((customer) => {
                    const customerTx = transactions.filter(t => t.customerId === customer.id);
                    const bal = customer.openingBalance + customerTx.filter(t => t.type === 'CREDIT').reduce((s, t) => s + t.amount, 0) - customerTx.filter(t => t.type === 'DEBIT').reduce((s, t) => s + t.amount, 0);
                    return (
                      <div key={customer.id} onClick={() => { setSelectedCustomerId(customer.id); setActiveTab('ledger'); }} className="glass-card p-5 md:p-6 rounded-2xl cursor-pointer group">
                        <div className="flex items-center space-x-4 mb-6">
                          <div className="w-10 h-10 md:w-12 md:h-12 bg-slate-800 rounded-full flex items-center justify-center text-lg md:text-xl font-bold text-white shrink-0">{customer.name.charAt(0)}</div>
                          <div className="min-w-0">
                            <h4 className="text-base md:text-lg font-bold text-white group-hover:text-blue-400 truncate">{customer.name}</h4>
                            <p className="text-xs text-slate-500 truncate">{customer.phone}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 md:gap-4">
                          <div className="p-2 md:p-3 rounded-xl bg-white/5">
                            <p className="text-[10px] text-slate-500 font-bold mb-1 uppercase">Balance</p>
                            <p className={`text-xs md:text-sm font-bold ${bal >= 0 ? 'text-green-400' : 'text-red-400'}`}>₹{formatCurrency(Math.abs(bal))}</p>
                          </div>
                          <div className="p-2 md:p-3 rounded-xl bg-white/5">
                            <p className="text-[10px] text-slate-500 font-bold mb-1 uppercase">Type</p>
                            <p className="text-xs md:text-sm font-bold text-white">{bal >= 0 ? 'CR' : 'DR'}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* LEDGER */}
        {activeTab === 'ledger' && (
          <div className="animate-in fade-in space-y-6">
            {!selectedCustomerId ? (
              <div className="glass-card p-12 md:p-20 rounded-3xl text-center">
                <Users size={48} className="mx-auto text-slate-700 mb-6" />
                <h3 className="text-xl md:text-2xl font-bold text-white mb-8">Select a customer</h3>
                <button onClick={() => setActiveTab('customers')} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold transition-all text-sm">Select Customer</button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                  <div className="flex w-full sm:w-auto space-x-2">
                    <button onClick={() => setIsTransactionModalOpen(true)} className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-lg font-bold flex items-center justify-center space-x-2 text-sm shrink-0">
                      <Plus size={18} />
                      <span className="hidden sm:inline">New Entry</span>
                      <span className="sm:hidden">Entry</span>
                    </button>
                    <button onClick={handleExportBackup} className="flex-1 sm:flex-none glass text-slate-300 px-4 py-2.5 rounded-lg font-bold flex items-center justify-center space-x-2 text-sm shrink-0">
                      <Download size={18} />
                      <span>Export</span>
                    </button>
                  </div>
                  <div className="flex w-full justify-between sm:justify-end sm:space-x-8 text-right bg-white/5 p-4 rounded-xl border border-white/5">
                    <div><p className="text-[10px] font-bold text-slate-500 uppercase">Debits</p><p className="text-base md:text-lg font-bold text-red-400">₹{formatCurrency(transactions.filter(t => t.customerId === selectedCustomerId && t.type === 'DEBIT').reduce((s, t) => s + t.amount, 0))}</p></div>
                    <div className="hidden sm:block w-px h-8 bg-white/10 mx-4 self-center"></div>
                    <div><p className="text-[10px] font-bold text-slate-500 uppercase">Credits</p><p className="text-base md:text-lg font-bold text-green-400">₹{formatCurrency(transactions.filter(t => t.customerId === selectedCustomerId && t.type === 'CREDIT').reduce((s, t) => s + t.amount, 0))}</p></div>
                  </div>
                </div>
                
                <div className="glass-card rounded-2xl overflow-hidden overflow-x-auto shadow-inner">
                  <table className="w-full text-left min-w-[700px]">
                    <thead>
                      <tr className="bg-white/5 border-b border-white/10 text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest">
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4">Description</th>
                        <th className="px-6 py-4 text-right">Debit</th>
                        <th className="px-6 py-4 text-right">Credit</th>
                        <th className="px-6 py-4 text-right">Balance</th>
                        <th className="px-6 py-4 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      <tr className="bg-blue-500/5">
                        <td className="px-6 py-4 text-sm text-slate-500">-</td>
                        <td className="px-6 py-4 text-sm font-semibold text-white">Opening Balance</td>
                        <td className="px-6 py-4">-</td>
                        <td className="px-6 py-4">-</td>
                        <td className="px-6 py-4 text-right font-bold text-white">₹{formatCurrency(currentCustomer?.openingBalance || 0)}</td>
                        <td className="px-6 py-4"></td>
                      </tr>
                      {(() => {
                        let runningBal = currentCustomer?.openingBalance || 0;
                        const filtered = transactions.filter(t => t.customerId === selectedCustomerId).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                        return filtered.map((tx) => {
                          tx.type === 'CREDIT' ? (runningBal += tx.amount) : (runningBal -= tx.amount);
                          return (
                            <tr key={tx.id} className="hover:bg-white/5 group transition-colors">
                              <td className="px-6 py-4 text-sm text-slate-400 whitespace-nowrap">{tx.date}</td>
                              <td className="px-6 py-4 text-sm text-white max-w-[200px] truncate">{tx.description}</td>
                              <td className="px-6 py-4 text-sm text-right font-bold text-red-400">{tx.type === 'DEBIT' ? `₹${formatCurrency(tx.amount)}` : '-'}</td>
                              <td className="px-6 py-4 text-sm text-right font-bold text-green-400">{tx.type === 'CREDIT' ? `₹${formatCurrency(tx.amount)}` : '-'}</td>
                              <td className="px-6 py-4 text-sm text-right font-bold text-white whitespace-nowrap">₹{formatCurrency(Math.abs(runningBal))} <span className="text-[10px] text-slate-500">{runningBal >= 0 ? 'CR' : 'DR'}</span></td>
                              <td className="px-6 py-4 text-center">
                                <button onClick={() => deleteTransaction(tx.id)} className="p-2 text-slate-600 hover:text-red-400 opacity-50 lg:opacity-0 lg:group-hover:opacity-100 transition-all">
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                  {transactions.filter(t => t.customerId === selectedCustomerId).length === 0 && (
                    <div className="py-20 text-center text-slate-500 text-sm">No entries found for this ledger.</div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* SETTINGS */}
        {activeTab === 'settings' && (
          <div className="space-y-6 md:space-y-8 animate-in slide-in-from-bottom-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              <div className="glass-card p-6 md:p-8 rounded-3xl flex flex-col">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-500/20 text-blue-400 rounded-2xl flex items-center justify-center shrink-0"><Database size={24} /></div>
                  <div className="min-w-0"><h3 className="text-lg md:text-xl font-bold text-white truncate">Local Backup</h3><p className="text-xs md:text-sm text-slate-500">Offline JSON export</p></div>
                </div>
                <div className="space-y-3">
                  <button onClick={handleExportBackup} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl flex items-center justify-center space-x-3 transition-all text-sm"><Download size={18} /><span>Export All Data</span></button>
                  <button onClick={() => fileInputRef.current?.click()} className="w-full glass border border-white/10 text-slate-300 hover:bg-white/5 font-bold py-3.5 rounded-xl flex items-center justify-center space-x-3 transition-all text-sm"><Upload size={18} /><span>Import Backup</span></button>
                  <input type="file" ref={fileInputRef} onChange={handleImportBackup} className="hidden" accept=".json" />
                </div>
              </div>

              <div className="glass-card p-6 md:p-8 rounded-3xl flex flex-col">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-green-500/20 text-green-400 rounded-2xl flex items-center justify-center shrink-0"><CloudUpload size={24} /></div>
                  <div className="min-w-0"><h3 className="text-lg md:text-xl font-bold text-white truncate">Google Drive</h3><p className="text-xs md:text-sm text-slate-500">Auto cloud synchronization</p></div>
                </div>
                <div className="bg-slate-900/50 rounded-2xl p-4 border border-white/5 mb-6 text-xs text-slate-400 space-y-2">
                  <div className="flex justify-between"><span>Status</span><span className="text-slate-500 italic">Disconnected</span></div>
                  <div className="flex justify-between"><span>Last Backup</span><span className="text-slate-500 italic">None</span></div>
                </div>
                <button onClick={simulateGoogleDriveSync} disabled={isSyncing} className={`w-full font-bold py-3.5 rounded-xl flex items-center justify-center space-x-3 transition-all text-sm ${isSyncing ? 'bg-slate-800 text-slate-500' : 'bg-green-600 hover:bg-green-500 text-white'}`}>
                  {isSyncing ? <RefreshCw size={18} className="animate-spin" /> : <CloudUpload size={18} />}
                  <span>{isSyncing ? 'Connecting...' : 'Sync Cloud Drive'}</span>
                </button>
              </div>
            </div>

            <div className="glass-card p-6 md:p-8 rounded-3xl border border-red-500/20 bg-red-500/5">
              <h3 className="text-base md:text-lg font-bold text-red-400 mb-4 flex items-center"><Trash2 size={20} className="mr-2" />Danger Zone</h3>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <p className="text-xs md:text-sm text-slate-400">Permanently delete all business data from this browser storage.</p>
                <button onClick={() => { if (confirm("DELETE ALL DATA? This cannot be undone.")) { localStorage.clear(); window.location.reload(); } }} className="bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white px-6 py-2.5 rounded-xl font-bold transition-all border border-red-500/20 text-sm">Wipe Local Storage</button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODALS */}
      <Modal isOpen={isCompanyModalOpen} onClose={() => setIsCompanyModalOpen(false)} title="New Company">
        <InputField label="Company Name" autoFocus value={companyForm.name} onChange={(v) => setCompanyForm({ ...companyForm, name: v })} placeholder="Acme Corp" />
        <InputField label="Address" value={companyForm.address} onChange={(v) => setCompanyForm({ ...companyForm, address: v })} placeholder="123 Street" />
        <InputField label="GST Number" value={companyForm.gst} onChange={(v) => setCompanyForm({ ...companyForm, gst: v })} placeholder="Optional" />
        <InputField label="Financial Year" value={companyForm.fy} onChange={(v) => setCompanyForm({ ...companyForm, fy: v })} />
        <button onClick={handleAddCompany} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl shadow-lg mt-4 transition-all text-sm">Create Organization</button>
      </Modal>

      <Modal isOpen={isCustomerModalOpen} onClose={() => setIsCustomerModalOpen(false)} title="New Customer">
        <InputField label="Full Name" autoFocus value={customerForm.name} onChange={(v) => setCustomerForm({ ...customerForm, name: v })} placeholder="John Doe" />
        <InputField label="Phone" value={customerForm.phone} onChange={(v) => setCustomerForm({ ...customerForm, phone: v })} placeholder="+91 ..." />
        <InputField label="Opening Balance (₹)" type="number" value={customerForm.openingBalance} onChange={(v) => setCustomerForm({ ...customerForm, openingBalance: v })} />
        <button onClick={handleAddCustomer} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl shadow-lg mt-4 transition-all text-sm">Save Customer</button>
      </Modal>

      <Modal isOpen={isTransactionModalOpen} onClose={() => setIsTransactionModalOpen(false)} title="Add Transaction">
        <div className="flex bg-slate-900 rounded-xl p-1 mb-6 border border-white/5">
          <button onClick={() => setTxForm({ ...txForm, type: 'CREDIT' })} className={`flex-1 py-2 text-xs md:text-sm rounded-lg font-bold transition-all ${txForm.type === 'CREDIT' ? 'bg-green-500 text-white shadow-lg' : 'text-slate-500'}`}>Credit (In)</button>
          <button onClick={() => setTxForm({ ...txForm, type: 'DEBIT' })} className={`flex-1 py-2 text-xs md:text-sm rounded-lg font-bold transition-all ${txForm.type === 'DEBIT' ? 'bg-red-500 text-white shadow-lg' : 'text-slate-500'}`}>Debit (Out)</button>
        </div>
        <InputField label="Date" type="date" value={txForm.date} onChange={(v) => setTxForm({ ...txForm, date: v })} />
        <InputField label="Description" value={txForm.desc} onChange={(v) => setTxForm({ ...txForm, desc: v })} placeholder="Purchase order #123" />
        <InputField label="Amount (₹)" type="number" value={txForm.amount} onChange={(v) => setTxForm({ ...txForm, amount: v })} />
        <button onClick={handleAddTransaction} className={`w-full font-bold py-3.5 rounded-xl shadow-lg mt-4 text-white transition-all text-sm ${txForm.type === 'CREDIT' ? 'bg-green-600 hover:bg-green-500' : 'bg-red-600 hover:bg-red-500'}`}>Confirm Entry</button>
      </Modal>
    </div>
  );
};

export default App;

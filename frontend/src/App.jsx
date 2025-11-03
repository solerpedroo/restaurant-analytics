import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, Package, Calendar, Download, Filter, Menu, Bell, Settings, Sparkles, RefreshCw } from 'lucide-react';

// ============================================================================
// API Configuration
// ============================================================================

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const fetchDashboardData = async (startDate, endDate) => {
  try {
    const response = await fetch(
      `${API_BASE}/dashboard/overview?start_date=${startDate}&end_date=${endDate}`
    );
    if (!response.ok) throw new Error('Failed to fetch dashboard data');
    return await response.json();
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    // Return mock data for demo
    return generateMockData();
  }
};

const generateMockData = () => ({
  metrics: {
    revenue: { value: 125450.50, change: 12.5 },
    orders: { value: 2341, change: 8.3 },
    avg_ticket: { value: 53.60, change: -2.1 },
    products_sold: { value: 5820, change: 15.2 }
  },
  top_products: Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    name: `Produto ${i + 1}`,
    value: Math.random() * 5000 + 1000,
    percentage: 0
  })),
  top_stores: Array.from({ length: 5 }, (_, i) => ({
    id: i + 1,
    name: `Loja ${i + 1}`,
    value: Math.random() * 50000 + 10000,
    percentage: 0
  })),
  channel_distribution: [
    { id: 1, name: 'Presencial', value: 48500, percentage: 38.7 },
    { id: 2, name: 'iFood', value: 42300, percentage: 33.7 },
    { id: 3, name: 'Rappi', value: 20150, percentage: 16.1 },
    { id: 4, name: 'Uber Eats', value: 9840, percentage: 7.8 },
    { id: 5, name: 'WhatsApp', value: 4660, percentage: 3.7 }
  ],
  revenue_trend: Array.from({ length: 30 }, (_, i) => ({
    timestamp: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    value: Math.random() * 6000 + 2000
  }))
});

// ============================================================================
// Animated Number Component
// ============================================================================

const AnimatedNumber = ({ value, prefix = '', suffix = '', decimals = 2 }) => {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    let start = 0;
    const end = parseFloat(value);
    const duration = 1000;
    const increment = end / (duration / 16);
    
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setDisplayValue(end);
        clearInterval(timer);
      } else {
        setDisplayValue(start);
      }
    }, 16);
    
    return () => clearInterval(timer);
  }, [value]);
  
  return (
    <span>
      {prefix}
      {displayValue.toLocaleString('pt-BR', { 
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals 
      })}
      {suffix}
    </span>
  );
};

// ============================================================================
// Metric Card Component
// ============================================================================

const MetricCard = ({ title, value, change, icon: Icon, isLoading }) => {
  if (isLoading) {
    return (
      <div className="metric-card glass loading">
        <div className="skeleton skeleton-header"></div>
        <div className="skeleton skeleton-value"></div>
        <div className="skeleton skeleton-footer"></div>
      </div>
    );
  }

  const isPositive = change >= 0;
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;
  
  return (
    <div className="metric-card glass">
      <div className="metric-header">
        <div className="metric-title-group">
          <span className="metric-title">{title}</span>
        </div>
        <div className="metric-icon-wrapper">
          <Icon className="metric-icon" size={24} />
        </div>
      </div>
      
      <div className="metric-value">
        <AnimatedNumber value={value} prefix="R$ " decimals={2} />
      </div>
      
      <div className={`metric-change ${isPositive ? 'positive' : 'negative'}`}>
        <TrendIcon size={16} />
        <span>{Math.abs(change).toFixed(1)}%</span>
        <span className="vs-text">vs período anterior</span>
      </div>
    </div>
  );
};

// ============================================================================
// Chart Card Component
// ============================================================================

const ChartCard = ({ title, subtitle, children, actions }) => (
  <div className="chart-card glass">
    <div className="chart-header">
      <div>
        <h3 className="chart-title">{title}</h3>
        {subtitle && <p className="chart-subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="chart-actions">{actions}</div>}
    </div>
    <div className="chart-content">
      {children}
    </div>
  </div>
);

// ============================================================================
// Custom Tooltip
// ============================================================================

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  
  return (
    <div className="custom-tooltip glass">
      <p className="tooltip-label">{label}</p>
      {payload.map((entry, index) => (
        <p key={index} className="tooltip-value" style={{ color: entry.color }}>
          {entry.name}: R$ {entry.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </p>
      ))}
    </div>
  );
};

// ============================================================================
// Main Dashboard Component
// ============================================================================

export default function PremiumDashboard() {
  const [data, setData] = useState(null);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [theme, setTheme] = useState('light');
  
  // Load data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const dashboardData = await fetchDashboardData(dateRange.start, dateRange.end);
      setData(dashboardData);
      setIsLoading(false);
    };
    
    loadData();
  }, [dateRange]);
  
  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(async () => {
      const dashboardData = await fetchDashboardData(dateRange.start, dateRange.end);
      setData(dashboardData);
      setIsLoading(false);
    }, 500);
  };
  
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
  
  return (
    <div className={`dashboard-container ${theme}`} data-theme={theme}>
      {/* Header */}
      <header className="dashboard-header glass-header">
        <div className="header-content">
          <div className="header-left">
            <button className="btn-icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <Menu size={20} />
            </button>
            <div className="brand">
              <Sparkles className="brand-icon" size={24} />
              <h1 className="brand-title">Restaurant Analytics</h1>
            </div>
          </div>
          
          <div className="header-right">
            <div className="date-range-picker glass-input">
              <Calendar size={16} />
              <input 
                type="date" 
                value={dateRange.start}
                onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
              />
              <span>até</span>
              <input 
                type="date" 
                value={dateRange.end}
                onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
              />
            </div>
            
            <button className="btn-icon" onClick={handleRefresh} title="Atualizar dados">
              <RefreshCw size={20} className={isLoading ? 'spin' : ''} />
            </button>
            
            <button className="btn-icon" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
            
            <div className="user-avatar">
              <img src="https://i.pravatar.cc/40" alt="User" />
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <div className="dashboard-main">
        {/* Sidebar */}
        <aside className={`dashboard-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
          <nav className="sidebar-nav">
            <a href="#" className="nav-item active">
              <TrendingUp size={20} />
              {sidebarOpen && <span>Dashboard</span>}
            </a>
            <a href="#" className="nav-item">
              <ShoppingCart size={20} />
              {sidebarOpen && <span>Vendas</span>}
            </a>
            <a href="#" className="nav-item">
              <Package size={20} />
              {sidebarOpen && <span>Produtos</span>}
            </a>
            <a href="#" className="nav-item">
              <Users size={20} />
              {sidebarOpen && <span>Clientes</span>}
            </a>
            <a href="#" className="nav-item">
              <Settings size={20} />
              {sidebarOpen && <span>Configurações</span>}
            </a>
          </nav>
        </aside>
        
        {/* Content Area */}
        <main className="dashboard-content">
          {/* Metrics Grid */}
          <div className="metrics-grid">
            <MetricCard
              title="Faturamento Total"
              value={data?.metrics.revenue.value || 0}
              change={data?.metrics.revenue.change || 0}
              icon={DollarSign}
              isLoading={isLoading}
            />
            <MetricCard
              title="Total de Pedidos"
              value={data?.metrics.orders.value || 0}
              change={data?.metrics.orders.change || 0}
              icon={ShoppingCart}
              isLoading={isLoading}
            />
            <MetricCard
              title="Ticket Médio"
              value={data?.metrics.avg_ticket.value || 0}
              change={data?.metrics.avg_ticket.change || 0}
              icon={Users}
              isLoading={isLoading}
            />
            <MetricCard
              title="Produtos Vendidos"
              value={data?.metrics.products_sold.value || 0}
              change={data?.metrics.products_sold.change || 0}
              icon={Package}
              isLoading={isLoading}
            />
          </div>
          
          {/* Charts Grid */}
          {!isLoading && data && (
            <div className="charts-grid">
              {/* Revenue Trend */}
              <ChartCard title="Evolução de Faturamento" subtitle="Últimos 30 dias">
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={data.revenue_trend}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="timestamp" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => `R$ ${(v/1000).toFixed(0)}k`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      name="Faturamento"
                      stroke="#3b82f6" 
                      fill="url(#colorRevenue)"
                      strokeWidth={3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>
              
              {/* Channel Distribution */}
              <ChartCard title="Distribuição por Canal">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data.channel_distribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      label={({name, percentage}) => `${name} ${percentage.toFixed(0)}%`}
                    >
                      {data.channel_distribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `R$ ${value.toLocaleString('pt-BR')}`} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>
              
              {/* Top Products */}
              <ChartCard title="Top 10 Produtos" subtitle="Por faturamento">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.top_products} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis type="number" stroke="#64748b" fontSize={12} tickFormatter={(v) => `R$ ${(v/1000).toFixed(0)}k`} />
                    <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={11} width={100} />
                    <Tooltip formatter={(value) => `R$ ${value.toLocaleString('pt-BR')}`} />
                    <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
              
              {/* Top Stores */}
              <ChartCard title="Top 5 Lojas" subtitle="Por faturamento">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.top_stores}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => `R$ ${(v/1000).toFixed(0)}k`} />
                    <Tooltip formatter={(value) => `R$ ${value.toLocaleString('pt-BR')}`} />
                    <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          )}
        </main>
      </div>
      
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        .dashboard-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          color: #0f172a;
        }
        
        .dashboard-container[data-theme="dark"] {
          background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
          color: #f1f5f9;
        }
        
        .dashboard-header {
          position: sticky;
          top: 0;
          z-index: 100;
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .glass-header {
          background: rgba(255, 255, 255, 0.9);
        }
        
        [data-theme="dark"] .glass-header {
          background: rgba(15, 23, 42, 0.9);
        }
        
        .header-content {
          max-width: 1920px;
          margin: 0 auto;
          padding: 1rem 1.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .header-left, .header-right {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        
        .brand {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        
        .brand-icon {
          color: #3b82f6;
          animation: sparkle 2s ease-in-out infinite;
        }
        
        @keyframes sparkle {
          0%, 100% { transform: rotate(0deg) scale(1); }
          50% { transform: rotate(10deg) scale(1.1); }
        }
        
        .brand-title {
          font-size: 1.25rem;
          font-weight: 700;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        
        .btn-icon {
          padding: 0.5rem;
          background: rgba(59, 130, 246, 0.1);
          border: none;
          border-radius: 0.5rem;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .btn-icon:hover {
          background: rgba(59, 130, 246, 0.2);
          transform: translateY(-2px);
        }
        
        .spin {
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        .date-range-picker {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: rgba(255, 255, 255, 0.5);
          backdrop-filter: blur(10px);
          border-radius: 0.5rem;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .date-range-picker input {
          background: transparent;
          border: none;
          font-size: 0.875rem;
          color: inherit;
        }
        
        .date-range-picker span {
          font-size: 0.875rem;
          color: #64748b;
        }
        
        .user-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          overflow: hidden;
          border: 2px solid #3b82f6;
        }
        
        .user-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .dashboard-main {
          display: flex;
          max-width: 1920px;
          margin: 0 auto;
        }
        
        .dashboard-sidebar {
          width: 240px;
          padding: 1.5rem;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .dashboard-sidebar.closed {
          width: 80px;
        }
        
        .sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .nav-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.75rem 1rem;
          border-radius: 0.5rem;
          text-decoration: none;
          color: inherit;
          transition: all 0.2s;
        }
        
        .nav-item:hover {
          background: rgba(59, 130, 246, 0.1);
          transform: translateX(4px);
        }
        
        .nav-item.active {
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          color: white;
        }
        
        .dashboard-content {
          flex: 1;
          padding: 2rem;
          overflow-y: auto;
        }
        
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
          animation: fadeInUp 0.6s ease-out;
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .metric-card {
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 1rem;
          padding: 1.5rem;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        
        [data-theme="dark"] .metric-card {
          background: rgba(30, 41, 59, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        
        .metric-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        }
        
        .metric-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
        }
        
        .metric-title {
          font-size: 0.875rem;
          font-weight: 500;
          color: #64748b;
        }
        
        .metric-icon-wrapper {
          padding: 0.75rem;
          background: rgba(59, 130, 246, 0.1);
          border-radius: 0.75rem;
        }
        
        .metric-icon {
          color: #3b82f6;
        }
        
        .metric-value {
          font-size: 2rem;
          font-weight: 700;
          margin: 1rem 0;
          animation: countUp 1s ease-out;
        }
        
        @keyframes countUp {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
        
        .metric-change {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          font-weight: 500;
        }
        
        .metric-change.positive {
          color: #10b981;
        }
        
        .metric-change.negative {
          color: #ef4444;
        }
        
        .vs-text {
          color: #94a3b8;
          font-size: 0.75rem;
        }
        
        .charts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
          gap: 1.5rem;
        }
        
        .chart-card {
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 1rem;
          padding: 1.5rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        
        [data-theme="dark"] .chart-card {
          background: rgba(30, 41, 59, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        
        .chart-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1.5rem;
        }
        
        .chart-title {
          font-size: 1.125rem;
          font-weight: 600;
        }
        
        .chart-subtitle {
          font-size: 0.875rem;
          color: #64748b;
          margin-top: 0.25rem;
        }
        
        .custom-tooltip {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(0, 0, 0, 0.1);
          border-radius: 0.5rem;
          padding: 1rem;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }
        
        [data-theme="dark"] .custom-tooltip {
          background: rgba(30, 41, 59, 0.95);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .tooltip-label {
          font-weight: 600;
          margin-bottom: 0.5rem;
        }
        
        .tooltip-value {
          font-size: 0.875rem;
          margin: 0.25rem 0;
        }
        
        .skeleton {
          background: linear-gradient(
            90deg,
            rgba(203, 213, 225, 0.3) 0%,
            rgba(203, 213, 225, 0.5) 50%,
            rgba(203, 213, 225, 0.3) 100%
          );
          background-size: 200% 100%;
          animation: shimmer 1.5s ease-in-out infinite;
          border-radius: 0.5rem;
        }
        
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        
        .skeleton-header {
          height: 20px;
          width: 60%;
          margin-bottom: 1rem;
        }
        
        .skeleton-value {
          height: 32px;
          width: 80%;
          margin-bottom: 1rem;
        }
        
        .skeleton-footer {
          height: 16px;
          width: 40%;
        }
        
        @media (max-width: 768px) {
          .header-content {
            flex-direction: column;
            gap: 1rem;
          }
          
          .dashboard-sidebar {
            display: none;
          }
          
          .metrics-grid {
            grid-template-columns: 1fr;
          }
          
          .charts-grid {
            grid-template-columns: 1fr;
          }
        }
        
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.05);
        }
        
        ::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.3);
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(59, 130, 246, 0.5);
        }
      `}</style>
    </div>
  );
}
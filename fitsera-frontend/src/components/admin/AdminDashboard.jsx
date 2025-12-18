import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../../context/AdminContext';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import { FaShoppingBag, FaEllipsisV, FaCalendar } from 'react-icons/fa';

function AdminDashboard() {
  const navigate = useNavigate();
  const { isAdminAuthenticated, admin, loading: adminLoading } = useAdmin();
  const [activeTab, setActiveTab] = useState('MONTHLY');
  const [orders, setOrders] = useState([]);
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bestSellers, setBestSellers] = useState([]);
  const [salesData, setSalesData] = useState([]);
  const [stats, setStats] = useState({
    totalRentals: { value: 0, change: 0 },
    activeRentals: { value: 0, change: 0 },
    completedRentals: { value: 0, change: 0 },
    notReturnedRentals: { value: 0, change: 0 }
  });

  useEffect(() => {
    if (!adminLoading && !isAdminAuthenticated) {
      navigate('/admin/login');
      return;
    }

    if (admin?.accountId) {
      loadDashboardData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdminAuthenticated, navigate, admin?.accountId, activeTab, adminLoading]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      // Fetch account-specific orders
      const url = admin?.accountId 
        ? `http://localhost:8080/api/orders/account/${admin.accountId}`
        : 'http://localhost:8080/api/orders';
      
      const response = await fetch(url);
      const data = await response.json();
      const allOrders = data.orders || data || [];
      
      // Sort by date (newest first)
      allOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      // Get current and previous month data for comparison
      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      
      // Filter orders by month
      const currentMonthOrders = allOrders.filter(o => 
        new Date(o.createdAt) >= currentMonthStart
      );
      const previousMonthOrders = allOrders.filter(o => {
        const orderDate = new Date(o.createdAt);
        return orderDate >= previousMonthStart && orderDate <= previousMonthEnd;
      });
      
      // Helper function to check if order has overdue items
      const hasOverdueItems = (order) => {
        if (!order.items) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        return order.items.some(item => {
          if (item.returnStatus === 'returned') return false;
          if (!item.expectedReturnDate) return false;
          const returnDate = new Date(item.expectedReturnDate);
          returnDate.setHours(0, 0, 0, 0);
          return today > returnDate;
        });
      };
      
      // Calculate current month statistics
      const currentRevenue = currentMonthOrders.reduce((sum, order) => sum + (order.total || 0), 0);
      const currentActive = currentMonthOrders.filter(o => 
        o.status.toLowerCase() === 'processing' || 
        o.status.toLowerCase() === 'shipped' ||
        o.status.toLowerCase() === 'pending'
      ).length;
      const currentCompleted = currentMonthOrders.filter(o => 
        o.status.toLowerCase() === 'delivered' && !hasOverdueItems(o)
      ).length;
      const currentNotReturned = currentMonthOrders.filter(o => 
        o.status.toLowerCase() === 'delivered' && hasOverdueItems(o)
      ).length;
      
      // Calculate previous month statistics
      const previousRevenue = previousMonthOrders.reduce((sum, order) => sum + (order.total || 0), 0);
      const previousActive = previousMonthOrders.filter(o => 
        o.status.toLowerCase() === 'processing' || 
        o.status.toLowerCase() === 'shipped' ||
        o.status.toLowerCase() === 'pending'
      ).length;
      const previousCompleted = previousMonthOrders.filter(o => 
        o.status.toLowerCase() === 'delivered' && !hasOverdueItems(o)
      ).length;
      const previousNotReturned = previousMonthOrders.filter(o => 
        o.status.toLowerCase() === 'delivered' && hasOverdueItems(o)
      ).length;
      
      // Calculate percentage changes
      const calculateChange = (current, previous) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
      };
      
      const activeOrders = allOrders.filter(o => 
        o.status.toLowerCase() === 'processing' || 
        o.status.toLowerCase() === 'shipped' ||
        o.status.toLowerCase() === 'pending'
      );
      const completedOrders = allOrders.filter(o => 
        o.status.toLowerCase() === 'delivered' && !hasOverdueItems(o)
      );
      const notReturnedOrders = allOrders.filter(o => 
        o.status.toLowerCase() === 'delivered' && hasOverdueItems(o)
      );
      const returnedOrders = allOrders.filter(o => o.status.toLowerCase() === 'returned');
      
      setStats({
        totalRentals: { 
          value: currentRevenue, 
          change: parseFloat(calculateChange(currentRevenue, previousRevenue).toFixed(1))
        },
        activeRentals: { 
          value: currentActive, 
          change: parseFloat(calculateChange(currentActive, previousActive).toFixed(1))
        },
        completedRentals: { 
          value: currentCompleted, 
          change: parseFloat(calculateChange(currentCompleted, previousCompleted).toFixed(1))
        },
        notReturnedRentals: { 
          value: currentNotReturned, 
          change: parseFloat(calculateChange(currentNotReturned, previousNotReturned).toFixed(1))
        }
      });
      
      // Helper function to get status color
      const getStatusColor = (status) => {
        switch (status.toLowerCase()) {
          case 'pending': return 'bg-yellow-100 text-yellow-800';
          case 'processing': return 'bg-blue-100 text-blue-800';
          case 'shipped': return 'bg-purple-100 text-purple-800';
          case 'delivered': return 'bg-green-100 text-green-800';
          case 'returned': return 'bg-teal-100 text-teal-800';
          case 'cancelled': return 'bg-red-100 text-red-800';
          default: return 'bg-gray-100 text-gray-800';
        }
      };
      
      // Get recent orders (last 6)
      const recentOrders = allOrders.slice(0, 6).map(order => {
        const firstItem = order.items && order.items.length > 0 ? order.items[0] : null;
        const productName = firstItem ? firstItem.productName : 'N/A';
        const customerEmail = order.contactInfo?.email || 'N/A';
        
        // Extract customer name from email or use the whole email
        const customerName = customerEmail.split('@')[0];
        
        return {
          id: order.orderNumber || order.id,
          product: productName,
          itemCount: order.items?.length || 0,
          date: order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          }) : 'N/A',
          customer: customerName,
          customerEmail: customerEmail,
          customerAvatar: customerName.charAt(0).toUpperCase(),
          status: order.status.replace('_', ' '),
          statusColor: getStatusColor(order.status),
          amount: order.total || 0
        };
      });
      
      // Get recent returns (returned or overdue orders)
      const recentReturns = [...returnedOrders, ...notReturnedOrders]
        .slice(0, 6)
        .map(order => {
          const firstItem = order.items && order.items.length > 0 ? order.items[0] : null;
          const productName = firstItem ? firstItem.productName : 'N/A';
          const customerEmail = order.contactInfo?.email || 'N/A';
          const customerName = customerEmail.split('@')[0];
          
          return {
            id: order.orderNumber || order.id,
            product: productName,
            date: order.updatedAt ? new Date(order.updatedAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            }) : 'N/A',
            customer: customerName,
            customerAvatar: customerName.charAt(0).toUpperCase(),
            status: order.status.replace('_', ' '),
            statusColor: getStatusColor(order.status),
            reason: order.status.toLowerCase() === 'returned' ? 'End of rental' : 'Overdue return'
          };
        });
      
      setOrders(recentOrders);
      setReturns(recentReturns);
      
      // Calculate best sellers (products with most orders)
      const productSales = {};
      allOrders.forEach(order => {
        if (order.items) {
          order.items.forEach(item => {
            const key = item.productId;
            if (!productSales[key]) {
              productSales[key] = {
                name: item.productName,
                count: 0,
                revenue: 0,
                image: item.productImageUrl
              };
            }
            productSales[key].count += (item.quantity || 1);
            productSales[key].revenue += (item.subtotal || item.price * item.quantity || 0);
          });
        }
      });
      
      const topSellers = Object.values(productSales)
        .sort((a, b) => b.count - a.count)
        .slice(0, 3)
        .map(item => ({
          name: item.name,
          subPrice: `${item.count} Rentals`,
          price: `$${item.revenue.toFixed(2)}`,
          rentals: `${item.count} Rentals`,
          image: item.image || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="64" height="64"%3E%3Crect fill="%23ddd" width="64" height="64"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="10" fill="%23666"%3ENo Image%3C/text%3E%3C/svg%3E'
        }));
      
      setBestSellers(topSellers);
      
      // Generate sales data for graph based on activeTab
      let graphData = [];
      const today = new Date();
      
      if (activeTab === 'WEEKLY') {
        // Last 7 days
        for (let i = 6; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          const dayOrders = allOrders.filter(order => {
            const orderDate = new Date(order.createdAt);
            return orderDate.toDateString() === date.toDateString();
          });
          const dayRevenue = dayOrders.reduce((sum, order) => sum + (order.total || 0), 0);
          graphData.push({
            day: date.toLocaleDateString('en-US', { weekday: 'short' }),
            amount: dayRevenue
          });
        }
      } else if (activeTab === 'MONTHLY') {
        // Last 30 days grouped by week
        for (let i = 29; i >= 0; i -= 7) {
          const endDate = new Date(today);
          endDate.setDate(endDate.getDate() - i);
          const startDate = new Date(endDate);
          startDate.setDate(startDate.getDate() - 6);
          
          const weekOrders = allOrders.filter(order => {
            const orderDate = new Date(order.createdAt);
            return orderDate >= startDate && orderDate <= endDate;
          });
          const weekRevenue = weekOrders.reduce((sum, order) => sum + (order.total || 0), 0);
          graphData.push({
            day: `W${Math.floor((29 - i) / 7) + 1}`,
            amount: weekRevenue
          });
        }
      } else if (activeTab === 'YEARLY') {
        // Current year: January to December
        const currentYear = today.getFullYear();
        for (let month = 0; month < 12; month++) {
          const date = new Date(currentYear, month, 1);
          const nextMonth = new Date(currentYear, month + 1, 0);
          
          const monthOrders = allOrders.filter(order => {
            const orderDate = new Date(order.createdAt);
            return orderDate >= date && orderDate <= nextMonth;
          });
          const monthRevenue = monthOrders.reduce((sum, order) => sum + (order.total || 0), 0);
          graphData.push({
            day: date.toLocaleDateString('en-US', { month: 'short' }),
            amount: monthRevenue
          });
        }
      }
      
      setSalesData(graphData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate date range for display
  const getCurrentMonthRange = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const formatDate = (date) => date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
    return `${formatDate(firstDay)} - ${formatDate(lastDay)}`;
  };

  const getPreviousMonthName = () => {
    const now = new Date();
    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return previousMonth.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      <AdminSidebar />
      <AdminHeader />

      <main className="ml-64 mt-16 p-8">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
            <p className="text-sm text-gray-500">Home &gt; Dashboard</p>
          </div>
          <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-lg border border-gray-200">
            <FaCalendar className="text-gray-500" />
            <span className="text-sm font-semibold">{getCurrentMonthRange()}</span>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
          </div>
        ) : (
          <>
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-teal-600 p-3 rounded-lg">
                <FaShoppingBag className="text-white text-xl" />
              </div>
              <button className="text-gray-400 hover:text-gray-600">
                <FaEllipsisV />
              </button>
            </div>
            <h3 className="text-sm text-gray-600 mb-2">Total Rentals</h3>
            <div className="flex items-end justify-between">
              <span className="text-2xl font-bold">${stats.totalRentals.value.toLocaleString()}</span>
              <span className={`text-sm flex items-center ${stats.totalRentals.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {stats.totalRentals.change >= 0 ? '↑' : '↓'} {Math.abs(stats.totalRentals.change)}%
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-2">Compared to {getPreviousMonthName()}</p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-teal-600 p-3 rounded-lg">
                <FaShoppingBag className="text-white text-xl" />
              </div>
              <button className="text-gray-400 hover:text-gray-600">
                <FaEllipsisV />
              </button>
            </div>
            <h3 className="text-sm text-gray-600 mb-2">Active Rentals</h3>
            <div className="flex items-end justify-between">
              <span className="text-2xl font-bold">{stats.activeRentals.value}</span>
              <span className={`text-sm flex items-center ${stats.activeRentals.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {stats.activeRentals.change >= 0 ? '↑' : '↓'} {Math.abs(stats.activeRentals.change)}%
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-2">Compared to {getPreviousMonthName()}</p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-teal-600 p-3 rounded-lg">
                <FaShoppingBag className="text-white text-xl" />
              </div>
              <button className="text-gray-400 hover:text-gray-600">
                <FaEllipsisV />
              </button>
            </div>
            <h3 className="text-sm text-gray-600 mb-2">Completed Rentals</h3>
            <div className="flex items-end justify-between">
              <span className="text-2xl font-bold">{stats.completedRentals.value}</span>
              <span className={`text-sm flex items-center ${stats.completedRentals.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {stats.completedRentals.change >= 0 ? '↑' : '↓'} {Math.abs(stats.completedRentals.change)}%
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-2">Compared to {getPreviousMonthName()}</p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-teal-600 p-3 rounded-lg">
                <FaShoppingBag className="text-white text-xl" />
              </div>
              <button className="text-gray-400 hover:text-gray-600">
                <FaEllipsisV />
              </button>
            </div>
            <h3 className="text-sm text-gray-600 mb-2">Not Returned Rentals</h3>
            <div className="flex items-end justify-between">
              <span className="text-2xl font-bold">{stats.notReturnedRentals.value}</span>
              <span className={`text-sm flex items-center ${stats.notReturnedRentals.change >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                {stats.notReturnedRentals.change >= 0 ? '↑' : '↓'} {Math.abs(stats.notReturnedRentals.change)}%
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-2">Compared to {getPreviousMonthName()}</p>
          </div>
        </div>

        {/* Charts and Best Sellers */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Sales Graph */}
          <div className="lg:col-span-2 bg-white rounded-lg p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Sale Graph</h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => setActiveTab('WEEKLY')}
                  className={`px-4 py-2 rounded ${
                    activeTab === 'WEEKLY'
                      ? 'bg-gray-200 text-gray-800'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  WEEKLY
                </button>
                <button
                  onClick={() => setActiveTab('MONTHLY')}
                  className={`px-4 py-2 rounded ${
                    activeTab === 'MONTHLY'
                      ? 'bg-teal-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  MONTHLY
                </button>
                <button
                  onClick={() => setActiveTab('YEARLY')}
                  className={`px-4 py-2 rounded ${
                    activeTab === 'YEARLY'
                      ? 'bg-gray-200 text-gray-800'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  YEARLY
                </button>
              </div>
            </div>
            
            {/* Simple SVG Chart */}
            <div className="h-64 relative">
              {salesData.length > 0 ? (
                <svg className="w-full h-full" viewBox="0 0 600 250">
                  {/* Grid lines */}
                  <line x1="50" y1="200" x2="550" y2="200" stroke="#e5e7eb" strokeWidth="1" />
                  <line x1="50" y1="150" x2="550" y2="150" stroke="#e5e7eb" strokeWidth="1" />
                  <line x1="50" y1="100" x2="550" y2="100" stroke="#e5e7eb" strokeWidth="1" />
                  <line x1="50" y1="50" x2="550" y2="50" stroke="#e5e7eb" strokeWidth="1" />
                  
                  {/* Y-axis labels */}
                  <text x="10" y="205" fontSize="12" fill="#9ca3af">$0</text>
                  <text x="10" y="155" fontSize="12" fill="#9ca3af">${Math.round(stats.totalRentals.value * 0.25)}</text>
                  <text x="10" y="105" fontSize="12" fill="#9ca3af">${Math.round(stats.totalRentals.value * 0.5)}</text>
                  <text x="10" y="55" fontSize="12" fill="#9ca3af">${Math.round(stats.totalRentals.value * 0.75)}</text>
                  
                  {/* Line chart - Dynamic based on real data */}
                  <path
                    d={salesData.map((day, i) => {
                      const x = 50 + (i * 80);
                      const maxRevenue = Math.max(...salesData.map(d => d.amount), 1);
                      const y = 200 - ((day.amount / maxRevenue) * 150);
                      return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
                    }).join(' ')}
                    fill="none"
                    stroke="#14b8a6"
                    strokeWidth="3"
                  />
                  
                  {/* Data points */}
                  {salesData.map((day, i) => {
                    const x = 50 + (i * 80);
                    const maxRevenue = Math.max(...salesData.map(d => d.amount), 1);
                    const y = 200 - ((day.amount / maxRevenue) * 150);
                    return (
                      <circle key={i} cx={x} cy={y} r="4" fill="#14b8a6" />
                    );
                  })}
                  
                  {/* X-axis labels */}
                  {salesData.map((day, i) => (
                    <text key={i} x={50 + (i * 80)} y="230" fontSize="12" fill="#9ca3af" textAnchor="middle">
                      {day.day}
                    </text>
                  ))}
                </svg>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  No sales data available
                </div>
              )}
            </div>
          </div>

          {/* Best Sellers */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Best Sellers</h2>
              <button className="text-gray-400 hover:text-gray-600">
                <FaEllipsisV />
              </button>
            </div>
            
            <div className="space-y-4">
              {bestSellers.length > 0 ? (
                bestSellers.map((item, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="w-16 h-16 bg-gray-200 rounded object-cover"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 text-sm">{item.name}</h3>
                      <p className="text-xs text-gray-500">{item.subPrice}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-800">{item.price}</p>
                      <p className="text-xs text-gray-500">{item.rentals}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400">
                  No best sellers data available
                </div>
              )}
            </div>

            <button className="w-full mt-6 bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800">
              REPORT
            </button>
          </div>
        </div>

        {/* Recent Orders Table */}
        <div className="bg-white rounded-lg p-6 shadow-sm mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Recent Orders</h2>
            <button className="text-gray-400 hover:text-gray-600">
              <FaEllipsisV />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Product</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Order ID</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Customer Name</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Amount</th>
                </tr>
              </thead>
              <tbody>
                {orders.length > 0 ? (
                  orders.map((order) => (
                    <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm">
                        {order.product}
                        {order.itemCount > 1 && (
                          <span className="ml-2 text-xs text-gray-500">
                            +{order.itemCount - 1} more
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm">#{order.id}</td>
                      <td className="py-3 px-4 text-sm">{order.date}</td>
                      <td className="py-3 px-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-xs font-semibold">
                            {order.customerAvatar}
                          </div>
                          <span title={order.customerEmail}>{order.customer}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-xs px-2 py-1 rounded ${order.statusColor}`}>
                          ● {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm font-semibold">${order.amount.toFixed(2)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-gray-400">
                      No recent orders found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Returns Table */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Recent Returns</h2>
            <button className="text-gray-400 hover:text-gray-600">
              <FaEllipsisV />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Product</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Order ID</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Customer Name</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Reason</th>
                </tr>
              </thead>
              <tbody>
                {returns.length > 0 ? (
                  returns.map((returnItem) => (
                    <tr key={returnItem.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm">{returnItem.product}</td>
                      <td className="py-3 px-4 text-sm">#{returnItem.id}</td>
                      <td className="py-3 px-4 text-sm">{returnItem.date}</td>
                      <td className="py-3 px-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-xs font-semibold">
                            {returnItem.customerAvatar}
                          </div>
                          <span>{returnItem.customer}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-xs px-2 py-1 rounded ${returnItem.statusColor}`}>
                          ● {returnItem.status.charAt(0).toUpperCase() + returnItem.status.slice(1)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm">{returnItem.reason}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-gray-400">
                      No returns found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        </>
        )}
      </main>
    </div>
  );
}

export default AdminDashboard;


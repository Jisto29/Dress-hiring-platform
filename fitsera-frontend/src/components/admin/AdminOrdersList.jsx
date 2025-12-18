import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../../context/AdminContext';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import { FaEllipsisV, FaEye, FaDownload, FaSync } from 'react-icons/fa';

function AdminOrdersList() {
  const navigate = useNavigate();
  const { isAdminAuthenticated, admin, loading: adminLoading } = useAdmin();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!adminLoading && !isAdminAuthenticated) {
      navigate('/admin/login');
      return;
    }

    loadOrders();
  }, [isAdminAuthenticated, navigate, admin]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      
      if (!admin?.accountId) {
        console.log('No account ID available yet, waiting...');
        setLoading(false);
        return;
      }
      
      // Fetch brand-specific orders using accountId
      const url = `http://localhost:8080/api/orders/account/${admin.accountId}`;
      
      console.log('Fetching orders from:', url);
      console.log('Admin account ID:', admin.accountId);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      console.log('Orders fetched from backend:', data.length);
      console.log('Orders:', data);
      
      setOrders(data);
      setFilteredOrders(data);
    } catch (error) {
      console.error('Error loading orders:', error);
      setOrders([]);
      setFilteredOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = (status) => {
    setFilterStatus(status);
    if (status === 'all') {
      setFilteredOrders(orders);
    } else {
      setFilteredOrders(orders.filter(order => order.status === status));
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'returned':
        return 'bg-gray-100 text-gray-800';
      case 'return_overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const formatStatus = (status) => {
    return status === 'return_overdue' ? 'Return Overdue' : status.charAt(0).toUpperCase() + status.slice(1);
  };

  const getStatusCount = (status) => {
    return orders.filter(order => order.status === status).length;
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const response = await fetch(`http://localhost:8080/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update order status');
      }

      // Reload orders to reflect the change
      loadOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status. Please try again.');
    }
  };

  const handleReturnApproval = async (orderId, productId, approved) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`http://localhost:8080/api/orders/admin/${orderId}/items/${productId}/return/process`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ approved }),
      });

      if (!response.ok) {
        throw new Error('Failed to process return');
      }

      const data = await response.json();
      alert(data.message || (approved ? 'Return approved successfully!' : 'Return rejected successfully!'));
      
      // Reload orders to reflect the change
      loadOrders();
    } catch (error) {
      console.error('Error processing return:', error);
      alert('Failed to process return. Please try again.');
    }
  };

  const getNextStatus = (currentStatus) => {
    switch (currentStatus) {
      case 'pending':
        return 'processing';
      case 'processing':
        return 'shipped';
      case 'shipped':
        return 'delivered';
      default:
        return null;
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      <AdminSidebar />
      <AdminHeader />

      <main className="ml-64 mt-16 p-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Order List</h1>
          <p className="text-sm text-gray-500">Home &gt; Order List</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4 mb-6">
          <div
            onClick={() => filterOrders('all')}
            className={`bg-white rounded-lg p-6 shadow-sm cursor-pointer hover:shadow-md transition ${
              filterStatus === 'all' ? 'ring-2 ring-teal-600' : ''
            }`}
          >
            <h3 className="text-sm text-gray-600 mb-2">Total Orders</h3>
            <p className="text-3xl font-bold text-gray-800">{orders.length}</p>
          </div>

          <div
            onClick={() => filterOrders('pending')}
            className={`bg-white rounded-lg p-6 shadow-sm cursor-pointer hover:shadow-md transition ${
              filterStatus === 'pending' ? 'ring-2 ring-yellow-600' : ''
            }`}
          >
            <h3 className="text-sm text-gray-600 mb-2">Pending</h3>
            <p className="text-3xl font-bold text-yellow-600">{getStatusCount('pending')}</p>
          </div>

          <div
            onClick={() => filterOrders('processing')}
            className={`bg-white rounded-lg p-6 shadow-sm cursor-pointer hover:shadow-md transition ${
              filterStatus === 'processing' ? 'ring-2 ring-blue-600' : ''
            }`}
          >
            <h3 className="text-sm text-gray-600 mb-2">Processing</h3>
            <p className="text-3xl font-bold text-blue-600">{getStatusCount('processing')}</p>
          </div>

          <div
            onClick={() => filterOrders('shipped')}
            className={`bg-white rounded-lg p-6 shadow-sm cursor-pointer hover:shadow-md transition ${
              filterStatus === 'shipped' ? 'ring-2 ring-purple-600' : ''
            }`}
          >
            <h3 className="text-sm text-gray-600 mb-2">Shipped</h3>
            <p className="text-3xl font-bold text-purple-600">{getStatusCount('shipped')}</p>
          </div>

          <div
            onClick={() => filterOrders('delivered')}
            className={`bg-white rounded-lg p-6 shadow-sm cursor-pointer hover:shadow-md transition ${
              filterStatus === 'delivered' ? 'ring-2 ring-green-600' : ''
            }`}
          >
            <h3 className="text-sm text-gray-600 mb-2">Delivered</h3>
            <p className="text-3xl font-bold text-green-600">{getStatusCount('delivered')}</p>
          </div>

          <div
            onClick={() => filterOrders('returned')}
            className={`bg-white rounded-lg p-6 shadow-sm cursor-pointer hover:shadow-md transition ${
              filterStatus === 'returned' ? 'ring-2 ring-gray-600' : ''
            }`}
          >
            <h3 className="text-sm text-gray-600 mb-2">Returned</h3>
            <p className="text-3xl font-bold text-gray-600">{getStatusCount('returned')}</p>
          </div>

          <div
            onClick={() => filterOrders('return_overdue')}
            className={`bg-white rounded-lg p-6 shadow-sm cursor-pointer hover:shadow-md transition ${
              filterStatus === 'return_overdue' ? 'ring-2 ring-red-600' : ''
            }`}
          >
            <h3 className="text-sm text-gray-600 mb-2">Return Overdue</h3>
            <p className="text-3xl font-bold text-red-600">{getStatusCount('return_overdue')}</p>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-bold">
              {filterStatus === 'all' ? 'All Orders' : `${formatStatus(filterStatus)} Orders`}
            </h2>
            <div className="flex items-center gap-4">
              <p className="text-sm text-gray-500">{filteredOrders.length} orders</p>
              <button
                onClick={loadOrders}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                title="Refresh orders"
              >
                <FaSync className={loading ? 'animate-spin' : ''} />
                Refresh
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4">
                      <input type="checkbox" className="rounded" />
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Order ID</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Customer</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Product</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Total</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Payment</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="text-center py-12 text-gray-500">
                        No orders found
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => {
                      const firstItem = order.items && order.items.length > 0 ? order.items[0] : null;
                      return (
                      <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <input type="checkbox" className="rounded" />
                        </td>
                        <td className="py-3 px-4 text-sm font-semibold">#{order.orderNumber}</td>
                        <td className="py-3 px-4 text-sm">
                          {new Date(order.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          <div>
                            <p className="font-semibold">{order.contactInfo?.email || 'N/A'}</p>
                            <p className="text-xs text-gray-500">{order.contactInfo?.phone || ''}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {firstItem ? (
                            <div className="flex items-center space-x-3">
                              <img
                                src={firstItem.productImageUrl || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="50" height="50"%3E%3Crect fill="%23ddd" width="50" height="50"/%3E%3C/svg%3E'}
                                alt={firstItem.productName}
                                className="w-12 h-12 rounded object-cover"
                              />
                              <div>
                                <p className="font-semibold text-sm">{firstItem.productName?.substring(0, 25)}...</p>
                                <p className="text-xs text-gray-500">
                                  {firstItem.size ? `Size: ${firstItem.size}` : ''} 
                                  {firstItem.rentalPeriod ? ` | ${firstItem.rentalPeriod}` : ''}
                                </p>
                                {firstItem.returnStatus && firstItem.returnStatus !== 'not_returned' && (
                                  <div className="flex items-center gap-2">
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                                      firstItem.returnStatus === 'returned' ? 'bg-green-100 text-green-800' : 
                                      firstItem.returnStatus === 'return_submitted' ? 'bg-yellow-100 text-yellow-800' : 
                                      'bg-gray-100 text-gray-800'
                                    }`}>
                                      {firstItem.returnStatus === 'returned' ? '✓ Returned' : 
                                       firstItem.returnStatus === 'return_submitted' ? '⏳ Return Submitted' : 
                                       firstItem.returnStatus}
                                    </span>
                                    {firstItem.returnStatus === 'return_submitted' && (
                                      <div className="flex gap-1">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleReturnApproval(order.id, firstItem.productId, true);
                                          }}
                                          className="text-xs px-2 py-0.5 bg-green-600 text-white rounded hover:bg-green-700 transition"
                                          title="Approve Return"
                                        >
                                          ✓ Approve
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleReturnApproval(order.id, firstItem.productId, false);
                                          }}
                                          className="text-xs px-2 py-0.5 bg-red-600 text-white rounded hover:bg-red-700 transition"
                                          title="Reject Return"
                                        >
                                          ✗ Reject
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                )}
                                {order.items.length > 1 && (
                                  <p className="text-xs text-gray-400">
                                    +{order.items.length - 1} more item(s)
                                    {order.items.filter(i => i.returnStatus === 'returned').length > 0 && 
                                      ` (${order.items.filter(i => i.returnStatus === 'returned').length} returned)`}
                                  </p>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400">No items</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-sm font-semibold">${order.total ? order.total.toFixed(2) : '0.00'}</td>
                        <td className="py-3 px-4 text-sm">
                          <div>
                            <p className="font-semibold">{order.paymentInfo?.method || 'N/A'}</p>
                            <p className="text-xs text-gray-500">
                              {order.paymentInfo?.cardLast4 ? `•••• ${order.paymentInfo.cardLast4}` : ''}
                            </p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-3 py-1 rounded-full font-semibold ${getStatusColor(order.status)}`}>
                              {formatStatus(order.status)}
                            </span>
                            {getNextStatus(order.status) && (
                              <button
                                onClick={() => handleStatusChange(order.id, getNextStatus(order.status))}
                                className="text-xs px-2 py-1 bg-teal-600 text-white rounded hover:bg-teal-700 transition"
                                title={`Mark as ${formatStatus(getNextStatus(order.status))}`}
                              >
                                → {formatStatus(getNextStatus(order.status))}
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => navigate(`/orders/${order.id}`)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                              title="View Details"
                            >
                              <FaEye />
                            </button>
                            <button
                              className="p-2 text-gray-600 hover:bg-gray-50 rounded"
                              title="Download Invoice"
                            >
                              <FaDownload />
                            </button>
                          </div>
                        </td>
                    </tr>
                    );
                  })
                )}
              </tbody>
            </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default AdminOrdersList;


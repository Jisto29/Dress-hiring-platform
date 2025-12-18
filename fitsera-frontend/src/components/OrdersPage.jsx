import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Header from './Header';
import Footer from './Footer';

function OrdersPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading } = useAuth();
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login');
    }
  }, [loading, isAuthenticated, navigate]);

  // Fetch orders from backend
  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;
      
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch('http://localhost:8080/api/orders', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          credentials: 'include',
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('📦 Orders fetched from backend:', data);
          setOrders(data.orders || []);
        } else {
          console.error('Failed to fetch orders:', response.status);
          setOrders([]);
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
        setOrders([]);
      } finally {
        setOrdersLoading(false);
      }
    };
    
    if (user) {
      fetchOrders();
    }
  }, [user]);

  if (loading || ordersLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Check if an order has overdue items
  const hasOverdueItems = (order) => {
    if (order.status !== 'delivered' || !order.items) return false;
    
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

  // Get the display status for an order
  const getDisplayStatus = (order) => {
    // Check if all items are returned
    if (order.status === 'returned') {
      return 'returned';
    }
    
    // Check for overdue items
    if (hasOverdueItems(order)) {
      return 'overdue';
    }
    
    return order.status;
  };

  const getStatusBadge = (displayStatus) => {
    switch (displayStatus?.toLowerCase()) {
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'returned':
        return 'bg-teal-100 text-teal-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'processing':
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="bg-beige min-h-screen">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black mb-2">My Orders</h1>
          <p className="text-gray-600">Track and manage your rental orders</p>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-600 mb-4">You haven't placed any orders yet</p>
            <button
              onClick={() => navigate('/')}
              className="bg-olive-dark text-white px-6 py-3 rounded-lg hover:bg-opacity-90 transition"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer"
                onClick={() => navigate(`/orders/${order.id}`)}
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-black mb-1">
                      Order #{order.orderNumber}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Placed on {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <div className="mt-2 md:mt-0">
                    {(() => {
                      const displayStatus = getDisplayStatus(order);
                      return (
                        <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusBadge(displayStatus)}`}>
                          {displayStatus === 'overdue' && '⚠️ '}
                          {displayStatus === 'returned' && '✓ '}
                          {displayStatus?.charAt(0).toUpperCase() + displayStatus?.slice(1)}
                        </span>
                      );
                    })()}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Items</p>
                      <p className="font-semibold">{order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Total</p>
                      <p className="font-semibold">${order.total?.toFixed(2) || '0.00'}</p>
                    </div>
                    <div>
                      {(() => {
                        const displayStatus = getDisplayStatus(order);
                        
                        if (displayStatus === 'overdue') {
                          // Find earliest overdue return date
                          const overdueItem = order.items?.find(item => {
                            if (item.returnStatus === 'returned' || !item.expectedReturnDate) return false;
                            const returnDate = new Date(item.expectedReturnDate);
                            const today = new Date();
                            returnDate.setHours(0, 0, 0, 0);
                            today.setHours(0, 0, 0, 0);
                            return today > returnDate;
                          });
                          return (
                            <>
                              <p className="text-sm text-red-600 mb-1 font-medium">Overdue Since</p>
                              <p className="font-semibold text-red-800">{formatDate(overdueItem?.expectedReturnDate)}</p>
                            </>
                          );
                        }
                        
                        if (displayStatus === 'returned') {
                          return (
                            <>
                              <p className="text-sm text-gray-600 mb-1">Returned</p>
                              <p className="font-semibold">{formatDate(order.updatedAt)}</p>
                            </>
                          );
                        }
                        
                        return (
                          <>
                            <p className="text-sm text-gray-600 mb-1">
                              {order.status === 'delivered' ? 'Delivered on' : 
                               order.status === 'shipped' ? 'Shipped on' :
                               'Order Date'}
                            </p>
                            <p className="font-semibold">
                              {order.status === 'delivered' ? formatDate(order.deliveredAt) :
                               order.status === 'shipped' ? formatDate(order.shippedAt) :
                               formatDate(order.createdAt)}
                            </p>
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {order.items?.slice(0, 3).map((item, index) => {
                      // Check if this specific item is overdue
                      const isItemOverdue = order.status === 'delivered' && 
                        item.returnStatus !== 'returned' && 
                        item.expectedReturnDate && 
                        new Date() > new Date(item.expectedReturnDate);
                      
                      const isItemReturned = item.returnStatus === 'returned';
                      
                      return (
                        <div 
                          key={index} 
                          className={`flex items-center gap-3 rounded-lg p-3 relative ${
                            isItemOverdue ? 'bg-red-50 border-2 border-red-200' :
                            isItemReturned ? 'bg-teal-50 border-2 border-teal-200' :
                            'bg-gray-50'
                          }`}
                        >
                          <img
                            src={item.productImageUrl || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="64" height="64"%3E%3Crect fill="%23ddd" width="64" height="64"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="10" fill="%23666"%3ENo Image%3C/text%3E%3C/svg%3E'}
                            alt={item.productName}
                            className="w-16 h-16 object-cover rounded"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="64" height="64"%3E%3Crect fill="%23ddd" width="64" height="64"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="10" fill="%23666"%3ENo Image%3C/text%3E%3C/svg%3E';
                            }}
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-black">{item.productName}</p>
                            <p className="text-xs text-gray-600">
                              {item.size && `Size: ${item.size}`} {item.size && item.color && '| '} {item.color && `Color: ${item.color}`}
                            </p>
                            <p className="text-sm font-semibold text-olive-dark">${item.price?.toFixed(2) || '0.00'}</p>
                            {isItemOverdue && (
                              <p className="text-xs font-semibold text-red-600 mt-1">⚠️ Overdue</p>
                            )}
                            {isItemReturned && (
                              <p className="text-xs font-semibold text-teal-600 mt-1">✓ Returned</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {order.items?.length > 3 && (
                      <div className="flex items-center justify-center bg-gray-50 rounded-lg p-3 w-24">
                        <p className="text-sm font-medium text-gray-600">
                          +{order.items.length - 3} more
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t flex justify-end">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/orders/${order.id}`);
                    }}
                    className="text-olive-dark hover:text-opacity-80 font-medium flex items-center gap-2"
                  >
                    View Details
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

export default OrdersPage;


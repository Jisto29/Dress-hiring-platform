import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Header from './Header';
import Footer from './Footer';
import ReturnModal from './ReturnModal';
import ReviewSubmissionModal from './ReviewSubmissionModal';

function OrderTrackingPage() {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const { user, isAuthenticated, loading } = useAuth();
  const [order, setOrder] = useState(null);
  const [orderLoading, setOrderLoading] = useState(true);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedItemIndex, setSelectedItemIndex] = useState(null);
  const [itemReviews, setItemReviews] = useState({}); // Store reviews for each item by productId

  // Fetch order from backend - memoized for reuse
  const fetchOrder = useCallback(async () => {
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`http://localhost:8080/api/orders/${orderId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          credentials: 'include',
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('📦 Order fetched from backend:', data);
          const fetchedOrder = data.order;
          
          // Convert backend DTO to frontend format
          const formattedOrder = {
            id: fetchedOrder.id,
            orderNumber: fetchedOrder.orderNumber,
            status: fetchedOrder.status,
            subtotal: fetchedOrder.subtotal,
            discount: fetchedOrder.discount || 0,
            deliveryFee: fetchedOrder.deliveryFee || 0,
            total: fetchedOrder.total,
            orderDate: new Date(fetchedOrder.createdAt).toLocaleDateString(),
            estimatedDelivery: fetchedOrder.deliveredAt 
              ? new Date(fetchedOrder.deliveredAt).toLocaleDateString()
              : fetchedOrder.estimatedDeliveryDate
                ? new Date(fetchedOrder.estimatedDeliveryDate).toLocaleDateString()
                : 'Pending',
            shippingAddress: {
              street: fetchedOrder.deliveryAddress?.line1,
              city: fetchedOrder.deliveryAddress?.city,
              state: fetchedOrder.deliveryAddress?.state,
              zipCode: fetchedOrder.deliveryAddress?.postalCode,
              country: fetchedOrder.deliveryAddress?.country,
            },
            paymentMethod: fetchedOrder.paymentInfo?.method,
            items: fetchedOrder.items?.map(item => ({
              id: item.productId,
              productId: item.productId,
              name: item.productName,
              brand: item.productBrand,
              image: item.productImageUrl,
              size: item.size,
              color: item.color,
              price: item.price,
              rentalPeriod: item.rentalPeriod,
              quantity: item.quantity,
              desiredDeliveryDate: item.desiredDeliveryDate,
              needsExpressDelivery: item.needsExpressDelivery,
              returnStatus: item.returnStatus || 'not_returned',
              returnDate: item.returnDate,
              returnCondition: item.returnCondition,
              expectedReturnDate: item.expectedReturnDate,
            })) || [],
            trackingStages: [
              { stage: 'Order Placed', completed: true, date: new Date(fetchedOrder.createdAt).toLocaleDateString() },
              { stage: 'Processing', completed: ['processing', 'shipped', 'delivered'].includes(fetchedOrder.status), date: '' },
              { stage: 'Shipped', completed: ['shipped', 'delivered'].includes(fetchedOrder.status), date: fetchedOrder.shippedAt ? new Date(fetchedOrder.shippedAt).toLocaleDateString() : '' },
              { stage: 'Delivered', completed: fetchedOrder.status === 'delivered', date: fetchedOrder.deliveredAt ? new Date(fetchedOrder.deliveredAt).toLocaleDateString() : '' }
            ]
          };
          
          setOrder(formattedOrder);
          
          // Fetch reviews for all items in the order
          fetchItemReviews(formattedOrder);
        } else {
          console.error('Failed to fetch order:', response.status);
          navigate('/orders');
        }
      } catch (error) {
        console.error('Error fetching order:', error);
        navigate('/orders');
      } finally {
        setOrderLoading(false);
      }
  }, [orderId, navigate]);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login');
      return;
    }
    
    if (loading) return;
    
    if (user) {
      fetchOrder();
    }
  }, [isAuthenticated, user, loading, fetchOrder, navigate]);

  // Fetch reviews for all items in the order
  const fetchItemReviews = async (order) => {
    try {
      if (!user || !user.email) {
        console.log('User not available yet, skipping review fetch');
        return;
      }
      
      const reviewsMap = {};
      
      for (const item of order.items) {
        const productId = item.id || item.productId;
        const response = await fetch(`http://localhost:8080/api/reviews/product/${productId}`);
        
        if (response.ok) {
          const allReviews = await response.json();
          // Find this customer's review for this product
          const customerReview = allReviews.find(r => r.customerEmail === user.email);
          if (customerReview) {
            reviewsMap[productId] = customerReview;
          }
        }
      }
      
      setItemReviews(reviewsMap);
      console.log('Fetched reviews for items:', reviewsMap);
    } catch (error) {
      console.error('Error fetching item reviews:', error);
    }
  };

  const syncOrderStatusWithBackend = async (localOrder) => {
    try {
      // Refetch the current order from backend
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:8080/api/orders/${localOrder.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });
      
      if (!response.ok) {
        console.error('Failed to refresh order:', response.status);
        return;
      }
      
      const data = await response.json();
      const fetchedOrder = data.order;
      
      // Convert backend DTO to frontend format
      const formattedOrder = {
        id: fetchedOrder.id,
        orderNumber: fetchedOrder.orderNumber,
        status: fetchedOrder.status,
        subtotal: fetchedOrder.subtotal,
        discount: fetchedOrder.discount || 0,
        deliveryFee: fetchedOrder.deliveryFee || 0,
        total: fetchedOrder.total,
        orderDate: new Date(fetchedOrder.createdAt).toLocaleDateString(),
        estimatedDelivery: fetchedOrder.deliveredAt 
          ? new Date(fetchedOrder.deliveredAt).toLocaleDateString()
          : fetchedOrder.estimatedDeliveryDate
            ? new Date(fetchedOrder.estimatedDeliveryDate).toLocaleDateString()
            : 'Pending',
        shippingAddress: {
          street: fetchedOrder.deliveryAddress?.line1,
          city: fetchedOrder.deliveryAddress?.city,
          state: fetchedOrder.deliveryAddress?.state,
          zipCode: fetchedOrder.deliveryAddress?.postalCode,
          country: fetchedOrder.deliveryAddress?.country,
        },
        paymentMethod: fetchedOrder.paymentInfo?.method,
        items: fetchedOrder.items?.map(item => ({
          id: item.productId,
          productId: item.productId,
          name: item.productName,
          brand: item.productBrand,
          image: item.productImageUrl,
          size: item.size,
          color: item.color,
          price: item.price,
          rentalPeriod: item.rentalPeriod,
          quantity: item.quantity,
          desiredDeliveryDate: item.desiredDeliveryDate,
          needsExpressDelivery: item.needsExpressDelivery,
          returnStatus: 'not_returned',
        })) || [],
        trackingStages: [
          { stage: 'Order Placed', completed: true, date: new Date(fetchedOrder.createdAt).toLocaleDateString() },
          { stage: 'Processing', completed: ['processing', 'shipped', 'delivered'].includes(fetchedOrder.status), date: '' },
          { stage: 'Shipped', completed: ['shipped', 'delivered'].includes(fetchedOrder.status), date: fetchedOrder.shippedAt ? new Date(fetchedOrder.shippedAt).toLocaleDateString() : '' },
          { stage: 'Delivered', completed: fetchedOrder.status === 'delivered', date: fetchedOrder.deliveredAt ? new Date(fetchedOrder.deliveredAt).toLocaleDateString() : '' }
        ]
      };
      
      // Check if status changed
      if (localOrder.status !== fetchedOrder.status) {
        alert(`Order status updated to: ${fetchedOrder.status.charAt(0).toUpperCase() + fetchedOrder.status.slice(1)}`);
      }
      
      setOrder(formattedOrder);
      console.log('Order refreshed successfully');
    } catch (error) {
      console.error('Error refreshing order:', error);
    }
  };
  
  const handleRefreshStatus = async () => {
    if (order) {
      await syncOrderStatusWithBackend(order);
    }
  };

  if (loading || orderLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading order...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600">Order not found</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'returned':
        return 'bg-gray-100 text-gray-800';
      case 'return overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const shouldShowTracking = order.status !== 'returned' && order.status !== 'return overdue';

  const handleReturnSubmit = async (returnData) => {
    try {
      if (!user || selectedItemIndex === null || !order) return;
      
      const item = order.items[selectedItemIndex];
      const productId = item.productId || item.id;
      
      console.log('📦 Processing return for item:', item.name, 'Product ID:', productId);
      console.log('Order ID:', order.id);
      console.log('Return condition:', returnData.condition);
      
      // Submit return to backend
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:8080/api/orders/${order.id}/items/${productId}/return`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({ condition: returnData.condition }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to process return');
      }
      
      const data = await response.json();
      console.log('✅ Return processed successfully:', data);
      
      // Refresh the order data
      await fetchOrder();
      
      // Close return modal
      setShowReturnModal(false);
      
      // Show review modal for this specific item
      setShowReviewModal(true);
      
      alert('Return submitted successfully! Awaiting admin confirmation.');
    } catch (error) {
      console.error('Error submitting return:', error);
      alert('Failed to submit return. Please try again.');
    }
  };
  
  const handleItemReturn = (index) => {
    setSelectedItemIndex(index);
    setShowReturnModal(true);
  };
  
  const checkItemOverdue = (item) => {
    if (!item.expectedReturnDate) return false;
    const dueDate = new Date(item.expectedReturnDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to compare only dates
    dueDate.setHours(0, 0, 0, 0);
    return today > dueDate && (!item.returnStatus || item.returnStatus === 'not_returned');
  };
  
  const getItemStatusBadge = (item) => {
    if (item.returnStatus === 'returned') {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
          ✓ Returned
        </span>
      );
    } else if (item.returnStatus === 'return_submitted') {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
          ⏳ Return Submitted (Pending Admin Review)
        </span>
      );
    } else if (item.returnStatus === 'not_returned' && item.returnDate) {
      // Only show "Admin Rejected" if there's a return date (meaning it was submitted and then rejected)
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
          ✗ Not Returned (Admin Rejected)
        </span>
      );
    } else if (checkItemOverdue(item)) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
          ⚠ Unreturned (Overdue)
        </span>
      );
    } else if (order.status === 'delivered') {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
          Awaiting Return
        </span>
      );
    }
    return null;
  };

  const handleReviewSubmit = async (reviewData) => {
    try {
      if (selectedItemIndex === null) {
        console.error('No item selected for review');
        return;
      }
      
      const selectedItem = order.items[selectedItemIndex];
      const productId = selectedItem.id || selectedItem.productId;
      console.log('Submitting review for item:', selectedItem);
      
      // Check if editing existing review
      const existingReview = itemReviews[productId];
      
      // Create review object
      const review = {
        productId: productId,
        productBrand: selectedItem.brand,
        productTitle: selectedItem.name,
        orderId: order.id,
        customerName: user.fullName || user.full_name || user.name || 'Anonymous',
        customerEmail: user.email,
        rating: reviewData.rating,
        comment: reviewData.comment,
        reviewTitle: reviewData.reviewTitle
      };
      
      console.log('Submitting review to backend:', review);
      
      let response;
      if (existingReview) {
        // Update existing review
        response = await fetch(`http://localhost:8080/api/reviews/${existingReview.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(review)
        });
      } else {
        // Create new review
        response = await fetch('http://localhost:8080/api/reviews', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(review)
        });
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Backend error:', errorText);
        throw new Error('Failed to submit review');
      }
      
      const savedReview = await response.json();
      console.log('Review saved successfully:', savedReview);
      
      // Update local reviews map
      setItemReviews(prev => ({
        ...prev,
        [productId]: savedReview
      }));
      
      setShowReviewModal(false);
      setSelectedItemIndex(null);
      alert(existingReview ? 'Review updated successfully!' : 'Thank you for your review!');
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review. Please try again.');
    }
  };

  const handleDeleteReview = async (productId, reviewId) => {
    if (!confirm('Are you sure you want to delete your review?')) {
      return;
    }
    
    try {
      const response = await fetch(`http://localhost:8080/api/reviews/${reviewId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete review');
      }
      
      // Remove from local reviews map
      setItemReviews(prev => {
        const updated = { ...prev };
        delete updated[productId];
        return updated;
      });
      
      alert('Review deleted successfully!');
    } catch (error) {
      console.error('Error deleting review:', error);
      alert('Failed to delete review. Please try again.');
    }
  };

  const handleLeaveReview = (index) => {
    setSelectedItemIndex(index);
    setShowReviewModal(true);
  };

  return (
    <div className="bg-beige min-h-screen">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/orders')}
            className="text-gray-600 hover:text-black mb-4 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Orders
          </button>
          <h1 className="text-3xl font-bold text-black mb-2">Order #{order.orderNumber}</h1>
        </div>

        {/* Buttons and Date */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex gap-3">
              <button className="px-6 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Invoice
              </button>
              <button 
                onClick={() => navigate(`/orders/${orderId}`)}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Track order
              </button>
              <button 
                onClick={handleRefreshStatus}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh Status
              </button>
            </div>
            <div className="text-sm">
              <span className="text-gray-600">Order date: </span>
              <span className="font-semibold">{order.orderDate}</span>
              <span className="mx-3">|</span>
              <span className="text-green-600">📦 Estimated delivery: </span>
              <span className="font-semibold text-green-600">{order.estimatedDelivery}</span>
            </div>
          </div>
        </div>

        {/* Tracking Progress Bar */}
        {shouldShowTracking && order.trackingStages && (
          <div className="bg-white rounded-lg shadow-md p-8 mb-6">
            <div className="relative">
              {/* Progress Line */}
              <div className="absolute top-6 left-0 right-0 h-1 bg-gray-200">
                <div 
                  className="h-full bg-green-500 transition-all duration-500"
                  style={{ 
                    width: `${(order.trackingStages.filter(s => s.completed).length - 1) / (order.trackingStages.length - 1) * 100}%`
                  }}
                ></div>
              </div>

              {/* Tracking Stages */}
              <div className="relative flex justify-between">
                {order.trackingStages.map((stage, index) => (
                  <div key={index} className="flex flex-col items-center" style={{ width: '25%' }}>
                    {/* Circle */}
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center z-10 ${
                      stage.completed ? 'bg-green-500' : 'bg-gray-200'
                    }`}>
                      {stage.completed ? (
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <div className="w-3 h-3 bg-white rounded-full"></div>
                      )}
                    </div>
                    {/* Label */}
                    <div className="mt-4 text-center">
                      <p className={`text-sm font-semibold ${stage.completed ? 'text-green-600' : 'text-gray-400'}`}>
                        {stage.stage}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{stage.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Return Status */}
        {order.status === 'returned' && (
          <div className="bg-gray-100 rounded-lg p-6 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-lg">Order Returned</p>
                <p className="text-sm text-gray-600">Returned on {order.returnDate}</p>
                {order.returnReason && (
                  <p className="text-sm text-gray-600">Reason: {order.returnReason}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Return Overdue Status */}
        {order.status === 'return overdue' && (
          <div className="bg-red-100 rounded-lg p-6 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-lg text-red-800">Return Overdue</p>
                <p className="text-sm text-red-700">Return was due by {order.returnDueDate}</p>
                <p className="text-sm text-red-700 font-medium mt-1">Please return the items as soon as possible to avoid additional charges.</p>
              </div>
            </div>
          </div>
        )}

        {/* Products List */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-black mb-6">Order Items</h2>
          <div className="space-y-4">
            {order.items.map((item, index) => (
              <div key={index} className="flex gap-4 pb-4 border-b last:border-b-0">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-24 h-32 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-black mb-1">{item.name}</h3>
                      <p className="text-sm text-gray-600 mb-1">Size: {item.size}</p>
                      <p className="text-sm text-gray-600 mb-1">Color: {item.color}</p>
                      <p className="text-lg font-bold text-olive-dark">${item.price}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {getItemStatusBadge(item)}
                      {/* Show expected return date after delivery */}
                      {order.status === 'delivered' && item.expectedReturnDate && (!item.returnStatus || item.returnStatus === 'not_returned') && (
                        <p className="text-xs text-gray-600 font-medium">
                          Return by: {new Date(item.expectedReturnDate).toLocaleDateString()}
                        </p>
                      )}
                      {/* Show return button only for delivered items that haven't been returned or submitted */}
                      {order.status === 'delivered' && (!item.returnStatus || item.returnStatus === 'not_returned') && !checkItemOverdue(item) && (
                        <button
                          onClick={() => handleItemReturn(index)}
                          className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition text-sm flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                          </svg>
                          Return Item
                        </button>
                      )}
                      {/* Show overdue warning with return button */}
                      {checkItemOverdue(item) && (
                        <button
                          onClick={() => handleItemReturn(index)}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          Return Now (Overdue)
                        </button>
                      )}
                      
                      {/* Review buttons - only show for returned items */}
                      {item.returnStatus === 'returned' && (() => {
                        const productId = item.id || item.productId;
                        const existingReview = itemReviews[productId];
                        
                        if (existingReview) {
                          // Show edit and delete buttons
                          return (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleLeaveReview(index)}
                                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-xs flex items-center gap-1"
                                title="Edit your review"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Edit Review
                              </button>
                              <button
                                onClick={() => handleDeleteReview(productId, existingReview.id)}
                                className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-xs flex items-center gap-1"
                                title="Delete your review"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Delete
                              </button>
                            </div>
                          );
                        } else {
                          // Show leave review button
                          return (
                            <button
                              onClick={() => handleLeaveReview(index)}
                              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition text-sm flex items-center gap-2"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                              </svg>
                              Leave Review
                            </button>
                          );
                        }
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Delivery and Order Summary */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Delivery Address */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-black mb-4">Delivery</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600 mb-1">Address</p>
                <div className="text-black leading-relaxed">
                  {order.shippingAddress.street && (
                    <p>{order.shippingAddress.street}</p>
                  )}
                  {order.shippingAddress.city && (
                    <p>
                      {order.shippingAddress.city}
                      {order.shippingAddress.state && `, ${order.shippingAddress.state}`}
                      {order.shippingAddress.zipCode && ` ${order.shippingAddress.zipCode}`}
                    </p>
                  )}
                  {order.shippingAddress.country && (
                    <p>{order.shippingAddress.country}</p>
                  )}
                </div>
              </div>
              {user.mobile && (
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="text-black">{user.mobile}</p>
                </div>
              )}
            </div>

            {order.paymentMethod && (
              <div className="mt-6 pt-4 border-t">
                <h4 className="text-md font-semibold text-black mb-2">Payment</h4>
                <p className="text-black">{order.paymentMethod}</p>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-black mb-4">Order Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-semibold">${order.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-red-600">
                <span>Discount (-20%)</span>
                <span>-${order.discount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Delivery Fee</span>
                <span className="font-semibold">${order.deliveryFee.toFixed(2)}</span>
              </div>
              <div className="border-t pt-3 flex justify-between text-xl font-bold">
                <span>Total</span>
                <span>${order.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

        {/* Return Modal */}
        {selectedItemIndex !== null && (
          <ReturnModal
            isOpen={showReturnModal}
            onClose={() => {
              setShowReturnModal(false);
              setSelectedItemIndex(null);
            }}
            product={{
              productImage: order.items[selectedItemIndex]?.image,
              productTitle: order.items[selectedItemIndex]?.name,
              size: order.items[selectedItemIndex]?.size,
              color: order.items[selectedItemIndex]?.color,
              returnDate: order.returnDueDate,
              total: order.items[selectedItemIndex]?.price
            }}
            onSubmit={handleReturnSubmit}
          />
        )}

        {/* Review Submission Modal */}
        {selectedItemIndex !== null && (
          <ReviewSubmissionModal
            isOpen={showReviewModal}
            onClose={() => {
              setShowReviewModal(false);
              setSelectedItemIndex(null);
            }}
            product={{
              productImage: order.items[selectedItemIndex]?.image,
              productTitle: order.items[selectedItemIndex]?.name,
              brand: order.items[selectedItemIndex]?.brand,
              size: order.items[selectedItemIndex]?.size
            }}
            orderId={order.id}
            onSubmit={handleReviewSubmit}
            existingReview={selectedItemIndex !== null ? itemReviews[order.items[selectedItemIndex]?.id || order.items[selectedItemIndex]?.productId] : null}
          />
        )}

      <Footer />
    </div>
  );
}

export default OrderTrackingPage;


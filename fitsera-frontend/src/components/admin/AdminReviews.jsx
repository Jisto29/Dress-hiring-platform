import { useState, useEffect } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import { FaStar } from 'react-icons/fa';

function AdminReviews() {
  const { admin, isAdminAuthenticated, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRating, setFilterRating] = useState('all');

  useEffect(() => {
    if (!adminLoading && !isAdminAuthenticated) {
      navigate('/admin/login');
      return;
    }
    
    if (isAdminAuthenticated && admin?.accountId) {
      loadReviews();
    }
  }, [isAdminAuthenticated, adminLoading, admin?.accountId, navigate]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      
      // Check if admin and accountId are available
      if (!admin?.accountId) {
        console.log('❌ Admin accountId not available yet');
        setLoading(false);
        return;
      }
      
      console.log('🔍 Fetching reviews for accountId:', admin.accountId);
      
      // Fetch reviews for this brand's account from backend
      const response = await fetch(`http://localhost:8080/api/reviews/account/${admin.accountId}`);
      
      console.log('📡 Response status:', response.status, response.statusText);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const brandReviews = await response.json();
      console.log('📝 Reviews fetched for brand:', brandReviews);
      console.log('📊 Number of reviews:', brandReviews?.length || 0);
      
      setReviews(brandReviews || []);
    } catch (error) {
      console.error('❌ Error loading reviews:', error);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  if (adminLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAdminAuthenticated || !admin) {
    return null;
  }

  const getFilteredReviews = () => {
    if (filterRating === 'all') return reviews;
    return reviews.filter(review => review.rating === parseInt(filterRating));
  };

  const filteredReviews = getFilteredReviews();
  
  console.log('🎯 Rendering AdminReviews:', {
    reviewsCount: reviews.length,
    filteredReviewsCount: filteredReviews.length,
    filterRating,
    loading,
    reviews
  });

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
    : 0;

  const getRatingCount = (stars) => {
    return reviews.filter(review => review.rating === stars).length;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <AdminSidebar />
      <AdminHeader />
      
      <main className="ml-64 mt-16 p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Customer Reviews</h1>
            <p className="text-gray-600 mt-2">Manage and respond to customer feedback</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-sm text-gray-600 mb-2">Total Reviews</h3>
              <p className="text-3xl font-bold text-gray-800">{reviews.length}</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-sm text-gray-600 mb-2">Average Rating</h3>
              <div className="flex items-center gap-2">
                <p className="text-3xl font-bold text-gray-800">{averageRating}</p>
                <FaStar className="text-yellow-400 text-2xl" />
              </div>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-sm text-gray-600 mb-2">5 Star Reviews</h3>
              <p className="text-3xl font-bold text-green-600">{getRatingCount(5)}</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-sm text-gray-600 mb-2">1-2 Star Reviews</h3>
              <p className="text-3xl font-bold text-red-600">{getRatingCount(1) + getRatingCount(2)}</p>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="bg-white rounded-lg shadow-sm mb-6">
            <div className="flex flex-wrap gap-2 p-4">
              <button
                onClick={() => setFilterRating('all')}
                className={`px-4 py-2 rounded-lg transition ${
                  filterRating === 'all' 
                    ? 'bg-teal-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Reviews ({reviews.length})
              </button>
              {[5, 4, 3, 2, 1].map(stars => (
                <button
                  key={stars}
                  onClick={() => setFilterRating(stars.toString())}
                  className={`px-4 py-2 rounded-lg transition flex items-center gap-1 ${
                    filterRating === stars.toString()
                      ? 'bg-teal-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {stars} <FaStar className="text-yellow-400" size={14} /> ({getRatingCount(stars)})
                </button>
              ))}
            </div>
          </div>

          {/* Reviews List */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                {filterRating === 'all' ? 'All Reviews' : `${filterRating} Star Reviews`}
              </h2>

              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading reviews...</p>
                </div>
              ) : filteredReviews.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 text-lg">No reviews found</p>
                  <p className="text-gray-400 text-sm mt-2">
                    {filterRating === 'all' 
                      ? 'Your products haven\'t received any reviews yet' 
                      : `No ${filterRating} star reviews`}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredReviews.map((review) => (
                    <div key={review.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <FaStar 
                                  key={i} 
                                  className={i < review.rating ? 'text-yellow-400' : 'text-gray-300'}
                                  size={18}
                                />
                              ))}
                            </div>
                            {review.verified && (
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                Verified Purchase
                              </span>
                            )}
                          </div>
                          <h3 className="font-semibold text-gray-800 mb-1">{review.productTitle}</h3>
                          {review.reviewTitle && (
                            <h4 className="font-medium text-gray-700 mb-2">{review.reviewTitle}</h4>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">{review.customerName}</p>
                          <p className="text-xs text-gray-400">
                            {review.createdAt ? formatDate(review.createdAt) : 'Recently'}
                          </p>
                        </div>
                      </div>
                      <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                          Order ID: {review.orderId}
                        </div>
                        <div className="text-sm text-gray-500">
                          {review.customerEmail}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
    </div>
  );
}

export default AdminReviews;


import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { FaChevronLeft, FaChevronRight, FaHeart, FaChevronDown, FaChevronUp, FaTimes, FaTruck, FaCamera } from 'react-icons/fa';
import Header from './Header';
import Footer from './Footer';
import ARTryOn from './ARTryOn';

function ProductDetailPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [calculatedRating, setCalculatedRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [selectedSize, setSelectedSize] = useState('14');
  const [rentalPeriod, setRentalPeriod] = useState('1 Week');
  const [postcode, setPostcode] = useState('');
  const [desiredDeliveryDate, setDesiredDeliveryDate] = useState('');
  const [estimatedDeliveryDays, setEstimatedDeliveryDays] = useState(0);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    sizeFit: false,
    description: true,
    aboutDesigner: false
  });
  const [showARTryOn, setShowARTryOn] = useState(false);

  // Fetch product by ID
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:8080/api/products/${productId}`);
        const data = await response.json();
        
        // Parse images JSON string if available
        let imagesArray = [];
        if (data.images) {
          try {
            imagesArray = JSON.parse(data.images);
          } catch (e) {
            console.warn('Failed to parse images JSON, using imageUrl instead');
            imagesArray = [data.imageUrl];
          }
        } else if (data.imageUrl) {
          imagesArray = [data.imageUrl];
        }
        
        const productData = {
          ...data,
          name: data.title,
          images: imagesArray
        };
        
        setProduct(productData);
      } catch (error) {
        console.error('Error fetching product:', error);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    const fetchReviews = async () => {
      try {
        console.log('Fetching reviews for product:', productId);
        const response = await fetch(`http://localhost:8080/api/reviews/product/${productId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch reviews');
        }
        const data = await response.json();
        console.log('Reviews fetched:', data.length, 'reviews');
        console.log('Reviews data:', data);
        setReviews(data);
        setReviewCount(data.length);
        
        // Calculate average rating
        if (data.length > 0) {
          const avgRating = data.reduce((sum, review) => sum + review.rating, 0) / data.length;
          setCalculatedRating(avgRating);
          console.log('Calculated rating:', avgRating);
        } else {
          setCalculatedRating(0);
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
        setReviews([]);
        setReviewCount(0);
        setCalculatedRating(0);
      }
    };

    fetchProduct();
    fetchReviews();
  }, [productId]);

  // Refresh reviews when page gains visibility (user comes back from another tab/page)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('Page visible - refreshing reviews');
        const fetchReviews = async () => {
          try {
            const response = await fetch(`http://localhost:8080/api/reviews/product/${productId}`);
            if (response.ok) {
              const data = await response.json();
              console.log('Reviews refreshed:', data.length, 'reviews');
              setReviews(data);
              setReviewCount(data.length);
              
              if (data.length > 0) {
                const avgRating = data.reduce((sum, review) => sum + review.rating, 0) / data.length;
                setCalculatedRating(avgRating);
              } else {
                setCalculatedRating(0);
              }
            }
          } catch (error) {
            console.error('Error refreshing reviews:', error);
          }
        };
        fetchReviews();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [productId]);

  // Check if product is in wishlist
  useEffect(() => {
    const checkWishlistStatus = async () => {
      if (isAuthenticated && user && productId) {
        try {
          const response = await fetch(
            `http://localhost:8080/api/wishlist/customer/${user.id}/check/${productId}`
          );
          if (response.ok) {
            const data = await response.json();
            setIsInWishlist(data.inWishlist);
          }
        } catch (error) {
          console.error('Error checking wishlist status:', error);
        }
      }
    };

    checkWishlistStatus();
  }, [isAuthenticated, user, productId]);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Get sizes from product data or use default
  const sizes = product?.sizes ? product.sizes.split(',').map(s => s.trim()) : ['8', '10', '12', '14'];

  // Calculate delivery days based on postcode
  const calculateDeliveryDays = (postcodeInput) => {
    if (!postcodeInput) return 0;
    
    // Simulate delivery estimation based on postcode ranges
    // In production, this would call an actual delivery API
    const code = parseInt(postcodeInput);
    
    if (code >= 2000 && code <= 2299) return 2; // Sydney metro - 2 days
    if (code >= 2300 && code <= 2599) return 3; // Sydney suburbs - 3 days
    if (code >= 3000 && code <= 3999) return 3; // Melbourne - 3 days
    if (code >= 4000 && code <= 4999) return 4; // Brisbane - 4 days
    if (code >= 5000 && code <= 5999) return 4; // Adelaide - 4 days
    if (code >= 6000 && code <= 6999) return 5; // Perth - 5 days
    if (code >= 7000 && code <= 7999) return 4; // Tasmania - 4 days
    return 5; // Other areas - 5 days
  };

  // Calculate business days from today
  const calculateBusinessDate = (businessDays) => {
    let date = new Date();
    let addedDays = 0;
    while (addedDays < businessDays) {
      date.setDate(date.getDate() + 1);
      const dayOfWeek = date.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        addedDays++;
      }
    }
    return date.toISOString().split('T')[0];
  };

  // Handle postcode change
  const handlePostcodeChange = (value) => {
    setPostcode(value);
    if (value.length >= 4) {
      const days = calculateDeliveryDays(value);
      setEstimatedDeliveryDays(days);
    }
  };

  // Handle add to cart with delivery preferences
  const handleAddToBag = () => {
    if (!product) return;
    
    if (!postcode || !desiredDeliveryDate) {
      setShowDeliveryModal(true);
      return;
    }
    
    // Calculate if express delivery is needed
    const standardDeliveryDate = calculateBusinessDate(estimatedDeliveryDays);
    const isExpressNeeded = new Date(desiredDeliveryDate) < new Date(standardDeliveryDate);
    
    addToCart({
      id: product.id,
      name: product.name || product.title,
      brand: product.brand,
      price: product.price,
      size: selectedSize,
      color: product.color || 'Default',
      rentalPeriod: rentalPeriod,
      image: product.images ? product.images[0] : product.imageUrl,
      occasion: product.occasion,
      quantity: 1,
      postcode: postcode,
      desiredDeliveryDate: desiredDeliveryDate,
      standardDeliveryDays: estimatedDeliveryDays,
      needsExpressDelivery: isExpressNeeded
    });
    
    navigate('/cart');
  };

  // Handle wishlist toggle
  const toggleWishlist = async () => {
    if (!isAuthenticated || !user) {
      alert('Please log in to add items to your wishlist');
      navigate('/login');
      return;
    }

    if (!product) return;

    setWishlistLoading(true);

    try {
      if (isInWishlist) {
        // Remove from wishlist
        const response = await fetch(
          `http://localhost:8080/api/wishlist/customer/${user.id}/product/${productId}`,
          {
            method: 'DELETE',
          }
        );

        if (response.ok) {
          setIsInWishlist(false);
          alert('Removed from wishlist!');
        } else {
          throw new Error('Failed to remove from wishlist');
        }
      } else {
        // Add to wishlist
        const wishlistItem = {
          productId: productId,
          productTitle: product.name || product.title,
          productBrand: product.brand,
          productPrice: product.price,
          productImage: product.images ? product.images[0] : product.imageUrl,
        };

        const response = await fetch(
          `http://localhost:8080/api/wishlist/customer/${user.id}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(wishlistItem),
          }
        );

        if (response.ok) {
          setIsInWishlist(true);
          alert('Added to wishlist!');
        } else {
          throw new Error('Failed to add to wishlist');
        }
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
      alert('Failed to update wishlist. Please try again.');
    } finally {
      setWishlistLoading(false);
    }
  };

  // Reviews are now fetched from backend in useEffect

  // Generate rating distribution based on actual reviews
  const generateRatingDistribution = () => {
    if (reviews.length === 0) {
      return { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    }
    
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(review => {
      if (review.rating >= 1 && review.rating <= 5) {
        distribution[review.rating]++;
      }
    });
    
    return distribution;
  };
  
  const generateRatingDistributionOld = () => {
    const rating = calculatedRating;
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

    if (rating >= 4.5) {
      distribution[5] = 60;
      distribution[4] = 25;
      distribution[3] = 10;
      distribution[2] = 3;
      distribution[1] = 2;
    } else if (rating >= 4.0) {
      distribution[5] = 45;
      distribution[4] = 35;
      distribution[3] = 12;
      distribution[2] = 5;
      distribution[1] = 3;
    } else if (rating >= 3.5) {
      distribution[5] = 30;
      distribution[4] = 35;
      distribution[3] = 20;
      distribution[2] = 10;
      distribution[1] = 5;
    } else if (rating >= 3.0) {
      distribution[5] = 20;
      distribution[4] = 25;
      distribution[3] = 30;
      distribution[2] = 15;
      distribution[1] = 10;
    } else {
      distribution[5] = 10;
      distribution[4] = 15;
      distribution[3] = 25;
      distribution[2] = 30;
      distribution[1] = 20;
    }

    return distribution;
  };

  const ratingDistribution = generateRatingDistribution();

  // Format review count for display
  const formatReviewCount = (count) => {
    if (!count) return '0';
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K+`;
    }
    return `${count}+`;
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const nextImage = () => {
    if (product && product.images) {
      setCurrentImageIndex((prev) => (prev + 1) % product.images.length);
    }
  };

  const prevImage = () => {
    if (product && product.images) {
      setCurrentImageIndex((prev) => (prev - 1 + product.images.length) % product.images.length);
    }
  };

  const selectThumbnail = (index) => {
    setCurrentImageIndex(index);
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-beige flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-olive-dark"></div>
      </div>
    );
  }

  // Show error state if product not found
  if (!product) {
    return (
      <div className="min-h-screen bg-beige flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Product not found</h2>
        <button
          onClick={() => navigate('/')}
          className="bg-olive-dark text-white px-6 py-3 rounded-lg hover:bg-opacity-90"
        >
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="bg-beige min-h-screen">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Left Side - Images */}
          <div>
            <div className="relative mb-4 bg-gray-100 rounded-lg overflow-hidden">
              <img 
                src={(product.imageUrls && product.imageUrls[currentImageIndex]) || (product.images && product.images[currentImageIndex]) || product.thumbnailUrl || product.imageUrl} 
                alt={product.name || product.title}
                className="w-full h-[600px] object-contain rounded-lg"
              />
              {((product.imageUrls && product.imageUrls.length > 1) || (product.images && product.images.length > 1)) && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white p-2 rounded-full shadow-md hover:shadow-lg"
                  >
                    <FaChevronLeft />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white p-2 rounded-full shadow-md hover:shadow-lg"
                  >
                    <FaChevronRight />
                  </button>
                </>
              )}
            </div>
            
            {/* Thumbnail Carousel */}
            {((product.imageUrls && product.imageUrls.length > 1) || (product.images && product.images.length > 1)) && (
              <div className="flex gap-2 overflow-x-auto">
                {(product.imageUrls || product.images).map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => selectThumbnail(idx)}
                    className={`flex-shrink-0 w-20 h-28 rounded-lg overflow-hidden border-2 bg-gray-100 ${
                      idx === currentImageIndex ? 'border-black' : 'border-transparent'
                    }`}
                  >
                    <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-contain" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Side - Product Info */}
          <div>
            <p className="text-lg text-gray-600 mb-2">{product.brand}</p>
            <h1 className="text-3xl font-bold text-black mb-4">{product.name || product.title}</h1>
            <p className="text-2xl font-bold text-black mb-6">${(product.price || 0).toFixed(2)} Rental</p>

            {/* Stock Availability */}
            <div className="mb-4">
              {product.stock !== undefined && product.stock !== null ? (
                product.stock > 0 ? (
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
                    <span className="text-sm font-semibold text-green-700">
                      {product.stock} {product.stock === 1 ? 'item' : 'items'} in stock
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-lg">
                    <span className="inline-block w-2 h-2 bg-red-500 rounded-full"></span>
                    <span className="text-lg font-bold text-red-600">OUT OF STOCK</span>
                  </div>
                )
              ) : null}
            </div>

            {/* One Time Rental Box */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
              <h3 className="font-semibold mb-4">One Time Rental</h3>
              
              {/* Size Selection */}
              <div className="mb-4">
                <label className="block mb-2 text-sm font-semibold">Size</label>
                <div className="flex gap-2">
                  {sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`w-14 h-14 rounded-full font-semibold transition ${
                        selectedSize === size ? 'bg-olive-dark text-white' : 'bg-gray-200 text-black hover:bg-gray-300'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rental Period */}
              <div className="mb-4">
                <label className="block mb-2 text-sm font-semibold">Rental Period</label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setRentalPeriod('1 Week')}
                    className={`px-6 py-2 rounded-lg font-semibold transition ${
                      rentalPeriod === '1 Week' ? 'bg-olive-dark text-white' : 'bg-gray-200 text-black hover:bg-gray-300'
                    }`}
                  >
                    1 Week
                  </button>
                  <button
                    onClick={() => setRentalPeriod('2 Week')}
                    className={`px-6 py-2 rounded-lg font-semibold transition ${
                      rentalPeriod === '2 Week' ? 'bg-olive-dark text-white' : 'bg-gray-200 text-black hover:bg-gray-300'
                    }`}
                  >
                    2 Week
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mb-4">
                <button 
                  onClick={handleAddToBag}
                  disabled={product.stock === 0}
                  className={`flex-1 py-3 px-6 rounded-lg font-bold transition ${
                    product.stock === 0 
                      ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                      : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
                >
                  {product.stock === 0 ? 'OUT OF STOCK' : 'ADD TO BAG'}
                </button>
                <button 
                  onClick={toggleWishlist}
                  disabled={product.stock === 0 || wishlistLoading}
                  className={`p-3 rounded-lg transition ${
                    product.stock === 0 || wishlistLoading
                      ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                      : isInWishlist
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'bg-white text-red-600 border-2 border-red-600 hover:bg-red-50'
                  }`}
                  title={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                >
                  <FaHeart className={isInWishlist ? 'fill-current' : ''} />
                </button>
              </div>

              {/* AR Try-On Button */}
              <button
                onClick={() => setShowARTryOn(true)}
                className="w-full py-3 px-6 rounded-lg font-bold transition bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 flex items-center justify-center gap-2"
              >
                <FaCamera size={20} />
                <span>Try On with AR</span>
              </button>
            </div>

            {/* Collapsible Sections */}
            <div className="space-y-2">
              <button
                onClick={() => toggleSection('sizeFit')}
                className="w-full bg-white p-4 rounded-lg shadow-md flex items-center justify-between hover:shadow-lg transition"
              >
                <span className="font-semibold">SIZE & FIT</span>
                {expandedSections.sizeFit ? <FaChevronUp /> : <FaChevronDown />}
              </button>
              {expandedSections.sizeFit && (
                <div className="bg-white p-4 rounded-lg shadow-md">
                  <p className="text-gray-700 mb-2">
                    <strong>Available Sizes:</strong> {sizes.join(', ')}
                  </p>
                  <p className="text-gray-700 mb-2">
                    Model is wearing a size 8.
                  </p>
                  <p className="text-gray-700">
                    This item runs true to size. For the best fit, please refer to our size guide.
                  </p>
                </div>
              )}
              
              <button
                onClick={() => toggleSection('description')}
                className="w-full bg-white p-4 rounded-lg shadow-md flex items-center justify-between hover:shadow-lg transition"
              >
                <span className="font-semibold">DESCRIPTION</span>
                {expandedSections.description ? <FaChevronUp /> : <FaChevronDown />}
              </button>
              {expandedSections.description && (
                <div className="bg-white p-4 rounded-lg shadow-md">
                  <p className="text-gray-700">
                    {product.description || 'No description available.'}
                  </p>
                  <p className="mt-4 text-sm text-gray-600">
                    <strong>Color:</strong> {product.color || 'N/A'}<br />
                    <strong>Category:</strong> {product.category || 'N/A'}<br />
                    <strong>Recommended for:</strong> {product.occasion || 'Various occasions'}
                  </p>
                </div>
              )}
              
              <button
                onClick={() => toggleSection('aboutDesigner')}
                className="w-full bg-white p-4 rounded-lg shadow-md flex items-center justify-between hover:shadow-lg transition"
              >
                <span className="font-semibold">ABOUT THE DESIGNER</span>
                {expandedSections.aboutDesigner ? <FaChevronUp /> : <FaChevronDown />}
              </button>
              {expandedSections.aboutDesigner && (
                <div className="bg-white p-4 rounded-lg shadow-md">
                  <p className="text-gray-700">
                    {product.brand} is a renowned fashion brand known for its exceptional quality and contemporary designs. 
                    Each piece is carefully crafted to provide both style and comfort for any occasion.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-6 text-black">Reviews</h2>
          
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* Left - Rating Summary */}
            <div>
              <div className="mb-4">
                <div className="space-y-2">
                  {[5, 4, 3, 2, 1].map((stars) => (
                    <div key={stars} className="flex items-center gap-2">
                      <span className="text-sm w-8">{stars}★</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-yellow-400 h-2 rounded-full"
                          style={{ width: `${ratingDistribution[stars]}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600">{ratingDistribution[stars]}%</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mb-4">
                <p className="text-gray-600">Total Reviews</p>
                <p className="text-2xl font-bold text-black">{reviewCount} Review{reviewCount !== 1 ? 's' : ''}</p>
              </div>
              <div>
                <p className="text-gray-600">Avg Rating</p>
                <div className="flex items-center gap-2">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={i < Math.floor(calculatedRating) ? 'text-yellow-400 text-2xl' : 'text-gray-300 text-2xl'}>
                      ★
                    </span>
                  ))}
                </div>
                <span className="text-xl font-bold text-black">{calculatedRating.toFixed(1)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Reviews */}
          <div className="space-y-4 mb-6">
            {reviews.length > 0 ? (
              reviews.map((review) => (
                <div key={review.id} className="bg-beige p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-black">{review.customerName}</span>
                      {review.verified && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Verified Purchase</span>
                      )}
                    </div>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className={i < review.rating ? 'text-yellow-400' : 'text-gray-300'}>
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                  {review.reviewTitle && (
                    <h4 className="font-semibold text-gray-800 mb-1">{review.reviewTitle}</h4>
                  )}
                  <p className="text-gray-700">{review.comment}</p>
                  {review.createdAt && (
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(review.createdAt).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <div className="bg-beige p-8 rounded-lg text-center">
                <p className="text-gray-500 text-lg">No reviews yet</p>
                <p className="text-gray-400 text-sm mt-2">Be the first to review this product!</p>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Delivery Preferences Modal */}
      {showDeliveryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative">
            <button 
              onClick={() => setShowDeliveryModal(false)} 
              className="absolute top-4 right-4 text-gray-600 hover:text-gray-900"
            >
              <FaTimes size={20} />
            </button>
            
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-black mb-2 flex items-center gap-2">
                <FaTruck className="text-red-600" />
                Delivery Details
              </h2>
              <p className="text-sm text-gray-600">Enter your delivery preferences to calculate costs</p>
            </div>

            <div className="space-y-4 mb-6">
              {/* Postcode */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Postcode <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., 2500"
                  value={postcode}
                  onChange={(e) => handlePostcodeChange(e.target.value)}
                  maxLength="4"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                />
                {estimatedDeliveryDays > 0 && (
                  <p className="mt-2 text-sm text-green-600">
                    ✓ Standard delivery: {estimatedDeliveryDays} business days
                  </p>
                )}
              </div>

              {/* Desired Delivery Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  When do you need it? <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={desiredDeliveryDate}
                  onChange={(e) => setDesiredDeliveryDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                />
                {desiredDeliveryDate && estimatedDeliveryDays > 0 && (
                  <div className="mt-2 text-sm">
                    {new Date(desiredDeliveryDate) < new Date(calculateBusinessDate(estimatedDeliveryDays)) ? (
                      <p className="text-orange-600">
                        ⚡ Express delivery required (+$15.00)
                      </p>
                    ) : (
                      <p className="text-green-600">
                        ✓ Standard delivery available
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-700">
                  <strong>Delivery Options:</strong><br/>
                  • Standard: Based on your postcode<br/>
                  • Express: When you need it faster (+$15)
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeliveryModal(false)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (postcode && desiredDeliveryDate) {
                    setShowDeliveryModal(false);
                    handleAddToBag();
                  } else {
                    alert('Please fill in all required fields');
                  }
                }}
                disabled={!postcode || !desiredDeliveryDate}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AR Try-On Modal */}
      {showARTryOn && (
        <ARTryOn 
          product={product}
          onClose={() => setShowARTryOn(false)}
        />
      )}

      <Footer />
    </div>
  );
}

export default ProductDetailPage;


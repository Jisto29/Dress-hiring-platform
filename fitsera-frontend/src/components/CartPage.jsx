import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { FaTrash, FaChevronLeft } from 'react-icons/fa';
import Header from './Header';

// Calculate estimated delivery date (3 business days from now)
const getEstimatedDeliveryDate = () => {
  const date = new Date();
  let businessDaysAdded = 0;
  
  while (businessDaysAdded < 3) {
    date.setDate(date.getDate() + 1);
    // Skip weekends (0 = Sunday, 6 = Saturday)
    if (date.getDay() !== 0 && date.getDay() !== 6) {
      businessDaysAdded++;
    }
  }
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

function CartPage() {
  const navigate = useNavigate();
  const { cartItems, updateQuantity, removeItem } = useCart();
  const { user } = useAuth();

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = subtotal * 0.2; // 20% discount
  const standardDeliveryFee = 15;
  
  // Calculate express delivery fee
  const expressDeliveryFee = cartItems.reduce((sum, item) => {
    return sum + (item.needsExpressDelivery ? 15 : 0);
  }, 0);
  
  const totalDeliveryFee = standardDeliveryFee + expressDeliveryFee;
  const total = subtotal - discount + totalDeliveryFee;

  // Get user's default address or first address
  const getDefaultAddress = () => {
    if (!user || !user.addresses || user.addresses.length === 0) {
      return null;
    }
    const defaultAddr = user.addresses.find(addr => addr.isDefault) || user.addresses[0];
    // Map backend fields to what the UI expects
    if (defaultAddr) {
      return {
        ...defaultAddr,
        street: defaultAddr.line1,
        zipCode: defaultAddr.postalCode
      };
    }
    return defaultAddr;
  };

  // Get earliest delivery date from cart items
  const getEarliestDeliveryDate = () => {
    if (cartItems.length === 0) return getEstimatedDeliveryDate();
    
    // Find the earliest desired delivery date from all cart items
    const datesWithItems = cartItems
      .filter(item => item.desiredDeliveryDate)
      .map(item => new Date(item.desiredDeliveryDate));
    
    if (datesWithItems.length === 0) return getEstimatedDeliveryDate();
    
    const earliestDate = new Date(Math.min(...datesWithItems));
    return earliestDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const defaultAddress = getDefaultAddress();
  const estimatedDelivery = getEarliestDeliveryDate();

  const handleUpdateQuantity = (item, change) => {
    updateQuantity(item.id, item.size, item.color, item.rentalPeriod, change);
  };

  const handleRemoveItem = (item) => {
    removeItem(item.id, item.size, item.color, item.rentalPeriod);
  };

  return (
    <div className="bg-beige min-h-screen">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumbs */}
        <div className="mb-6 text-sm text-gray-600 flex items-center gap-2">
          <button onClick={() => navigate('/')} className="hover:text-olive-dark">
            Home
          </button>
          <span>&gt;</span>
          <span>Cart</span>
        </div>

        <h1 className="text-4xl font-bold text-black mb-8">Your Bag</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <p className="text-gray-600 mb-4">Your bag is empty</p>
                <button 
                  onClick={() => navigate('/')}
                  className="bg-olive-dark text-white px-6 py-2 rounded-lg hover:bg-opacity-90"
                >
                  Continue Shopping
                </button>
              </div>
            ) : (
              cartItems.map((item, index) => (
                <div key={`${item.id}-${index}`} className="bg-white rounded-lg shadow-md p-4 flex gap-4">
                  <img
                    src={item.image || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="150" height="150"%3E%3Crect fill="%23ddd" width="150" height="150"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14" fill="%23666"%3ENo Image%3C/text%3E%3C/svg%3E'}
                    alt={item.title || item.name}
                    className="w-24 h-24 object-cover rounded-lg bg-gray-200"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="150" height="150"%3E%3Crect fill="%23ddd" width="150" height="150"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14" fill="%23666"%3ENo Image%3C/text%3E%3C/svg%3E';
                    }}
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-black mb-2">{item.title || item.name}</h3>
                    <div className="text-sm text-gray-600 mb-1">
                      <span>Size: {item.size}</span>
                      {' • '}
                      <span>Color: {item.color}</span>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      <span>Rental Period: {item.rentalPeriod}</span>
                    </div>
                    {item.postcode && item.desiredDeliveryDate && (
                      <div className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded inline-block mb-2">
                        {item.needsExpressDelivery ? '⚡ Express' : '📦 Standard'} delivery to {item.postcode} by {new Date(item.desiredDeliveryDate).toLocaleDateString()}
                      </div>
                    )}
                    <p className="text-lg font-bold text-black">${item.price}</p>
                  </div>
                  <div className="flex flex-col items-end justify-between">
                    <button
                      onClick={() => handleRemoveItem(item)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <FaTrash />
                    </button>
                    <div className="flex items-center gap-2 border border-gray-300 rounded-lg">
                      <button
                        onClick={() => handleUpdateQuantity(item, -1)}
                        className="px-3 py-1 hover:bg-gray-100"
                      >
                        -
                      </button>
                      <span className="px-4">{item.quantity}</span>
                      <button
                        onClick={() => handleUpdateQuantity(item, 1)}
                        className="px-3 py-1 hover:bg-gray-100"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-bold text-black mb-4">Order Summary</h2>
              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span>Discount (-20%)</span>
                  <span>-${discount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Standard Delivery</span>
                  <span>${standardDeliveryFee.toFixed(2)}</span>
                </div>
                {expressDeliveryFee > 0 && (
                  <div className="flex justify-between text-orange-600">
                    <span>⚡ Express Delivery</span>
                    <span>+${expressDeliveryFee.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t pt-3 flex justify-between text-xl font-bold text-black">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Add promo code"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-olive-dark"
                />
              </div>
              <button className="w-full bg-olive-dark text-white py-2 rounded-lg font-semibold hover:bg-opacity-90">
                Apply
              </button>
            </div>

            {/* Delivery Details */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-black">Delivery</h2>
                {user && (
                  <button
                    onClick={() => navigate('/profile')}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Edit
                  </button>
                )}
              </div>
              
              {!user ? (
                <div className="text-center py-4">
                  <p className="text-gray-600 mb-3">Please login to add delivery details</p>
                  <button
                    onClick={() => navigate('/login')}
                    className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Login
                  </button>
                </div>
              ) : !defaultAddress || (!user.mobile && !user.phone) ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-yellow-800 font-semibold mb-2">⚠️ Delivery Information Required</p>
                  <p className="text-sm text-gray-700 mb-3">
                    Please add your delivery address and phone number to complete your order.
                  </p>
                  <button
                    onClick={() => navigate('/profile')}
                    className="text-sm bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700"
                  >
                    Add Delivery Details
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Address</p>
                    <p className="text-black">
                      {defaultAddress.street || defaultAddress.line1}
                      {defaultAddress.line2 && `, ${defaultAddress.line2}`}
                      {defaultAddress.city && `, ${defaultAddress.city}`}
                      {defaultAddress.state && `, ${defaultAddress.state}`}
                      {(defaultAddress.zipCode || defaultAddress.postalCode) && ` ${defaultAddress.zipCode || defaultAddress.postalCode}`}
                      {defaultAddress.country && `, ${defaultAddress.country}`}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Phone number</p>
                    <p className="text-black">{user.mobile || user.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Estimated delivery</p>
                    <p className="text-black">{estimatedDelivery}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Checkout Button */}
        <div className="mt-8">
          <button 
            onClick={() => {
              if (!user) {
                alert('Please login to continue with checkout');
                navigate('/login');
                return;
              }
              if (!defaultAddress || (!user.mobile && !user.phone)) {
                alert('Please add your delivery address and phone number in your profile');
                navigate('/profile');
                return;
              }
              navigate('/payment', {
                state: {
                  subtotal: parseFloat(subtotal.toFixed(2)),
                  discount: parseFloat(discount.toFixed(2)),
                  deliveryFee: totalDeliveryFee,
                  total: parseFloat(total.toFixed(2))
                }
              });
            }}
            disabled={cartItems.length === 0}
            className={`w-full ${cartItems.length === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'} text-white py-4 rounded-lg font-bold text-lg transition flex items-center justify-center gap-2`}
          >
            Go to Checkout <FaChevronLeft className="rotate-180" />
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 mt-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-bold text-lg mb-4">Topcare Alterations</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition">About us</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Blog</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Careers</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Privacy</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Terms</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">cancellations</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Returns policy</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Refunds</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4">Follow Us</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition">Instagram</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Facebook</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Youtube</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4">Help</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition">Help Center</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">How it works</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Size & fit</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Buy an e-gift card</a></li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default CartPage;


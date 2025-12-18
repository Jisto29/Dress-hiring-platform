import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import Header from './Header';

function PaymentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, addSavedCard, addOrder, addAddress, hasOverdueReturns, getOverdueItems } = useAuth();
  const { cartItems, clearCart } = useCart();
  const { subtotal = 0, discount = 0, deliveryFee = 0, total = 0 } = location.state || {};
  
  const overdueItems = user ? getOverdueItems() : [];
  
  // Get default saved card
  const defaultCard = user?.savedCards?.find(card => card.isDefault) || user?.savedCards?.[0];
  const hasDefaultCard = !!defaultCard;

  const [showCVV, setShowCVV] = useState(false);
  const [useNewCard, setUseNewCard] = useState(!hasDefaultCard); // Use new card form if no saved card
  const [saveCard, setSaveCard] = useState(false);
  const [saveAddress, setSaveAddress] = useState(false);
  const [cvvForSavedCard, setCvvForSavedCard] = useState('');
  const [formData, setFormData] = useState({
    nameOnCard: '',
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    country: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    email: '',
    phone: ''
  });

  // Pre-fill contact info from user data when user is loaded
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        email: user.email || '',
        phone: user.phone || user.mobile || ''
      }));
    }
  }, [user]);

  // Pre-fill form with default card data AND billing address when switching between saved and new card
  useEffect(() => {
    if (!useNewCard && defaultCard) {
      setFormData(prev => ({
        ...prev,
        nameOnCard: defaultCard.nameOnCard || '',
        cardNumber: `•••• •••• •••• ${defaultCard.cardNumberLast4 || defaultCard.cardNumber?.slice(-4) || '****'}`,
        expiryMonth: defaultCard.expiryMonth || '',
        expiryYear: defaultCard.expiryYear || '',
        cvv: '', // Always require CVV for security
        // Pre-fill billing address from saved card
        country: defaultCard.billingCountry || '',
        address: defaultCard.billingLine1 || defaultCard.billingStreet || '',
        city: defaultCard.billingCity || '',
        state: defaultCard.billingState || '',
        zipCode: defaultCard.billingPostalCode || defaultCard.billingZipCode || ''
      }));
    } else if (useNewCard) {
      // Reset to empty for new card
      setFormData(prev => ({
        ...prev,
        nameOnCard: '',
        cardNumber: '',
        expiryMonth: '',
        expiryYear: '',
        cvv: '',
        country: '',
        address: '',
        city: '',
        state: '',
        zipCode: ''
      }));
    }
  }, [useNewCard, defaultCard]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCardNumberChange = (e) => {
    let value = e.target.value.replace(/\s/g, '');
    value = value.replace(/(\d{4})/g, '$1 ').trim();
    setFormData(prev => ({
      ...prev,
      cardNumber: value
    }));
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    
    // Check for overdue returns - block order if any exist
    if (user) {
      const hasOverdue = await hasOverdueReturns();
      if (hasOverdue) {
        alert('❌ Order Blocked: You have overdue returns that must be completed before placing a new order. Please check your orders page and return all overdue items.');
        navigate('/orders');
        return;
      }
    }
    
    // Validate CVV for saved card
    if (!useNewCard && !cvvForSavedCard && defaultCard) {
      alert('Please enter your card security code (CVV)');
      return;
    }
    
    // Save card with billing address if user is logged in, using new card, and wants to save it
    if (user && useNewCard && saveCard) {
      addSavedCard({
        nameOnCard: formData.nameOnCard,
        cardNumber: formData.cardNumber.replace(/\s/g, ''), // Remove spaces and save full number
        expiryMonth: formData.expiryMonth,
        expiryYear: formData.expiryYear,
        securityCode: formData.cvv,
        cardBrand: 'Visa', // You could detect this from card number
        // Save billing address with the card
        billingLine1: formData.address,
        billingCity: formData.city,
        billingState: formData.state,
        billingPostalCode: formData.zipCode,
        billingCountry: formData.country
      });
    }

    // Save address if user is logged in and wants to save it
    if (user && saveAddress) {
      addAddress({
        country: formData.country,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode
      });
    }

    // Create order if user is logged in
    if (user) {
      try {
        // Prepare order data matching backend DTO structure
        const orderData = {
          subtotal,
          discount,
          deliveryFee,
          total,
          deliveryAddress: {
            line1: formData.address,
            line2: '',
            city: formData.city,
            state: formData.state,
            postalCode: formData.zipCode,
            country: formData.country
          },
          contactInfo: {
            email: formData.email,
            phone: formData.phone
          },
          paymentInfo: {
            method: 'card',
            cardLast4: useNewCard ? formData.cardNumber.replace(/\s/g, '').slice(-4) : (defaultCard?.cardNumberLast4 || '****')
          },
          items: cartItems.map(item => ({
            productId: item.productId || item.id,
            productName: item.title || item.name,
            productBrand: item.brand || '',
            productImageUrl: item.image || '',
            size: item.size || '',
            color: item.color || '',
            rentalPeriod: item.rentalPeriod || '',
            quantity: item.quantity || 1,
            price: item.price || 0
          }))
        };

        const newOrder = await addOrder(orderData);
        
        // Clear cart after successful order
        clearCart();
        
        // Show success message with order number
        alert(`Payment successful! Your order ${newOrder.orderNumber} has been placed.`);
        navigate('/');
      } catch (error) {
        console.error('Error processing order:', error);
        alert('There was an error processing your order. Please try again.');
      }
    } else {
      // Guest checkout - just show success and go home
      alert('Payment processed successfully! Order placed.');
      navigate('/');
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 15 }, (_, i) => currentYear + i);

  return (
    <div className="bg-beige min-h-screen">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Overdue Warning Banner */}
        {overdueItems.length > 0 && (
          <div className="bg-red-600 text-white rounded-lg p-6 mb-6 shadow-lg">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-2">⚠️ Cannot Place Order - Overdue Returns</h3>
                <p className="mb-3">You have {overdueItems.length} overdue item{overdueItems.length !== 1 ? 's' : ''} that must be returned before you can place a new order:</p>
                <ul className="list-disc list-inside space-y-1 mb-4">
                  {overdueItems.map((item, index) => (
                    <li key={index}>
                      <strong>{item.itemName}</strong> - Due: {item.dueDate} ({item.daysOverdue} day{item.daysOverdue !== 1 ? 's' : ''} overdue)
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => navigate('/orders')}
                  className="bg-white text-red-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition"
                >
                  View Orders & Return Items
                </button>
              </div>
            </div>
          </div>
        )}
        
        <form onSubmit={handlePayment}>
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Payment Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Credit Card Details & Billing Address */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-black">Card Details & Billing Address</h2>
                  {hasDefaultCard && (
                    <button
                      type="button"
                      onClick={() => setUseNewCard(!useNewCard)}
                      className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                    >
                      {useNewCard ? '← Use Saved Card' : '+ Add New Card'}
                    </button>
                  )}
                </div>

                {/* Show saved card info when using saved card */}
                {!useNewCard && defaultCard && (
                  <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <p className="text-sm text-purple-600 font-semibold mb-3">✓ Using Saved Card & Billing Address</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Card Info */}
                      <div>
                        <p className="text-xs text-gray-500 font-semibold mb-1">CARD DETAILS</p>
                        <p className="text-gray-900 font-medium">{defaultCard.nameOnCard}</p>
                        <p className="text-gray-600">•••• •••• •••• {defaultCard.cardNumberLast4 || defaultCard.cardNumber?.slice(-4) || '****'}</p>
                        <p className="text-gray-500 text-sm">Expires: {defaultCard.expiryMonth}/{defaultCard.expiryYear}</p>
                      </div>
                      
                      {/* Billing Address */}
                      {(defaultCard.billingLine1 || defaultCard.billingStreet || defaultCard.billingCity) && (
                        <div>
                          <p className="text-xs text-gray-500 font-semibold mb-1">BILLING ADDRESS</p>
                          {(defaultCard.billingLine1 || defaultCard.billingStreet) && (
                            <p className="text-gray-700 text-sm">{defaultCard.billingLine1 || defaultCard.billingStreet}</p>
                          )}
                          {defaultCard.billingLine2 && <p className="text-gray-700 text-sm">{defaultCard.billingLine2}</p>}
                          {defaultCard.billingCity && (
                            <p className="text-gray-700 text-sm">
                              {defaultCard.billingCity}{defaultCard.billingState && `, ${defaultCard.billingState}`}
                              {(defaultCard.billingPostalCode || defaultCard.billingZipCode) && ` ${defaultCard.billingPostalCode || defaultCard.billingZipCode}`}
                            </p>
                          )}
                          {defaultCard.billingCountry && <p className="text-gray-700 text-sm">{defaultCard.billingCountry}</p>}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="space-y-4">
                  {/* Show full card form only when adding new card */}
                  {useNewCard ? (
                    <>
                      {/* Name on Card */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Name on card
                        </label>
                        <input
                          type="text"
                          name="nameOnCard"
                          placeholder="Meet Patel"
                          value={formData.nameOnCard}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-olive-dark"
                          required
                        />
                      </div>

                      {/* Card Number */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Card number
                        </label>
                        <input
                          type="text"
                          name="cardNumber"
                          placeholder="0000 0000 0000 0000"
                          value={formData.cardNumber}
                          onChange={handleCardNumberChange}
                          maxLength="19"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-olive-dark"
                          required
                        />
                      </div>

                      {/* Card Expiration and CVV */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Card expiration
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            <select
                              name="expiryMonth"
                              value={formData.expiryMonth}
                              onChange={handleInputChange}
                              className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-olive-dark"
                              required
                            >
                              <option value="">Month</option>
                              {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                                <option key={month} value={month.toString().padStart(2, '0')}>
                                  {month.toString().padStart(2, '0')}
                                </option>
                              ))}
                            </select>
                            <select
                              name="expiryYear"
                              value={formData.expiryYear}
                              onChange={handleInputChange}
                              className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-olive-dark"
                              required
                            >
                              <option value="">Year</option>
                              {years.map(year => (
                                <option key={year} value={year}>
                                  {year}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Card Security Code
                          </label>
                          <div className="relative">
                            <input
                              type={showCVV ? "text" : "password"}
                              name="cvv"
                              placeholder="Code"
                              value={formData.cvv}
                              onChange={handleInputChange}
                              maxLength="4"
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-olive-dark"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowCVV(!showCVV)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                            >
                              {showCVV ? <FaEyeSlash /> : <FaEye />}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Payment Method Icons */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Payment Method
                        </label>
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-8 bg-gradient-to-r from-red-600 to-orange-400 rounded flex items-center justify-center">
                            <div className="flex gap-1">
                              <div className="w-2 h-2 bg-white rounded-full opacity-70"></div>
                              <div className="w-2 h-2 bg-white rounded-full opacity-70"></div>
                            </div>
                          </div>
                          <div className="w-12 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-xs">
                            VISA
                          </div>
                          <div className="w-12 h-8 bg-blue-400 rounded flex items-center justify-center text-white font-bold text-[8px]">
                            AMEX
                          </div>
                          <div className="w-12 h-8 bg-orange-500 rounded flex items-center justify-center text-white font-bold text-[8px]">
                            DISCOVER
                          </div>
                        </div>
                      </div>

                      {/* Billing Address Section Header */}
                      <div className="pt-4 border-t border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Billing Address</h3>
                      </div>

                      {/* Country */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Country
                        </label>
                        <select
                          name="country"
                          value={formData.country}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-olive-dark"
                          required
                        >
                          <option value="">Country</option>
                          <option value="US">United States</option>
                          <option value="UK">United Kingdom</option>
                          <option value="AU">Australia</option>
                          <option value="CA">Canada</option>
                        </select>
                      </div>

                      {/* Address */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Address
                        </label>
                        <input
                          type="text"
                          name="address"
                          placeholder="Address"
                          value={formData.address}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-olive-dark"
                          required
                        />
                      </div>

                      {/* City and State */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            City
                          </label>
                          <input
                            type="text"
                            name="city"
                            placeholder="City"
                            value={formData.city}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-olive-dark"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            State
                          </label>
                          <input
                            type="text"
                            name="state"
                            placeholder="State"
                            value={formData.state}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-olive-dark"
                            required
                          />
                        </div>
                      </div>

                      {/* ZIP CODE */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          ZIP CODE
                        </label>
                        <input
                          type="text"
                          name="zipCode"
                          placeholder="ZIP CODE"
                          value={formData.zipCode}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-olive-dark"
                          required
                        />
                      </div>
                    </>
                  ) : (
                    /* Show only CVV when using saved card */
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Card Security Code (CVV) <span className="text-red-500">*</span>
                      </label>
                      <p className="text-sm text-gray-500 mb-3">Please enter your CVV to confirm payment</p>
                      <div className="relative max-w-xs">
                        <input
                          type={showCVV ? "text" : "password"}
                          value={cvvForSavedCard}
                          onChange={(e) => setCvvForSavedCard(e.target.value)}
                          placeholder="123"
                          maxLength="4"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowCVV(!showCVV)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                        >
                          {showCVV ? <FaEyeSlash /> : <FaEye />}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Save Card Checkbox - Only show when adding new card */}
                  {user && useNewCard && (
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="saveCard"
                        checked={saveCard}
                        onChange={(e) => setSaveCard(e.target.checked)}
                        className="mr-2"
                      />
                      <label htmlFor="saveCard" className="text-sm text-gray-600">
                        Save this card for future payments
                      </label>
                    </div>
                  )}
                </div>
              </div>


              {/* Contact Information */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-black mb-6">Contact information</h2>
                
                <div className="space-y-4">
                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      placeholder="Email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-olive-dark"
                      required
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      placeholder="Phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-olive-dark"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
                <h2 className="text-xl font-bold text-black mb-6">Order Summary</h2>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-red-600">
                    <span>Discount (-20%)</span>
                    <span>-${discount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Delivery Fee</span>
                    <span>${deliveryFee.toFixed(2)}</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between text-xl font-bold text-black">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={overdueItems.length > 0}
                  className={`w-full py-4 rounded-lg font-semibold transition ${
                    overdueItems.length > 0 
                      ? 'bg-gray-400 text-gray-700 cursor-not-allowed' 
                      : 'bg-black text-white hover:bg-gray-800'
                  }`}
                >
                  {overdueItems.length > 0 ? '⚠️ Cannot Pay - Overdue Returns' : 'Pay'}
                </button>
              </div>
            </div>
          </div>
        </form>
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

export default PaymentPage;


import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Header from './Header';
import Footer from './Footer';

function ProfilePage() {
  const navigate = useNavigate();
  const { user, updateProfile, addAddress, updateAddress, deleteAddress, setDefaultAddress, addSavedCard, updateCard, deleteCard, setDefaultCard, isAuthenticated, loading } = useAuth();
  
  const [editMode, setEditMode] = useState({
    name: false,
    email: false,
    mobile: false,
    passkey: false,
    password: false,
    twoStep: false
  });

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    passkey: '',
    password: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [newAddress, setNewAddress] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: ''
  });

  const [editingAddressId, setEditingAddressId] = useState(null);
  const [showAddAddressForm, setShowAddAddressForm] = useState(false);

  // Card management state
  const [showCardModal, setShowCardModal] = useState(false);
  const [editingCardId, setEditingCardId] = useState(null);
  const [cardFormData, setCardFormData] = useState({
    cardNumber: '',
    nameOnCard: '',
    expiryMonth: '',
    expiryYear: '',
    securityCode: '',
    billingStreet: '',
    billingCity: '',
    billingState: '',
    billingZipCode: '',
    billingCountry: ''
  });

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login');
    } else if (!loading && user) {
      setFormData({
        name: user.fullName || '',
        email: user.email || '',
        mobile: user.phone || '',
        passkey: user.passkey || '',
        password: '**********',
        newPassword: '',
        confirmPassword: ''
      });
    }
  }, [user, isAuthenticated, navigate, loading]);

  const handleEdit = (field) => {
    setEditMode({ ...editMode, [field]: true });
  };

  const handleSave = async (field) => {
    const updates = {};
    
    if (field === 'password') {
      if (formData.newPassword && formData.newPassword === formData.confirmPassword) {
        updates.password = formData.newPassword;
        alert('Password updated successfully!');
      } else {
        alert('Passwords do not match!');
        return;
      }
    } else {
      // Map frontend field names to backend field names
      if (field === 'name') {
        updates.fullName = formData.name;
      } else if (field === 'mobile') {
        updates.phone = formData.mobile;
      } else {
        updates[field] = formData[field];
      }
    }

    await updateProfile(updates);
    setEditMode({ ...editMode, [field]: false });
    
    if (field === 'password') {
      setFormData({ ...formData, newPassword: '', confirmPassword: '', password: '**********' });
    }
  };

  const handleCancel = (field) => {
    setEditMode({ ...editMode, [field]: false });
    if (user) {
      setFormData({
        ...formData,
        [field]: field === 'password' ? '**********' : user[field] || ''
      });
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleAddressChange = (e) => {
    setNewAddress({
      ...newAddress,
      [e.target.name]: e.target.value
    });
  };

  const handleAddAddress = async () => {
    // Fixed validation - check for the correct field names in state
    if (!newAddress.street || !newAddress.city || !newAddress.state || !newAddress.zipCode) {
      alert('Please fill in all required address fields');
      return;
    }
    
    try {
      if (editingAddressId) {
        // Update existing address
        await updateAddress(editingAddressId, {
          line1: newAddress.street,
          line2: newAddress.line2 || '',
          city: newAddress.city,
          state: newAddress.state,
          postalCode: newAddress.zipCode,
          country: newAddress.country || 'Australia',
          addressType: 'shipping',
        });
        setEditingAddressId(null);
        alert('Address updated successfully!');
      } else {
        // Add new address
        await addAddress({
          line1: newAddress.street,
          line2: newAddress.line2 || '',
          city: newAddress.city,
          state: newAddress.state,
          postalCode: newAddress.zipCode,
          country: newAddress.country || 'Australia',
          addressType: 'shipping',
        });
        alert('Address added successfully!');
      }
      setNewAddress({ street: '', city: '', state: '', zipCode: '', country: '' });
      setShowAddAddressForm(false);
    } catch (error) {
      console.error('Address error:', error);
      alert('Error: ' + error.message);
    }
  };

  const handleEditAddress = (address) => {
    setNewAddress({
      street: address.line1,
      line2: address.line2 || '',
      city: address.city,
      state: address.state,
      zipCode: address.postalCode,
      country: address.country || ''
    });
    setEditingAddressId(address.id);
    setShowAddAddressForm(true);
  };

  const handleDeleteAddress = async (addressId) => {
    if (window.confirm('Are you sure you want to delete this address?')) {
      try {
        await deleteAddress(addressId);
        alert('Address deleted successfully!');
      } catch (error) {
        console.error('Delete address error:', error);
        alert('Error: ' + error.message);
      }
    }
  };

  const handleCancelAddressForm = () => {
    setNewAddress({ street: '', city: '', state: '', zipCode: '', country: '' });
    setEditingAddressId(null);
    setShowAddAddressForm(false);
  };

  const handleSetDefaultAddress = async (addressId) => {
    try {
      await setDefaultAddress(addressId);
      // User state is already refreshed by setDefaultAddress
    } catch (error) {
      console.error('Set default address error:', error);
      alert('Error: ' + error.message);
    }
  };

  // Card handlers
  const handleCardFormChange = (e) => {
    setCardFormData({
      ...cardFormData,
      [e.target.name]: e.target.value
    });
  };

  const handleAddCard = async () => {
    // Validate required fields
    if (!cardFormData.cardNumber || !cardFormData.nameOnCard || !cardFormData.expiryMonth || 
        !cardFormData.expiryYear || !cardFormData.securityCode) {
      alert('Please fill in all card details');
      return;
    }

    try {
      if (editingCardId) {
        // Update existing card
        await updateCard(editingCardId, {
          nameOnCard: cardFormData.nameOnCard,
          expiryMonth: parseInt(cardFormData.expiryMonth),
          expiryYear: parseInt(cardFormData.expiryYear),
          billingLine1: cardFormData.billingStreet,
          billingCity: cardFormData.billingCity,
          billingState: cardFormData.billingState,
          billingPostalCode: cardFormData.billingZipCode,
          billingCountry: cardFormData.billingCountry,
        });
        alert('Card updated successfully!');
        setEditingCardId(null);
      } else {
        // Add new card
        await addSavedCard({
          cardNumber: cardFormData.cardNumber,
          nameOnCard: cardFormData.nameOnCard,
          expiryMonth: parseInt(cardFormData.expiryMonth),
          expiryYear: parseInt(cardFormData.expiryYear),
          billingLine1: cardFormData.billingStreet,
          billingCity: cardFormData.billingCity,
          billingState: cardFormData.billingState,
          billingPostalCode: cardFormData.billingZipCode,
          billingCountry: cardFormData.billingCountry,
        });
        alert('Card added successfully!');
      }
      
      // Reset form and close modal
      setCardFormData({
        cardNumber: '',
        nameOnCard: '',
        expiryMonth: '',
        expiryYear: '',
        securityCode: '',
        billingStreet: '',
        billingCity: '',
        billingState: '',
        billingZipCode: '',
        billingCountry: ''
      });
      setShowCardModal(false);
    } catch (error) {
      console.error('Error saving card:', error);
      alert('Failed to save card: ' + error.message);
    }
  };

  const handleEditCard = (card) => {
    setCardFormData({
      cardNumber: '•••• •••• •••• ' + card.cardNumberLast4,
      nameOnCard: card.nameOnCard,
      expiryMonth: card.expiryMonth.toString(),
      expiryYear: card.expiryYear.toString(),
      securityCode: '***',
      billingStreet: card.billingLine1 || '',
      billingCity: card.billingCity || '',
      billingState: card.billingState || '',
      billingZipCode: card.billingPostalCode || '',
      billingCountry: card.billingCountry || ''
    });
    setEditingCardId(card.id);
    setShowCardModal(true);
  };

  const handleDeleteCard = async (cardId) => {
    if (window.confirm('Are you sure you want to delete this card?')) {
      try {
        await deleteCard(cardId);
        alert('Card deleted successfully!');
      } catch (error) {
        console.error('Delete card error:', error);
        alert('Error: ' + error.message);
      }
    }
  };

  const handleSetDefaultCard = async (cardId) => {
    try {
      await setDefaultCard(cardId);
      // User state is already refreshed by setDefaultCard
    } catch (error) {
      console.error('Set default card error:', error);
      alert('Error: ' + error.message);
    }
  };

  const handleCancelCardForm = () => {
    setCardFormData({
      cardNumber: '',
      nameOnCard: '',
      expiryMonth: '',
      expiryYear: '',
      securityCode: '',
      billingStreet: '',
      billingCity: '',
      billingState: '',
      billingZipCode: '',
      billingCountry: ''
    });
    setEditingCardId(null);
    setShowCardModal(false);
  };

  const getDefaultAddress = () => {
    return user?.addresses?.find(addr => addr.isDefault) || user?.addresses?.[0];
  };

  const getDefaultCard = () => {
    return user?.savedCards?.[0];
  };

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-beige min-h-screen">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Section - Profile Information */}
          <div className="space-y-6">
            {/* Name */}
            <div className="bg-white rounded-lg border border-gray-300 p-6">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-gray-700">Name</h3>
                {!editMode.name ? (
                  <button
                    onClick={() => handleEdit('name')}
                    className="px-6 py-2 border-2 border-gray-800 rounded-full hover:bg-gray-100 transition"
                  >
                    Edit
                  </button>
                ) : (
                  <div className="space-x-2">
                    <button
                      onClick={() => handleSave('name')}
                      className="px-4 py-2 bg-green-600 text-white rounded-full hover:bg-green-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => handleCancel('name')}
                      className="px-4 py-2 border-2 border-gray-800 rounded-full hover:bg-gray-100"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
              {!editMode.name ? (
                <p className="text-gray-900">{formData.name}</p>
              ) : (
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-olive-dark"
                />
              )}
            </div>

            {/* Email */}
            <div className="bg-white rounded-lg border border-gray-300 p-6">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-gray-700">Email</h3>
                {!editMode.email ? (
                  <button
                    onClick={() => handleEdit('email')}
                    className="px-6 py-2 border-2 border-gray-800 rounded-full hover:bg-gray-100 transition"
                  >
                    Edit
                  </button>
                ) : (
                  <div className="space-x-2">
                    <button
                      onClick={() => handleSave('email')}
                      className="px-4 py-2 bg-green-600 text-white rounded-full hover:bg-green-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => handleCancel('email')}
                      className="px-4 py-2 border-2 border-gray-800 rounded-full hover:bg-gray-100"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
              {!editMode.email ? (
                <p className="text-gray-900">{formData.email}</p>
              ) : (
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-olive-dark"
                />
              )}
            </div>

            {/* Mobile Number */}
            <div className="bg-white rounded-lg border border-gray-300 p-6">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-gray-700">Mobile number</h3>
                {!editMode.mobile ? (
                  <button
                    onClick={() => handleEdit('mobile')}
                    className="px-6 py-2 border-2 border-gray-800 rounded-full hover:bg-gray-100 transition"
                  >
                    Edit
                  </button>
                ) : (
                  <div className="space-x-2">
                    <button
                      onClick={() => handleSave('mobile')}
                      className="px-4 py-2 bg-green-600 text-white rounded-full hover:bg-green-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => handleCancel('mobile')}
                      className="px-4 py-2 border-2 border-gray-800 rounded-full hover:bg-gray-100"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
              {!editMode.mobile ? (
                <p className="text-gray-900">{formData.mobile || 'Not set'}</p>
              ) : (
                <input
                  type="tel"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  placeholder="+61 444444444"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-olive-dark"
                />
              )}
            </div>

            {/* Passkey */}
            <div className="bg-white rounded-lg border border-gray-300 p-6">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-gray-700">Passkey</h3>
                <button
                  onClick={() => handleEdit('passkey')}
                  className="px-6 py-2 border-2 border-gray-800 rounded-full hover:bg-gray-100 transition"
                >
                  Edit
                </button>
              </div>
              <p className="text-sm text-gray-600">Sign in the same way you unlock your device by using your face, fingerprint, or PIN.</p>
            </div>

            {/* Password */}
            <div className="bg-white rounded-lg border border-gray-300 p-6">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-gray-700">Password</h3>
                {!editMode.password ? (
                  <button
                    onClick={() => handleEdit('password')}
                    className="px-6 py-2 border-2 border-gray-800 rounded-full hover:bg-gray-100 transition"
                  >
                    Edit
                  </button>
                ) : (
                  <div className="space-x-2">
                    <button
                      onClick={() => handleSave('password')}
                      className="px-4 py-2 bg-green-600 text-white rounded-full hover:bg-green-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => handleCancel('password')}
                      className="px-4 py-2 border-2 border-gray-800 rounded-full hover:bg-gray-100"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
              {!editMode.password ? (
                <p className="text-gray-900">{formData.password}</p>
              ) : (
                <div className="space-y-3">
                  <input
                    type="password"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                    placeholder="New password (min 8 characters)"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-olive-dark"
                  />
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm new password"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-olive-dark"
                  />
                </div>
              )}
            </div>

            {/* 2-step verification */}
            <div className="bg-white rounded-lg border border-gray-300 p-6">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-gray-700">2-step verification</h3>
                <button
                  onClick={() => handleEdit('twoStep')}
                  className="px-6 py-2 border-2 border-gray-800 rounded-full hover:bg-gray-100 transition"
                >
                  Edit
                </button>
              </div>
              <p className="text-sm text-gray-600">Add an additional layer of security</p>
            </div>
          </div>

          {/* Right Section - Cards & Address */}
          <div className="space-y-6">
            {/* Payment Cards Section */}
            <div className="bg-white rounded-lg border border-gray-300 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-black">MY PAYMENT METHODS</h3>
                <button
                  onClick={() => setShowCardModal(true)}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                >
                  + Add New Card
                </button>
              </div>

              <div className="space-y-4">
                {user.savedCards && user.savedCards.length > 0 ? (
                  user.savedCards.map((card, index) => (
                    <div key={card.id || index} className="border border-gray-200 rounded-lg p-4 hover:border-purple-500 transition">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {card.isDefault && (
                              <span className="px-3 py-1 bg-purple-600 text-white text-xs rounded-full font-semibold">
                                ✓ CURRENTLY USING
                              </span>
                            )}
                          </div>
                          <p className="text-gray-900 font-medium">
                            {card.nameOnCard || 'Cardholder Name'}
                          </p>
                          <p className="text-gray-600 text-sm">
                            •••• •••• •••• {card.cardNumberLast4 || '****'}
                          </p>
                          <p className="text-gray-500 text-xs mt-1">
                            Expires: {card.expiryMonth}/{card.expiryYear}
                          </p>
                          {(card.billingLine1 || card.billingCity) && (
                            <p className="text-gray-500 text-xs mt-1">
                              Billing: {card.billingLine1 && card.billingLine1 + ', '}
                              {card.billingCity}{card.billingState && `, ${card.billingState}`}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col gap-2">
                          {!card.isDefault && (
                            <button
                              onClick={() => handleSetDefaultCard(card.id)}
                              className="px-4 py-1.5 border-2 border-purple-600 text-purple-600 rounded-lg text-sm hover:bg-purple-50 transition font-medium"
                            >
                              Set as Default
                            </button>
                          )}
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditCard(card)}
                              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteCard(card.id)}
                              className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <svg className="w-16 h-16 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    <p className="text-lg font-medium mb-1">No payment methods added yet</p>
                    <p className="text-sm">Click "Add New Card" to add a payment method</p>
                  </div>
                )}
              </div>
            </div>

            {/* Combined Addresses Section */}
            <div className="bg-white rounded-lg border border-gray-300 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-black">MY ADDRESSES</h3>
                <button
                  onClick={() => setShowAddAddressForm(true)}
                  className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
                >
                  + Add New Address
                </button>
              </div>
              
              {showAddAddressForm && (
                <div className="mb-4 p-4 border-2 border-teal-500 rounded-lg bg-teal-50">
                  <h4 className="font-semibold mb-3 text-gray-800">
                    {editingAddressId ? 'Edit Address' : 'Add New Address'}
                  </h4>
                  <div className="space-y-3">
                    <input
                      type="text"
                      name="street"
                      value={newAddress.street}
                      onChange={handleAddressChange}
                      placeholder="Street Address"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                    <input
                      type="text"
                      name="city"
                      value={newAddress.city}
                      onChange={handleAddressChange}
                      placeholder="City"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        name="state"
                        value={newAddress.state}
                        onChange={handleAddressChange}
                        placeholder="State"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                      <input
                        type="text"
                        name="zipCode"
                        value={newAddress.zipCode}
                        onChange={handleAddressChange}
                        placeholder="ZIP Code"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                    <input
                      type="text"
                      name="country"
                      value={newAddress.country}
                      onChange={handleAddressChange}
                      placeholder="Country"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleAddAddress}
                        className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                      >
                        {editingAddressId ? 'Save Changes' : 'Add Address'}
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelAddressForm}
                        className="px-4 py-2 border-2 border-gray-800 rounded-lg hover:bg-gray-100"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {user.addresses && user.addresses.length > 0 ? (
                  user.addresses.map((address, index) => (
                    <div key={address.id || index} className="border border-gray-200 rounded-lg p-4 hover:border-teal-500 transition">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {address.isDefault && (
                              <span className="px-3 py-1 bg-teal-600 text-white text-xs rounded-full font-semibold">
                                ✓ CURRENTLY USING
                              </span>
                            )}
                          </div>
                          <p className="text-gray-900 font-medium">{address.line1}</p>
                          {address.line2 && <p className="text-gray-600 text-sm">{address.line2}</p>}
                          <p className="text-gray-600 text-sm">
                            {address.city}, {address.state} {address.postalCode}
                            {address.country && `, ${address.country}`}
                          </p>
                        </div>
                        <div className="flex flex-col gap-2">
                          {!address.isDefault && (
                            <button
                              onClick={() => handleSetDefaultAddress(address.id)}
                              className="px-4 py-1.5 border-2 border-teal-600 text-teal-600 rounded-lg text-sm hover:bg-teal-50 transition font-medium"
                            >
                              Set as Default
                            </button>
                          )}
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditAddress(address)}
                              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteAddress(address.id)}
                              className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <svg className="w-16 h-16 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <p className="text-lg font-medium mb-1">No addresses added yet</p>
                    <p className="text-sm">Click "Add New Address" to add your delivery address</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Card Modal */}
      {showCardModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-black mb-4">
                {editingCardId ? 'Edit Card' : 'Add a credit or debit card'}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column - Card Details */}
                <div className="space-y-4">
                  {/* Card Number */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Card Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="cardNumber"
                      value={cardFormData.cardNumber}
                      onChange={handleCardFormChange}
                      placeholder="1234 5678 9012 3456"
                      maxLength="16"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  {/* Name on Card */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name on card <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="nameOnCard"
                      value={cardFormData.nameOnCard}
                      onChange={handleCardFormChange}
                      placeholder="John Doe"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  {/* Expiry */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expiry <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        name="expiryMonth"
                        value={cardFormData.expiryMonth}
                        onChange={handleCardFormChange}
                        placeholder="01"
                        maxLength="2"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <input
                        type="text"
                        name="expiryYear"
                        value={cardFormData.expiryYear}
                        onChange={handleCardFormChange}
                        placeholder="2025"
                        maxLength="4"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>

                  {/* Security Code */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Security code <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="securityCode"
                      value={cardFormData.securityCode}
                      onChange={handleCardFormChange}
                      placeholder="123"
                      maxLength="4"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                {/* Right Column - Billing Address */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-800 mb-2">Billing Address</h3>
                  
                  {/* Street */}
                  <div>
                    <input
                      type="text"
                      name="billingStreet"
                      value={cardFormData.billingStreet}
                      onChange={handleCardFormChange}
                      placeholder="Street Address"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  {/* City */}
                  <div>
                    <input
                      type="text"
                      name="billingCity"
                      value={cardFormData.billingCity}
                      onChange={handleCardFormChange}
                      placeholder="City"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  {/* State & ZIP */}
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      name="billingState"
                      value={cardFormData.billingState}
                      onChange={handleCardFormChange}
                      placeholder="State"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <input
                      type="text"
                      name="billingZipCode"
                      value={cardFormData.billingZipCode}
                      onChange={handleCardFormChange}
                      placeholder="ZIP Code"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  {/* Country */}
                  <div>
                    <input
                      type="text"
                      name="billingCountry"
                      value={cardFormData.billingCountry}
                      onChange={handleCardFormChange}
                      placeholder="Country"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  {/* Info Note */}
                  <div className="text-right pt-4">
                    <p className="text-sm text-gray-600 italic">
                      Accepts all major credit and debit cards:<br/>
                      <span className="font-medium">Visa, Mastercard, AMEX, Union pay</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6 pt-4 border-t">
                <button
                  onClick={handleCancelCardForm}
                  className="flex-1 px-6 py-3 border-2 border-gray-800 rounded-full text-gray-800 font-medium hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddCard}
                  className="flex-1 px-6 py-3 bg-red-600 text-white rounded-full font-medium hover:bg-red-700 transition"
                >
                  {editingCardId ? 'Save Changes' : 'Add card'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

export default ProfilePage;


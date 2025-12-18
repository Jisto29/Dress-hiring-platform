import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper to get headers with JWT token
  const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  };

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (token) {
          // Use the /me endpoint to verify token and get user
          const userRes = await fetch('http://localhost:8080/api/users/me', {
            headers: { 'Authorization': `Bearer ${token}` },
            credentials: 'include',
          });
          
          if (userRes.ok) {
            const data = await userRes.json();
            const freshUser = data.user;
            
            // Fetch addresses and cards
            const [addressesRes, cardsRes] = await Promise.all([
              fetch(`http://localhost:8080/api/customers/${freshUser.id}/addresses`, {
                headers: { 'Authorization': `Bearer ${token}` },
                credentials: 'include',
              }),
              fetch(`http://localhost:8080/api/customers/${freshUser.id}/cards`, {
                headers: { 'Authorization': `Bearer ${token}` },
                credentials: 'include',
              }),
            ]);
            
            const addresses = addressesRes.ok ? await addressesRes.json() : [];
            const savedCards = cardsRes.ok ? await cardsRes.json() : [];
            
            const completeUser = {
              ...freshUser,
              addresses,
              savedCards,
            };
            
            setUser(completeUser);
          } else {
            // Token invalid, clear everything
            localStorage.removeItem('authToken');
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
        localStorage.removeItem('authToken');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Sign up
  const signup = async (userData) => {
    try {
      const response = await fetch('http://localhost:8080/api/users/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: userData.email,
          password: userData.password,
          fullName: userData.name,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Signup failed');
      }

      const data = await response.json();
      const user = data.user;
      
      // Note: Signup doesn't return a token yet, so we need to login after
      // For now, just return the user
      const completeUser = {
        ...user,
        addresses: [],
        savedCards: [],
      };
      
      setUser(completeUser);
      return completeUser;
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  // Login
  const login = async (email, password) => {
    try {
      const response = await fetch('http://localhost:8080/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }

      const data = await response.json();
      const user = data.user;
      const token = data.token;
      
      // Store JWT token
      localStorage.setItem('authToken', token);
      
      // Fetch addresses and cards for the logged-in user
      try {
        const [addressesRes, cardsRes] = await Promise.all([
          fetch(`http://localhost:8080/api/customers/${user.id}/addresses`, {
            headers: { 'Authorization': `Bearer ${token}` },
            credentials: 'include',
          }),
          fetch(`http://localhost:8080/api/customers/${user.id}/cards`, {
            headers: { 'Authorization': `Bearer ${token}` },
            credentials: 'include',
          }),
        ]);
        
        const addresses = addressesRes.ok ? await addressesRes.json() : [];
        const savedCards = cardsRes.ok ? await cardsRes.json() : [];
        
        const completeUser = {
          ...user,
          addresses,
          savedCards,
        };
        
        setUser(completeUser);
        return completeUser;
      } catch (err) {
        // If fetching addresses/cards fails, still login with basic user data
        console.error('Error fetching user data:', err);
        const completeUser = {
          ...user,
          addresses: [],
          savedCards: [],
        };
        setUser(completeUser);
        return completeUser;
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  // Logout
  const logout = async () => {
    try {
      const token = localStorage.getItem('authToken');
      await fetch('http://localhost:8080/api/users/logout', {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
    // Clear localStorage and state
    localStorage.removeItem('authToken');
    setUser(null);
  };

  // Update profile
  const updateProfile = async (updates) => {
    if (!user) {
      throw new Error('No user logged in');
    }

    try {
      const response = await fetch(`http://localhost:8080/api/users/${user.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to update profile');
      }

      const updatedUser = await response.json();
      setUser({ ...user, ...updatedUser });
      return updatedUser;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  };

  // Address management
  const addAddress = async (addressData) => {
    if (!user) throw new Error('No user logged in');
    
    try {
      const response = await fetch(`http://localhost:8080/api/customers/${user.id}/addresses`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          ...addressData,
          type: 'shipping', // default type
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to add address');
      }
      
      const result = await response.json();
      await refreshUserData();
      return result.address;
    } catch (error) {
      console.error('Add address error:', error);
      throw error;
    }
  };

  const updateAddress = async (addressId, updates) => {
    if (!user) throw new Error('No user logged in');
    
    try {
      const response = await fetch(`http://localhost:8080/api/customers/${user.id}/addresses/${addressId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) throw new Error('Failed to update address');
      
      const result = await response.json();
      await refreshUserData();
      return result.address;
    } catch (error) {
      console.error('Update address error:', error);
      throw error;
    }
  };

  const deleteAddress = async (addressId) => {
    if (!user) throw new Error('No user logged in');
    
    try {
      const response = await fetch(`http://localhost:8080/api/customers/${user.id}/addresses/${addressId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      
      if (!response.ok) throw new Error('Failed to delete address');
      
      await refreshUserData();
    } catch (error) {
      console.error('Delete address error:', error);
      throw error;
    }
  };

  const setDefaultAddress = async (addressId) => {
    if (!user) throw new Error('No user logged in');
    
    try {
      const response = await fetch(`http://localhost:8080/api/customers/${user.id}/addresses/${addressId}/set-default`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      
      if (!response.ok) throw new Error('Failed to set default address');
      
      await refreshUserData();
    } catch (error) {
      console.error('Set default address error:', error);
      throw error;
    }
  };

  // Card management
  const addSavedCard = async (cardData) => {
    if (!user) throw new Error('No user logged in');
    
    try {
      const response = await fetch(`http://localhost:8080/api/customers/${user.id}/cards`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          ...cardData,
          cardNumberLast4: cardData.cardNumber,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to add card');
      }
      
      const result = await response.json();
      await refreshUserData();
      return result.card;
    } catch (error) {
      console.error('Add card error:', error);
      throw error;
    }
  };

  const updateCard = async (cardId, updates) => {
    if (!user) throw new Error('No user logged in');
    
    try {
      const response = await fetch(`http://localhost:8080/api/customers/${user.id}/cards/${cardId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) throw new Error('Failed to update card');
      
      const result = await response.json();
      await refreshUserData();
      return result.card;
    } catch (error) {
      console.error('Update card error:', error);
      throw error;
    }
  };

  const deleteCard = async (cardId) => {
    if (!user) throw new Error('No user logged in');
    
    try {
      const response = await fetch(`http://localhost:8080/api/customers/${user.id}/cards/${cardId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      
      if (!response.ok) throw new Error('Failed to delete card');
      
      await refreshUserData();
    } catch (error) {
      console.error('Delete card error:', error);
      throw error;
    }
  };

  const setDefaultCard = async (cardId) => {
    if (!user) throw new Error('No user logged in');
    
    try {
      const response = await fetch(`http://localhost:8080/api/customers/${user.id}/cards/${cardId}/set-default`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      
      if (!response.ok) throw new Error('Failed to set default card');
      
      await refreshUserData();
    } catch (error) {
      console.error('Set default card error:', error);
      throw error;
    }
  };

  const refreshUserData = async () => {
    if (!user) return;
    
    try {
      const token = localStorage.getItem('authToken');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      // Fetch updated user, addresses, and cards
      const [userRes, addressesRes, cardsRes] = await Promise.all([
        fetch(`http://localhost:8080/api/users/${user.id}`, {
          headers,
          credentials: 'include',
        }),
        fetch(`http://localhost:8080/api/customers/${user.id}/addresses`, {
          headers,
          credentials: 'include',
        }),
        fetch(`http://localhost:8080/api/customers/${user.id}/cards`, {
          headers,
          credentials: 'include',
        }),
      ]);
      
      const userData = await userRes.json();
      const addresses = addressesRes.ok ? await addressesRes.json() : [];
      const savedCards = cardsRes.ok ? await cardsRes.json() : [];
      
      const updatedUser = {
        ...userData,
        addresses,
        savedCards,
      };
      
      setUser(updatedUser);
    } catch (error) {
      console.error('Refresh user data error:', error);
    }
  };

  // Check if user has overdue returns
  const hasOverdueReturns = async () => {
    if (!user) return false;
    
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return false;

      const response = await fetch('http://localhost:8080/api/orders/overdue-check', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        return data.hasOverdueReturns || false;
      }
      return false;
    } catch (error) {
      console.error('Error checking overdue returns:', error);
      return false;
    }
  };

  // Get overdue items (for display purposes)
  const getOverdueItems = () => {
    // This can be expanded later to return actual overdue items
    // For now, it's used for compatibility
    return [];
  };

  const addOrder = async (orderData) => {
    if (!user) throw new Error('No user logged in');
    
    try {
      const response = await fetch('http://localhost:8080/api/orders', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(orderData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create order');
      }
      
      return data.order;
    } catch (error) {
      console.error('Create order error:', error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    signup,
    login,
    logout,
    updateProfile,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    addSavedCard,
    updateCard,
    deleteCard,
    setDefaultCard,
    getOverdueItems,
    hasOverdueReturns,
    addOrder,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

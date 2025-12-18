import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const { user } = useAuth();

  // Helper to get JWT token
  const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  };

  // Load cart from server when user changes
  useEffect(() => {
    const loadCart = async () => {
      if (user) {
        try {
          const token = localStorage.getItem('authToken');
          const response = await fetch(`http://localhost:8080/api/cart`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
            credentials: 'include',
          });
          if (response.ok) {
            const cart = await response.json();
            console.log('🛒 Cart loaded from backend:', cart);
            cart.forEach((item, index) => {
              console.log(`  Item ${index}:`, {
                productId: item.productId,
                title: item.title,
                image: item.image,
                images: item.images
              });
            });
            setCartItems(cart || []);
          } else {
            setCartItems([]);
          }
        } catch (error) {
          console.error('Error loading cart:', error);
          setCartItems([]);
        }
      } else {
        // Guest users - cart not persisted
        setCartItems([]);
      }
    };

    loadCart();
  }, [user]);

  // Save cart to server whenever it changes (for logged-in users)
  const saveCart = async (items) => {
    if (user) {
      try {
        // Ensure each item has productId set
        const itemsToSave = items.map(item => ({
          ...item,
          productId: item.productId || item.id // Ensure productId is always set
        }));
        
        console.log('💾 Saving cart to backend:', itemsToSave);
        
        const response = await fetch('http://localhost:8080/api/cart', {
          method: 'PUT',
          headers: getAuthHeaders(),
          credentials: 'include',
          body: JSON.stringify(itemsToSave),
        });
        
        if (response.ok) {
          const updatedCart = await response.json();
          console.log('✅ Cart saved, backend returned:', updatedCart);
          updatedCart.forEach((item, index) => {
            console.log(`  Item ${index}:`, {
              productId: item.productId,
              title: item.title,
              image: item.image,
              images: item.images
            });
          });
          // Update local cart with backend response to get populated fields like images
          setCartItems(updatedCart);
        }
      } catch (error) {
        console.error('Error saving cart:', error);
      }
    }
  };

  const addToCart = (product) => {
    setCartItems(prev => {
      // Check if this exact product with same size, color, and rental period already exists
      const existingIndex = prev.findIndex(
        item => 
          item.id === product.id &&
          item.size === product.size &&
          item.color === product.color &&
          item.rentalPeriod === product.rentalPeriod
      );

      let newItems;
      if (existingIndex >= 0) {
        // If exists, increase quantity
        newItems = [...prev];
        newItems[existingIndex].quantity += 1;
      } else {
        // If new, add to cart with productId field for backend
        newItems = [...prev, { 
          ...product, 
          quantity: 1,
          productId: product.id // Ensure productId is set for backend
        }];
      }
      
      saveCart(newItems);
      return newItems;
    });
  };

  const updateQuantity = (id, size, color, rentalPeriod, change) => {
    setCartItems(items => {
      const newItems = items.map(item =>
        item.id === id && 
        item.size === size && 
        item.color === color && 
        item.rentalPeriod === rentalPeriod
          ? { ...item, quantity: Math.max(0, item.quantity + change), productId: item.productId || item.id }
          : item
      ).filter(item => item.quantity > 0);
      
      saveCart(newItems);
      return newItems;
    });
  };

  const removeItem = (id, size, color, rentalPeriod) => {
    setCartItems(items => {
      const newItems = items.filter(item => 
        !(item.id === id && 
          item.size === size && 
          item.color === color && 
          item.rentalPeriod === rentalPeriod)
      );
      
      saveCart(newItems);
      return newItems;
    });
  };

  const clearCart = () => {
    setCartItems([]);
    saveCart([]);
  };

  return (
    <CartContext.Provider value={{ cartItems, addToCart, updateQuantity, removeItem, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};



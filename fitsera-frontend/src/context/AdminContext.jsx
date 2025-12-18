import { createContext, useContext, useState, useEffect } from 'react';
import API_BASE_URL from '../config/api';

const AdminContext = createContext();

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};

export const AdminProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);

  // Check authentication on mount (page load/refresh)
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/brand-users/me`, {
          credentials: 'include',
        });
        
        if (response.ok) {
          const data = await response.json();
          setAdmin(data);
          setIsAdminAuthenticated(true);
          loadNotifications(data.id);
        } else {
          setAdmin(null);
          setIsAdminAuthenticated(false);
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        setAdmin(null);
        setIsAdminAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Load notifications from backend
  const loadNotifications = async (brandUserId) => {
    try {
      const response = await fetch(`http://localhost:8080/api/notifications/brand-user/${brandUserId}`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      } else {
        setNotifications([]);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      setNotifications([]);
    }
  };

  // Admin signup
  const adminSignup = async (signupData) => {
    try {
      const response = await fetch('http://localhost:8080/api/brand-users/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(signupData),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, message: data.message || 'Signup failed' };
      }
      
      // Auto-login after signup
      if (data.success && data.user) {
        setAdmin(data.user);
        setIsAdminAuthenticated(true);
        loadNotifications(data.user.id);
        return { success: true, admin: data.user };
      } else {
        return { success: false, message: data.message || 'Signup failed' };
      }
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, message: error.message || 'Network error occurred' };
    }
  };

  // Admin login
  const adminLogin = async (email, password) => {
    try {
      const response = await fetch('http://localhost:8080/api/brand-users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        return { success: false, message: 'Invalid credentials' };
      }
      
      const data = await response.json();
      if (data.success && data.user) {
        setAdmin(data.user);
        setIsAdminAuthenticated(true);
        loadNotifications(data.user.id);
        return { success: true, admin: data.user };
      } else {
        return { success: false, message: data.message || 'Login failed' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: error.message };
    }
  };

  // Admin logout
  const adminLogout = async () => {
    try {
      await fetch('http://localhost:8080/api/brand-users/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
    setAdmin(null);
    setIsAdminAuthenticated(false);
    setNotifications([]);
  };

  // Mark notification as read
  const markNotificationAsRead = async (notificationId) => {
    try {
      await fetch(`http://localhost:8080/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        credentials: 'include',
      });
      
      const updatedNotifications = notifications.map(notif =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      );
      setNotifications(updatedNotifications);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all notifications as read
  const markAllNotificationsAsRead = async () => {
    try {
      await fetch(`http://localhost:8080/api/notifications/read-all`, {
        method: 'PUT',
        credentials: 'include',
      });
      
      const updatedNotifications = notifications.map(notif => ({ ...notif, read: true }));
      setNotifications(updatedNotifications);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Add notification
  const addNotification = async (notification) => {
    try {
      const response = await fetch('http://localhost:8080/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(notification),
      });
      
      if (response.ok) {
        const newNotification = await response.json();
        const updatedNotifications = [newNotification, ...notifications];
        setNotifications(updatedNotifications);
      }
    } catch (error) {
      console.error('Error adding notification:', error);
    }
  };

  // Get unread count
  const getUnreadCount = () => {
    return notifications.filter(notif => !notif.read).length;
  };

  // Create notification for brand admin when order is placed
  const createOrderNotification = async (orderItem, customerName) => {
    try {
      const response = await fetch('http://localhost:8080/api/notifications/order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          productName: orderItem.name,
          productImage: orderItem.image,
          price: orderItem.price,
          customerName: customerName,
          status: 'New Order',
          type: 'order',
        }),
      });
      
      if (response.ok) {
        // Reload notifications if this is for the current admin
        if (admin) {
          loadNotifications(admin.id);
        }
      }
    } catch (error) {
      console.error('Error creating order notification:', error);
    }
  };

  // Update admin profile
  const updateAdminProfile = async (updates) => {
    if (!admin) {
      return { success: false, message: 'No admin logged in' };
    }

    try {
      const response = await fetch(`http://localhost:8080/api/brand-users/${admin.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const error = await response.text();
        return { success: false, message: error || 'Failed to update profile' };
      }

      const updatedAdminData = await response.json();
      setAdmin(updatedAdminData);

      return { success: true, admin: updatedAdminData };
    } catch (error) {
      console.error('Update profile error:', error);
      return { success: false, message: error.message };
    }
  };

  return (
    <AdminContext.Provider
      value={{
        admin,
        isAdminAuthenticated,
        loading,
        adminSignup,
        adminLogin,
        adminLogout,
        updateAdminProfile,
        notifications,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        addNotification,
        getUnreadCount,
        createOrderNotification
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};


import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { AdminProvider } from './context/AdminContext';
import { ChatProvider } from './context/ChatContext';
import HomePage from './pages/HomePage';
import CategoryPage from './components/CategoryPage';
import ProductDetailPage from './components/ProductDetailPage';
import CartPage from './components/CartPage';
import PaymentPage from './components/PaymentPage';
import LoginPage from './components/auth/LoginPage';
import SignUpPage from './components/auth/SignUpPage';
import ForgotPasswordPage from './components/auth/ForgotPasswordPage';
import VerifyCodePage from './components/auth/VerifyCodePage';
import SetNewPasswordPage from './components/auth/SetNewPasswordPage';
import PasswordResetSuccessPage from './components/auth/PasswordResetSuccessPage';
import ProfilePage from './components/ProfilePage';
import OrdersPage from './components/OrdersPage';
import OrderTrackingPage from './components/OrderTrackingPage';
import BrandsPage from './components/BrandsPage';
import ErrorBoundary from './components/ErrorBoundary';
import AdminLogin from './components/admin/AdminLogin';
import AdminSignup from './components/admin/AdminSignup';
import AdminDashboard from './components/admin/AdminDashboard';
import AdminAllProducts from './components/admin/AdminAllProducts';
import AdminOrdersList from './components/admin/AdminOrdersList';
import AdminReviews from './components/admin/AdminReviews';
import AdminIssueTracker from './components/admin/AdminIssueTracker';
import AdminSettings from './components/admin/AdminSettings';
import EnhancedChatBot from './components/EnhancedChatBot';
import './App.css';

// Component to handle dynamic title changes
function TitleManager() {
  const location = useLocation();
  
  useEffect(() => {
    // Update title based on current route
    if (location.pathname.startsWith('/admin')) {
      document.title = 'Fitsera-admin';
    } else {
      document.title = 'Fitsera';
    }
  }, [location]);
  
  return null;
}

function App() {
  return (
    <ErrorBoundary>
      <AdminProvider>
        <AuthProvider>
          <CartProvider>
            <ChatProvider>
              <Router>
                <TitleManager />
                <div className="App">
                  <Routes>
                    {/* Customer Routes */}
                    <Route path="/" element={<HomePage />} />
                    <Route path="/brands" element={<BrandsPage />} />
                    <Route path="/category/:category/:occasion?" element={<CategoryPage />} />
                    <Route path="/product/:productId" element={<ProductDetailPage />} />
                    <Route path="/cart" element={<CartPage />} />
                    <Route path="/payment" element={<PaymentPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/orders" element={<OrdersPage />} />
                    <Route path="/orders/:orderId" element={<OrderTrackingPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/signup" element={<SignUpPage />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                    <Route path="/verify-code" element={<VerifyCodePage />} />
                    <Route path="/set-new-password" element={<SetNewPasswordPage />} />
                    <Route path="/password-reset-success" element={<PasswordResetSuccessPage />} />
                    
                    {/* Admin Routes */}
                    <Route path="/admin/login" element={<AdminLogin />} />
                    <Route path="/admin/signup" element={<AdminSignup />} />
                    <Route path="/admin/dashboard" element={<AdminDashboard />} />
                    <Route path="/admin/products" element={<AdminAllProducts />} />
                    <Route path="/admin/orders" element={<AdminOrdersList />} />
                    <Route path="/admin/reviews" element={<AdminReviews />} />
                    <Route path="/admin/issues" element={<AdminIssueTracker />} />
                    <Route path="/admin/settings" element={<AdminSettings />} />
                  </Routes>
                  {/* Enhanced AI ChatBot - Available on all pages */}
                  <EnhancedChatBot />
                </div>
              </Router>
            </ChatProvider>
          </CartProvider>
        </AuthProvider>
      </AdminProvider>
    </ErrorBoundary>
  );
}

export default App;

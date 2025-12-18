import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaUser, FaShoppingBag, FaSignOutAlt } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

function Header() {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const { cartItems } = useCart();
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    navigate('/');
  };

  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="bg-olive-dark text-white sticky top-0 z-50 shadow-md">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center">
          <h1 
            className="text-2xl font-bold cursor-pointer hover:opacity-80 transition"
            onClick={() => navigate('/')}
          >
            Fitsera
          </h1>
        </div>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center space-x-6">
          <a href="#" className="hover:text-gray-300 transition">TRENDING</a>
          <a href="#" className="hover:text-gray-300 transition">DESIGNER PICKS</a>
          <a href="#" className="hover:text-gray-300 transition">UNDER 50$</a>
        </nav>

        {/* Search Bar and User Actions */}
        <div className="flex items-center space-x-4">
          <div className="hidden md:flex items-center bg-gray-600 rounded-lg px-4 py-2">
            <input
              type="text"
              placeholder="Search Dress"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-white placeholder-gray-400 focus:outline-none"
            />
            <FaSearch className="text-gray-400 ml-2" />
          </div>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 hover:text-gray-300 transition"
                >
                  <FaUser className="text-xl" />
                  <span className="hidden md:block text-sm">{user?.fullName}</span>
                </button>
                
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 text-gray-800">
                    <button
                      onClick={() => {
                        navigate('/profile');
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 transition"
                    >
                      My Profile
                    </button>
                    <button
                      onClick={() => {
                        navigate('/orders');
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 transition"
                    >
                      My Orders
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 transition flex items-center gap-2 text-red-600"
                    >
                      <FaSignOutAlt />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="hover:text-gray-300 transition flex items-center gap-2"
              >
                <FaUser className="text-xl" />
                <span className="hidden md:block text-sm">Login</span>
              </button>
            )}
            
            <button 
              onClick={() => navigate('/cart')}
              className="relative hover:text-gray-300 transition"
            >
              <FaShoppingBag className="text-xl" />
              {cartItemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;



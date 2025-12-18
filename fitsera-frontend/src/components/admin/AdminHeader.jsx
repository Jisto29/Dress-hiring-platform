import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaBell, FaChevronDown, FaTimes } from 'react-icons/fa';
import { useAdmin } from '../../context/AdminContext';

function AdminHeader() {
  const navigate = useNavigate();
  const { admin, adminLogout, notifications, markAllNotificationsAsRead, getUnreadCount } = useAdmin();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [brandName, setBrandName] = useState('');

  // Fetch brand name from account data
  useEffect(() => {
    const fetchBrandName = async () => {
      if (admin && admin.accountId) {
        try {
          const response = await fetch(`http://localhost:8080/api/accounts/${admin.accountId}`, {
            credentials: 'include',
          });
          
          if (response.ok) {
            const account = await response.json();
            setBrandName(account.name);
          }
        } catch (error) {
          console.error('Error fetching brand name:', error);
        }
      }
    };

    fetchBrandName();
  }, [admin]);

  const handleLogout = () => {
    adminLogout();
    navigate('/admin/login');
  };

  const unreadCount = getUnreadCount();

  return (
    <header className="bg-white border-b border-gray-200 h-16 fixed top-0 left-64 right-0 z-10">
      <div className="h-full px-6 flex items-center justify-between">
        {/* Search Bar */}
        <div className="flex-1 max-w-xl">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
            />
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 hover:bg-gray-100 rounded-full relative"
            >
              <FaBell className="text-gray-600 text-xl" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Panel */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-2xl border border-gray-200 z-50">
                <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                  <h3 className="font-bold text-gray-800">Notifications</h3>
                  <button onClick={() => setShowNotifications(false)}>
                    <FaTimes className="text-gray-400 hover:text-gray-600" />
                  </button>
                </div>

                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      No notifications
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                          !notif.read ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <img
                            src={notif.productImage}
                            alt={notif.productName}
                            className="w-16 h-16 object-cover rounded"
                          />
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <h4 className="font-semibold text-gray-800">{notif.productName}</h4>
                              <span className="bg-teal-600 text-white text-xs px-2 py-1 rounded">
                                {notif.status}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">${notif.price}</p>
                            <p className="text-xs text-gray-400 mt-1">{notif.date}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-4 border-t border-gray-200 flex justify-between">
                  <button
                    onClick={markAllNotificationsAsRead}
                    className="text-sm text-gray-600 hover:text-gray-800"
                  >
                    ✓ MARK ALL AS READ
                  </button>
                  <button className="text-sm bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700">
                    VIEW ALL NOTIFICATION
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <span className="text-sm font-semibold text-gray-700">{brandName || admin?.fullName || 'ADMIN'}</span>
              <FaChevronDown className="text-gray-500 text-xs" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-3 hover:bg-gray-100 text-sm text-gray-700 rounded-lg"
                >
                  🚪 LOG OUT
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default AdminHeader;


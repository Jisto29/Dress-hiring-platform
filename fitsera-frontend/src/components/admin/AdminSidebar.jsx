import { useNavigate, useLocation } from 'react-router-dom';
import { FaChartLine, FaBox, FaClipboardList, FaExclamationCircle, FaStar, FaCog, FaChevronDown } from 'react-icons/fa';
import { useState } from 'react';

function AdminSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [categoriesOpen, setCategoriesOpen] = useState(false);

  const menuItems = [
    { path: '/admin/dashboard', icon: FaChartLine, label: 'DASHBOARD' },
    { path: '/admin/products', icon: FaBox, label: 'ALL PRODUCTS' },
    { path: '/admin/orders', icon: FaClipboardList, label: 'ORDER LIST' },
    { path: '/admin/reviews', icon: FaStar, label: 'REVIEWS' },
    { path: '/admin/issues', icon: FaExclamationCircle, label: 'ISSUE TRACKER' },
    { path: '/admin/settings', icon: FaCog, label: 'SETTINGS' },
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <aside className="w-64 bg-white h-screen fixed left-0 top-0 shadow-lg">
      <div className="p-6 border-b border-gray-200">
        <h1 
          className="text-2xl font-bold text-gray-800 cursor-pointer"
          onClick={() => navigate('/admin/dashboard')}
        >
          Fitsera
        </h1>
      </div>

      <nav className="mt-6">
        {menuItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`w-full flex items-center px-6 py-3 text-left transition ${
              isActive(item.path)
                ? 'bg-teal-700 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <item.icon className="mr-3" />
            <span className="text-sm font-semibold">{item.label}</span>
          </button>
        ))}

        {/* Categories Section */}
        <div className="mt-8">
          <button
            onClick={() => setCategoriesOpen(!categoriesOpen)}
            className="w-full flex items-center justify-between px-6 py-3 text-gray-700 hover:bg-gray-100 transition"
          >
            <span className="text-sm font-semibold">Categories</span>
            <FaChevronDown
              className={`transition-transform ${categoriesOpen ? 'rotate-180' : ''}`}
            />
          </button>
          
          {categoriesOpen && (
            <div className="bg-gray-50">
              <div className="px-6 py-2 flex justify-between items-center hover:bg-gray-100 cursor-pointer">
                <span className="text-sm text-gray-600">Dresses</span>
                <span className="text-xs bg-gray-200 px-2 py-1 rounded-full">21</span>
              </div>
              <div className="px-6 py-2 flex justify-between items-center hover:bg-gray-100 cursor-pointer">
                <span className="text-sm text-gray-600">Gowns</span>
                <span className="text-xs bg-gray-200 px-2 py-1 rounded-full">32</span>
              </div>
              <div className="px-6 py-2 flex justify-between items-center hover:bg-gray-100 cursor-pointer">
                <span className="text-sm text-gray-600">Casual</span>
                <span className="text-xs bg-gray-200 px-2 py-1 rounded-full">13</span>
              </div>
              <div className="px-6 py-2 flex justify-between items-center hover:bg-gray-100 cursor-pointer">
                <span className="text-sm text-gray-600">Formal</span>
                <span className="text-xs bg-gray-200 px-2 py-1 rounded-full">14</span>
              </div>
              <div className="px-6 py-2 flex justify-between items-center hover:bg-gray-100 cursor-pointer">
                <span className="text-sm text-gray-600">Party</span>
                <span className="text-xs bg-gray-200 px-2 py-1 rounded-full">06</span>
              </div>
              <div className="px-6 py-2 flex justify-between items-center hover:bg-gray-100 cursor-pointer">
                <span className="text-sm text-gray-600">Wedding</span>
                <span className="text-xs bg-gray-200 px-2 py-1 rounded-full">11</span>
              </div>
            </div>
          )}
        </div>
      </nav>
    </aside>
  );
}

export default AdminSidebar;


import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../../context/AdminContext';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import { FaExclamationCircle, FaCheckCircle, FaClock, FaTimes } from 'react-icons/fa';

function AdminIssueTracker() {
  const navigate = useNavigate();
  const { isAdminAuthenticated, admin, loading: adminLoading } = useAdmin();
  const [issues, setIssues] = useState([]);
  const [filterPriority, setFilterPriority] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!adminLoading && !isAdminAuthenticated) {
      navigate('/admin/login');
      return;
    }

    loadIssues();
  }, [isAdminAuthenticated, navigate, admin]);

  const loadIssues = async () => {
    try {
      setLoading(true);
      // Fetch brand-specific issues if admin has a brand, otherwise all issues
      const url = admin?.brand 
        ? `http://localhost:8080/api/issues/brand/${admin.brand}`
        : 'http://localhost:8080/api/issues';
      
      const response = await fetch(url);
      const data = await response.json();
      
      // Sort by created date (newest first)
      data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      setIssues(data);
    } catch (error) {
      console.error('Error loading issues:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    const p = (priority || '').toLowerCase();
    switch (p) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    const s = (status || '').toLowerCase().replace(' ', '_');
    switch (s) {
      case 'open':
        return <FaExclamationCircle className="text-red-500" />;
      case 'in_progress':
        return <FaClock className="text-yellow-500" />;
      case 'resolved':
        return <FaCheckCircle className="text-green-500" />;
      case 'closed':
        return <FaTimes className="text-green-500" />;
      default:
        return <FaTimes className="text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    const s = (status || '').toLowerCase().replace(' ', '_');
    switch (s) {
      case 'open':
        return 'bg-red-100 text-red-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredIssues = filterPriority === 'all' 
    ? issues 
    : issues.filter(issue => (issue.priority || '').toLowerCase() === filterPriority.toLowerCase());

  const getIssueCount = (priority) => {
    return priority === 'all' 
      ? issues.length 
      : issues.filter(issue => (issue.priority || '').toLowerCase() === priority.toLowerCase()).length;
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      <AdminSidebar />
      <AdminHeader />

      <main className="ml-64 mt-16 p-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Issue Tracker</h1>
          <p className="text-sm text-gray-500">Home &gt; Issue Tracker</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div
            onClick={() => setFilterPriority('all')}
            className={`bg-white rounded-lg p-6 shadow-sm cursor-pointer hover:shadow-md transition ${
              filterPriority === 'all' ? 'ring-2 ring-teal-600' : ''
            }`}
          >
            <h3 className="text-sm text-gray-600 mb-2">All Issues</h3>
            <p className="text-3xl font-bold text-gray-800">{getIssueCount('all')}</p>
          </div>

          <div
            onClick={() => setFilterPriority('high')}
            className={`bg-white rounded-lg p-6 shadow-sm cursor-pointer hover:shadow-md transition ${
              filterPriority === 'high' ? 'ring-2 ring-red-600' : ''
            }`}
          >
            <h3 className="text-sm text-gray-600 mb-2">High Priority</h3>
            <p className="text-3xl font-bold text-red-600">{getIssueCount('high')}</p>
          </div>

          <div
            onClick={() => setFilterPriority('medium')}
            className={`bg-white rounded-lg p-6 shadow-sm cursor-pointer hover:shadow-md transition ${
              filterPriority === 'medium' ? 'ring-2 ring-yellow-600' : ''
            }`}
          >
            <h3 className="text-sm text-gray-600 mb-2">Medium Priority</h3>
            <p className="text-3xl font-bold text-yellow-600">{getIssueCount('medium')}</p>
          </div>

          <div
            onClick={() => setFilterPriority('low')}
            className={`bg-white rounded-lg p-6 shadow-sm cursor-pointer hover:shadow-md transition ${
              filterPriority === 'low' ? 'ring-2 ring-blue-600' : ''
            }`}
          >
            <h3 className="text-sm text-gray-600 mb-2">Low Priority</h3>
            <p className="text-3xl font-bold text-blue-600">{getIssueCount('low')}</p>
          </div>
        </div>

        {/* Issues List */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold">
              {filterPriority === 'all' ? 'All Issues' : `${filterPriority.charAt(0).toUpperCase() + filterPriority.slice(1)} Priority Issues`}
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4">
                    <input type="checkbox" className="rounded" />
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Issue ID</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Title</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Customer</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Order No</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Priority</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Created</th>
                </tr>
              </thead>
              <tbody>
                {filteredIssues.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-12 text-gray-500">
                      No issues found
                    </td>
                  </tr>
                ) : (
                  filteredIssues.map((issue) => (
                    <tr key={issue.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <input type="checkbox" className="rounded" />
                      </td>
                      <td className="py-4 px-4 text-sm font-semibold">{issue.id}</td>
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-semibold text-sm">{issue.title}</p>
                          <p className="text-xs text-gray-500">{issue.description}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-sm">{issue.customerName}</td>
                      <td className="py-4 px-4 text-sm">#{issue.orderNo}</td>
                      <td className="py-4 px-4">
                        <span className={`text-xs px-3 py-1 rounded-full font-semibold ${getPriorityColor(issue.priority)}`}>
                          {issue.priority}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(issue.status)}
                          <span className={`text-xs px-3 py-1 rounded-full font-semibold ${getStatusColor(issue.status)}`}>
                            {issue.status}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-600">
                        {new Date(issue.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          {filteredIssues.length > 0 && (
            <div className="p-4 border-t border-gray-200 flex justify-between items-center">
              <p className="text-sm text-gray-600">
                Showing {filteredIssues.length} of {issues.length} issues
              </p>
              <div className="flex space-x-2">
                <button className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700">
                  Resolve Selected
                </button>
                <button className="px-4 py-2 bg-white text-gray-700 rounded border hover:bg-gray-50">
                  Export Report
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default AdminIssueTracker;


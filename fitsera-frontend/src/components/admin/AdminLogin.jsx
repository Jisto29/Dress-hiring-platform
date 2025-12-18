import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../../context/AdminContext';
import { FaUser, FaLock, FaExclamationCircle } from 'react-icons/fa';

function AdminLogin() {
  const navigate = useNavigate();
  const { adminLogin } = useAdmin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !password) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    try {
      const result = await adminLogin(email, password);
      if (result.success) {
        navigate('/admin/dashboard');
      } else {
        // Make error messages more user-friendly
        const errorMessage = result.message || 'Login failed';
        if (errorMessage.toLowerCase().includes('invalid credentials')) {
          setError('Incorrect email or password. Please check your credentials and try again.');
        } else if (errorMessage.toLowerCase().includes('not found')) {
          setError('No account found with this email address. Please sign up or check your email.');
        } else {
          setError(errorMessage);
        }
      }
    } catch (err) {
      setError('Unable to connect to the server. Please check your internet connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Fitsera Admin</h1>
          <p className="text-gray-400">Sign in to access the admin dashboard</p>
        </div>

        <div className="bg-white rounded-lg shadow-2xl p-8">
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-semibold mb-2">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-400">
                  <FaUser />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="admin@fitsera.com"
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-semibold mb-2">
                Password
              </label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-400">
                  <FaLock />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg flex items-start gap-3">
                <FaExclamationCircle className="text-red-500 mt-0.5 flex-shrink-0" size={18} />
                <div>
                  <p className="text-red-800 font-medium text-sm">{error}</p>
                  {error.toLowerCase().includes('incorrect') && (
                    <p className="text-red-600 text-xs mt-1">
                      Tip: Make sure Caps Lock is off and check for typos.
                    </p>
                  )}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-200 disabled:bg-blue-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an admin account?{' '}
              <button
                onClick={() => navigate('/admin/signup')}
                className="text-blue-600 hover:text-blue-800 font-semibold"
              >
                Create Account
              </button>
            </p>
          </div>

          <div className="mt-4 text-center">
            <button
              onClick={() => navigate('/')}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              ← Back to Customer Site
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;


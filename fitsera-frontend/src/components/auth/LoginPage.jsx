import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FaGoogle, FaFacebook, FaExclamationCircle } from 'react-icons/fa';

function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await login(formData.email, formData.password);
      navigate('/');
    } catch (err) {
      // Make error messages more user-friendly
      const errorMessage = err.message || 'Login failed';
      if (errorMessage.toLowerCase().includes('invalid credentials') || errorMessage.toLowerCase().includes('incorrect')) {
        setError('Incorrect email or password. Please check your credentials and try again.');
      } else if (errorMessage.toLowerCase().includes('not found')) {
        setError('No account found with this email address. Please sign up or check your email.');
      } else if (errorMessage.toLowerCase().includes('network') || errorMessage.toLowerCase().includes('fetch')) {
        setError('Unable to connect to the server. Please check your internet connection and try again.');
      } else {
        setError(errorMessage);
      }
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-beige grid lg:grid-cols-2">
      {/* Left side - Image */}
      <div className="hidden lg:block">
        <div className="h-full bg-gradient-to-br from-amber-100 to-stone-300 p-12 flex items-center justify-center">
          <div className="w-full max-w-md bg-gradient-to-b from-amber-400 to-amber-600 rounded-3xl p-8 aspect-square flex items-center justify-center shadow-2xl">
            <div className="text-center">
              <div className="w-48 h-48 mx-auto bg-white/20 rounded-full flex items-center justify-center">
                <div className="text-white text-6xl">👗</div>
              </div>
              <p className="text-white text-lg mt-6">Fashion Rental Made Easy</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-right mb-12">
            <h1 className="text-3xl font-bold text-black cursor-pointer" onClick={() => navigate('/')}>
              Fitsera
            </h1>
          </div>

          <div className="space-y-8">
            <div>
              <h2 className="text-4xl font-bold text-black mb-2">Welcome Back</h2>
            </div>

            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg flex items-start gap-3">
                <FaExclamationCircle className="text-red-500 mt-0.5 flex-shrink-0" size={18} />
                <div>
                  <p className="text-red-800 font-medium text-sm">{error}</p>
                  {error.toLowerCase().includes('incorrect') && (
                    <p className="text-red-600 text-xs mt-1">
                      Tip: Make sure Caps Lock is off and check for typos.
                    </p>
                  )}
                  {error.toLowerCase().includes('no account found') && (
                    <p className="text-red-600 text-xs mt-1">
                      New to Fitsera? Click "Sign up" below to create an account.
                    </p>
                  )}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="Example@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-teal-900"
                  required
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  placeholder="At least 8 characters"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-teal-900"
                  required
                />
              </div>

              {/* Forgot Password */}
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => navigate('/forgot-password')}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Forgot Password?
                </button>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                className="w-full bg-teal-900 text-white py-3 rounded-lg font-semibold hover:bg-teal-800 transition"
              >
                Sign in
              </button>
            </form>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-beige text-gray-500">Or</span>
              </div>
            </div>

            {/* Social Login */}
            <div className="space-y-3">
              <button
                type="button"
                className="w-full bg-white border border-gray-300 py-3 rounded-lg font-medium hover:bg-gray-50 transition flex items-center justify-center gap-3"
              >
                <FaGoogle className="text-xl" />
                Sign in with Google
              </button>
              <button
                type="button"
                className="w-full bg-white border border-gray-300 py-3 rounded-lg font-medium hover:bg-gray-50 transition flex items-center justify-center gap-3"
              >
                <FaFacebook className="text-xl text-blue-600" />
                Sign in with Facebook
              </button>
            </div>

            {/* Sign Up Link */}
            <div className="text-center">
              <span className="text-gray-600">Don't you have an account? </span>
              <button
                type="button"
                onClick={() => navigate('/signup')}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Sign up
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;


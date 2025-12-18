import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FaGoogle, FaFacebook } from 'react-icons/fa';

function SignUpPage() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    try {
      await signup(formData);
      navigate('/');
    } catch (err) {
      setError(err.message);
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
      {/* Left side - Form */}
      <div className="flex items-center justify-center p-8 order-2 lg:order-1">
        <div className="w-full max-w-md">
          <div className="mb-12">
            <h1 className="text-3xl font-bold text-black cursor-pointer" onClick={() => navigate('/')}>
              Fitsera
            </h1>
          </div>

          <div className="space-y-8">
            <div>
              <h2 className="text-4xl font-bold text-black mb-2">Let's get Started</h2>
            </div>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  placeholder="Enter your name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-teal-900"
                  required
                />
              </div>

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
                  minLength={8}
                />
              </div>

              {/* Sign Up Button */}
              <button
                type="submit"
                className="w-full bg-teal-900 text-white py-3 rounded-lg font-semibold hover:bg-teal-800 transition"
              >
                Sign Up
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

            {/* Social Sign Up */}
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

            {/* Sign In Link */}
            <div className="text-center">
              <span className="text-gray-600">have an account? </span>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Sign in
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Image */}
      <div className="hidden lg:block order-1 lg:order-2">
        <div className="h-full bg-gradient-to-br from-rose-100 via-teal-100 to-green-200 p-12 flex items-center justify-center">
          <div className="w-full max-w-md bg-gradient-to-b from-gray-800 to-black rounded-3xl p-8 aspect-square flex items-center justify-center shadow-2xl">
            <div className="text-center">
              <div className="w-48 h-48 mx-auto bg-white/10 rounded-full flex items-center justify-center">
                <div className="text-white text-6xl">✨</div>
              </div>
              <p className="text-white text-lg mt-6">Join Our Fashion Community</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignUpPage;


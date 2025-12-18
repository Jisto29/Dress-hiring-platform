import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../../context/AdminContext';
import { FaUser, FaLock, FaEnvelope, FaStore, FaImage } from 'react-icons/fa';

function AdminSignup() {
  const navigate = useNavigate();
  const { adminSignup } = useAdmin();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    brand: '',
    password: '',
    confirmPassword: ''
  });
  const [brandLogo, setBrandLogo] = useState('');
  const [logoPreview, setLogoPreview] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please upload a valid image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Logo file size must be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setBrandLogo(reader.result);
        setLogoPreview(reader.result);
        setError(''); // Clear any previous errors
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.name || !formData.email || !formData.brand || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (!brandLogo) {
      setError('Please upload your brand logo');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      const result = await adminSignup({
        adminName: formData.name,
        email: formData.email,
        brandName: formData.brand,
        password: formData.password,
        brandLogo: brandLogo
      });

      if (result.success) {
        navigate('/admin/dashboard');
      } else {
        setError(result.message || 'Signup failed. Please try again.');
      }
    } catch (error) {
      setError('An error occurred during signup. Please try again.');
      console.error('Signup error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Fitsera Admin</h1>
          <p className="text-gray-400">Create your brand admin account</p>
        </div>

        <div className="bg-white rounded-lg shadow-2xl p-8">
          <form onSubmit={handleSubmit}>
            <div className="mb-5">
              <label className="block text-gray-700 text-sm font-semibold mb-2">
                Admin Name
              </label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-400">
                  <FaUser />
                </span>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-gray-700 text-sm font-semibold mb-2">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-400">
                  <FaEnvelope />
                </span>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="brandadmin@fitsera.com"
                />
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-gray-700 text-sm font-semibold mb-2">
                Brand Name
              </label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-400">
                  <FaStore />
                </span>
                <input
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="GUCCI, ZARA, H&M, etc."
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Your brand name will be converted to uppercase</p>
            </div>

            <div className="mb-5">
              <label className="block text-gray-700 text-sm font-semibold mb-2">
                Brand Logo <span className="text-red-500">*</span>
              </label>
              <div className="space-y-3">
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition">
                    {logoPreview ? (
                      <div className="flex flex-col items-center justify-center p-4">
                        <img src={logoPreview} alt="Brand Logo Preview" className="max-h-20 max-w-full object-contain" />
                        <p className="mt-2 text-xs text-gray-600">Click to change</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <FaImage className="w-8 h-8 mb-2 text-gray-400" />
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">Click to upload</span> brand logo
                        </p>
                        <p className="text-xs text-gray-500">PNG, JPG, JPEG (MAX. 5MB)</p>
                      </div>
                    )}
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleLogoUpload}
                    />
                  </label>
                </div>
                <p className="text-xs text-gray-500">Upload your brand's official logo. This will be displayed on the brands page.</p>
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-gray-700 text-sm font-semibold mb-2">
                Password
              </label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-400">
                  <FaLock />
                </span>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-semibold mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-400">
                  <FaLock />
                </span>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-200"
            >
              Create Admin Account
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <button
                onClick={() => navigate('/admin/login')}
                className="text-blue-600 hover:text-blue-800 font-semibold"
              >
                Sign In
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

export default AdminSignup;


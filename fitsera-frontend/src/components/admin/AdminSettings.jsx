import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../../context/AdminContext';
import { FaUser, FaLock, FaStore, FaImage, FaEnvelope, FaSave, FaTimes, FaArrowLeft } from 'react-icons/fa';

function AdminSettings() {
  const navigate = useNavigate();
  const { admin, updateAdminProfile } = useAdmin();
  const [activeTab, setActiveTab] = useState('profile');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [accountData, setAccountData] = useState(null);
  
  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    brand: ''
  });
  
  // Logo form state
  const [brandLogo, setBrandLogo] = useState('');
  const [logoPreview, setLogoPreview] = useState('');
  
  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Fetch account data when admin loads
  useEffect(() => {
    const fetchAccountData = async () => {
      if (admin && admin.accountId) {
        try {
          const response = await fetch(`http://localhost:8080/api/accounts/${admin.accountId}`, {
            credentials: 'include',
          });
          
          if (response.ok) {
            const account = await response.json();
            setAccountData(account);
          }
        } catch (error) {
          console.error('Error fetching account data:', error);
        }
      }
    };

    fetchAccountData();
  }, [admin]);

  // Update form when admin or account data loads
  useEffect(() => {
    if (admin && accountData) {
      setProfileForm({
        name: admin.fullName || '',
        email: admin.email || '',
        brand: accountData.name || ''
      });
      setLogoPreview(accountData.brandLogo || '');
      setBrandLogo(accountData.brandLogo || '');
    }
  }, [admin, accountData]);

  const handleProfileChange = (e) => {
    setProfileForm({
      ...profileForm,
      [e.target.name]: e.target.value
    });
  };

  const handlePasswordChange = (e) => {
    setPasswordForm({
      ...passwordForm,
      [e.target.name]: e.target.value
    });
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setMessage({ type: 'error', text: 'Please upload a valid image file' });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'Logo file size must be less than 5MB' });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setBrandLogo(reader.result);
        setLogoPreview(reader.result);
        setMessage({ type: '', text: '' });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (!profileForm.name || !profileForm.email || !profileForm.brand) {
      setMessage({ type: 'error', text: 'Please fill in all fields' });
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(profileForm.email)) {
      setMessage({ type: 'error', text: 'Please enter a valid email address' });
      return;
    }

    const result = updateAdminProfile({
      name: profileForm.name,
      email: profileForm.email,
      brand: profileForm.brand.toUpperCase()
    });

    if (result.success) {
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } else {
      setMessage({ type: 'error', text: result.message });
    }
  };

  const handleLogoSubmit = (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (!brandLogo) {
      setMessage({ type: 'error', text: 'Please upload a brand logo' });
      return;
    }

    const result = updateAdminProfile({ brandLogo });

    if (result.success) {
      setMessage({ type: 'success', text: 'Brand logo updated successfully!' });
    } else {
      setMessage({ type: 'error', text: result.message });
    }
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setMessage({ type: 'error', text: 'Please fill in all password fields' });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'New password must be at least 6 characters long' });
      return;
    }

    const result = updateAdminProfile({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword
    });

    if (result.success) {
      setMessage({ type: 'success', text: 'Password updated successfully!' });
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } else {
      setMessage({ type: 'error', text: result.message });
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate('/admin/dashboard')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 transition"
        >
          <FaArrowLeft />
          <span>Back to Dashboard</span>
        </button>
        
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Account Settings</h1>

        {/* Message Display */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-100 border border-green-400 text-green-700' 
              : 'bg-red-100 border border-red-400 text-red-700'
          }`}>
            <div className="flex items-center justify-between">
              <span>{message.text}</span>
              <button onClick={() => setMessage({ type: '', text: '' })}>
                <FaTimes />
              </button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex-1 py-4 px-6 text-center font-semibold transition ${
                activeTab === 'profile'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              <FaUser className="inline mr-2" />
              Profile Information
            </button>
            <button
              onClick={() => setActiveTab('logo')}
              className={`flex-1 py-4 px-6 text-center font-semibold transition ${
                activeTab === 'logo'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              <FaImage className="inline mr-2" />
              Brand Logo
            </button>
            <button
              onClick={() => setActiveTab('password')}
              className={`flex-1 py-4 px-6 text-center font-semibold transition ${
                activeTab === 'password'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              <FaLock className="inline mr-2" />
              Change Password
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-md p-8">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <form onSubmit={handleProfileSubmit}>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Profile Information</h2>
              
              <div className="space-y-6">
                {/* Admin Name */}
                <div>
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
                      value={profileForm.name}
                      onChange={handleProfileChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="Your Name"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
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
                      value={profileForm.email}
                      onChange={handleProfileChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="admin@brand.com"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    ⚠️ Changing email will affect your login credentials
                  </p>
                </div>

                {/* Brand Name */}
                <div>
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
                      value={profileForm.brand}
                      onChange={handleProfileChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="BRAND NAME"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Brand name will be converted to uppercase
                  </p>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition duration-200"
                  >
                    <FaSave />
                    Save Profile Changes
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Logo Tab */}
          {activeTab === 'logo' && (
            <form onSubmit={handleLogoSubmit}>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Brand Logo</h2>
              
              <div className="space-y-6">
                {/* Current Logo Preview */}
                {logoPreview && (
                  <div>
                    <label className="block text-gray-700 text-sm font-semibold mb-2">
                      Current Logo
                    </label>
                    <div className="flex items-center justify-center w-full p-6 border-2 border-gray-300 rounded-lg bg-gray-50">
                      <img 
                        src={logoPreview} 
                        alt="Brand Logo" 
                        className="max-h-32 max-w-full object-contain"
                      />
                    </div>
                  </div>
                )}

                {/* Logo Upload */}
                <div>
                  <label className="block text-gray-700 text-sm font-semibold mb-2">
                    Upload New Logo
                  </label>
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <FaImage className="w-12 h-12 mb-3 text-gray-400" />
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">PNG, JPG, JPEG (MAX. 5MB)</p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleLogoUpload}
                      />
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    This logo will be displayed on the brands page and throughout the admin panel
                  </p>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition duration-200"
                  >
                    <FaSave />
                    Update Brand Logo
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Password Tab */}
          {activeTab === 'password' && (
            <form onSubmit={handlePasswordSubmit}>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Change Password</h2>
              
              <div className="space-y-6">
                {/* Current Password */}
                <div>
                  <label className="block text-gray-700 text-sm font-semibold mb-2">
                    Current Password
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-gray-400">
                      <FaLock />
                    </span>
                    <input
                      type="password"
                      name="currentPassword"
                      value={passwordForm.currentPassword}
                      onChange={handlePasswordChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="Enter current password"
                    />
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-gray-700 text-sm font-semibold mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-gray-400">
                      <FaLock />
                    </span>
                    <input
                      type="password"
                      name="newPassword"
                      value={passwordForm.newPassword}
                      onChange={handlePasswordChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="Enter new password"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Must be at least 6 characters long
                  </p>
                </div>

                {/* Confirm New Password */}
                <div>
                  <label className="block text-gray-700 text-sm font-semibold mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-gray-400">
                      <FaLock />
                    </span>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={passwordForm.confirmPassword}
                      onChange={handlePasswordChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>

                {/* Security Notice */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Security Tip:</strong> Choose a strong password that includes uppercase and lowercase letters, numbers, and special characters.
                  </p>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition duration-200"
                  >
                    <FaSave />
                    Update Password
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminSettings;


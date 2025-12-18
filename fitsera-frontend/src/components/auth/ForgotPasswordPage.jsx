import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FaChevronLeft } from 'react-icons/fa';

function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { sendVerificationCode } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    try {
      sendVerificationCode(email);
      navigate('/verify-code', { state: { email } });
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-beige">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black">Fitsera</h1>
        </div>

        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => navigate('/login')}
            className="flex items-center gap-2 text-gray-600 hover:text-black mb-8"
          >
            <FaChevronLeft />
          </button>

          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-black mb-2">Forgot password</h2>
              <p className="text-gray-500">Please enter your email to reset the password</p>
            </div>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6 mt-12">
              <div className="flex items-center gap-4">
                <label className="text-black font-medium w-32">Your Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contact@dscodetech.com"
                  className="flex-1 px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="flex justify-center mt-12">
                <button
                  type="submit"
                  className="px-32 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition"
                >
                  Reset Password
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;


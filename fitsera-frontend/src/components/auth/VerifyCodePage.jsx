import { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FaChevronLeft } from 'react-icons/fa';

function VerifyCodePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { verifyCode, sendVerificationCode } = useAuth();
  const email = location.state?.email || '';
  
  const [code, setCode] = useState(['', '', '', '', '']);
  const [error, setError] = useState('');
  const inputRefs = [useRef(), useRef(), useRef(), useRef(), useRef()];

  const handleChange = (index, value) => {
    if (value.length > 1) return;
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 4) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const fullCode = code.join('');
    if (fullCode.length !== 5) {
      setError('Please enter the complete code');
      return;
    }

    if (verifyCode(fullCode)) {
      navigate('/set-new-password', { state: { email } });
    } else {
      setError('Invalid verification code');
    }
  };

  const handleResend = () => {
    try {
      sendVerificationCode(email);
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
            onClick={() => navigate('/forgot-password')}
            className="flex items-center gap-2 text-gray-600 hover:text-black mb-8"
          >
            <FaChevronLeft />
          </button>

          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-black mb-2">Check your email</h2>
              <p className="text-gray-500">
                We sent a reset link to <span className="font-semibold text-black">{email}</span>
              </p>
              <p className="text-gray-500">enter 5 digit code that mentioned in the email</p>
            </div>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8 mt-12">
              <div className="flex justify-center gap-4">
                {code.map((digit, index) => (
                  <input
                    key={index}
                    ref={inputRefs[index]}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-16 h-16 text-center text-2xl font-semibold bg-white border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                ))}
              </div>

              <div className="flex justify-center">
                <button
                  type="submit"
                  className="px-32 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition"
                >
                  Verify Code
                </button>
              </div>

              <div className="text-center">
                <span className="text-gray-500">Haven't got the email yet? </span>
                <button
                  type="button"
                  onClick={handleResend}
                  className="text-blue-600 hover:text-blue-800 font-medium underline"
                >
                  Resend email
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VerifyCodePage;


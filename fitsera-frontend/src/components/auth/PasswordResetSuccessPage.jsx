import { useNavigate } from 'react-router-dom';
import { FaChevronLeft } from 'react-icons/fa';

function PasswordResetSuccessPage() {
  const navigate = useNavigate();

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
              <h2 className="text-3xl font-bold text-black mb-2">Password reset</h2>
              <p className="text-gray-500">Your password has been successfully reset. click confirm to set a new password</p>
            </div>

            <div className="flex justify-center mt-12">
              <button
                onClick={() => navigate('/login')}
                className="px-32 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PasswordResetSuccessPage;


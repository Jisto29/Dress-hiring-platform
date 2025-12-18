import { useState } from 'react';
import { FaTrash } from 'react-icons/fa';

const ReturnModal = ({ isOpen, onClose, product, onSubmit }) => {
  const [formData, setFormData] = useState({
    returnOption: 'send_post',
    condition: 'not_perfect',
    conditionDetails: ''
  });

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-beige rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          <h2 className="text-3xl font-bold text-center mb-8">Return</h2>

          {/* Product Info */}
          <div className="bg-white rounded-lg p-6 mb-6">
            <div className="flex items-start justify-between">
              <div className="flex gap-4">
                <img 
                  src={product.productImage} 
                  alt={product.productTitle}
                  className="w-24 h-32 object-cover rounded-lg"
                />
                <div>
                  <h3 className="font-bold text-lg">{product.productTitle}</h3>
                  <p className="text-gray-600 text-sm">Size: {product.size}</p>
                  <p className="text-gray-600 text-sm">Color: {product.color}</p>
                  <p className="text-gray-600 text-sm">Return: {product.returnDate ? new Date(product.returnDate).toLocaleDateString() : 'N/A'}</p>
                  <p className="font-bold text-lg mt-2">${product.total?.toFixed(2)}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTrash />
              </button>
            </div>
          </div>

          {/* Return Options */}
          <div className="mb-6">
            <h3 className="font-bold text-lg mb-4">Return Options</h3>
            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="returnOption"
                  value="send_post"
                  checked={formData.returnOption === 'send_post'}
                  onChange={handleInputChange}
                  className="mt-1"
                />
                <div>
                  <p className="font-semibold">Send post</p>
                  <p className="text-sm text-gray-600">123 mathew avenue,</p>
                  <p className="text-sm text-gray-600">liverpool,</p>
                  <p className="text-sm text-gray-600">2547,</p>
                  <p className="text-sm text-gray-600">NSW</p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="returnOption"
                  value="drop_off"
                  checked={formData.returnOption === 'drop_off'}
                  onChange={handleInputChange}
                  className="mt-1"
                />
                <div>
                  <p className="font-semibold">Drop off at</p>
                  <p className="text-sm text-gray-600">123 mathew avenue,</p>
                  <p className="text-sm text-gray-600">liverpool,</p>
                  <p className="text-sm text-gray-600">2547,</p>
                  <p className="text-sm text-gray-600">NSW</p>
                </div>
              </label>
            </div>
          </div>

          {/* Product Condition */}
          <div className="mb-6">
            <h3 className="font-bold text-lg mb-4">Product condition</h3>
            <div className="flex gap-4 mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="condition"
                  value="perfect"
                  checked={formData.condition === 'perfect'}
                  onChange={handleInputChange}
                />
                <span>Perfect</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="condition"
                  value="not_perfect"
                  checked={formData.condition === 'not_perfect'}
                  onChange={handleInputChange}
                />
                <span>Not perfect</span>
              </label>
            </div>

            <textarea
              name="conditionDetails"
              value={formData.conditionDetails}
              onChange={handleInputChange}
              placeholder="Has got some stain from a coffee"
              className="w-full border border-gray-300 rounded-lg p-3 h-24 resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={handleSubmit}
              className="flex-1 bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800"
            >
              RETURN
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-white border-2 border-black text-black py-3 rounded-lg font-semibold hover:bg-gray-100"
            >
              CANCEL
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReturnModal;


import { useState, useEffect } from 'react';
import { FaStar } from 'react-icons/fa';

const ReviewSubmissionModal = ({ isOpen, onClose, product, orderId, onSubmit, existingReview }) => {
  const [formData, setFormData] = useState({
    rating: 0,
    reviewTitle: '',
    comment: ''
  });
  const [hoverRating, setHoverRating] = useState(0);

  // Pre-fill form if editing existing review
  useEffect(() => {
    if (existingReview) {
      setFormData({
        rating: existingReview.rating || 0,
        reviewTitle: existingReview.reviewTitle || '',
        comment: existingReview.comment || ''
      });
    } else {
      // Reset form for new review
      setFormData({
        rating: 0,
        reviewTitle: '',
        comment: ''
      });
    }
  }, [existingReview, isOpen]);

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleRatingClick = (rating) => {
    setFormData({ ...formData, rating });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.rating === 0) {
      alert('Please select a rating');
      return;
    }
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          <h2 className="text-3xl font-bold text-center mb-8">
            {existingReview ? 'Edit Your Review' : 'Leave a Review'}
          </h2>

          {/* Product Info */}
          <div className="bg-beige rounded-lg p-6 mb-6">
            <div className="flex gap-4">
              <img 
                src={product.productImage} 
                alt={product.productTitle}
                className="w-20 h-28 object-cover rounded-lg"
              />
              <div>
                <h3 className="font-bold text-lg">{product.productTitle}</h3>
                <p className="text-gray-600 text-sm">Brand: {product.brand}</p>
                <p className="text-gray-600 text-sm">Size: {product.size}</p>
              </div>
            </div>
          </div>

          {/* Rating */}
          <div className="mb-6">
            <label className="block font-semibold mb-3 text-lg">Your Rating *</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleRatingClick(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="text-3xl focus:outline-none transition-colors"
                >
                  <FaStar
                    className={
                      star <= (hoverRating || formData.rating)
                        ? 'text-yellow-400'
                        : 'text-gray-300'
                    }
                  />
                </button>
              ))}
              <span className="ml-4 text-gray-600 self-center">
                {formData.rating > 0 && `${formData.rating} out of 5 stars`}
              </span>
            </div>
          </div>

          {/* Review Title */}
          <div className="mb-6">
            <label className="block font-semibold mb-2">Review Title</label>
            <input
              type="text"
              name="reviewTitle"
              value={formData.reviewTitle}
              onChange={handleInputChange}
              placeholder="Give your review a title"
              className="w-full border border-gray-300 rounded-lg p-3"
            />
          </div>

          {/* Review Comment */}
          <div className="mb-6">
            <label className="block font-semibold mb-2">Your Review *</label>
            <textarea
              name="comment"
              value={formData.comment}
              onChange={handleInputChange}
              placeholder="Tell us what you think about this product..."
              className="w-full border border-gray-300 rounded-lg p-3 h-32 resize-none"
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              Your review will help other customers make informed decisions
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={handleSubmit}
              className="flex-1 bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800"
            >
              SUBMIT REVIEW
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-white border-2 border-black text-black py-3 rounded-lg font-semibold hover:bg-gray-100"
            >
              SKIP
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewSubmissionModal;


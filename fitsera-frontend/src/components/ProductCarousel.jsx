import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import API_BASE_URL from '../config/api';

function ProductCarousel() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/products`);
        const data = await response.json();
        // Get first 6 products
        setProducts(data.slice(0, 6));
      } catch (error) {
        console.error('Error fetching products:', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) {
    return (
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-8 text-black">
            New Rental Clothes
          </h2>
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-olive-dark"></div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-8 text-black">
          New Rental Clothes
        </h2>
        <div className="relative">
          <button className="absolute left-0 top-1/2 -translate-y-1/2 bg-black text-white p-3 rounded-full hover:bg-gray-800 transition z-10">
            <FaChevronLeft />
          </button>
          <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
            {products.map((product) => (
              <div 
                key={product.id} 
                className="flex-shrink-0 w-72 cursor-pointer"
                onClick={() => navigate(`/product/${product.id}`)}
              >
                <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition">
                  <img
                    src={product.thumbnailUrl || product.imageUrl || product.image}
                    alt={product.title}
                    className="w-full h-96 object-cover"
                  />
                  <div className="p-4">
                    <p className="font-bold text-black mb-2">{product.brand}</p>
                    <p className="text-sm text-gray-600 mb-2 truncate">{product.title}</p>
                    <p className="font-semibold text-black">
                      ${typeof product.price === 'number' ? product.price.toFixed(2) : product.price} Rental
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button className="absolute right-0 top-1/2 -translate-y-1/2 bg-black text-white p-3 rounded-full hover:bg-gray-800 transition z-10">
            <FaChevronRight />
          </button>
        </div>
        <div className="text-center mt-8">
          <button 
            onClick={() => navigate('/category/all')}
            className="border-2 border-black text-black px-8 py-3 font-semibold uppercase hover:bg-black hover:text-white transition"
          >
            SHOP NEW ARRIVALS
          </button>
        </div>
      </div>
    </section>
  );
}

export default ProductCarousel;


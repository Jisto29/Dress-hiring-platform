import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import { FaSearch } from 'react-icons/fa';

function BrandsPage() {
  const navigate = useNavigate();
  const [brands, setBrands] = useState([]);
  const [brandLogos, setBrandLogos] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchBrandsAndLogos();
  }, []);

  const fetchBrandsAndLogos = async () => {
    try {
      setLoading(true);
      
      // Fetch products to get brands
      const productsResponse = await fetch('http://localhost:8080/api/products');
      const products = await productsResponse.json();
      
      // Extract unique brands from products
      const uniqueBrands = [...new Set(products.map(product => product.brand))].filter(Boolean);
      
      // Fetch accounts to get brand logos
      const accountsResponse = await fetch('http://localhost:8080/api/accounts');
      const accounts = await accountsResponse.json();
      
      const logosMap = {};
      accounts.forEach(account => {
        if (account.name && account.brandLogo) {
          logosMap[account.name] = account.brandLogo;
        }
      });
      
      // Sort brands alphabetically
      const sortedBrands = uniqueBrands.sort();
      
      setBrands(sortedBrands);
      setBrandLogos(logosMap);
    } catch (error) {
      console.error('Error fetching brands:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBrandClick = (brandName) => {
    navigate('/category/all', { state: { selectedBrand: brandName } });
  };

  // Filter brands based on search
  const filteredBrands = brands.filter(brand =>
    brand.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Brand icon mapping (optional - can be customized)
  const getBrandIcon = (brandName) => {
    const iconMap = {
      'RALPH LAUREN': '👔',
      'PANDORA': '💎',
      'GUCCI': '👗',
      'PRADA': '👜',
      'VERSACE': '👠',
      'NOOKIE': '🎩',
      'ZARA': '🧥',
      'H&M': '👚',
      'NIKE': '👟',
      'ADIDAS': '⚽',
      'CUE': '👗',
      'INCU': '👕',
      'CALVIN KLEIN': '🩲',
      'TOMMY HILFIGER': '🧢'
    };
    return iconMap[brandName] || '🏷️';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-12">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-black mb-4">
            Browse All Brands
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Explore our collection of premium Australian and international fashion brands
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="relative">
            <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search for a brand..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-lg"
            />
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading brands...</p>
          </div>
        )}

        {/* No Brands Found */}
        {!loading && brands.length === 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🏷️</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">No Brands Available</h3>
            <p className="text-gray-600">
              Brands will appear here once admins add products.
            </p>
          </div>
        )}

        {/* No Search Results */}
        {!loading && brands.length > 0 && filteredBrands.length === 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">No brands found</h3>
            <p className="text-gray-600">
              Try searching with a different keyword
            </p>
          </div>
        )}

        {/* Brands Grid */}
        {!loading && filteredBrands.length > 0 && (
          <>
            <div className="mb-6 text-center text-gray-600">
              Showing {filteredBrands.length} {filteredBrands.length === 1 ? 'brand' : 'brands'}
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {filteredBrands.map((brand, index) => (
                <div
                  key={index}
                  onClick={() => handleBrandClick(brand)}
                  className="bg-white rounded-xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105 hover:-translate-y-1 border border-gray-100"
                >
                  <div className="text-center">
                    {brandLogos[brand] ? (
                      <div className="flex items-center justify-center h-20 mb-4">
                        <img 
                          src={brandLogos[brand]} 
                          alt={`${brand} logo`} 
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                    ) : (
                      <div className="text-5xl mb-4">{getBrandIcon(brand)}</div>
                    )}
                    <p className="font-semibold text-black text-sm leading-tight">
                      {brand}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Back Button */}
        <div className="text-center mt-12">
          <button
            onClick={() => navigate('/')}
            className="px-8 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition font-semibold"
          >
            ← Back to Home
          </button>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default BrandsPage;


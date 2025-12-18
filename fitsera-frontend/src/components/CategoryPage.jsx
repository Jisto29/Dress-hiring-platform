import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { FaFilter, FaChevronRight, FaShoppingCart, FaShoppingBag, FaHeart, FaUser } from 'react-icons/fa';
import Header from './Header';
import Footer from './Footer';

function CategoryPage() {
  const { category, occasion } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Get brand from navigation state if available
  const brandFromState = location.state?.selectedBrand;
  
  // Filter states
  const [selectedBrands, setSelectedBrands] = useState(brandFromState ? [brandFromState] : []);
  const [selectedColors, setSelectedColors] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedOccasions, setSelectedOccasions] = useState(occasion ? [occasion.toUpperCase()] : []);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [priceRange, setPriceRange] = useState([0, 500]);
  const [sortBy, setSortBy] = useState('popular');

  // Available filter options
  const colors = [
    { name: 'green', class: 'bg-green-500' },
    { name: 'red', class: 'bg-red-500' },
    { name: 'yellow', class: 'bg-yellow-500' },
    { name: 'orange', class: 'bg-orange-500' },
    { name: 'pink', class: 'bg-pink-500' },
    { name: 'purple', class: 'bg-purple-500' },
    { name: 'blue', class: 'bg-blue-500' },
    { name: 'black', class: 'bg-black' },
    { name: 'white', class: 'bg-white border border-gray-300' },
  ];

  const sizes = ['8', '10', '12', '14'];
  const occasions = ['CASUAL', 'FORMAL', 'PARTY', 'WEDDING', 'GYM', 'EVERYDAY'];
  const categories = ['Dresses', 'Gowns', 'Suits', 'Jackets', 'Hoodies', 'Skirts', 'Shorts'];

  // Update brand filter when navigation state changes
  useEffect(() => {
    if (brandFromState && !selectedBrands.includes(brandFromState)) {
      setSelectedBrands([brandFromState]);
    }
  }, [brandFromState]);

  // Fetch products from backend
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:8080/api/products');
        const data = await response.json();
        setProducts(data);
        setFilteredProducts(data);
      } catch (error) {
        console.error('Error fetching products:', error);
        setProducts([]);
        setFilteredProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Extract unique brands from products
  const availableBrands = [...new Set(products.map(p => p.brand))].filter(Boolean).sort();

  // Apply filters whenever filter states change
  useEffect(() => {
    let filtered = [...products];

    // Filter by brands
    if (selectedBrands.length > 0) {
      filtered = filtered.filter(p => selectedBrands.includes(p.brand));
    }

    // Filter by colors
    if (selectedColors.length > 0) {
      filtered = filtered.filter(p => selectedColors.includes(p.color));
    }

    // Filter by categories
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(p => selectedCategories.includes(p.category));
    }

    // Filter by occasions
    if (selectedOccasions.length > 0) {
      filtered = filtered.filter(p => selectedOccasions.includes(p.occasion));
    }

    // Filter by sizes (product must have at least one of the selected sizes)
    if (selectedSizes.length > 0) {
      filtered = filtered.filter(p => {
        const productSizes = p.sizes ? p.sizes.split(',').map(s => s.trim()) : [];
        return selectedSizes.some(size => productSizes.includes(size));
      });
    }

    // Filter by price range
    filtered = filtered.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);

    // Sort products
    switch (sortBy) {
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      default: // popular
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    setFilteredProducts(filtered);
  }, [products, selectedBrands, selectedColors, selectedCategories, selectedOccasions, selectedSizes, priceRange, sortBy]);

  const toggleFilter = (setFilter, value) => {
    setFilter(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    );
  };

  const clearAllFilters = () => {
    setSelectedBrands([]);
    setSelectedColors([]);
    setSelectedCategories([]);
    setSelectedOccasions([]);  // Clear all occasions including URL param
    setSelectedSizes([]);
    setPriceRange([0, 500]);
  };

  const displayTitle = occasion 
    ? occasion.charAt(0).toUpperCase() + occasion.slice(1).toLowerCase()
    : category 
    ? category.charAt(0).toUpperCase() + category.slice(1).toLowerCase()
    : 'All Products';

  const ProductCard = ({ product }) => {
    const discount = product.originalPrice ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : null;
    const isOutOfStock = product.stock === 0;
    
    return (
      <div className={`bg-white rounded-lg shadow-md hover:shadow-xl transition overflow-hidden group ${isOutOfStock ? 'opacity-60' : ''}`}>
        <div className="relative">
          <img src={product.thumbnailUrl || product.imageUrl || product.image} alt={product.title} className={`w-full h-80 object-cover ${isOutOfStock ? 'grayscale' : ''}`} />
          
          {/* Out of Stock Overlay */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <div className="bg-red-600 text-white px-6 py-3 rounded-lg font-bold text-lg transform rotate-[-15deg]">
                OUT OF STOCK
              </div>
            </div>
          )}
          
          <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition">
            <button className="bg-white p-2 rounded-full shadow-md hover:shadow-lg" disabled={isOutOfStock}>
              <FaHeart className="text-gray-600" />
            </button>
            <button className="bg-white p-2 rounded-full shadow-md hover:shadow-lg" disabled={isOutOfStock}>
              <FaShoppingCart className="text-gray-600" />
            </button>
          </div>
          {discount && !isOutOfStock && (
            <div className="absolute top-4 left-0 bg-red-500 text-white px-3 py-1 font-bold">
              -{discount}%
            </div>
          )}
          {product.brand && (
            <div className="absolute bottom-4 left-4 bg-white/90 px-3 py-1 rounded-full text-xs font-semibold">
              {product.brand}
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-black mb-2 truncate">{product.title}</h3>
          <div className="flex items-center mb-2">
            {[...Array(5)].map((_, i) => (
              <span key={i} className={i < Math.floor(product.rating || 0) ? 'text-yellow-400' : 'text-gray-300'}>
                ★
              </span>
            ))}
            <span className="ml-2 text-sm text-gray-600">{(product.rating || 0).toFixed(1)}/5</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {product.originalPrice ? (
                <>
                  <span className="font-bold text-black">${product.price}</span>
                  <span className="line-through text-gray-400 text-sm">${product.originalPrice}</span>
                </>
              ) : (
                <span className="font-bold text-black">${product.price}</span>
              )}
            </div>
            {product.category && (
              <span className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-600">
                {product.category}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-beige min-h-screen">
      <Header />

      <div className="container mx-auto px-4 py-8 flex gap-6">
        {/* Left Sidebar - Filters */}
        <div className="w-80 bg-white rounded-lg shadow-md p-6 h-fit sticky top-24 overflow-y-auto max-h-[calc(100vh-120px)]">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-bold text-xl flex items-center gap-2">
              <FaFilter /> Filters
            </h2>
            <button
              onClick={clearAllFilters}
              className="text-sm text-red-600 hover:text-red-800 font-medium"
            >
              Clear All
            </button>
          </div>

          {/* Brands */}
          <div className="mb-6 pb-6 border-b">
            <h3 className="font-semibold mb-3 text-gray-800">Brands</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {availableBrands.map((brand, idx) => (
                <label key={idx} className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded transition">
                  <input
                    type="checkbox"
                    checked={selectedBrands.includes(brand)}
                    onChange={() => toggleFilter(setSelectedBrands, brand)}
                    className="mr-3 w-4 h-4 accent-olive-dark"
                  />
                  <span className="text-sm">{brand}</span>
                  <span className="ml-auto text-xs text-gray-400">
                    ({products.filter(p => p.brand === brand).length})
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div className="mb-6 pb-6 border-b">
            <h3 className="font-semibold mb-3 text-gray-800">Categories</h3>
            <div className="space-y-2">
              {categories.map((cat, idx) => (
                <label key={idx} className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded transition">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(cat)}
                    onChange={() => toggleFilter(setSelectedCategories, cat)}
                    className="mr-3 w-4 h-4 accent-olive-dark"
                  />
                  <span className="text-sm">{cat}</span>
                  <span className="ml-auto text-xs text-gray-400">
                    ({products.filter(p => p.category === cat).length})
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Occasions */}
          <div className="mb-6 pb-6 border-b">
            <h3 className="font-semibold mb-3 text-gray-800">Occasions</h3>
            <div className="space-y-2">
              {occasions.map((occ, idx) => (
                <label key={idx} className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded transition">
                  <input
                    type="checkbox"
                    checked={selectedOccasions.includes(occ)}
                    onChange={() => toggleFilter(setSelectedOccasions, occ)}
                    className="mr-3 w-4 h-4 accent-olive-dark"
                  />
                  <span className="text-sm capitalize">{occ.toLowerCase()}</span>
                  <span className="ml-auto text-xs text-gray-400">
                    ({products.filter(p => p.occasion === occ).length})
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div className="mb-6 pb-6 border-b">
            <h3 className="font-semibold mb-3 text-gray-800">Price Range</h3>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-xs text-gray-600">Min</label>
                  <input
                    type="number"
                    value={priceRange[0]}
                    onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-olive-dark"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-gray-600">Max</label>
                  <input
                    type="number"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-olive-dark"
                  />
                </div>
              </div>
              <input
                type="range"
                min="0"
                max="500"
                value={priceRange[1]}
                onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                className="w-full accent-olive-dark"
              />
              <div className="flex justify-between text-sm text-gray-600">
                <span>${priceRange[0]}</span>
                <span>${priceRange[1]}</span>
              </div>
            </div>
          </div>

          {/* Colors */}
          <div className="mb-6 pb-6 border-b">
            <h3 className="font-semibold mb-3 text-gray-800">Colors</h3>
            <div className="grid grid-cols-3 gap-3">
              {colors.map((color, idx) => (
                <button
                  key={idx}
                  onClick={() => toggleFilter(setSelectedColors, color.name)}
                  className={`w-12 h-12 rounded-lg ${color.class} border-4 ${
                    selectedColors.includes(color.name) ? 'border-olive-dark' : 'border-gray-200'
                  } hover:scale-110 transition shadow-sm`}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          {/* Size */}
          <div className="mb-6">
            <h3 className="font-semibold mb-3 text-gray-800">Sizes Available</h3>
            <div className="grid grid-cols-4 gap-2">
              {sizes.map((size, idx) => (
                <button
                  key={idx}
                  onClick={() => toggleFilter(setSelectedSizes, size)}
                  className={`h-12 rounded-lg ${
                    selectedSizes.includes(size) 
                      ? 'bg-olive-dark text-white' 
                      : 'bg-gray-100 text-black hover:bg-gray-200'
                  } font-semibold transition`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Breadcrumbs */}
          <div className="mb-4 text-sm text-gray-600">
            Home &gt; {displayTitle}
          </div>

          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-4xl font-bold text-black mb-2">{displayTitle}</h1>
            <div className="flex justify-between items-center">
              <p className="text-gray-600">
                Showing {filteredProducts.length} of {products.length} Products
                {(selectedBrands.length > 0 || selectedColors.length > 0 || selectedCategories.length > 0 || 
                  selectedOccasions.length > 0 || selectedSizes.length > 0) && 
                  <span className="ml-2 text-sm text-olive-dark font-medium">
                    ({selectedBrands.length + selectedColors.length + selectedCategories.length + 
                      selectedOccasions.length + selectedSizes.length} filters applied)
                  </span>
                }
              </p>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-olive-dark"
              >
                <option value="popular">Most Popular</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-olive-dark"></div>
            </div>
          )}

          {/* Empty State */}
          {!loading && filteredProducts.length === 0 && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">No products found</h3>
              <p className="text-gray-600 mb-6">Try adjusting your filters to see more results</p>
              <button
                onClick={clearAllFilters}
                className="bg-olive-dark text-white px-6 py-3 rounded-lg hover:bg-opacity-90 transition"
              >
                Clear All Filters
              </button>
            </div>
          )}

          {/* Product Grid */}
          {!loading && filteredProducts.length > 0 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map(product => (
                  <div 
                    key={product.id} 
                    onClick={() => {
                      if (product.stock !== 0) {
                        navigate(`/product/${product.id}`);
                      }
                    }} 
                    className={product.stock === 0 ? 'cursor-not-allowed' : 'cursor-pointer'}
                  >
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>

              {/* Pagination */}
              <div className="flex justify-center items-center gap-2 mt-8">
                <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100">
                  ← Previous
                </button>
                <button className="px-4 py-2 bg-olive-dark text-white rounded-lg">1</button>
                <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100">2</button>
                <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100">3</button>
                <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100">
                  Next →
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default CategoryPage;

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../../context/AdminContext';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import { FaPlus, FaEllipsisV, FaEdit, FaTrash, FaTimes } from 'react-icons/fa';

function AdminAllProducts() {
  const navigate = useNavigate();
  const { isAdminAuthenticated, admin, loading: adminLoading } = useAdmin();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showActionMenu, setShowActionMenu] = useState(null);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [brandName, setBrandName] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    brand: '',
    title: '',
    description: '',
    price: '',
    imageUrl: '',
    occasion: 'CASUAL',
    category: 'Dresses',
    color: 'black',
    sizes: '8,10,12,14',
    available: true,
    stock: 0
  });

  // Fetch brand name from account data
  useEffect(() => {
    const fetchBrandName = async () => {
      if (admin && admin.accountId) {
        try {
          const response = await fetch(`http://localhost:8080/api/accounts/${admin.accountId}`, {
            credentials: 'include',
          });
          
          if (response.ok) {
            const account = await response.json();
            setBrandName(account.name);
            // Set brand name in form data
            setFormData(prev => ({
              ...prev,
              brand: account.name
            }));
          }
        } catch (error) {
          console.error('Error fetching brand name:', error);
        }
      }
    };

    fetchBrandName();
  }, [admin]);

  useEffect(() => {
    if (!adminLoading && !isAdminAuthenticated) {
      navigate('/admin/login');
      return;
    }

    if (admin?.accountId) {
      fetchProducts();
    }
  }, [isAdminAuthenticated, navigate, admin]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      // Fetch only products for this account
      const url = admin?.accountId 
        ? `http://localhost:8080/api/products/account/${admin.accountId}`
        : 'http://localhost:8080/api/products';
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate rental count for a product (lazy load if needed)
  const getRentalCount = (productId) => {
    // For performance, we don't load orders on page load
    // This can be enhanced later with lazy loading
    return 0;
  };

  // Calculate stock bar percentage based on ratio of rentals and remaining stock
  const getStockBarPercentage = (stock, rentals) => {
    // If no stock info, return 0
    if (stock === undefined || stock === null) return 0;
    
    // If no rentals yet, bar should be full (100%)
    if (rentals === 0) return 100;
    
    // Calculate ratio: remaining stock / (rentals + remaining stock)
    const total = rentals + stock;
    if (total === 0) return 0;
    
    return (stock / total) * 100;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    // Store File objects instead of Base64 strings
    setUploadedImages(prev => [...prev, ...files]);
  };

  const removeImage = (index) => {
    const newImages = uploadedImages.filter((_, i) => i !== index);
    setUploadedImages(newImages);
    // Update main image if we removed it
    if (index === 0 && newImages.length > 0) {
      setFormData(prev => ({ ...prev, imageUrl: newImages[0] }));
    } else if (newImages.length === 0) {
      setFormData(prev => ({ ...prev, imageUrl: '' }));
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      // Step 1: Create the product first to get its ID
      const productData = {
        ...formData,
        brand: brandName || formData.brand,
        accountId: admin?.accountId,
        price: parseFloat(formData.price),
        basePricePerDay: parseFloat(formData.basePricePerDay),
        stock: parseInt(formData.stock) || 0,
        rating: 0.0,
        usesMediaAssets: uploadedImages.length > 0, // Flag: using Supabase Storage
      };

      const response = await fetch('http://localhost:8080/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        throw new Error('Failed to create product');
      }

      const newProduct = await response.json();

      // Step 2: Upload images to Supabase Storage if any
      if (uploadedImages.length > 0) {
        for (let i = 0; i < uploadedImages.length; i++) {
          const file = uploadedImages[i];
          const imageFormData = new FormData();
          imageFormData.append('file', file);
          imageFormData.append('productId', newProduct.id);
          imageFormData.append('isPrimary', i === 0); // First image is primary

          await fetch('http://localhost:8080/api/media/upload/product', {
            method: 'POST',
            body: imageFormData,
          });
        }
      }

      alert('Product added successfully!');
      setShowAddModal(false);
      fetchProducts();
      resetForm();
      setUploadedImages([]);
    } catch (error) {
      console.error('Error adding product:', error);
      alert('Error: ' + error.message);
    }
  };

  const handleEditProduct = async (e) => {
    e.preventDefault();
    try {
      // Update product details (without changing images for now)
      const response = await fetch(`http://localhost:8080/api/products/${selectedProduct.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          brand: brandName || formData.brand,
          accountId: admin?.accountId,
          price: parseFloat(formData.price),
          basePricePerDay: parseFloat(formData.basePricePerDay),
          stock: parseInt(formData.stock) || 0,
          // Keep existing images - don't try to update them for now
          imageUrl: formData.imageUrl,
          images: selectedProduct.images,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update product');
      }

      // If new images were uploaded, upload them to Supabase
      if (uploadedImages.length > 0) {
        for (let i = 0; i < uploadedImages.length; i++) {
          const file = uploadedImages[i];
          const imageFormData = new FormData();
          imageFormData.append('file', file);
          imageFormData.append('productId', selectedProduct.id);
          imageFormData.append('isPrimary', i === 0);

          await fetch('http://localhost:8080/api/media/upload/product', {
            method: 'POST',
            body: imageFormData,
          });
        }
      }

      alert('Product updated successfully!');
      setShowEditModal(false);
      fetchProducts();
      resetForm();
      setUploadedImages([]);
    } catch (error) {
      console.error('Error updating product:', error);
      alert('Error: ' + error.message);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:8080/api/products/${productId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchProducts();
      }
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const openEditModal = (product) => {
    setSelectedProduct(product);
    setFormData({
      brand: product.brand,
      title: product.title,
      description: product.description,
      price: product.price.toString(),
      imageUrl: product.imageUrl,
      occasion: product.occasion,
      category: product.category,
      color: product.color,
      sizes: product.sizes,
      available: product.available,
      stock: product.stock || 0
    });
    // Parse and set all uploaded images if they exist
    if (product.images) {
      try {
        const parsedImages = JSON.parse(product.images);
        setUploadedImages(parsedImages);
      } catch (e) {
        console.warn('Failed to parse product images, using imageUrl');
        setUploadedImages([product.imageUrl]);
      }
    } else if (product.imageUrl) {
      setUploadedImages([product.imageUrl]);
    } else {
      setUploadedImages([]);
    }
    setShowEditModal(true);
    setShowActionMenu(null);
  };

  const resetForm = () => {
    setFormData({
      brand: brandName || admin?.brand || '',
      title: '',
      description: '',
      price: '',
      imageUrl: '',
      occasion: 'CASUAL',
      category: 'Dresses',
      color: 'black',
      sizes: '8,10,12,14',
      available: true,
      stock: 0
    });
    setUploadedImages([]);
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      <AdminSidebar />
      <AdminHeader />

      <main className="ml-64 mt-16 p-8">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">All Products</h1>
            <p className="text-sm text-gray-500">Home &gt; All Products</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-black text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800 flex items-center space-x-2"
          >
            <FaPlus />
            <span>ADD NEW PRODUCT</span>
          </button>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-teal-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <div key={product.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="relative">
                  <img
                    src={product.thumbnailUrl || product.imageUrl || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23f3f4f6' width='400' height='300'/%3E%3Ctext fill='%239ca3af' font-family='sans-serif' font-size='24' x='50%25' y='50%25' text-anchor='middle' dominant-baseline='middle'%3ENo Image%3C/text%3E%3C/svg%3E"}
                    alt={product.title}
                    className="w-full h-64 object-cover"
                  />
                  <div className="absolute top-4 right-4">
                    <button
                      onClick={() => setShowActionMenu(showActionMenu === product.id ? null : product.id)}
                      className="bg-white rounded-full p-2 shadow-lg hover:bg-gray-100"
                    >
                      <FaEllipsisV className="text-gray-600" />
                    </button>

                    {showActionMenu === product.id && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-10">
                        <button
                          onClick={() => openEditModal(product)}
                          className="w-full text-left px-4 py-3 hover:bg-gray-100 flex items-center space-x-2 text-sm"
                        >
                          <FaEdit className="text-blue-500" />
                          <span>Edit Product</span>
                        </button>
                        <button
                          onClick={() => {
                            handleDeleteProduct(product.id);
                            setShowActionMenu(null);
                          }}
                          className="w-full text-left px-4 py-3 hover:bg-gray-100 flex items-center space-x-2 text-sm text-red-600"
                        >
                          <FaTrash />
                          <span>Delete Product</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-gray-800">{product.title.substring(0, 20)}...</h3>
                      <p className="text-sm text-gray-500">{product.occasion}</p>
                    </div>
                    <span className="font-bold text-gray-800">${product.price}</span>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3 mb-3">
                    <h4 className="text-xs font-semibold mb-2">Summary</h4>
                    <p className="text-xs text-gray-600">{product.description ? product.description.substring(0, 60) : 'No description'}...</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">Rentals</span>
                      <span className="text-sm font-semibold text-orange-500 flex items-center">
                        ↑ {getRentalCount(product.id)}
                      </span>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-gray-600">Remaining Stock</span>
                        <span className={`text-xs font-semibold ${
                          product.stock === 0 ? 'text-red-500' : 
                          product.stock < 5 ? 'text-orange-500' : 
                          'text-green-600'
                        }`}>
                          {product.stock !== undefined && product.stock !== null ? product.stock : 'N/A'}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${
                            product.stock === 0 ? 'bg-red-500' : 
                            product.stock < 5 ? 'bg-orange-400' : 
                            'bg-green-500'
                          }`}
                          style={{ width: `${getStockBarPercentage(product.stock, getRentalCount(product.id))}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Add New Product</h2>
              <button onClick={() => setShowAddModal(false)}>
                <FaTimes className="text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            <form onSubmit={handleAddProduct} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Brand {brandName && <span className="text-xs text-gray-500">(Auto-filled)</span>}
                  </label>
                  <input
                    type="text"
                    name="brand"
                    value={brandName || formData.brand}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 outline-none cursor-not-allowed"
                    readOnly={!!brandName}
                    disabled={!!brandName}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Price</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Stock Count</label>
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Title</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                  required
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  Product Images <span className="text-xs text-gray-500">(First image will be the main image)</span>
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                  required={uploadedImages.length === 0}
                />
                
                {/* Image Preview */}
                {uploadedImages.length > 0 && (
                  <div className="mt-3 grid grid-cols-4 gap-2">
                    {uploadedImages.map((image, index) => (
                      <div key={index} className="relative">
                        <img
                          src={typeof image === 'string' ? image : URL.createObjectURL(image)}
                          alt={`Upload ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        {index === 0 && (
                          <span className="absolute top-1 left-1 bg-green-500 text-white text-xs px-2 py-1 rounded">
                            Main
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <FaTimes className="text-xs" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Occasion</label>
                  <select
                    name="occasion"
                    value={formData.occasion}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                  >
                    <option value="CASUAL">Casual</option>
                    <option value="FORMAL">Formal</option>
                    <option value="PARTY">Party</option>
                    <option value="WEDDING">Wedding</option>
                    <option value="GYM">Gym</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Category</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                  >
                    <option value="Dresses">Dresses</option>
                    <option value="Gowns">Gowns</option>
                    <option value="Suits">Suits</option>
                    <option value="Jackets">Jackets</option>
                    <option value="Hoodies">Hoodies</option>
                    <option value="Skirts">Skirts</option>
                    <option value="Shorts">Shorts</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Color</label>
                  <input
                    type="text"
                    name="color"
                    value={formData.color}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Sizes (comma-separated)</label>
                <input
                  type="text"
                  name="sizes"
                  value={formData.sizes}
                  onChange={handleInputChange}
                  placeholder="8,10,12,14"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Rating will be calculated from customer reviews</p>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="available"
                  checked={formData.available}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                />
                <label className="ml-2 text-sm font-semibold">Available for rent</label>
              </div>

              <div className="flex justify-end space-x-4 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-gray-100"
                >
                  Add Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Edit Product</h2>
              <button onClick={() => setShowEditModal(false)}>
                <FaTimes className="text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            <form onSubmit={handleEditProduct} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Brand <span className="text-xs text-gray-500">(Cannot be changed)</span>
                  </label>
                  <input
                    type="text"
                    name="brand"
                    value={formData.brand}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 outline-none cursor-not-allowed"
                    readOnly
                    disabled
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Price</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Stock Count</label>
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Title</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                  required
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  Product Images <span className="text-xs text-gray-500">(First image will be the main image)</span>
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                />
                
                {/* Image Preview */}
                {uploadedImages.length > 0 && (
                  <div className="mt-3 grid grid-cols-4 gap-2">
                    {uploadedImages.map((image, index) => (
                      <div key={index} className="relative">
                        <img
                          src={typeof image === 'string' ? image : URL.createObjectURL(image)}
                          alt={`Upload ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        {index === 0 && (
                          <span className="absolute top-1 left-1 bg-green-500 text-white text-xs px-2 py-1 rounded">
                            Main
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <FaTimes className="text-xs" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Occasion</label>
                  <select
                    name="occasion"
                    value={formData.occasion}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                  >
                    <option value="CASUAL">Casual</option>
                    <option value="FORMAL">Formal</option>
                    <option value="PARTY">Party</option>
                    <option value="WEDDING">Wedding</option>
                    <option value="GYM">Gym</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Category</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                  >
                    <option value="Dresses">Dresses</option>
                    <option value="Gowns">Gowns</option>
                    <option value="Suits">Suits</option>
                    <option value="Jackets">Jackets</option>
                    <option value="Hoodies">Hoodies</option>
                    <option value="Skirts">Skirts</option>
                    <option value="Shorts">Shorts</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Color</label>
                  <input
                    type="text"
                    name="color"
                    value={formData.color}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Sizes (comma-separated)</label>
                <input
                  type="text"
                  name="sizes"
                  value={formData.sizes}
                  onChange={handleInputChange}
                  placeholder="8,10,12,14"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Rating is calculated from customer reviews and cannot be changed manually</p>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="available"
                  checked={formData.available}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                />
                <label className="ml-2 text-sm font-semibold">Available for rent</label>
              </div>

              <div className="flex justify-end space-x-4 mt-6">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                >
                  Update Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminAllProducts;


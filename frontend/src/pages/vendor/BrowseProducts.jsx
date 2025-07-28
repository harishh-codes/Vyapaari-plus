import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  Package, 
  ShoppingCart,
  Star,
  MapPin,
  Clock
} from 'lucide-react';
import api from '../../utils/api';
import { toast } from 'react-toastify';

const BrowseProducts = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/products');
      setProducts(response.data.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/api/products/categories/list');
      setCategories(response.data.categories || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const addToSavedKit = async (productId) => {
    try {
              await api.post('/api/vendor/saved-kit/add', { productId });
      toast.success('Product added to saved kit!');
      // Refresh products to update saved status (if we had one)
      // For now, just a toast
    } catch (error) {
      console.error('Error adding to saved kit:', error);
      toast.error('Failed to add to saved kit');
    }
  };

  const handleAddToCart = (product, supplierId, price) => {
    addToCart(product, supplierId, price, 1);
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => navigate('/vendor/dashboard')}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </button>
            <h1 className="text-xl font-semibold text-gray-900">Browse Products</h1>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/vendor/cart')}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <ShoppingCart className="h-5 w-5 mr-1" />
                Cart
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <div key={product._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-w-1 aspect-h-1 w-full">
                <img
                  src={product.image || 'https://via.placeholder.com/300x200?text=Product'}
                  alt={product.name}
                  className="w-full h-48 object-cover"
                />
              </div>
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{product.name}</h3>
                <p className="text-sm text-gray-600 mb-2">{product.category}</p>
                
                {/* Price Range */}
                <div className="mb-3">
                  <p className="text-sm text-gray-500">Price Range:</p>
                  <p className="text-lg font-bold text-green-600">
                    ₹{product.minPrice || 0} - ₹{product.maxPrice || 0}
                  </p>
                </div>

                {/* Supplier Prices */}
                {product.supplierPrices && product.supplierPrices.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Available from:</p>
                    <div className="space-y-2">
                      {product.supplierPrices.slice(0, 3).map((supplierPrice, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <div className="flex items-center space-x-2">
                            <span className="text-gray-600">
                              {supplierPrice.supplierId?.businessName || 'Supplier'}
                            </span>
                            {supplierPrice.supplierId?.averageRating && (
                              <div className="flex items-center">
                                <Star className="h-3 w-3 text-yellow-400 fill-current" />
                                <span className="ml-1 text-xs text-gray-500">
                                  {supplierPrice.supplierId.averageRating.toFixed(1)}
                                </span>
                              </div>
                            )}
                          </div>
                          <span className="font-semibold text-green-600">
                            ₹{supplierPrice.pricePerKg}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => addToSavedKit(product._id)}
                    className="flex-1 flex items-center justify-center px-3 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <Package className="h-4 w-4 mr-1" />
                    Save
                  </button>
                  <button
                    onClick={() => navigate(`/vendor/compare/${product._id}`)}
                    className="flex-1 flex items-center justify-center px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Compare
                  </button>
                </div>

                {/* Quick Add to Cart Buttons */}
                {product.supplierPrices && product.supplierPrices.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-500 mb-2">Quick Add:</p>
                    <div className="space-y-1">
                      {product.supplierPrices.slice(0, 2).map((supplierPrice, index) => (
                        <button
                          key={index}
                          onClick={() => handleAddToCart(product, supplierPrice.supplierId._id, supplierPrice.pricePerKg)}
                          className="w-full flex items-center justify-between px-2 py-1 text-xs bg-gray-50 hover:bg-gray-100 rounded border"
                        >
                          <span className="text-gray-600">
                            {supplierPrice.supplierId?.businessName || 'Supplier'}
                          </span>
                          <span className="text-green-600 font-medium">
                            + ₹{supplierPrice.pricePerKg}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No products found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your search or filter criteria.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BrowseProducts; 
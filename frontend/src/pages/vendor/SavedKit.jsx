import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  ArrowLeft, 
  Package, 
  Trash2, 
  ShoppingCart,
  TrendingUp,
  Star
} from 'lucide-react';
import api from '../../utils/api';
import { toast } from 'react-toastify';

const SavedKit = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [savedKit, setSavedKit] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSavedKit();
  }, []);

  const fetchSavedKit = async () => {
    try {
      setLoading(true);
      const response = await api.get('/vendor/saved-kit');
      setSavedKit(response.data.savedKit || []);
    } catch (error) {
      console.error('Error fetching saved kit:', error);
      toast.error('Failed to load saved kit');
    } finally {
      setLoading(false);
    }
  };

  const removeFromSavedKit = async (productId) => {
    try {
      await api.delete(`/vendor/saved-kit/remove/${productId}`);
      toast.success('Product removed from saved kit');
      fetchSavedKit(); // Refresh the list
    } catch (error) {
      console.error('Error removing from saved kit:', error);
      toast.error('Failed to remove from saved kit');
    }
  };

  const addToCart = async (productId, supplierId, price) => {
    try {
      // For now, we'll just show a toast. In a real app, you'd add to cart
      toast.success('Product added to cart!');
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add to cart');
    }
  };

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
            <h1 className="text-xl font-semibold text-gray-900">Saved Kit</h1>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/vendor/browse-products')}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <Package className="h-5 w-5 mr-1" />
                Browse More
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Info */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Your Saved Ingredients</h2>
          <p className="mt-2 text-gray-600">
            Manage your saved ingredients and compare prices from different suppliers.
          </p>
        </div>

        {savedKit.length === 0 ? (
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No saved products</h3>
            <p className="mt-1 text-sm text-gray-500">
              Start by browsing products and adding them to your saved kit.
            </p>
            <div className="mt-6">
              <button
                onClick={() => navigate('/vendor/browse-products')}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Browse Products
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {savedKit.map((product) => (
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
                            <span className="text-gray-600">
                              {supplierPrice.supplierId?.businessName || 'Supplier'}
                            </span>
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
                      onClick={() => navigate(`/vendor/compare/${product._id}`)}
                      className="flex-1 flex items-center justify-center px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      <TrendingUp className="h-4 w-4 mr-1" />
                      Compare
                    </button>
                    <button
                      onClick={() => removeFromSavedKit(product._id)}
                      className="flex items-center justify-center px-3 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedKit; 
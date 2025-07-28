import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, Clock, MapPin, ShoppingCart, Eye, X } from 'lucide-react';
import api from '../../utils/api';
import { toast } from 'react-toastify';

const VendorCompare = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [supplierDetails, setSupplierDetails] = useState(null);
  const [showSupplierModal, setShowSupplierModal] = useState(false);

  useEffect(() => {
    fetchProductData();
  }, [productId]);

  const fetchProductData = async () => {
    try {
      const response = await api.get(`/vendor/compare/${productId}`);
      setProduct(response.data.product);
      setSuppliers(response.data.suppliers);
    } catch (error) {
      console.error('Error fetching product data:', error);
      toast.error('Failed to load product data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (supplier) => {
    // Add to cart logic here
    toast.success(`Added ${product.name} from ${supplier.supplierId.businessName} to cart`);
  };

  const handleViewSupplierDetails = async (supplier) => {
    try {
      setSelectedSupplier(supplier);
      setShowSupplierModal(true);
      
      const response = await api.get(`/vendor/suppliers/${supplier.supplierId._id}`);
      setSupplierDetails(response.data.supplier);
    } catch (error) {
      console.error('Error fetching supplier details:', error);
      toast.error('Failed to load supplier details');
    }
  };

  const closeSupplierModal = () => {
    setShowSupplierModal(false);
    setSelectedSupplier(null);
    setSupplierDetails(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h2>
          <button
            onClick={() => navigate('/vendor/dashboard')}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/vendor/dashboard')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </button>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center space-x-4">
              <img
                src={product.image}
                alt={product.name}
                className="w-16 h-16 rounded-lg object-cover"
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
                <p className="text-gray-600 capitalize">{product.category}</p>
                <div className="flex items-center mt-2">
                  <span className="text-sm text-gray-500">Average Price:</span>
                  <span className="ml-2 text-lg font-semibold text-indigo-600">
                    ₹{product.averagePrice?.toFixed(2)}/{product.unit}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Suppliers Comparison */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Compare Prices ({suppliers.length} suppliers)
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Prices sorted from lowest to highest
            </p>
          </div>

          <div className="divide-y divide-gray-200">
            {suppliers.map((supplier, index) => (
              <div key={supplier.supplierId._id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-500 mr-2">
                          #{index + 1}
                        </span>
                        <h3 className="text-lg font-medium text-gray-900">
                          {supplier.supplierId.businessName}
                        </h3>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-yellow-400 fill-current" />
                          <span className="ml-1 text-sm text-gray-600">
                            {supplier.supplierId.averageRating?.toFixed(1) || 'N/A'}
                          </span>
                          <span className="ml-1 text-xs text-gray-500">
                            ({supplier.supplierId.totalRatings || 0} reviews)
                          </span>
                        </div>
                        <button
                          onClick={() => handleViewSupplierDetails(supplier)}
                          className="flex items-center text-indigo-600 hover:text-indigo-800 text-sm"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </button>
                      </div>
                    </div>

                    <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span>Pickup Available</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        <span>{supplier.pickupSlots?.length || 0} slots</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-2xl font-bold text-indigo-600">
                        ₹{supplier.pricePerKg?.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-500">per {product.unit}</div>
                      <div className="text-sm text-gray-500">
                        Stock: {supplier.stock} {product.unit}
                      </div>
                    </div>

                    <button
                      onClick={() => handleAddToCart(supplier)}
                      className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Add to Cart
                    </button>
                  </div>
                </div>

                {/* Pickup Slots */}
                {supplier.pickupSlots && supplier.pickupSlots.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Available Pickup Slots:</h4>
                    <div className="flex flex-wrap gap-2">
                      {supplier.pickupSlots.map((slot, slotIndex) => (
                        <span
                          key={slotIndex}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                        >
                          {slot}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Price Range Info */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Price Range Information
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  Price range: ₹{product.minPrice?.toFixed(2)} - ₹{product.maxPrice?.toFixed(2)} per {product.unit}. 
                  Average price: ₹{product.averagePrice?.toFixed(2)} per {product.unit}.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Supplier Details Modal */}
      {showSupplierModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {supplierDetails?.businessName} - Details
              </h2>
              <button
                onClick={closeSupplierModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6">
              {supplierDetails ? (
                <div className="space-y-6">
                  {/* Basic Information */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Business Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Business Name</p>
                        <p className="font-medium">{supplierDetails.businessName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Business Type</p>
                        <p className="font-medium capitalize">{supplierDetails.businessType}</p>
                      </div>
                      {supplierDetails.address && (
                        <div className="md:col-span-2">
                          <p className="text-sm text-gray-600">Address</p>
                          <p className="font-medium">
                            {supplierDetails.address.street}, {supplierDetails.address.city}, {supplierDetails.address.state} - {supplierDetails.address.pincode}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Ratings */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Ratings & Reviews</h3>
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="flex items-center">
                        <Star className="h-6 w-6 text-yellow-400 fill-current" />
                        <span className="ml-2 text-2xl font-bold">
                          {supplierDetails.averageRating?.toFixed(1) || 'N/A'}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">
                          {supplierDetails.totalRatings} total reviews
                        </p>
                      </div>
                    </div>

                    {/* Recent Reviews */}
                    {supplierDetails.recentReviews && supplierDetails.recentReviews.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Recent Reviews</h4>
                        <div className="space-y-2">
                          {supplierDetails.recentReviews.map((review, index) => (
                            <div key={index} className="bg-gray-50 p-3 rounded-lg">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`h-4 w-4 ${
                                        i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                      }`}
                                    />
                                  ))}
                                </div>
                                <span className="text-sm text-gray-500">
                                  {new Date(review.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              {review.review && (
                                <p className="text-sm text-gray-700 mt-1">{review.review}</p>
                              )}
                              {review.vendorId && (
                                <p className="text-xs text-gray-500 mt-1">
                                  - {review.vendorId.name || review.vendorId.businessName || 'Vendor'}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Pickup Slots */}
                  {supplierDetails.pickupSlots && supplierDetails.pickupSlots.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-3">Available Pickup Slots</h3>
                      <div className="flex flex-wrap gap-2">
                        {supplierDetails.pickupSlots.map((slot, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800"
                          >
                            {slot}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Current Product Price */}
                  {selectedSupplier && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-3">Current Product Price</h3>
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600">Price for {product.name}</p>
                            <p className="text-2xl font-bold text-blue-600">
                              ₹{selectedSupplier.pricePerKg?.toFixed(2)} per {product.unit}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-600">Stock Available</p>
                            <p className="text-lg font-semibold text-green-600">
                              {selectedSupplier.stock} {product.unit}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              )}
            </div>

            <div className="flex justify-end p-6 border-t border-gray-200">
              <button
                onClick={closeSupplierModal}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorCompare; 
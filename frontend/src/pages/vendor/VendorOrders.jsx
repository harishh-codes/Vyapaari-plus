import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  ArrowLeft, 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle,
  Star,
  Filter,
  X
} from 'lucide-react';
import api from '../../utils/api';
import { toast } from 'react-toastify';

const VendorOrders = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get('/vendor/orders');
      setOrders(response.data.orders || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const rateOrder = async (orderId, rating, review) => {
    try {
      setSubmittingRating(true);
      await api.post(`/vendor/orders/${orderId}/rate`, { rating, review });
      toast.success('Order rated successfully!');
      fetchOrders(); // Refresh orders
      closeRatingModal();
    } catch (error) {
      console.error('Error rating order:', error);
      toast.error('Failed to rate order');
    } finally {
      setSubmittingRating(false);
    }
  };

  const openRatingModal = (order) => {
    setSelectedOrder(order);
    setRating(0);
    setReview('');
    setShowRatingModal(true);
  };

  const closeRatingModal = () => {
    setShowRatingModal(false);
    setSelectedOrder(null);
    setRating(0);
    setReview('');
    setHoverRating(0);
  };

  const handleRatingSubmit = () => {
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }
    rateOrder(selectedOrder._id, rating, review);
  };

  // Debug function to clear rating data (for testing)
  const clearRatingData = async (orderId) => {
    try {
      console.log('🧹 Clearing rating data for order:', orderId);
      // This would need a backend endpoint, but for now just log
      console.log('Note: Add backend endpoint to clear rating data if needed');
    } catch (error) {
      console.error('Error clearing rating data:', error);
    }
  };

  const cancelOrder = async (orderId) => {
    try {
      console.log('🔍 Frontend: Cancelling order:', orderId);
      
      const response = await api.patch(`/vendor/orders/${orderId}/status`, {
        status: 'Cancelled'
      });
      
      if (response.data.success) {
        console.log('✅ Frontend: Order cancelled successfully');
        toast.success('Order cancelled successfully!');
        fetchOrders(); // Refresh orders
      } else {
        throw new Error(response.data.message || 'Failed to cancel order');
      }
    } catch (error) {
      console.error('❌ Frontend: Error cancelling order:', error);
      toast.error(error.response?.data?.message || 'Failed to cancel order');
    }
  };

  const reorder = async (orderId) => {
    try {
      await api.post(`/vendor/orders/${orderId}/reorder`);
      toast.success('Order added to cart!');
      navigate('/vendor/cart');
    } catch (error) {
      console.error('Error reordering:', error);
      toast.error('Failed to reorder');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'Ready':
        return 'bg-purple-100 text-purple-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle className="h-5 w-5" />;
      case 'Pending':
        return <Clock className="h-5 w-5" />;
      case 'Confirmed':
        return <Clock className="h-5 w-5" />;
      case 'Ready':
        return <Clock className="h-5 w-5" />;
      case 'Cancelled':
        return <XCircle className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  // Check if order has been rated
  const hasOrderBeenRated = (order) => {
    console.log('🔍 Checking rating for order:', order.orderNumber, 'Rating data:', order.rating);
    const isRated = order.rating && 
           order.rating.rating && 
           typeof order.rating.rating === 'number' && 
           order.rating.rating > 0;
    console.log('✅ Is order rated?', isRated);
    return isRated;
  };

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    return order.status === filter;
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
            <h1 className="text-xl font-semibold text-gray-900">My Orders</h1>
            <div className="flex items-center space-x-4">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Orders</option>
                <option value="Pending">Pending</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Ready">Ready</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Info */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Order History</h2>
          <p className="mt-2 text-gray-600">
            Track your orders and manage your purchase history.
          </p>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No orders found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filter === 'all' 
                ? 'You haven\'t placed any orders yet.' 
                : `No ${filter.toLowerCase()} orders found.`
              }
            </p>
            {filter === 'all' && (
              <div className="mt-6">
                <button
                  onClick={() => navigate('/vendor/browse-products')}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Browse Products
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map((order) => (
              <div key={order._id} className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Order #{order.orderNumber}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Placed on {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        <span className="ml-1">{order.status}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-4">
                  {/* Order Items */}
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Items:</h4>
                    <div className="space-y-2">
                      {order.items.map((item, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="text-gray-600">
                            {item.productId?.name || 'Product'} x {item.quantity}kg
                          </span>
                          <span className="font-semibold text-gray-900">
                            ₹{item.price * item.quantity}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Order Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Supplier:</p>
                      <div className="flex items-center space-x-2">
                        <p className="font-medium">{order.supplierId?.businessName || 'N/A'}</p>
                        {order.supplierId?.averageRating && (
                          <div className="flex items-center">
                            <Star className="h-4 w-4 text-yellow-400 fill-current" />
                            <span className="ml-1 text-sm text-gray-600">
                              {order.supplierId.averageRating.toFixed(1)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Pickup Slot:</p>
                      <p className="font-medium">{order.pickupSlot}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Payment Method:</p>
                      <p className="font-medium">{order.paymentMethod}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Amount:</p>
                      <p className="font-bold text-green-600">₹{order.totalAmount}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    {/* Status Information */}
                    <div className="w-full mb-2">
                      <p className="text-sm text-gray-600">
                        {order.status === 'Pending' && 'Waiting for supplier confirmation'}
                        {order.status === 'Confirmed' && 'Order confirmed by supplier'}
                        {order.status === 'Ready' && 'Order is ready for pickup'}
                        {order.status === 'Completed' && 'Order completed successfully'}
                        {order.status === 'Cancelled' && 'Order was cancelled'}
                      </p>
                    </div>
                    
                    {order.status === 'Completed' && !hasOrderBeenRated(order) && (
                      <button
                        onClick={() => openRatingModal(order)}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                      >
                        <Star className="h-4 w-4 mr-1" />
                        Rate Order
                      </button>
                    )}

                    {order.status === 'Completed' && hasOrderBeenRated(order) && (
                      <div className="inline-flex items-center px-3 py-2 border border-gray-200 text-sm font-medium rounded-md text-gray-700 bg-gray-50">
                        <Star className="h-4 w-4 mr-1 text-yellow-400 fill-current" />
                        Rated: {order.rating.rating}/5
                        {order.rating.review && (
                          <span className="ml-2 text-xs text-gray-500">
                            - "{order.rating.review.substring(0, 30)}..."
                          </span>
                        )}
                      </div>
                    )}

                  
                    
                    {(order.status === 'Pending' || order.status === 'Confirmed' || order.status === 'Ready') && (
                      <button
                        onClick={() => {
                          if (confirm('Are you sure you want to cancel this order?')) {
                            cancelOrder(order._id);
                          }
                        }}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        Cancel Order
                      </button>
                    )}
                    
                    {order.status === 'Completed' && (
                      <button
                        onClick={() => reorder(order._id)}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Reorder
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rating Modal */}
      {showRatingModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Rate Your Experience</h3>
                <p className="text-sm text-gray-600 mt-1">Order #{selectedOrder.orderNumber}</p>
              </div>
              <button
                onClick={closeRatingModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Order Summary */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h4 className="font-medium text-gray-900 mb-2">Order Summary</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <p><span className="font-medium">Supplier:</span> {selectedOrder.supplierId?.businessName}</p>
                  <p><span className="font-medium">Total Amount:</span> ₹{selectedOrder.totalAmount}</p>
                  <p><span className="font-medium">Items:</span> {selectedOrder.items.length} product(s)</p>
                </div>
              </div>

              {/* Star Rating */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  How would you rate your experience? *
                </label>
                <div className="flex items-center justify-center space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className={`p-2 rounded-lg transition-all duration-200 ${
                        star <= (hoverRating || rating)
                          ? 'text-yellow-400 hover:text-yellow-500'
                          : 'text-gray-300 hover:text-gray-400'
                      }`}
                    >
                      <Star
                        className={`h-8 w-8 ${
                          star <= (hoverRating || rating) ? 'fill-current' : ''
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <div className="text-center mt-2">
                  <p className="text-sm text-gray-600">
                    {rating === 0 && hoverRating === 0 && 'Select a rating'}
                    {(hoverRating || rating) === 1 && 'Poor'}
                    {(hoverRating || rating) === 2 && 'Fair'}
                    {(hoverRating || rating) === 3 && 'Good'}
                    {(hoverRating || rating) === 4 && 'Very Good'}
                    {(hoverRating || rating) === 5 && 'Excellent'}
                  </p>
                </div>
              </div>

              {/* Review Text */}
              <div className="mb-6">
                <label htmlFor="review" className="block text-sm font-medium text-gray-700 mb-2">
                  Share your experience (optional)
                </label>
                <textarea
                  id="review"
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  placeholder="Tell us about your experience with this supplier..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                  rows={4}
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {review.length}/500 characters
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex space-x-3">
                <button
                  onClick={closeRatingModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRatingSubmit}
                  disabled={rating === 0 || submittingRating}
                  className={`flex-1 px-4 py-2 rounded-lg text-white transition-colors ${
                    rating === 0 || submittingRating
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
                >
                  {submittingRating ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </div>
                  ) : (
                    'Submit Rating'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorOrders; 
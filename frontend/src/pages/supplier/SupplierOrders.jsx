import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Clock, CheckCircle, XCircle, User } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../utils/api';

const SupplierOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchOrders();
  }, [filter, currentPage]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10
      });
      
      if (filter !== 'all') {
        params.append('status', filter);
      }

      console.log('🔍 Frontend: Fetching orders with params:', params.toString());
      
      const response = await api.get(`/supplier/orders?${params}`);
      
      if (response.data.success) {
        console.log('✅ Frontend: Orders fetched successfully:', response.data.orders);
        setOrders(response.data.orders);
        setTotalPages(response.data.totalPages);
      } else {
        throw new Error(response.data.message || 'Failed to fetch orders');
      }
    } catch (error) {
      console.error('❌ Frontend: Error fetching orders:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      console.log('🔍 Frontend: Updating order status:', orderId, 'to', newStatus);
      
      const response = await api.patch(`/supplier/orders/${orderId}/status`, {
        status: newStatus
      });
      
      if (response.data.success) {
        console.log('✅ Frontend: Order status updated successfully');
        toast.success('Order status updated successfully');
        fetchOrders(); // Refresh orders
      } else {
        throw new Error(response.data.message || 'Failed to update order status');
      }
    } catch (error) {
      console.error('❌ Frontend: Error updating order status:', error);
      toast.error(error.response?.data?.message || 'Failed to update order status');
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
        return <CheckCircle className="h-4 w-4" />;
      case 'Cancelled':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/supplier/dashboard')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Incoming Orders</h1>
        </div>

        {/* Filter */}
        <div className="mb-6">
          <div className="flex space-x-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                filter === 'all'
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              All Orders
            </button>
            <button
              onClick={() => setFilter('Pending')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                filter === 'Pending'
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilter('Confirmed')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                filter === 'Confirmed'
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Confirmed
            </button>
            <button
              onClick={() => setFilter('Ready')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                filter === 'Ready'
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Ready
            </button>
            <button
              onClick={() => setFilter('Completed')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                filter === 'Completed'
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Completed
            </button>
            <button
              onClick={() => setFilter('Cancelled')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                filter === 'Cancelled'
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Cancelled
            </button>
          </div>
        </div>

        {/* Orders List */}
        <div className="bg-white shadow rounded-lg">
          {orders.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
              <p className="text-gray-600">
                {filter === 'all' 
                  ? "You haven't received any orders yet."
                  : `No ${filter.toLowerCase()} orders found.`
                }
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {orders.map((order) => (
                <div key={order._id} className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-medium text-gray-900">
                        Order #{order.orderNumber}
                      </h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        <span className="ml-1">{order.status}</span>
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">
                        ₹{order.totalAmount}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {/* Vendor Info */}
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <User className="h-5 w-5 text-gray-400 mr-2" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {order.vendorId?.name || 'Unknown Vendor'}
                        </p>
                        <p className="text-sm text-gray-600">
                          {order.vendorId?.businessName || 'No business name'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Order Details */}
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Order Details:</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Pickup:</span>
                        <span>{order.pickupSlot} on {new Date(order.pickupDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Payment:</span>
                        <span>{order.paymentMethod}</span>
                      </div>
                      {order.notes && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Notes:</span>
                          <span className="text-gray-700">{order.notes}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Items:</h4>
                    <div className="space-y-2">
                      {order.items.map((item, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span>{item.productId?.name || 'Unknown Product'} x {item.quantity} {item.unit || 'kg'}</span>
                          <span>₹{item.totalPrice}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Order Actions */}
                  {order.status === 'Pending' && (
                    <div className="flex space-x-2 pt-4 border-t border-gray-100">
                      <button
                        onClick={() => handleStatusUpdate(order._id, 'Confirmed')}
                        className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
                      >
                        Confirm Order
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(order._id, 'Cancelled')}
                        className="px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
                      >
                        Cancel Order
                      </button>
                    </div>
                  )}

                  {order.status === 'Confirmed' && (
                    <div className="flex space-x-2 pt-4 border-t border-gray-100">
                      <button
                        onClick={() => handleStatusUpdate(order._id, 'Ready')}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        Mark Ready
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(order._id, 'Cancelled')}
                        className="px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
                      >
                        Cancel Order
                      </button>
                    </div>
                  )}

                  {order.status === 'Ready' && (
                    <div className="flex space-x-2 pt-4 border-t border-gray-100">
                      <button
                        onClick={() => handleStatusUpdate(order._id, 'Completed')}
                        className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
                      >
                        Mark Completed
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(order._id, 'Cancelled')}
                        className="px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
                      >
                        Cancel Order
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center">
            <nav className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-2 text-sm font-medium rounded-md ${
                    currentPage === page
                      ? 'bg-green-600 text-white'
                      : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </nav>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-8 bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => navigate('/supplier/products')}
              className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <FileText className="h-4 w-4 mr-2" />
              Manage Products
            </button>
            <button
              onClick={() => navigate('/supplier/dashboard')}
              className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupplierOrders; 
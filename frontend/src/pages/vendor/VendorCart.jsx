import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, Clock, CreditCard, Plus, Minus, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

const VendorCart = () => {
  const navigate = useNavigate();
  const { cartItems, removeFromCart, updateQuantity, getCartTotal, placeOrder, loading } = useCart();
  const { user } = useAuth();
  const [supplierNames, setSupplierNames] = useState({});
  
  const [orderData, setOrderData] = useState({
    pickupSlot: '',
    pickupDate: '',
    paymentMethod: 'UPI',
    notes: ''
  });

  useEffect(() => {
    // Fetch supplier names for cart items
    fetchSupplierNames();
  }, [cartItems]);

  const fetchSupplierNames = async () => {
    try {
      const supplierIds = [...new Set(cartItems.map(item => item.supplierId))];
      const names = {};
      
      for (const supplierId of supplierIds) {
        try {
          const response = await api.get(`/api/supplier/${supplierId}/name`);
          names[supplierId] = response.data.businessName;
        } catch (error) {
          names[supplierId] = 'Unknown Supplier';
        }
      }
      
      setSupplierNames(names);
    } catch (error) {
      console.error('Error fetching supplier names:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (cartItems.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    if (!orderData.pickupSlot || !orderData.pickupDate) {
      toast.error('Please select pickup slot and date');
      return;
    }

    const result = await placeOrder(orderData);
    
    if (result.success) {
      navigate('/vendor/orders');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setOrderData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleQuantityChange = (productId, supplierId, newQuantity) => {
    updateQuantity(productId, supplierId, newQuantity);
  };

  const handleRemoveItem = (productId, supplierId) => {
    removeFromCart(productId, supplierId);
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => navigate('/vendor/dashboard')}
              className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
          </div>

          {/* Empty Cart */}
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Your cart is empty</h3>
            <p className="text-gray-600 mb-4">
              Start shopping to add items to your cart
            </p>
            <button
              onClick={() => navigate('/vendor/browse-products')}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
            >
              Browse Products
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/vendor/dashboard')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Cart Items ({cartItems.length})</h2>
              </div>
              
              <div className="divide-y divide-gray-200">
                {cartItems.map((item) => (
                  <div key={`${item.productId}-${item.supplierId}`} className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          <img
                            src={item.productImage || 'https://via.placeholder.com/60x60?text=Product'}
                            alt={item.productName}
                            className="w-15 h-15 rounded-lg object-cover"
                          />
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">{item.productName}</h3>
                            <p className="text-sm text-gray-600">{supplierNames[item.supplierId] || 'Loading...'}</p>
                            <p className="text-sm text-gray-500 capitalize">{item.category}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleQuantityChange(item.productId, item.supplierId, item.quantity - 1)}
                            className="p-1 rounded-full hover:bg-gray-100"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <button
                            onClick={() => handleQuantityChange(item.productId, item.supplierId, item.quantity + 1)}
                            className="p-1 rounded-full hover:bg-gray-100"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-lg font-semibold text-gray-900">
                            ₹{item.price * item.quantity}
                          </div>
                          <div className="text-sm text-gray-500">
                            ₹{item.price}/{item.unit}
                          </div>
                        </div>
                        
                        <button
                          onClick={() => handleRemoveItem(item.productId, item.supplierId)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Order Details */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Order Details</h2>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Pickup Slot */}
                <div>
                  <label htmlFor="pickupSlot" className="block text-sm font-medium text-gray-700 mb-2">
                    Pickup Slot *
                  </label>
                  <select
                    id="pickupSlot"
                    name="pickupSlot"
                    value={orderData.pickupSlot}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Select pickup slot</option>
                    <option value="7-9 AM">7-9 AM</option>
                    <option value="9-11 AM">9-11 AM</option>
                    <option value="11-1 PM">11-1 PM</option>
                    <option value="1-3 PM">1-3 PM</option>
                    <option value="3-5 PM">3-5 PM</option>
                    <option value="5-7 PM">5-7 PM</option>
                    <option value="7-9 PM">7-9 PM</option>
                  </select>
                </div>

                {/* Pickup Date */}
                <div>
                  <label htmlFor="pickupDate" className="block text-sm font-medium text-gray-700 mb-2">
                    Pickup Date *
                  </label>
                  <input
                    type="date"
                    id="pickupDate"
                    name="pickupDate"
                    value={orderData.pickupDate}
                    onChange={handleInputChange}
                    required
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                {/* Payment Method */}
                <div>
                  <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Method
                  </label>
                  <select
                    id="paymentMethod"
                    name="paymentMethod"
                    value={orderData.paymentMethod}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="UPI">UPI</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>

                {/* Notes */}
                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                    Special Instructions
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={orderData.notes}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Any special instructions for pickup..."
                  />
                </div>

                {/* Order Summary */}
                <div className="border-t border-gray-200 pt-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal:</span>
                      <span>₹{getCartTotal()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Delivery Fee:</span>
                      <span className="text-green-600">Free (Pickup)</span>
                    </div>
                    <div className="border-t border-gray-200 pt-2">
                      <div className="flex justify-between font-semibold">
                        <span>Total:</span>
                        <span>₹{getCartTotal()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading || cartItems.length === 0}
                  className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Placing Order...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Place Order
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Info Box */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Clock className="h-5 w-5 text-blue-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    Pickup Information
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>
                      Orders are ready for pickup at the selected time. Please bring a valid ID and payment method.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorCart; 
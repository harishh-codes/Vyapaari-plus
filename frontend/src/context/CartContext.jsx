import { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../utils/api';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('vendorCart');
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
        localStorage.removeItem('vendorCart');
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('vendorCart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product, supplierId, price, quantity = 1) => {
    const existingItem = cartItems.find(
      item => item.productId === product._id && item.supplierId === supplierId
    );

    if (existingItem) {
      setCartItems(prev => 
        prev.map(item => 
          item.productId === product._id && item.supplierId === supplierId
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      );
      toast.success(`Updated ${product.name} quantity in cart`);
    } else {
      const newItem = {
        productId: product._id,
        productName: product.name,
        productImage: product.image,
        category: product.category,
        unit: product.unit,
        supplierId: supplierId,
        supplierName: '', // Will be populated when needed
        price: price,
        quantity: quantity
      };
      setCartItems(prev => [...prev, newItem]);
      toast.success(`${product.name} added to cart`);
    }
  };

  const removeFromCart = (productId, supplierId) => {
    setCartItems(prev => 
      prev.filter(item => 
        !(item.productId === productId && item.supplierId === supplierId)
      )
    );
    toast.success('Item removed from cart');
  };

  const updateQuantity = (productId, supplierId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId, supplierId);
      return;
    }

    setCartItems(prev => 
      prev.map(item => 
        item.productId === productId && item.supplierId === supplierId
          ? { ...item, quantity }
          : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
    toast.success('Cart cleared');
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getCartCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  };

  const placeOrder = async (orderData) => {
    try {
      setLoading(true);
      
      // Prepare order items
      const orderItems = cartItems.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        supplierId: item.supplierId,
        price: item.price
      }));

      const orderPayload = {
        ...orderData,
        items: orderItems,
        totalAmount: getCartTotal()
      };

      console.log('🔍 Frontend: Placing order with payload:', orderPayload);

      const response = await api.post('/orders/place', orderPayload);
      
      if (response.data.success) {
        clearCart();
        toast.success('Order placed successfully!');
        return { success: true, order: response.data.order };
      } else {
        throw new Error(response.data.message || 'Failed to place order');
      }
    } catch (error) {
      console.error('❌ Frontend: Error placing order:', error);
      console.error('❌ Frontend: Error response:', error.response?.data);
      toast.error(error.response?.data?.message || 'Failed to place order');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getCartCount,
    placeOrder,
    loading
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}; 
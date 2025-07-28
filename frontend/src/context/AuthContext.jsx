import { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on app start
    const token = localStorage.getItem('token');
    console.log('🔍 AuthContext: Token found:', !!token);
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUserProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserProfile = async () => {
    try {
      console.log('🔍 AuthContext: Fetching user profile...');
      const response = await api.get('/auth/profile');
      console.log('✅ AuthContext: Profile response:', response.data);
      setUser(response.data.user);
    } catch (error) {
      console.error('❌ AuthContext: Error fetching user profile:', error);
      console.error('❌ AuthContext: Error response:', error.response?.data);
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  const login = async (phone, otp, role) => {
    try {
      console.log('🔍 AuthContext: Attempting login with phone:', phone, 'role:', role);
      const response = await api.post('/auth/verify-otp', { phone, otp, role });
      console.log('✅ AuthContext: Login response:', response.data);
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
      
      toast.success('Login successful!');
      return { success: true, user };
    } catch (error) {
      console.error('❌ AuthContext: Login error:', error);
      console.error('❌ AuthContext: Error response:', error.response?.data);
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
      return { success: false, message };
    }
  };

  const requestOTP = async (phone, role) => {
    try {
      console.log('🔍 AuthContext: Requesting OTP for phone:', phone, 'role:', role);
      const response = await api.post('/auth/request-otp', { phone, role });
      console.log('✅ AuthContext: OTP request response:', response.data);
      toast.success('OTP sent to your phone!');
      return { success: true };
    } catch (error) {
      console.error('❌ AuthContext: OTP request error:', error);
      console.error('❌ AuthContext: Error response:', error.response?.data);
      const message = error.response?.data?.message || 'Failed to send OTP';
      toast.error(message);
      return { success: false, message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    toast.success('Logged out successfully');
  };

  const updateUser = (userData) => {
    setUser(prev => ({ ...prev, ...userData }));
  };

  const value = {
    user,
    loading,
    login,
    logout,
    requestOTP,
    updateUser,
    isAuthenticated: !!user,
    isVendor: user?.role === 'vendor',
    isSupplier: user?.role === 'supplier'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 
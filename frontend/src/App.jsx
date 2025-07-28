import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Context
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import VendorDashboard from './pages/vendor/VendorDashboard';
import VendorOnboarding from './pages/vendor/VendorOnboarding';
import VendorCompare from './pages/vendor/VendorCompare';
import VendorCart from './pages/vendor/VendorCart';
import VendorOrders from './pages/vendor/VendorOrders';
import BrowseProducts from './pages/vendor/BrowseProducts';
import SavedKit from './pages/vendor/SavedKit';
import SupplierDashboard from './pages/supplier/SupplierDashboard';
import SupplierOnboarding from './pages/supplier/SupplierOnboarding';
import SupplierProducts from './pages/supplier/SupplierProducts';
import SupplierOrders from './pages/supplier/SupplierOrders';

// Components
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <div className="App">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              
              {/* Vendor Routes */}
              <Route 
                path="/vendor/dashboard" 
                element={
                  <ProtectedRoute requiredRole="vendor">
                    <VendorDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/vendor/onboarding" 
                element={
                  <ProtectedRoute requiredRole="vendor">
                    <VendorOnboarding />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/vendor/compare/:productId" 
                element={
                  <ProtectedRoute requiredRole="vendor">
                    <VendorCompare />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/vendor/cart" 
                element={
                  <ProtectedRoute requiredRole="vendor">
                    <VendorCart />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/vendor/orders" 
                element={
                  <ProtectedRoute requiredRole="vendor">
                    <VendorOrders />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/vendor/browse-products" 
                element={
                  <ProtectedRoute requiredRole="vendor">
                    <BrowseProducts />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/vendor/saved-kit" 
                element={
                  <ProtectedRoute requiredRole="vendor">
                    <SavedKit />
                  </ProtectedRoute>
                } 
              />
              
              {/* Supplier Routes */}
              <Route 
                path="/supplier/dashboard" 
                element={
                  <ProtectedRoute requiredRole="supplier">
                    <SupplierDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/supplier/onboarding" 
                element={
                  <ProtectedRoute requiredRole="supplier">
                    <SupplierOnboarding />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/supplier/products" 
                element={
                  <ProtectedRoute requiredRole="supplier">
                    <SupplierProducts />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/supplier/orders" 
                element={
                  <ProtectedRoute requiredRole="supplier">
                    <SupplierOrders />
                  </ProtectedRoute>
                } 
              />
              
              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            
            <ToastContainer
              position="top-right"
              autoClose={5000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="light"
            />
      </div>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;

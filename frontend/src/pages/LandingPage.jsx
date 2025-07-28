import { useNavigate } from 'react-router-dom';
import { Store, Truck, ArrowRight } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();

  const handleRoleSelect = (role) => {
    navigate('/login', { state: { selectedRole: role } });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-indigo-600">Vyapaari+</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/login')}
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Login
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
            <span className="block">Connect. Compare.</span>
            <span className="block text-indigo-600">Thrive.</span>
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            The ultimate platform connecting street food vendors with trusted suppliers. 
            Compare prices, build your ingredient kit, and place pickup orders without delivery fees.
          </p>
        </div>

        {/* Features */}
        <div className="mt-16">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white mx-auto">
                <Store className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">For Vendors</h3>
              <p className="mt-2 text-base text-gray-500">
                Compare ingredient prices across trusted suppliers, build your personalized kit, 
                and get alerts when prices drop.
              </p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-green-500 text-white mx-auto">
                <Truck className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">For Suppliers</h3>
              <p className="mt-2 text-base text-gray-500">
                List your products, manage orders, and grow your business with our 
                comprehensive supplier dashboard.
              </p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-purple-500 text-white mx-auto">
                <ArrowRight className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Smart Pickup</h3>
              <p className="mt-2 text-base text-gray-500">
                No delivery fees! Choose your pickup slot and collect orders at your convenience.
              </p>
            </div>
          </div>
        </div>

        {/* Role Selection */}
        <div className="mt-16">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Choose Your Role
            </h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 max-w-4xl mx-auto">
              {/* Vendor Card */}
              <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-indigo-100 mx-auto mb-6">
                  <Store className="h-8 w-8 text-indigo-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">I'm a Vendor</h3>
                <p className="text-gray-600 mb-6">
                  Street food vendors, restaurants, and food businesses. Compare prices, 
                  build your ingredient kit, and place orders.
                </p>
                <ul className="text-left text-gray-600 mb-8 space-y-2">
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-indigo-500 rounded-full mr-3"></span>
                    Compare ingredient prices
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-indigo-500 rounded-full mr-3"></span>
                    Build personalized ingredient kit
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-indigo-500 rounded-full mr-3"></span>
                    Place pickup orders
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-indigo-500 rounded-full mr-3"></span>
                    Get price drop alerts
                  </li>
                </ul>
                <button
                  onClick={() => handleRoleSelect('vendor')}
                  className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-indigo-700 transition-colors duration-200"
                >
                  Join as Vendor
                </button>
              </div>

              {/* Supplier Card */}
              <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mx-auto mb-6">
                  <Truck className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">I'm a Supplier</h3>
                <p className="text-gray-600 mb-6">
                  Wholesalers, distributors, and ingredient suppliers. List your products, 
                  manage orders, and grow your business.
                </p>
                <ul className="text-left text-gray-600 mb-8 space-y-2">
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                    List your products
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                    Manage orders efficiently
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                    Set pickup slots
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                    Track analytics
                  </li>
                </ul>
                <button
                  onClick={() => handleRoleSelect('supplier')}
                  className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors duration-200"
                >
                  Join as Supplier
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-20 text-center text-gray-500">
          <p>&copy; 2025 Vyapaari+. All rights reserved.</p>
        </footer>
      </main>
    </div>
  );
};

export default LandingPage; 
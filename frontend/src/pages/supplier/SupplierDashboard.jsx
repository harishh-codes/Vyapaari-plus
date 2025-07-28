import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Home, 
  Package, 
  FileText, 
  LogOut,
  Menu,
  X,
  TrendingUp,
  Clock,
  DollarSign,
  Users
} from 'lucide-react';
import api from '../../utils/api';

const SupplierDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      console.log('🔍 Frontend: Fetching supplier dashboard data');
      
      const response = await api.get('/api/supplier/dashboard');
      
      if (response.data.success) {
        console.log('✅ Frontend: Dashboard data fetched successfully:', response.data);
        setDashboardData(response.data);
      } else {
        throw new Error(response.data.message || 'Failed to fetch dashboard data');
      }
    } catch (error) {
      console.error('❌ Frontend: Error fetching dashboard data:', error);
      console.error('❌ Frontend: Error response:', error.response?.data);
      // Set default data structure to prevent crashes
      setDashboardData({
        supplier: {
          name: user?.name || 'Supplier',
          businessName: 'Business',
          products: []
        },
        analytics: {
          totalOrders: 0,
          pendingOrders: 0,
          totalRevenue: 0
        },
        recentOrders: []
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navigation = [
    { name: 'Dashboard', href: '/supplier/dashboard', icon: Home, current: true },
    { name: 'Products', href: '/supplier/products', icon: Package, current: false },
    { name: 'Orders', href: '/supplier/orders', icon: FileText, current: false },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white">
          <div className="flex h-16 items-center justify-between px-4">
            <h1 className="text-xl font-bold text-green-600">Vyapaari+</h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                  item.current
                    ? 'bg-green-100 text-green-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </a>
            ))}
          </nav>
          <div className="border-t border-gray-200 p-4">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-2 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-md"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          <div className="flex h-16 items-center px-4">
            <h1 className="text-xl font-bold text-green-600">Vyapaari+</h1>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                  item.current
                    ? 'bg-green-100 text-green-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </a>
            ))}
          </nav>
          <div className="border-t border-gray-200 p-4">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-2 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-md"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Mobile header */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:hidden">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1"></div>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <span className="text-sm font-medium text-gray-700">
                Welcome, {user?.name}
              </span>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="mt-2 text-sm text-gray-600">
                Welcome back, {user?.name}! Here's your business overview.
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <FileText className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Total Orders
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {dashboardData?.analytics?.totalOrders || 0}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Clock className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Pending Orders
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {dashboardData?.analytics?.pendingOrders || 0}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <DollarSign className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Total Revenue
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          ₹{dashboardData?.analytics?.totalRevenue || 0}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Package className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Products Listed
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {dashboardData?.supplier?.products?.length || 0}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white shadow rounded-lg mb-8">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <button
                    onClick={() => navigate('/supplier/products')}
                    className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-green-500 rounded-lg border border-gray-200 hover:border-green-300"
                  >
                    <div>
                      <span className="rounded-lg inline-flex p-3 bg-green-50 text-green-700 ring-4 ring-white">
                        <Package className="h-6 w-6" />
                      </span>
                    </div>
                    <div className="mt-8">
                      <h3 className="text-lg font-medium">
                        <span className="absolute inset-0" aria-hidden="true" />
                        Manage Products
                      </h3>
                      <p className="mt-2 text-sm text-gray-500">
                        Add, edit, or update your product listings
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={() => navigate('/supplier/orders')}
                    className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-green-500 rounded-lg border border-gray-200 hover:border-green-300"
                  >
                    <div>
                      <span className="rounded-lg inline-flex p-3 bg-blue-50 text-blue-700 ring-4 ring-white">
                        <FileText className="h-6 w-6" />
                      </span>
                    </div>
                    <div className="mt-8">
                      <h3 className="text-lg font-medium">
                        <span className="absolute inset-0" aria-hidden="true" />
                        View Orders
                      </h3>
                      <p className="mt-2 text-sm text-gray-500">
                        Manage incoming orders and update status
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={() => navigate('/supplier/products')}
                    className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-green-500 rounded-lg border border-gray-200 hover:border-green-300"
                  >
                    <div>
                      <span className="rounded-lg inline-flex p-3 bg-purple-50 text-purple-700 ring-4 ring-white">
                        <TrendingUp className="h-6 w-6" />
                      </span>
                    </div>
                    <div className="mt-8">
                      <h3 className="text-lg font-medium">
                        <span className="absolute inset-0" aria-hidden="true" />
                        Add Product
                      </h3>
                      <p className="mt-2 text-sm text-gray-500">
                        List new products to grow your business
                      </p>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Recent Orders */}
            {dashboardData?.recentOrders && dashboardData.recentOrders.length > 0 && (
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Orders</h3>
                  <div className="flow-root">
                    <ul className="-my-5 divide-y divide-gray-200">
                      {dashboardData.recentOrders.map((order) => (
                        <li key={order._id} className="py-4">
                          <div className="flex items-center space-x-4">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                Order #{order.orderNumber}
                              </p>
                              <p className="text-sm text-gray-500">
                                {order.vendorId?.name} • ₹{order.totalAmount}
                              </p>
                            </div>
                            <div className="flex-shrink-0">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                order.status === 'Completed' ? 'bg-green-100 text-green-800' :
                                order.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {order.status}
                              </span>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="mt-6">
                    <button
                      onClick={() => navigate('/supplier/orders')}
                      className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      View all orders
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="flex justify-around">
          {navigation.map((item) => (
            <a
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center py-2 px-3 text-xs font-medium ${
                item.current
                  ? 'text-green-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <item.icon className="h-5 w-5 mb-1" />
              {item.name}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SupplierDashboard; 
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Edit, Trash2, Package, Eye, EyeOff, Upload, X } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../utils/api';

const SupplierProducts = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    pricePerKg: '',
    stock: '',
    image: '',
    pickupSlots: [],
    unit: 'kg'
  });

  const categories = [
    'Vegetables', 'Fruits', 'Grains', 'Spices', 'Oils', 
    'Dairy', 'Meat', 'Seafood', 'Beverages', 'Snacks', 'Other'
  ];

  const pickupSlots = [
    '7-9 AM', '9-11 AM', '11-1 PM', '1-3 PM', '3-5 PM', '5-7 PM'
  ];

  const units = ['kg', 'g', 'l', 'ml', 'piece', 'dozen', 'pack'];

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/supplier/products');
      setProducts(response.data.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = () => {
    setFormData({
      name: '',
      category: '',
      description: '',
      pricePerKg: '',
      stock: '',
      image: '',
      pickupSlots: [],
      unit: 'kg'
    });
    setEditingProduct(null);
    setImagePreview(null);
    setShowAddModal(true);
  };

  const handleEditProduct = (product) => {
    const supplierPrice = product.supplierPrice;
    setFormData({
      name: product.name,
      category: product.category,
      description: product.description || '',
      pricePerKg: supplierPrice?.pricePerKg || '',
      stock: supplierPrice?.stock || '',
      image: product.image || '',
      pickupSlots: supplierPrice?.pickupSlots || [],
      unit: product.unit || 'kg'
    });
    setEditingProduct(product);
    setImagePreview(product.image || null);
    setShowAddModal(true);
  };

  const handleDeleteProduct = async (product) => {
    if (window.confirm(`Are you sure you want to delete ${product.name}?`)) {
      try {
        await api.delete(`/api/supplier/products/${product._id}`);
        toast.success('Product deleted successfully');
        fetchProducts();
      } catch (error) {
        console.error('Error deleting product:', error);
        toast.error('Failed to delete product');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.category || !formData.pricePerKg || !formData.stock) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.pickupSlots.length === 0) {
      toast.error('Please select at least one pickup slot');
      return;
    }

    try {
      console.log('🔍 Frontend: Submitting form data:', formData);
      
      if (editingProduct) {
        // Update existing product
        const updateData = {
          pricePerKg: parseFloat(formData.pricePerKg),
          stock: parseInt(formData.stock),
          pickupSlots: formData.pickupSlots,
          isAvailable: true
        };
        
        console.log('🔍 Frontend: Updating product with data:', updateData);
        
        const response = await api.put(`/api/supplier/products/${editingProduct._id}`, updateData);
        
        if (response.data.success) {
          console.log('✅ Frontend: Product updated successfully');
          toast.success('Product updated successfully');
        } else {
          throw new Error(response.data.message || 'Failed to update product');
        }
      } else {
        // Add new product
        const productData = {
          ...formData,
          pricePerKg: parseFloat(formData.pricePerKg),
          stock: parseInt(formData.stock)
        };
        
        console.log('🔍 Frontend: Adding new product with data:', productData);
        
        const response = await api.post('/api/supplier/products', productData);
        
        if (response.data.success) {
          console.log('✅ Frontend: Product added successfully');
          toast.success('Product added successfully');
        } else {
          throw new Error(response.data.message || 'Failed to add product');
        }
      }
      
      setShowAddModal(false);
      setImagePreview(null);
      fetchProducts();
    } catch (error) {
      console.error('❌ Frontend: Error saving product:', error);
      toast.error(error.response?.data?.message || 'Failed to save product');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePickupSlotChange = (slot) => {
    setFormData(prev => ({
      ...prev,
      pickupSlots: prev.pickupSlots.includes(slot)
        ? prev.pickupSlots.filter(s => s !== slot)
        : [...prev.pickupSlots, slot]
    }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    try {
      setUploadingImage(true);
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('image', file);

      // Upload to Cloudinary
      const response = await api.post('/api/supplier/upload-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        setFormData(prev => ({
          ...prev,
          image: response.data.imageUrl
        }));
        setImagePreview(response.data.imageUrl);
        toast.success('Image uploaded successfully!');
      } else {
        throw new Error(response.data.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = () => {
    setFormData(prev => ({
      ...prev,
      image: ''
    }));
    setImagePreview(null);
  };

  const toggleProductAvailability = async (product) => {
    try {
      const supplierPrice = product.supplierPrice;
      const currentAvailability = supplierPrice?.isAvailable || false;
      const newAvailability = !currentAvailability;
      
      console.log('🔍 Frontend: Toggling availability for product:', product.name, 'from', currentAvailability, 'to', newAvailability);
      
      const response = await api.put(`/api/supplier/products/${product._id}`, {
        isAvailable: newAvailability
      });
      
      if (response.data.success) {
        console.log('✅ Frontend: Product availability updated successfully');
        toast.success(`Product ${newAvailability ? 'activated' : 'deactivated'} successfully`);
        fetchProducts(); // Refresh products to get updated data
      } else {
        throw new Error(response.data.message || 'Failed to update availability');
      }
    } catch (error) {
      console.error('❌ Frontend: Error toggling availability:', error);
      toast.error(error.response?.data?.message || 'Failed to update product availability');
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
          
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Products</h1>
              <p className="mt-2 text-gray-600">
                Manage your product listings and inventory
              </p>
            </div>
            <button
              onClick={handleAddProduct}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </button>
          </div>
        </div>

        {/* Products Grid */}
        {products.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products yet</h3>
            <p className="text-gray-600 mb-4">
              Start by adding your first product to begin selling on Vyapaari+
            </p>
            <button
              onClick={handleAddProduct}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            >
              Add Your First Product
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => {
              const supplierPrice = product.supplierPrice; // Use the single supplierPrice from backend
              return (
                <div key={product._id} className="bg-white rounded-lg shadow">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <img
                        src={product.image || 'https://via.placeholder.com/100x100?text=Product'}
                        alt={product.name}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                      <div className="flex space-x-2">
                        <button
                          onClick={() => toggleProductAvailability(product)}
                          className={`p-2 rounded-md ${
                            supplierPrice?.isAvailable 
                              ? 'text-green-600 hover:bg-green-50' 
                              : 'text-gray-400 hover:bg-gray-50'
                          }`}
                          title={supplierPrice?.isAvailable ? 'Deactivate' : 'Activate'}
                        >
                          {supplierPrice?.isAvailable ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => handleEditProduct(product)}
                          className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-md"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product)}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {product.name}
                    </h3>
                    <p className="text-sm text-gray-600 capitalize mb-4">
                      {product.category}
                    </p>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Price:</span>
                        <span className="font-medium">₹{supplierPrice?.pricePerKg || 0}/{product.unit}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Stock:</span>
                        <span className="font-medium">{supplierPrice?.stock || 0} {product.unit}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Status:</span>
                        <span className={`font-medium ${
                          supplierPrice?.isAvailable ? 'text-green-600' : 'text-gray-400'
                        }`}>
                          {supplierPrice?.isAvailable ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      {supplierPrice?.pickupSlots && supplierPrice.pickupSlots.length > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Pickup Slots:</span>
                          <span className="font-medium text-xs">
                            {supplierPrice.pickupSlots.slice(0, 2).join(', ')}
                            {supplierPrice.pickupSlots.length > 2 && '...'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-8 bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={handleAddProduct}
              className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Product
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

      {/* Add/Edit Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Enter product name"
                    disabled={!!editingProduct}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    disabled={!!editingProduct}
                  >
                    <option value="">Select category</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Enter product description"
                    disabled={!!editingProduct}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price per {formData.unit} *
                    </label>
                    <input
                      type="number"
                      name="pricePerKg"
                      value={formData.pricePerKg}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Stock *
                    </label>
                    <input
                      type="number"
                      name="stock"
                      value={formData.stock}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="0"
                      min="0"
                    />
                  </div>
                </div>

                {!editingProduct && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Unit
                      </label>
                      <select
                        name="unit"
                        value={formData.unit}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      >
                        {units.map(unit => (
                          <option key={unit} value={unit}>{unit}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Product Image
                      </label>
                      
                      {/* Image Upload Area */}
                      <div className="mt-2">
                        {imagePreview ? (
                          <div className="relative">
                            <img
                              src={imagePreview}
                              alt="Product preview"
                              className="w-full h-32 object-cover rounded-lg border"
                            />
                            <button
                              type="button"
                              onClick={removeImage}
                              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-400 transition-colors">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              className="hidden"
                              id="image-upload"
                              disabled={uploadingImage}
                            />
                            <label
                              htmlFor="image-upload"
                              className="cursor-pointer flex flex-col items-center"
                            >
                              {uploadingImage ? (
                                <div className="flex items-center">
                                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mr-2"></div>
                                  <span className="text-sm text-gray-600">Uploading...</span>
                                </div>
                              ) : (
                                <>
                                  <Upload className="h-8 w-8 text-gray-400 mb-2" />
                                  <span className="text-sm text-gray-600">
                                    Click to upload image
                                  </span>
                                  <span className="text-xs text-gray-500 mt-1">
                                    PNG, JPG, GIF up to 5MB
                                  </span>
                                </>
                              )}
                            </label>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pickup Slots *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {pickupSlots.map((slot) => (
                      <label key={slot} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.pickupSlots.includes(slot)}
                          onChange={() => handlePickupSlotChange(slot)}
                          className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">{slot}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    {editingProduct ? 'Update Product' : 'Add Product'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplierProducts; 
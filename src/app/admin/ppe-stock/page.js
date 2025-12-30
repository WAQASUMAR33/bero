'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Notification from '../components/Notification';

export default function PPEStockPage() {
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [showBreakdownModal, setShowBreakdownModal] = useState(false);
  const [showStockTakenModal, setShowStockTakenModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000);
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      fetchProducts();
    } else {
      router.push('/login');
    }
  }, [router]);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/pp-stock/products', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await response.json();
      
      if (result.success) {
        setProducts(result.data || []);
      } else {
        console.error('Error fetching products:', result.error);
        setProducts([]);
        showNotification(result.error || 'Failed to fetch products', 'error');
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
      showNotification('Failed to fetch products. Please check your connection.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTransactions = async (productId) => {
    try {
      setIsLoadingTransactions(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/pp-stock/products/${productId}/transactions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await response.json();
      
      if (result.success) {
        setTransactions(result.data || []);
      } else {
        showNotification('Failed to fetch transactions', 'error');
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      showNotification('Failed to fetch transactions', 'error');
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  const handleStockTaken = async (productId, quantity) => {
    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/pp-stock/products/${productId}/take`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ quantity: parseInt(quantity) })
      });

      const result = await response.json();
      
      if (result.success) {
        await fetchProducts();
        setShowStockTakenModal(false);
        setSelectedProduct(null);
        showNotification('Stock taken successfully!', 'success');
      } else {
        showNotification(result.error || 'Failed to take stock', 'error');
      }
    } catch (error) {
      console.error('Error taking stock:', error);
      showNotification('Error taking stock. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestock = async (productId, quantity) => {
    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/pp-stock/products/${productId}/restock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ quantity: parseInt(quantity) })
      });

      const result = await response.json();
      
      if (result.success) {
        await fetchProducts();
        setShowRestockModal(false);
        setSelectedProduct(null);
        showNotification('Stock restocked successfully!', 'success');
      } else {
        showNotification(result.error || 'Failed to restock', 'error');
      }
    } catch (error) {
      console.error('Error restocking:', error);
      showNotification('Error restocking. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!confirm('Are you sure you want to delete this product? All transaction history will be deleted.')) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/pp-stock/products/${productId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await response.json();
      
      if (result.success) {
        setProducts(prev => prev.filter(p => p.id !== productId));
        showNotification('Product deleted successfully!', 'success');
      } else {
        showNotification(result.error || 'Failed to delete product', 'error');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      showNotification('Error deleting product. Please try again.', 'error');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStockStatus = (currentQuantity, threshold) => {
    if (currentQuantity <= 0) return { label: 'Out of Stock', color: 'bg-red-100 text-red-800 border-red-300' };
    if (currentQuantity <= threshold) return { label: 'Low Stock', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' };
    return { label: 'In Stock', color: 'bg-green-100 text-green-800 border-green-300' };
  };

  const handleQuantityClick = async (product) => {
    setSelectedProduct(product);
    setShowBreakdownModal(true);
    await fetchTransactions(product.id);
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col lg:ml-64">
        <Header user={user} />
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {isLoading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#224fa6] mx-auto mb-4"></div>
                <p className="text-gray-600">Loading PPE stock...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="mb-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">PPE Stock</h1>
                    <p className="text-gray-600">Manage Personal Protective Equipment stock levels</p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowSettingsModal(true)}
                      className="bg-gray-100 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-200 transition-all duration-200 flex items-center space-x-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>Settings</span>
                    </button>
                    <button
                      onClick={() => {
                        if (products.length === 0) {
                          showNotification('Please add a product first', 'error');
                          return;
                        }
                        setShowStockTakenModal(true);
                        setSelectedProduct(null); // Will show product selector in modal
                      }}
                      className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all duration-200 flex items-center space-x-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                      </svg>
                      <span>Stock Taken</span>
                    </button>
                    <button
                      onClick={() => setShowRestockModal(true)}
                      className="bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all duration-200 flex items-center space-x-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span>Restock</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Products Table */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Product</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Threshold</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Quantity</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Created At</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Updated At</th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {products.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                            No products found. Click Settings to add a product.
                          </td>
                        </tr>
                      ) : (
                        products.map((product) => {
                          const status = getStockStatus(product.currentQuantity, product.threshold);
                          const isLowStock = product.currentQuantity <= product.threshold;
                          return (
                            <tr 
                              key={product.id} 
                              className={`transition-colors duration-200 ${
                                isLowStock 
                                  ? 'bg-red-50 hover:bg-red-100 border-l-4 border-red-500' 
                                  : 'hover:bg-gray-50'
                              }`}
                            >
                              <td className="px-6 py-5 whitespace-nowrap">
                                <div className={`text-sm font-medium ${isLowStock ? 'text-red-900' : 'text-gray-900'}`}>
                                  {product.name}
                                </div>
                              </td>
                              <td className="px-6 py-5 whitespace-nowrap">
                                <div className={`text-sm ${isLowStock ? 'text-red-900' : 'text-gray-900'}`}>
                                  {product.threshold}
                                </div>
                              </td>
                              <td className="px-6 py-5 whitespace-nowrap">
                                <button
                                  onClick={() => handleQuantityClick(product)}
                                  className={`text-sm font-medium hover:underline cursor-pointer ${
                                    isLowStock 
                                      ? 'text-red-700 hover:text-red-900' 
                                      : 'text-[#224fa6] hover:text-[#1a3d85]'
                                  }`}
                                >
                                  {product.currentQuantity}
                                </button>
                              </td>
                              <td className="px-6 py-5 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${status.color}`}>
                                  {status.label}
                                </span>
                              </td>
                              <td className="px-6 py-5 whitespace-nowrap">
                                <div className={`text-sm ${isLowStock ? 'text-red-900' : 'text-gray-900'}`}>
                                  {formatDate(product.createdAt)}
                                </div>
                              </td>
                              <td className="px-6 py-5 whitespace-nowrap">
                                <div className={`text-sm ${isLowStock ? 'text-red-900' : 'text-gray-900'}`}>
                                  {formatDate(product.updatedAt)}
                                </div>
                              </td>
                              <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex items-center justify-end space-x-2">
                                  <button
                                    onClick={() => {
                                      setSelectedProduct(product);
                                      setShowStockTakenModal(true);
                                    }}
                                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors text-xs font-medium"
                                  >
                                    Stock Taken
                                  </button>
                                  <button
                                    onClick={() => handleDeleteProduct(product.id)}
                                    className="px-3 py-1 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition-colors text-xs font-medium"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      {/* Settings Modal */}
      {showSettingsModal && (
        <PPEStockSettingsModal
          onClose={() => {
            setShowSettingsModal(false);
            setSelectedProduct(null);
          }}
          onSave={async () => {
            await fetchProducts();
            setShowSettingsModal(false);
            showNotification('Product added successfully!', 'success');
          }}
          isSubmitting={isSubmitting}
          setIsSubmitting={setIsSubmitting}
        />
      )}

      {/* Restock Modal */}
      {showRestockModal && (
        <RestockModal
          products={products}
          onClose={() => {
            setShowRestockModal(false);
            setSelectedProduct(null);
          }}
          onRestock={handleRestock}
          isSubmitting={isSubmitting}
        />
      )}

      {/* Stock Taken Modal */}
      {showStockTakenModal && (
        <StockTakenModal
          product={selectedProduct}
          products={products}
          onClose={() => {
            setShowStockTakenModal(false);
            setSelectedProduct(null);
          }}
          onTake={handleStockTaken}
          isSubmitting={isSubmitting}
        />
      )}

      {/* Breakdown Modal */}
      {showBreakdownModal && selectedProduct && (
        <BreakdownModal
          product={selectedProduct}
          transactions={transactions}
          isLoading={isLoadingTransactions}
          onClose={() => {
            setShowBreakdownModal(false);
            setSelectedProduct(null);
            setTransactions([]);
          }}
        />
      )}

      {notification.show && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification({ show: false, message: '', type: 'success' })}
        />
      )}
    </div>
  );
}

// Settings Modal Component
function PPEStockSettingsModal({ onClose, onSave, isSubmitting, setIsSubmitting }) {
  const [formData, setFormData] = useState({
    name: '',
    threshold: '',
    initialQuantity: ''
  });
  const [errors, setErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    if (!formData.name.trim()) {
      setErrors({ name: 'Product name is required' });
      return;
    }

    if (formData.threshold === '' || formData.threshold < 0) {
      setErrors({ threshold: 'Threshold must be 0 or greater' });
      return;
    }

    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/pp-stock/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          threshold: parseInt(formData.threshold) || 0,
          initialQuantity: parseInt(formData.initialQuantity) || 0
        })
      });

      const result = await response.json();
      
      if (result.success) {
        onSave();
        setFormData({ name: '', threshold: '', initialQuantity: '' });
      } else {
        setErrors({ submit: result.error || 'Failed to create product' });
      }
    } catch (error) {
      console.error('Error creating product:', error);
      setErrors({ submit: 'Error creating product. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Add Product</h2>
              <p className="text-sm text-white/90 mt-1">Create a new PPE product with threshold</p>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white text-2xl leading-none transition-colors"
            >
              ×
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Product Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Product Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900 placeholder-gray-500 transition-all duration-200 ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter product name"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          {/* Threshold */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Threshold <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              value={formData.threshold}
              onChange={(e) => setFormData({ ...formData, threshold: e.target.value })}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900 placeholder-gray-500 transition-all duration-200 ${
                errors.threshold ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Minimum quantity before alert"
            />
            {errors.threshold && (
              <p className="mt-1 text-sm text-red-500">{errors.threshold}</p>
            )}
            <p className="mt-1 text-sm text-gray-500">Alert when stock falls below this quantity</p>
          </div>

          {/* Initial Quantity (Optional) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Initial Quantity (Optional)
            </label>
            <input
              type="number"
              min="0"
              value={formData.initialQuantity}
              onChange={(e) => setFormData({ ...formData, initialQuantity: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900 placeholder-gray-500 transition-all duration-200"
              placeholder="0"
            />
            <p className="mt-1 text-sm text-gray-500">Starting stock quantity (leave 0 to add later)</p>
          </div>

          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-70 disabled:cursor-not-allowed transition-all font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white rounded-lg hover:shadow-lg transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Adding...' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Restock Modal Component
function RestockModal({ products, onClose, onRestock, isSubmitting }) {
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [errors, setErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    if (!selectedProductId) {
      setErrors({ product: 'Please select a product' });
      return;
    }

    if (!quantity || quantity <= 0) {
      setErrors({ quantity: 'Valid quantity is required' });
      return;
    }

    await onRestock(selectedProductId, quantity);
    setSelectedProductId('');
    setQuantity('');
  };

  return (
    <div className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Restock Product</h2>
              <p className="text-sm text-white/90 mt-1">Add stock to an existing product</p>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white text-2xl leading-none transition-colors"
            >
              ×
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Product Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Product <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900 transition-all duration-200 ${
                errors.product ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Please Select</option>
              {products.map(product => (
                <option key={product.id} value={product.id}>
                  {product.name} (Current: {product.currentQuantity})
                </option>
              ))}
            </select>
            {errors.product && (
              <p className="mt-1 text-sm text-red-500">{errors.product}</p>
            )}
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Quantity to Add <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900 placeholder-gray-500 transition-all duration-200 ${
                errors.quantity ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter quantity"
            />
            {errors.quantity && (
              <p className="mt-1 text-sm text-red-500">{errors.quantity}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-70 disabled:cursor-not-allowed transition-all font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white rounded-lg hover:shadow-lg transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Restocking...' : 'Restock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Stock Taken Modal Component
function StockTakenModal({ product, products, onClose, onTake, isSubmitting }) {
  const [selectedProductId, setSelectedProductId] = useState(product?.id?.toString() || '');
  const [quantity, setQuantity] = useState('');
  const [errors, setErrors] = useState({});

  const selectedProduct = selectedProductId ? products.find(p => p.id === parseInt(selectedProductId)) : null;
  const displayProduct = product || selectedProduct;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    if (!product && !selectedProductId) {
      setErrors({ product: 'Please select a product' });
      return;
    }

    if (!quantity || quantity <= 0) {
      setErrors({ quantity: 'Valid quantity is required' });
      return;
    }

    if (displayProduct && parseInt(quantity) > displayProduct.currentQuantity) {
      setErrors({ quantity: `Cannot take more than available stock (${displayProduct.currentQuantity})` });
      return;
    }

    const productIdToUse = product ? product.id : parseInt(selectedProductId);
    await onTake(productIdToUse, quantity);
    setSelectedProductId('');
    setQuantity('');
  };

  return (
    <div className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Stock Taken</h2>
              <p className="text-sm text-white/90 mt-1">
                {product ? `${product.name} - Available: ${product.currentQuantity}` : 'Record when stock items are used'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white text-2xl leading-none transition-colors"
            >
              ×
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Product Selection - only show if no product is passed */}
          {!product && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Product <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedProductId}
                onChange={(e) => {
                  setSelectedProductId(e.target.value);
                  setQuantity('');
                  setErrors({ ...errors, product: '' });
                }}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white text-gray-900 transition-all duration-200 ${
                  errors.product ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Please Select</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Available: {p.currentQuantity})
                  </option>
                ))}
              </select>
              {errors.product && (
                <p className="mt-1 text-sm text-red-500">{errors.product}</p>
              )}
            </div>
          )}

          {/* Show product info if product is passed */}
          {product && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm font-semibold text-gray-700 mb-1">Product</div>
              <div className="text-lg text-gray-900">{product.name}</div>
              <div className="text-sm text-gray-600 mt-1">Available: {product.currentQuantity}</div>
            </div>
          )}

          {/* Quantity */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Quantity Taken <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              max={displayProduct?.currentQuantity}
              value={quantity}
              onChange={(e) => {
                setQuantity(e.target.value);
                setErrors({ ...errors, quantity: '' });
              }}
              disabled={!displayProduct}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500 transition-all duration-200 ${
                errors.quantity ? 'border-red-500' : 'border-gray-300'
              } ${!displayProduct ? 'opacity-50 cursor-not-allowed' : ''}`}
              placeholder="Enter quantity"
            />
            {errors.quantity && (
              <p className="mt-1 text-sm text-red-500">{errors.quantity}</p>
            )}
            {displayProduct && (
              <p className="mt-1 text-sm text-gray-500">
                Available stock: {displayProduct.currentQuantity}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-70 disabled:cursor-not-allowed transition-all font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !displayProduct}
              className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:shadow-lg transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Processing...' : 'Confirm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Breakdown Modal Component
function BreakdownModal({ product, transactions, isLoading, onClose }) {
  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActionLabel = (action) => {
    switch (action) {
      case 'PURCHASE': return 'Purchase';
      case 'RESTOCK': return 'Restock';
      case 'TAKEN': return 'Taken';
      default: return action;
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'PURCHASE': return 'text-green-600';
      case 'RESTOCK': return 'text-blue-600';
      case 'TAKEN': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getQuantityDisplay = (action, quantity) => {
    if (action === 'TAKEN') {
      return `-${quantity}`;
    }
    return `+${quantity}`;
  };

  // Use product's current quantity as total
  const totalQuantity = product.currentQuantity;

  return (
    <div className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Breakdown</h2>
              <p className="text-sm text-white/90 mt-1">{product.name}</p>
            </div>
            <div className="flex items-center space-x-4">
              <svg className="w-5 h-5 cursor-pointer hover:text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white text-2xl leading-none transition-colors"
              >
                ×
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#224fa6] mx-auto mb-4"></div>
                <p className="text-gray-600">Loading transactions...</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Action</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Quantity</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">By</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                        No transactions found
                      </td>
                    </tr>
                  ) : (
                    <>
                      {transactions.map((transaction) => (
                        <tr key={transaction.id} className="hover:bg-gray-50 transition-colors duration-200">
                          <td className="px-6 py-5 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{formatDateTime(transaction.createdAt)}</div>
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap">
                            <div className={`text-sm font-medium ${getActionColor(transaction.action)}`}>
                              {getActionLabel(transaction.action)}
                            </div>
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap">
                            <div className={`text-sm font-medium ${getActionColor(transaction.action)}`}>
                              {getQuantityDisplay(transaction.action, transaction.quantity)}
                            </div>
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {transaction.user?.firstName} {transaction.user?.lastName}
                            </div>
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-gray-50 font-semibold">
                        <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-900">Totals</td>
                        <td className="px-6 py-5 whitespace-nowrap"></td>
                        <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-900">{totalQuantity}</td>
                        <td className="px-6 py-5 whitespace-nowrap"></td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 transition-all font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


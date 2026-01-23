'use client';

import { useState, useEffect } from 'react';

export default function PpeStockPage() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Take Stock State
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [quantityToTake, setQuantityToTake] = useState(1);
    const [takingStock, setTakingStock] = useState(false);
    const [takeError, setTakeError] = useState(null);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await fetch('/api/pp-stock/products', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setProducts(data.data || []);
                } else {
                    setError('Failed to load products');
                }
            } else {
                setError('Failed to fetch data');
            }
        } catch (err) {
            console.error(err);
            setError('Network error');
        } finally {
            setLoading(false);
        }
    };

    const handleTakeStock = async (e) => {
        e.preventDefault();
        if (!selectedProduct) return;

        setTakingStock(true);
        setTakeError(null);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/pp-stock/products/${selectedProduct.id}/take`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ quantity: parseInt(quantityToTake) })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // Update local state
                setProducts(prev => prev.map(p =>
                    p.id === selectedProduct.id ? data.data : p
                ));
                setSelectedProduct(null); // Close modal
                setQuantityToTake(1);
            } else {
                setTakeError(data.error || 'Failed to take stock');
            }
        } catch (err) {
            setTakeError('Network error');
        } finally {
            setTakingStock(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">PPE Stock</h1>
                    <p className="text-sm text-gray-500">Check and manage inventory levels</p>
                </div>
                <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-xl">
                    📦
                </div>
            </div>

            {/* Error State */}
            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 text-center">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#224fa6]" />
                </div>
            ) : products.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-100">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                        📦
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">No Inventory Found</h3>
                    <p className="text-gray-500">Stock list is currently empty.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {products.map(product => {
                        const isLow = product.currentQuantity <= product.threshold;
                        return (
                            <div key={product.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden group">
                                {isLow && (
                                    <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] uppercase font-bold px-2 py-1 rounded-bl-lg">
                                        Low Stock
                                    </div>
                                )}

                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="font-bold text-gray-800 text-lg mb-0.5">{product.name}</h3>
                                        <p className="text-xs text-gray-400">ID: #{product.id.toString().padStart(4, '0')}</p>
                                    </div>
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold ${isLow ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
                                        }`}>
                                        {product.currentQuantity}
                                    </div>
                                </div>

                                <div className="flex gap-2 mt-4">
                                    <button
                                        onClick={() => {
                                            setSelectedProduct(product);
                                            setQuantityToTake(1);
                                            setTakeError(null);
                                        }}
                                        className="flex-1 py-2 bg-[#224fa6] text-white text-sm font-bold rounded-lg hover:bg-[#1b3d82] active:scale-95 transition-all shadow-blue-900/10 shadow-lg"
                                    >
                                        Take Stock
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Take Stock Modal */}
            {selectedProduct && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 scale-in-95 animate-in zoom-in-95">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-slate-800">Use Item</h3>
                            <button onClick={() => setSelectedProduct(null)} className="text-gray-400 hover:text-gray-600">✕</button>
                        </div>

                        <div className="bg-blue-50 p-4 rounded-xl mb-6">
                            <p className="text-sm text-blue-600 font-semibold uppercase tracking-wider mb-1">Checking Out</p>
                            <p className="text-lg font-bold text-gray-900">{selectedProduct.name}</p>
                            <p className="text-sm text-gray-500 mt-1">Available: {selectedProduct.currentQuantity}</p>
                        </div>

                        {takeError && (
                            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4 border border-red-100">
                                {takeError}
                            </div>
                        )}

                        <form onSubmit={handleTakeStock}>
                            <div className="mb-6">
                                <label className="block text-sm font-bold text-gray-700 mb-2">Quantity Used</label>
                                <div className="flex items-center gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setQuantityToTake(q => Math.max(1, q - 1))}
                                        className="w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center font-bold text-gray-600 hover:bg-gray-50 active:scale-95"
                                    >
                                        -
                                    </button>
                                    <input
                                        type="number"
                                        min="1"
                                        max={selectedProduct.currentQuantity}
                                        value={quantityToTake}
                                        onChange={(e) => setQuantityToTake(Math.max(1, parseInt(e.target.value) || 0))}
                                        className="flex-1 text-center font-bold text-xl py-2 border-b-2 border-gray-200 focus:border-[#224fa6] outline-none"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setQuantityToTake(q => Math.min(selectedProduct.currentQuantity, q + 1))}
                                        className="w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center font-bold text-gray-600 hover:bg-gray-50 active:scale-95"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={takingStock}
                                className="w-full py-3.5 bg-[#224fa6] text-white font-bold rounded-xl shadow-lg shadow-blue-900/20 hover:bg-[#1b3d82] active:scale-[0.98] transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                            >
                                {takingStock ? (
                                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    'Confirm Usage'
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

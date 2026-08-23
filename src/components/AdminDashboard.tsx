import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Plus,
  Edit2,
  Trash2,
  Package,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  RefreshCw,
  Search,
  CheckCircle2,
  Truck,
  Filter,
  X,
  Layers,
  Save,
  Clock,
  Sparkles,
  BarChart2,
} from 'lucide-react';
import { Product, Order, OrderStatus, Category } from '../types';
import { productService } from '../services/productService';
import { orderService } from '../services/orderService';
import { SAMPLE_CATEGORIES } from '../data/sampleProducts';

interface AdminDashboardProps {
  products: Product[];
  onRefreshCatalog: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  products,
  onRefreshCatalog,
}) => {
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'analytics'>('products');
  const [orders, setOrders] = useState<Order[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [isSeeding, setIsSeeding] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);

  // Add / Edit Product Modal state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [productFormData, setProductFormData] = useState<Partial<Product>>({
    title: '',
    description: '',
    price: 99.99,
    originalPrice: 129.99,
    category: 'electronics',
    stock: 25,
    rating: 5.0,
    ratingCount: 1,
    featured: false,
    images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80'],
    tags: ['new', 'tech'],
    specs: [
      { name: 'Warranty', value: '2 Years Manufacturer' },
      { name: 'Condition', value: 'Brand New In Box' },
    ],
  });

  // Subscribe to all orders
  useEffect(() => {
    const unsub = orderService.subscribeToAllOrders((allOrders) => {
      setOrders(allOrders);
    });
    return () => unsub();
  }, []);

  // Handlers for Products
  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setProductFormData({
      title: '',
      description: '',
      price: 99.99,
      originalPrice: 129.99,
      category: 'electronics',
      stock: 25,
      rating: 5.0,
      ratingCount: 1,
      featured: false,
      images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80'],
      tags: ['new', 'tech'],
      specs: [
        { name: 'Warranty', value: '2 Years Manufacturer' },
        { name: 'Condition', value: 'Brand New In Box' },
      ],
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (prod: Product) => {
    setEditingProduct(prod);
    setProductFormData({ ...prod });
    setIsAddModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productFormData.title || !productFormData.price) return;

    try {
      if (editingProduct) {
        // Update existing
        await productService.updateProduct(editingProduct.id, productFormData);
        setStatusFeedback(`Product "${productFormData.title}" updated successfully!`);
      } else {
        // Add new
        await productService.addProduct(productFormData as Omit<Product, 'id'>);
        setStatusFeedback(`Product "${productFormData.title}" added to catalog!`);
      }
      setIsAddModalOpen(false);
      onRefreshCatalog();
      setTimeout(() => setStatusFeedback(null), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteProduct = async (prod: Product) => {
    if (!window.confirm(`Are you sure you want to delete "${prod.title}" from catalog?`)) return;
    try {
      await productService.deleteProduct(prod.id);
      setStatusFeedback(`Product "${prod.title}" deleted.`);
      onRefreshCatalog();
      setTimeout(() => setStatusFeedback(null), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleQuickStockChange = async (prod: Product, delta: number) => {
    const newStock = Math.max(0, prod.stock + delta);
    try {
      await productService.updateProduct(prod.id, { stock: newStock });
      onRefreshCatalog();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSeedCatalog = async () => {
    if (!window.confirm('Reset and seed sample tech catalog to Firestore?')) return;
    setIsSeeding(true);
    try {
      await productService.seedInitialCatalog(true);
      setStatusFeedback('Catalog reset and seeded with premium tech demo products.');
      onRefreshCatalog();
      setTimeout(() => setStatusFeedback(null), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSeeding(false);
    }
  };

  // Order status update
  const handleUpdateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await orderService.updateOrderStatus(orderId, newStatus);
      setStatusFeedback(`Order status updated to "${newStatus}".`);
      setTimeout(() => setStatusFeedback(null), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  // KPI Calculations
  const totalRevenue = orders.reduce((sum, o) => (o.status !== 'cancelled' ? sum + o.total : sum), 0);
  const activeShipments = orders.filter((o) => o.status === 'shipped' || o.status === 'out_for_delivery').length;
  const lowStockCount = products.filter((p) => p.stock <= 5).length;

  const filteredProducts = products.filter(
    (p) =>
      p.title.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.category.toLowerCase().includes(productSearch.toLowerCase())
  );

  const filteredOrders = orders.filter((o) => {
    if (orderStatusFilter !== 'all' && o.status !== orderStatusFilter) return false;
    if (orderSearch.trim()) {
      const q = orderSearch.toLowerCase();
      const matchNum = o.orderNumber.toLowerCase().includes(q);
      const matchCust = o.customerName.toLowerCase().includes(q) || o.customerEmail.toLowerCase().includes(q);
      const matchTrk = o.trackingNumber.toLowerCase().includes(q);
      if (!matchNum && !matchCust && !matchTrk) return false;
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-fade-in text-slate-900">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-semibold text-xs tracking-wider uppercase mb-1">
            <ShieldCheck className="w-4 h-4" />
            Store Management Console
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Administrator Control Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time product inventory control, order fulfillment dispatch, and store metrics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSeedCatalog}
            disabled={isSeeding}
            className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center gap-2 transition cursor-pointer shadow-xs"
            id="seed-catalog-btn"
            title="Populate or restore full sample products"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSeeding ? 'animate-spin' : ''}`} />
            {isSeeding ? 'Seeding...' : 'Reset / Seed Catalog'}
          </button>

          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition cursor-pointer"
            id="admin-add-product-btn"
          >
            <Plus className="w-4 h-4" />
            Add New Product
          </button>
        </div>
      </div>

      {/* Feedback Toast */}
      {statusFeedback && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          {statusFeedback}
        </div>
      )}

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-1 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Total Gross Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">${totalRevenue.toFixed(2)}</p>
          <span className="text-[11px] text-emerald-600 font-medium">From verified orders</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-1 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Total Orders</span>
            <Package className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">{orders.length}</p>
          <span className="text-[11px] text-indigo-600 font-medium">Real-time sync</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-1 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Active Shipments</span>
            <Truck className="w-4 h-4 text-slate-700" />
          </div>
          <p className="text-2xl font-black text-slate-900">{activeShipments}</p>
          <span className="text-[11px] text-slate-500 font-medium">In transit / out for delivery</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-1 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Low Stock Alerts</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">{lowStockCount}</p>
          <span className="text-[11px] text-amber-600 font-medium">Products ≤ 5 units</span>
        </div>
      </div>

      {/* Main Tab Nav */}
      <div className="flex border-b border-slate-200 gap-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('products')}
          className={`pb-3 transition relative cursor-pointer flex items-center gap-2 ${
            activeTab === 'products' ? 'text-slate-900 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
          id="admin-tab-products"
        >
          <Layers className="w-4 h-4" />
          Product Inventory ({products.length})
          {activeTab === 'products' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 transition relative cursor-pointer flex items-center gap-2 ${
            activeTab === 'orders' ? 'text-slate-900 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
          id="admin-tab-orders"
        >
          <Truck className="w-4 h-4" />
          Order Fulfillment ({orders.length})
          {activeTab === 'orders' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`pb-3 transition relative cursor-pointer flex items-center gap-2 ${
            activeTab === 'analytics' ? 'text-slate-900 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
          id="admin-tab-analytics"
        >
          <BarChart2 className="w-4 h-4" />
          Store Analytics
          {activeTab === 'analytics' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900 rounded-full" />
          )}
        </button>
      </div>

      {/* TAB 1: Product Inventory */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search catalog products..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <span className="text-xs text-slate-500">
              Showing {filteredProducts.length} of {products.length} items
            </span>
          </div>

          {/* Products Table */}
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                  <tr>
                    <th className="py-3.5 px-4">Product Details</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Price</th>
                    <th className="py-3.5 px-4">Stock Level</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.map((prod) => (
                    <tr key={prod.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3.5 px-4 flex items-center gap-3">
                        <img
                          src={prod.images[0]}
                          alt={prod.title}
                          className="w-11 h-11 rounded-xl object-cover bg-slate-100 border border-slate-200 shrink-0"
                        />
                        <div className="min-w-0 max-w-xs">
                          <p className="font-semibold text-slate-900 truncate">{prod.title}</p>
                          <p className="text-[11px] text-slate-400 font-mono">ID: {prod.id}</p>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 capitalize text-slate-600">{prod.category}</td>

                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900">${prod.price.toFixed(2)}</span>
                        {prod.originalPrice && (
                          <span className="text-slate-400 line-through ml-1 text-[11px]">
                            ${prod.originalPrice.toFixed(2)}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleQuickStockChange(prod, -1)}
                            className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 cursor-pointer font-bold"
                          >
                            -
                          </button>
                          <span className="font-bold text-slate-900 min-w-[20px] text-center font-mono">
                            {prod.stock}
                          </span>
                          <button
                            onClick={() => handleQuickStockChange(prod, 1)}
                            className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 cursor-pointer font-bold"
                          >
                            +
                          </button>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {prod.stock <= 0 ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            Out of Stock
                          </span>
                        ) : prod.stock <= 5 ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            Low ({prod.stock})
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            In Stock
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right space-x-2">
                        <button
                          onClick={() => handleOpenEditModal(prod)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 transition cursor-pointer"
                          title="Edit Product"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(prod)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition cursor-pointer"
                          title="Delete Product"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Order Fulfillment */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search orders, customers, tracking..."
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex gap-1.5 overflow-x-auto text-xs">
              {['all', 'pending', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'].map((st) => (
                <button
                  key={st}
                  onClick={() => setOrderStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl capitalize font-medium transition cursor-pointer ${
                    orderStatusFilter === st
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                >
                  {st.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                  <tr>
                    <th className="py-3.5 px-4">Order / Tracking</th>
                    <th className="py-3.5 px-4">Customer</th>
                    <th className="py-3.5 px-4">Items / Total</th>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">Fulfillment Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3.5 px-4">
                        <p className="font-mono font-bold text-slate-900">{ord.orderNumber}</p>
                        <p className="text-[11px] text-indigo-600 font-mono">{ord.trackingNumber}</p>
                        <p className="text-[10px] text-slate-400">{ord.carrier}</p>
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-900">{ord.customerName}</p>
                        <p className="text-[11px] text-slate-500">{ord.customerEmail}</p>
                        <p className="text-[10px] text-slate-400">{ord.shippingAddress?.city}, {ord.shippingAddress?.state}</p>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900">${ord.total.toFixed(2)}</span>
                        <p className="text-[11px] text-slate-500">{ord.items.length} unique items</p>
                      </td>

                      <td className="py-3.5 px-4 text-[11px] text-slate-500 font-mono">
                        {new Date(ord.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      <td className="py-3.5 px-4">
                        <select
                          value={ord.status}
                          onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value as OrderStatus)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider focus:outline-none cursor-pointer ${
                            ord.status === 'delivered'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : ord.status === 'cancelled'
                              ? 'bg-rose-50 text-rose-800 border border-rose-200'
                              : 'bg-slate-100 text-slate-800 border border-slate-200'
                          }`}
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="out_for_delivery">Out for Delivery</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Store Analytics */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Revenue by category */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              Category Inventory Breakdown
            </h3>
            <div className="space-y-3">
              {SAMPLE_CATEGORIES.map((cat) => {
                const catProducts = products.filter((p) => p.category === cat.slug);
                const totalStock = catProducts.reduce((acc, p) => acc + p.stock, 0);
                const percent = Math.min(100, (catProducts.length / (products.length || 1)) * 100);

                return (
                  <div key={cat.id} className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-700 font-medium">{cat.name}</span>
                      <span className="text-slate-500 font-mono">
                        {catProducts.length} models • {totalStock} in stock
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-slate-900 rounded-full"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Order Status Distribution */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-700" />
              Fulfillment Pipeline Breakdown
            </h3>
            <div className="space-y-3 text-xs">
              {['processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'].map((st) => {
                const count = orders.filter((o) => o.status === st).length;
                const percent = orders.length > 0 ? (count / orders.length) * 100 : 0;

                return (
                  <div key={st} className="space-y-1">
                    <div className="flex justify-between">
                      <span className="capitalize text-slate-700">{st.replace(/_/g, ' ')}</span>
                      <span className="font-mono text-slate-900 font-semibold">
                        {count} ({percent.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-slate-900 rounded-full"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl p-6 sm:p-8 shadow-2xl space-y-6 text-slate-900 animate-scale-in my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                {editingProduct ? 'Edit Catalog Product' : 'Add New Catalog Product'}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Product Title</label>
                <input
                  type="text"
                  required
                  value={productFormData.title}
                  onChange={(e) => setProductFormData({ ...productFormData, title: e.target.value })}
                  placeholder="e.g. AeroPulse Pro Headphones"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Category</label>
                  <select
                    value={productFormData.category}
                    onChange={(e) => setProductFormData({ ...productFormData, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-500 capitalize"
                  >
                    {SAMPLE_CATEGORIES.map((c) => (
                      <option key={c.slug} value={c.slug}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={productFormData.price}
                    onChange={(e) =>
                      setProductFormData({ ...productFormData, price: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Original Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={productFormData.originalPrice || ''}
                    onChange={(e) =>
                      setProductFormData({
                        ...productFormData,
                        originalPrice: parseFloat(e.target.value) || undefined,
                      })
                    }
                    placeholder="Optional"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Initial Stock Count</label>
                  <input
                    type="number"
                    required
                    value={productFormData.stock}
                    onChange={(e) =>
                      setProductFormData({ ...productFormData, stock: parseInt(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Primary Image URL</label>
                  <input
                    type="url"
                    required
                    value={productFormData.images?.[0] || ''}
                    onChange={(e) =>
                      setProductFormData({
                        ...productFormData,
                        images: [e.target.value, ...(productFormData.images?.slice(1) || [])],
                      })
                    }
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Description</label>
                <textarea
                  rows={3}
                  required
                  value={productFormData.description}
                  onChange={(e) => setProductFormData({ ...productFormData, description: e.target.value })}
                  placeholder="Detailed feature breakdown..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="featured-checkbox"
                  checked={productFormData.featured || false}
                  onChange={(e) => setProductFormData({ ...productFormData, featured: e.target.checked })}
                  className="w-4 h-4 rounded text-slate-900 focus:ring-slate-900 border-slate-300"
                />
                <label htmlFor="featured-checkbox" className="text-slate-700 font-medium cursor-pointer">
                  Feature this item on homepage hero banner
                </label>
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 cursor-pointer font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold cursor-pointer shadow-xs"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

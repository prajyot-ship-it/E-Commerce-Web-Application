import React, { useState, useEffect } from 'react';
import {
  Package,
  Truck,
  ExternalLink,
  RotateCcw,
  Printer,
  X,
  Search,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  Calendar,
  Clock,
} from 'lucide-react';
import { Order, OrderStatus } from '../types';
import { orderService } from '../services/orderService';
import { useAuth } from '../context/AuthContext';

interface UserOrdersViewProps {
  onTrackOrder: (orderId: string) => void;
  onShopNow: () => void;
}

export const UserOrdersView: React.FC<UserOrdersViewProps> = ({ onTrackOrder, onShopNow }) => {
  const { userProfile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<Order | null>(null);
  const [isCancellingId, setIsCancellingId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = orderService.subscribeToUserOrders(userProfile?.uid || 'guest', (userOrders) => {
      setOrders(userOrders);
    });

    return () => unsub();
  }, [userProfile]);

  const handleCancelOrder = async (order: Order) => {
    if (!window.confirm(`Are you sure you want to cancel order ${order.orderNumber}?`)) return;

    setIsCancellingId(order.id);
    try {
      await orderService.updateOrderStatus(
        order.id,
        'cancelled',
        'Order was cancelled by customer request. Refund scheduled.',
        'Online Management Portal'
      );
    } catch (e) {
      console.error('Error cancelling order:', e);
    } finally {
      setIsCancellingId(null);
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (filterStatus !== 'all' && order.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNumber = order.orderNumber.toLowerCase().includes(q);
      const matchTracking = order.trackingNumber.toLowerCase().includes(q);
      const matchItem = order.items?.some((i) => i.title.toLowerCase().includes(q));
      if (!matchNumber && !matchTracking && !matchItem) return false;
    }
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-fade-in text-slate-900">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-semibold text-xs tracking-wider uppercase mb-1">
            <Package className="w-4 h-4 text-emerald-600" />
            Customer Order Management
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            My Orders & Purchase History
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            View live status, invoices, and shipment progress for all purchases.
          </p>
        </div>

        {/* Filter / Search Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by order or product..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 text-xs">
        {['all', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'].map((st) => (
          <button
            key={st}
            onClick={() => setFilterStatus(st)}
            className={`px-3.5 py-1.5 rounded-xl font-medium capitalize transition shrink-0 cursor-pointer ${
              filterStatus === st
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            {st === 'all' ? 'All Orders' : st.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No Orders Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {orders.length === 0
              ? "You haven't placed any orders yet. Check out our store catalog to start shopping!"
              : 'No orders match your active filter criteria.'}
          </p>
          <button
            onClick={onShopNow}
            className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition cursor-pointer shadow-xs"
          >
            Explore Catalog
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white border border-slate-200 hover:border-slate-300 rounded-3xl p-6 transition shadow-sm space-y-4"
              id={`order-card-${order.id}`}
            >
              {/* Order Header Row */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-mono font-bold text-sm text-indigo-600">
                    {order.orderNumber}
                  </span>
                  <span className="text-xs text-slate-300">•</span>
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(order.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                  <span className="text-xs text-slate-300">•</span>
                  <span className="text-xs text-slate-500 font-mono">
                    Tracking: <strong className="text-slate-900">{order.trackingNumber}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      order.status === 'delivered'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : order.status === 'cancelled'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                    }`}
                  >
                    {order.status.replace(/_/g, ' ')}
                  </span>
                  <span className="text-base font-extrabold text-slate-900">
                    ${order.total.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Items Thumbnails & Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <div className="md:col-span-2 flex items-center gap-3 overflow-x-auto pb-1">
                  {order.items?.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 p-2 rounded-2xl bg-slate-50 border border-slate-200 shrink-0"
                    >
                      <img
                        src={item.image}
                        alt=""
                        className="w-10 h-10 rounded-xl object-cover bg-slate-100"
                      />
                      <div className="text-xs max-w-[140px]">
                        <p className="font-medium text-slate-900 truncate">{item.title}</p>
                        <p className="text-[11px] text-slate-500">Qty: {item.quantity} × ${item.price.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center justify-end gap-2 text-xs">
                  <button
                    onClick={() => onTrackOrder(order.id)}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    Track Shipment
                  </button>

                  <button
                    onClick={() => setSelectedReceiptOrder(order)}
                    className="px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-medium flex items-center gap-1.5 border border-slate-200 transition cursor-pointer shadow-xs"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Receipt
                  </button>

                  {(order.status === 'pending' || order.status === 'processing') && (
                    <button
                      onClick={() => handleCancelOrder(order)}
                      disabled={isCancellingId === order.id}
                      className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition cursor-pointer"
                    >
                      {isCancellingId === order.id ? 'Cancelling...' : 'Cancel'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Digital Receipt Modal */}
      {selectedReceiptOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-6 sm:p-8 shadow-2xl space-y-6 text-slate-900 animate-scale-in">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Digital Tax Invoice & Receipt</h3>
                <p className="text-xs text-slate-500 font-mono">Order {selectedReceiptOrder.orderNumber}</p>
              </div>
              <button
                onClick={() => setSelectedReceiptOrder(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Billed / Shipped To:</span>
                  <p className="font-bold text-slate-900 mt-1">{selectedReceiptOrder.customerName}</p>
                  <p className="text-slate-600">{selectedReceiptOrder.shippingAddress?.street}</p>
                  <p className="text-slate-600">
                    {selectedReceiptOrder.shippingAddress?.city}, {selectedReceiptOrder.shippingAddress?.state}{' '}
                    {selectedReceiptOrder.shippingAddress?.zipCode}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Payment Summary:</span>
                  <p className="font-bold text-slate-900 mt-1 uppercase">{selectedReceiptOrder.paymentMethod.replace('_', ' ')}</p>
                  <p className="text-emerald-700 font-semibold">Status: PAID</p>
                  <p className="text-slate-500">Carrier: {selectedReceiptOrder.carrier}</p>
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-2">
                <span className="font-semibold text-slate-700">Line Items:</span>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {selectedReceiptOrder.items.map((item, idx) => (
                    <div key={idx} className="p-3 bg-white flex justify-between items-center text-xs">
                      <div>
                        <p className="font-medium text-slate-900">{item.title}</p>
                        <p className="text-slate-500 text-[11px]">Qty: {item.quantity} × ${item.price.toFixed(2)}</p>
                      </div>
                      <span className="font-bold text-slate-900">${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cost Math */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal</span>
                  <span>${selectedReceiptOrder.subtotal.toFixed(2)}</span>
                </div>
                {selectedReceiptOrder.discount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount</span>
                    <span>-${selectedReceiptOrder.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-500">
                  <span>Shipping Fee</span>
                  <span>{selectedReceiptOrder.shippingFee === 0 ? 'FREE' : `$${selectedReceiptOrder.shippingFee.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Sales Tax</span>
                  <span>${selectedReceiptOrder.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-100">
                  <span>Total Paid</span>
                  <span className="text-slate-900">${selectedReceiptOrder.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

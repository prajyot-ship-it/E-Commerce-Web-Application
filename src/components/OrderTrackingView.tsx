import React, { useState, useEffect } from 'react';
import {
  Search,
  Truck,
  CheckCircle2,
  Package,
  Clock,
  MapPin,
  ShieldCheck,
  AlertCircle,
  Play,
  RotateCcw,
  Printer,
  ChevronRight,
  Sparkles,
  ExternalLink,
  ArrowRight,
} from 'lucide-react';
import { Order, OrderStatus } from '../types';
import { orderService } from '../services/orderService';
import { useAuth } from '../context/AuthContext';

interface OrderTrackingViewProps {
  initialOrderId?: string;
  onNavigateToShop: () => void;
}

const ORDER_STEPS: { status: OrderStatus; label: string; description: string }[] = [
  { status: 'pending', label: 'Order Placed', description: 'Payment confirmed & order authorized' },
  { status: 'processing', label: 'Processing', description: 'Packed & inspected at fulfillment facility' },
  { status: 'shipped', label: 'Shipped', description: 'Handed to carrier & en route' },
  { status: 'out_for_delivery', label: 'Out for Delivery', description: 'Courier is in your neighborhood' },
  { status: 'delivered', label: 'Delivered', description: 'Safely delivered to designated location' },
];

export const OrderTrackingView: React.FC<OrderTrackingViewProps> = ({
  initialOrderId,
  onNavigateToShop,
}) => {
  const { userProfile, role } = useAuth();
  const [searchQuery, setSearchQuery] = useState(initialOrderId || '');
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Subscribe to recent orders
  useEffect(() => {
    const unsub = orderService.subscribeToUserOrders(userProfile?.uid || 'guest', (orders) => {
      setRecentOrders(orders);
      if (!activeOrder && orders.length > 0) {
        setActiveOrder(orders[0]);
        setSearchQuery(orders[0].orderNumber);
      }
    });

    return () => unsub();
  }, [userProfile]);

  useEffect(() => {
    if (initialOrderId) {
      handleSearch(initialOrderId);
    }
  }, [initialOrderId]);

  const handleSearch = async (queryStr?: string) => {
    const q = (queryStr || searchQuery).trim();
    if (!q) return;

    setIsLoading(true);
    setErrorMsg(null);
    try {
      const found = await orderService.findOrder(q);
      if (found) {
        setActiveOrder(found);
      } else {
        setErrorMsg(`No order found matching "${q}". Check the order or tracking number.`);
      }
    } catch (e) {
      setErrorMsg('Error searching for order.');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to find step index
  const getStepIndex = (status: OrderStatus) => {
    if (status === 'cancelled') return -1;
    return ORDER_STEPS.findIndex((s) => s.status === status);
  };

  // Advance status simulation for interactive testing
  const handleAdvanceStatus = async () => {
    if (!activeOrder) return;
    const currentIdx = getStepIndex(activeOrder.status);
    if (currentIdx >= ORDER_STEPS.length - 1) return;

    const nextStep = ORDER_STEPS[currentIdx + 1];
    try {
      await orderService.updateOrderStatus(
        activeOrder.id,
        nextStep.status,
        `Status updated to: ${nextStep.label}`,
        'Regional Transit Hub'
      );
      // Reload order
      const refreshed = await orderService.findOrder(activeOrder.id);
      if (refreshed) {
        setActiveOrder(refreshed);
        setActionSuccess(`Simulated shipment advanced to: ${nextStep.label}`);
        setTimeout(() => setActionSuccess(null), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const currentStepIndex = activeOrder ? getStepIndex(activeOrder.status) : 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-fade-in text-slate-900">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-semibold text-xs tracking-wider uppercase mb-1">
            <Truck className="w-4 h-4 text-indigo-600" />
            Live Logistics & Order Tracker
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Track Your Package
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time status updates, transit milestones, and courier timestamps.
          </p>
        </div>

        {/* Search Bar */}
        <div className="w-full md:w-96">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            className="flex gap-2"
          >
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Enter Order # or Tracking #"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 font-mono"
                id="order-tracking-search-input"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer shrink-0"
              id="search-order-btn"
            >
              {isLoading ? 'Searching...' : 'Track'}
            </button>
          </form>
          {errorMsg && <p className="text-xs text-rose-600 mt-1.5">{errorMsg}</p>}
        </div>
      </div>

      {/* Quick Select from recent orders */}
      {recentOrders.length > 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2 text-xs">
            <span className="font-semibold text-slate-700">Your Recent Shipments:</span>
            <span className="text-slate-500">{recentOrders.length} available</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {recentOrders.map((ord) => (
              <button
                key={ord.id}
                onClick={() => {
                  setActiveOrder(ord);
                  setSearchQuery(ord.orderNumber);
                  setErrorMsg(null);
                }}
                className={`px-3 py-1.5 rounded-xl border text-xs font-mono transition shrink-0 cursor-pointer flex items-center gap-2 ${
                  activeOrder?.id === ord.id
                    ? 'bg-slate-900 border-slate-900 text-white font-bold shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                <span>{ord.orderNumber}</span>
                <span className={`text-[10px] uppercase font-sans px-1.5 py-0.5 rounded ${activeOrder?.id === ord.id ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-600'}`}>
                  {ord.status.replace('_', ' ')}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Interactive simulation banner */}
      {activeOrder && (
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2 text-xs">
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <p className="font-semibold text-slate-900">Live Tracking Interactive Simulation</p>
              <p className="text-slate-500 text-[11px]">Advance this shipment to next phase to test real-time state sync</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {actionSuccess && (
              <span className="text-xs text-emerald-600 font-medium animate-fade-in flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> {actionSuccess}
              </span>
            )}
            <button
              onClick={handleAdvanceStatus}
              disabled={activeOrder.status === 'delivered' || activeOrder.status === 'cancelled'}
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-30 cursor-pointer shadow-xs"
              id="advance-status-btn"
            >
              <Play className="w-3 h-3" />
              {activeOrder.status === 'delivered' ? 'Shipment Completed' : 'Simulate Next Step'}
            </button>
          </div>
        </div>
      )}

      {/* Active Order Card */}
      {activeOrder ? (
        <div className="space-y-8">
          {/* Order Details Header Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-slate-900 font-mono">{activeOrder.orderNumber}</h2>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      activeOrder.status === 'delivered'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : activeOrder.status === 'cancelled'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                    }`}
                  >
                    {activeOrder.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Placed on {new Date(activeOrder.createdAt).toLocaleDateString('en-US', { dateStyle: 'full' })}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block text-[10px]">Carrier</span>
                  <span className="font-semibold text-slate-900">{activeOrder.carrier}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block text-[10px]">Tracking Number</span>
                  <span className="font-mono font-bold text-indigo-600">{activeOrder.trackingNumber}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block text-[10px]">Estimated Delivery</span>
                  <span className="font-semibold text-emerald-600">{activeOrder.estimatedDelivery}</span>
                </div>
              </div>
            </div>

            {/* Stepper Graphic */}
            <div className="py-4">
              <div className="relative">
                {/* Horizontal line background */}
                <div className="hidden sm:block absolute top-1/2 left-0 right-0 h-1 bg-slate-100 -translate-y-1/2 z-0" />
                {/* Active filled line */}
                <div
                  className="hidden sm:block absolute top-1/2 left-0 h-1 bg-slate-900 -translate-y-1/2 z-0 transition-all duration-500"
                  style={{
                    width: `${Math.max(0, (currentStepIndex / (ORDER_STEPS.length - 1)) * 100)}%`,
                  }}
                />

                {/* Steps */}
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 relative z-10">
                  {ORDER_STEPS.map((step, idx) => {
                    const isPassed = currentStepIndex >= idx;
                    const isCurrent = currentStepIndex === idx;

                    return (
                      <div
                        key={step.status}
                        className="flex sm:flex-col items-center gap-3 sm:text-center"
                      >
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-all duration-300 ${
                            isPassed
                              ? 'bg-slate-900 text-white shadow-xs ring-4 ring-slate-100'
                              : 'bg-slate-100 border border-slate-200 text-slate-400 ring-4 ring-white'
                          } ${isCurrent ? 'ring-slate-300' : ''}`}
                        >
                          {isPassed ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                        </div>

                        <div className="sm:mt-2">
                          <p
                            className={`text-xs font-bold ${
                              isPassed ? 'text-slate-900' : 'text-slate-400'
                            }`}
                          >
                            {step.label}
                          </p>
                          <p className="text-[11px] text-slate-500 hidden sm:block mt-0.5 leading-tight">
                            {step.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Timeline and Details Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Timeline Column (2 cols) */}
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 space-y-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  Shipment Activity Timeline
                </h3>
                <span className="text-xs text-slate-500">Chronological Updates</span>
              </div>

              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {activeOrder.timeline && activeOrder.timeline.length > 0 ? (
                  activeOrder.timeline
                    .slice()
                    .reverse()
                    .map((evt, idx) => (
                      <div key={idx} className="relative group">
                        {/* Dot indicator */}
                        <div
                          className={`absolute -left-6 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white ${
                            idx === 0 ? 'bg-slate-900 ring-2 ring-slate-300' : 'bg-slate-400'
                          }`}
                        />
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-1 group-hover:border-slate-300 transition">
                          <div className="flex flex-wrap items-center justify-between gap-1">
                            <span className="text-xs font-bold text-slate-900">{evt.title}</span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {new Date(evt.timestamp).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600">{evt.description}</p>
                          {evt.location && (
                            <div className="flex items-center gap-1 text-[11px] text-slate-500 pt-1">
                              <MapPin className="w-3 h-3 text-indigo-600" />
                              <span>{evt.location}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                ) : (
                  <p className="text-xs text-slate-500">No timeline events logged yet.</p>
                )}
              </div>
            </div>

            {/* Order Items & Destination Column (1 col) */}
            <div className="space-y-6">
              {/* Shipping destination card */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-3 shadow-sm">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Delivery Address
                </h4>
                <div className="text-xs text-slate-700 space-y-1">
                  <p className="font-bold text-slate-900 text-sm">
                    {activeOrder.shippingAddress?.fullName || activeOrder.customerName}
                  </p>
                  <p className="text-slate-600">{activeOrder.shippingAddress?.street}</p>
                  {activeOrder.shippingAddress?.apartment && (
                    <p className="text-slate-500">{activeOrder.shippingAddress?.apartment}</p>
                  )}
                  <p className="text-slate-600">
                    {activeOrder.shippingAddress?.city}, {activeOrder.shippingAddress?.state}{' '}
                    {activeOrder.shippingAddress?.zipCode}
                  </p>
                  <p className="text-slate-500">{activeOrder.shippingAddress?.country}</p>
                  <p className="text-slate-500 pt-1">Phone: {activeOrder.customerPhone}</p>
                </div>
              </div>

              {/* Items in order */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                  <span>Package Items ({activeOrder.items?.length || 0})</span>
                  <span className="text-slate-900 font-bold">${activeOrder.total.toFixed(2)}</span>
                </h4>

                <div className="space-y-3 divide-y divide-slate-100 max-h-64 overflow-y-auto pr-1">
                  {activeOrder.items?.map((item, i) => (
                    <div key={i} className="pt-3 first:pt-0 flex items-center gap-3">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-12 h-12 rounded-xl object-cover bg-slate-50 border border-slate-200 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-900 truncate">{item.title}</p>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 mt-0.5">
                          <span>Qty: {item.quantity}</span>
                          <span className="font-semibold text-slate-900">${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-slate-100 text-xs space-y-1 text-slate-500">
                  <div className="flex justify-between">
                    <span>Payment Method:</span>
                    <span className="capitalize text-slate-900 font-medium">{activeOrder.paymentMethod.replace('_', ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Payment Status:</span>
                    <span className="font-semibold text-emerald-700 uppercase text-[10px] bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      {activeOrder.paymentStatus}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Package className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No Active Order Selected</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Enter an Order Number or Tracking Number in the search field above, or browse the store catalog to place your first order.
          </p>
          <button
            onClick={onNavigateToShop}
            className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition cursor-pointer shadow-xs"
          >
            Browse Products
          </button>
        </div>
      )}
    </div>
  );
};

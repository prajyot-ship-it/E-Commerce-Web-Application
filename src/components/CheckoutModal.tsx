import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  CreditCard,
  Truck,
  CheckCircle2,
  Lock,
  ArrowRight,
  ArrowLeft,
  DollarSign,
  Smartphone,
  Sparkles,
  MapPin,
  Clock,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { orderService } from '../services/orderService';
import { ShippingAddress, Order } from '../types';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderSuccess: (order: Order) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  onOrderSuccess,
}) => {
  const { cart, subtotal, discountAmount, shippingFee, taxAmount, total, coupon, clearCart, shippingTier, setShippingTier } = useCart();
  const { userProfile } = useAuth();

  const [step, setStep] = useState<'address' | 'shipping' | 'payment' | 'confirmation'>('address');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);

  // Address state
  const [address, setAddress] = useState<ShippingAddress>({
    id: 'addr-default',
    fullName: userProfile?.displayName || 'Alex Mercer',
    email: userProfile?.email || 'alex.shopper@nexusstore.com',
    phone: '+1 (555) 392-8812',
    street: '742 Evergreen Terrace',
    apartment: 'Apt 4B',
    city: 'San Francisco',
    state: 'CA',
    zipCode: '94107',
    country: 'United States',
  });

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal' | 'apple_pay' | 'cod' | 'test_pay'>('card');
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('08/29');
  const [cardCVC, setCardCVC] = useState('888');
  const [cardHolder, setCardHolder] = useState(userProfile?.displayName || 'Alex Mercer');

  if (!isOpen) return null;

  const handleFillDemoAddress = () => {
    setAddress({
      id: 'addr-demo',
      fullName: 'Dr. Evelyn Reed',
      email: 'evelyn.reed@biotech.org',
      phone: '+1 (415) 890-3321',
      street: '550 Mission Street',
      apartment: 'Suite 2800',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94105',
      country: 'United States',
    });
  };

  const handleCompleteOrder = async () => {
    setIsSubmitting(true);
    try {
      const order = await orderService.createOrder({
        userId: userProfile?.uid || 'guest-user',
        customerName: address.fullName,
        customerEmail: address.email,
        customerPhone: address.phone,
        shippingAddress: address,
        items: cart,
        subtotal,
        discount: discountAmount,
        shippingFee,
        tax: taxAmount,
        total,
        paymentMethod,
        couponCode: coupon?.code,
      });

      setCreatedOrder(order);
      setStep('confirmation');
      clearCart();

      // Trigger celebratory confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#6366f1', '#38bdf8', '#10b981', '#f59e0b'],
      });
    } catch (error) {
      console.error('Order creation error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
      <div
        className="bg-white border border-slate-200 rounded-3xl w-full max-w-3xl flex flex-col shadow-2xl overflow-hidden my-auto text-slate-900 animate-scale-in"
        id="checkout-modal"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-900 flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">NexusStore Secure Checkout</h2>
              <p className="text-xs text-slate-500">Order verification & instant dispatch</p>
            </div>
          </div>

          {step !== 'confirmation' && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Stepper Progress */}
        {step !== 'confirmation' && (
          <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs">
            <button
              onClick={() => setStep('address')}
              className={`flex items-center gap-1.5 font-medium cursor-pointer ${
                step === 'address' ? 'text-slate-900 font-bold' : 'text-slate-500'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-white border border-slate-300 flex items-center justify-center text-[10px] font-bold">
                1
              </span>
              <span>Shipping</span>
            </button>

            <span className="text-slate-300">───</span>

            <button
              onClick={() => setStep('shipping')}
              className={`flex items-center gap-1.5 font-medium cursor-pointer ${
                step === 'shipping' ? 'text-slate-900 font-bold' : 'text-slate-500'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-white border border-slate-300 flex items-center justify-center text-[10px] font-bold">
                2
              </span>
              <span>Delivery Method</span>
            </button>

            <span className="text-slate-300">───</span>

            <button
              onClick={() => setStep('payment')}
              className={`flex items-center gap-1.5 font-medium cursor-pointer ${
                step === 'payment' ? 'text-slate-900 font-bold' : 'text-slate-500'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-white border border-slate-300 flex items-center justify-center text-[10px] font-bold">
                3
              </span>
              <span>Payment</span>
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto max-h-[75vh]">
          {/* STEP 1: Shipping Address */}
          {step === 'address' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-indigo-600" />
                    Delivery Destination
                  </h3>
                  <p className="text-xs text-slate-500">Where should we deliver your package?</p>
                </div>
                <button
                  type="button"
                  onClick={handleFillDemoAddress}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 text-xs font-semibold cursor-pointer"
                >
                  ⚡ Autofill Demo Address
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Recipient Full Name</label>
                  <input
                    type="text"
                    value={address.fullName}
                    onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-500"
                    placeholder="Marcus Vance"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Email (For tracking updates)</label>
                  <input
                    type="email"
                    value={address.email}
                    onChange={(e) => setAddress({ ...address, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-500"
                    placeholder="marcus@example.com"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Mobile Phone</label>
                  <input
                    type="tel"
                    value={address.phone}
                    onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-500"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Country / Region</label>
                  <input
                    type="text"
                    value={address.country}
                    onChange={(e) => setAddress({ ...address, country: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-700 font-medium mb-1">Street Address</label>
                  <input
                    type="text"
                    value={address.street}
                    onChange={(e) => setAddress({ ...address, street: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-500"
                    placeholder="123 Tech Blvd"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Apt / Suite (Optional)</label>
                  <input
                    type="text"
                    value={address.apartment}
                    onChange={(e) => setAddress({ ...address, apartment: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-500"
                    placeholder="Suite 400"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">City</label>
                  <input
                    type="text"
                    value={address.city}
                    onChange={(e) => setAddress({ ...address, city: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">State / Province</label>
                  <input
                    type="text"
                    value={address.state}
                    onChange={(e) => setAddress({ ...address, state: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">ZIP / Postal Code</label>
                  <input
                    type="text"
                    value={address.zipCode}
                    onChange={(e) => setAddress({ ...address, zipCode: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setStep('shipping')}
                  className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center gap-2 transition cursor-pointer shadow-sm"
                >
                  Continue to Delivery Method
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Shipping Method */}
          {step === 'shipping' && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-slate-700" />
                  Select Delivery Speed
                </h3>
                <p className="text-xs text-slate-500">All methods include full insurance and real-time GPS tracking</p>
              </div>

              <div className="space-y-2.5">
                <label
                  onClick={() => setShippingTier('standard')}
                  className={`p-4 rounded-2xl border flex items-center justify-between cursor-pointer transition ${
                    shippingTier === 'standard'
                      ? 'bg-slate-50 border-slate-900 ring-1 ring-slate-900/10'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${shippingTier === 'standard' ? 'border-slate-900 bg-slate-900' : 'border-slate-300'}`}>
                      {shippingTier === 'standard' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">Standard Delivery (3-5 Business Days)</p>
                      <p className="text-[11px] text-slate-500">Reliable ground shipping with tracking</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-emerald-600">
                    {subtotal >= 100 ? 'FREE' : '$7.99'}
                  </span>
                </label>

                <label
                  onClick={() => setShippingTier('express')}
                  className={`p-4 rounded-2xl border flex items-center justify-between cursor-pointer transition ${
                    shippingTier === 'express'
                      ? 'bg-slate-50 border-slate-900 ring-1 ring-slate-900/10'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${shippingTier === 'express' ? 'border-slate-900 bg-slate-900' : 'border-slate-300'}`}>
                      {shippingTier === 'express' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        Express 2-Day Air
                        <span className="text-[10px] px-1.5 py-0.2 bg-indigo-50 text-indigo-700 rounded font-semibold">Popular</span>
                      </p>
                      <p className="text-[11px] text-slate-500">Dispatched in 4 hours from priority warehouse</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-slate-900">$9.99</span>
                </label>

                <label
                  onClick={() => setShippingTier('overnight')}
                  className={`p-4 rounded-2xl border flex items-center justify-between cursor-pointer transition ${
                    shippingTier === 'overnight'
                      ? 'bg-slate-50 border-slate-900 ring-1 ring-slate-900/10'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${shippingTier === 'overnight' ? 'border-slate-900 bg-slate-900' : 'border-slate-300'}`}>
                      {shippingTier === 'overnight' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">Overnight Priority Express</p>
                      <p className="text-[11px] text-slate-500">Guaranteed next-morning arrival by 10:30 AM</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-slate-900">$19.99</span>
                </label>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep('address')}
                  className="px-4 py-2 text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1.5 cursor-pointer font-medium"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep('payment')}
                  className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center gap-2 transition cursor-pointer shadow-sm"
                >
                  Continue to Payment
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Payment */}
          {step === 'payment' && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-slate-700" />
                  Select Payment Method
                </h3>
                <p className="text-xs text-slate-500">End-to-end encrypted 256-bit tokenized checkout</p>
              </div>

              {/* Payment selector pills */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`p-3 rounded-xl border text-center transition cursor-pointer ${
                    paymentMethod === 'card'
                      ? 'bg-slate-900 border-slate-900 text-white font-semibold shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <CreditCard className="w-4 h-4 mx-auto mb-1 text-inherit" />
                  <span className="text-xs">Credit Card</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('apple_pay')}
                  className={`p-3 rounded-xl border text-center transition cursor-pointer ${
                    paymentMethod === 'apple_pay'
                      ? 'bg-slate-900 border-slate-900 text-white font-semibold shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Smartphone className="w-4 h-4 mx-auto mb-1 text-inherit" />
                  <span className="text-xs">Apple / GPay</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('cod')}
                  className={`p-3 rounded-xl border text-center transition cursor-pointer ${
                    paymentMethod === 'cod'
                      ? 'bg-slate-900 border-slate-900 text-white font-semibold shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <DollarSign className="w-4 h-4 mx-auto mb-1 text-inherit" />
                  <span className="text-xs">Cash on Delivery</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('test_pay')}
                  className={`p-3 rounded-xl border text-center transition cursor-pointer ${
                    paymentMethod === 'test_pay'
                      ? 'bg-slate-900 border-slate-900 text-white font-semibold shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Sparkles className="w-4 h-4 mx-auto mb-1 text-inherit" />
                  <span className="text-xs">1-Click Test</span>
                </button>
              </div>

              {/* Realistic Mock Credit Card Preview */}
              {paymentMethod === 'card' && (
                <div className="p-4 rounded-2xl bg-slate-900 text-white border border-slate-800 shadow-md space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-mono text-slate-200 font-bold">NEXUS VAULT CARD</span>
                    <span className="text-slate-400">VISA / MASTERCARD</span>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1">Card Number</label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-indigo-400"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[11px] text-slate-300 mb-1">Expires</label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-indigo-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-300 mb-1">CVC / CVV</label>
                      <input
                        type="text"
                        value={cardCVC}
                        onChange={(e) => setCardCVC(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-indigo-400"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Order Final Summary */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Shipping to</span>
                  <span className="text-slate-900 font-medium truncate max-w-[200px]">
                    {address.street}, {address.city}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Items total ({cart.length})</span>
                  <span className="text-slate-900 font-medium">${subtotal.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>Coupon Discount</span>
                    <span>-${discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>Shipping & Handling</span>
                  <span>{shippingFee === 0 ? 'FREE' : `$${shippingFee.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Estimated Tax</span>
                  <span>${taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                  <span>Total Amount Due</span>
                  <span className="text-slate-900 font-extrabold text-base">${total.toFixed(2)}</span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep('shipping')}
                  className="px-4 py-2 text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1.5 cursor-pointer font-medium"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleCompleteOrder}
                  className="px-8 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm flex items-center gap-2 transition cursor-pointer shadow-sm disabled:opacity-50"
                  id="submit-order-btn"
                >
                  <ShieldCheck className="w-4 h-4" />
                  {isSubmitting ? 'Processing Payment...' : `Pay & Place Order ($${total.toFixed(2)})`}
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Confirmation & Celebration */}
          {step === 'confirmation' && createdOrder && (
            <div className="py-6 text-center space-y-6 animate-scale-in">
              <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200 shadow-xs">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <h3 className="text-2xl font-black text-slate-900">Order Confirmed!</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Thank you, <strong className="text-slate-800">{createdOrder.customerName}</strong>. Your payment was verified and order dispatch is initiated.
                </p>
              </div>

              {/* Order Numbers Pill */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 max-w-md mx-auto space-y-2 text-xs text-left">
                <div className="flex justify-between">
                  <span className="text-slate-500">Order Number:</span>
                  <span className="font-mono font-bold text-slate-900">{createdOrder.orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Carrier Tracking ID:</span>
                  <span className="font-mono font-bold text-indigo-600">{createdOrder.trackingNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Carrier:</span>
                  <span className="font-medium text-slate-800">{createdOrder.carrier}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Estimated Delivery:</span>
                  <span className="font-semibold text-emerald-600">{createdOrder.estimatedDelivery}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => {
                    onClose();
                    onOrderSuccess(createdOrder);
                  }}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
                  id="track-order-success-btn"
                >
                  <Truck className="w-4 h-4" />
                  Track Shipment in Real-Time
                </button>

                <button
                  onClick={onClose}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold text-xs transition cursor-pointer"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

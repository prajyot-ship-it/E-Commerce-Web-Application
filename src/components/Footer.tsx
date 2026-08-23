import React from 'react';
import { ShoppingBag, ShieldCheck, Truck, RotateCcw, Headphones, Heart } from 'lucide-react';

interface FooterProps {
  onNavigate: (view: 'shop' | 'tracking' | 'orders' | 'admin') => void;
  onSelectCategory: (cat: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onSelectCategory }) => {
  return (
    <footer className="bg-white border-t border-slate-200 text-slate-600 text-xs mt-auto">
      {/* Value props banner */}
      <div className="border-b border-slate-100 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-sm">Free Express Shipping</p>
              <p className="text-slate-500 text-xs">On all US orders over $100</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-sm">2-Year Warranty</p>
              <p className="text-slate-500 text-xs">Full replacement hardware guarantee</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 flex items-center justify-center shrink-0">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-sm">30-Day Hassle-Free Returns</p>
              <p className="text-slate-500 text-xs">Instant prepaid return labels</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 flex items-center justify-center shrink-0">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-sm">24/7 Expert Support</p>
              <p className="text-slate-500 text-xs">Real audio and hardware engineers</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main footer link matrix */}
      <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-8">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-slate-900 flex items-center justify-center text-white">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <span className="font-bold text-slate-900 text-sm">NexusStore</span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            The next-generation e-commerce platform engineered for modern electronics, high-fidelity audio, and workspace technology.
          </p>
        </div>

        <div>
          <h4 className="font-bold text-slate-900 mb-3 uppercase tracking-wider text-[11px]">Store Catalog</h4>
          <ul className="space-y-2 text-xs">
            <li>
              <button
                onClick={() => {
                  onNavigate('shop');
                  onSelectCategory('electronics');
                }}
                className="hover:text-slate-900 transition cursor-pointer"
              >
                Electronics & Displays
              </button>
            </li>
            <li>
              <button
                onClick={() => {
                  onNavigate('shop');
                  onSelectCategory('audio');
                }}
                className="hover:text-slate-900 transition cursor-pointer"
              >
                Spatial & Studio Audio
              </button>
            </li>
            <li>
              <button
                onClick={() => {
                  onNavigate('shop');
                  onSelectCategory('wearables');
                }}
                className="hover:text-slate-900 transition cursor-pointer"
              >
                Smart Wearables & Rings
              </button>
            </li>
            <li>
              <button
                onClick={() => {
                  onNavigate('shop');
                  onSelectCategory('accessories');
                }}
                className="hover:text-slate-900 transition cursor-pointer"
              >
                Custom Keyboards & Gear
              </button>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold text-slate-900 mb-3 uppercase tracking-wider text-[11px]">Customer Care</h4>
          <ul className="space-y-2 text-xs">
            <li>
              <button onClick={() => onNavigate('tracking')} className="hover:text-slate-900 transition cursor-pointer">
                Track Live Order
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('orders')} className="hover:text-slate-900 transition cursor-pointer">
                My Purchase History
              </button>
            </li>
            <li>
              <span className="text-slate-400">Shipping Policy (3-5 Days)</span>
            </li>
            <li>
              <span className="text-slate-400">Warranty Registration</span>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold text-slate-900 mb-3 uppercase tracking-wider text-[11px]">Admin & System</h4>
          <ul className="space-y-2 text-xs">
            <li>
              <button onClick={() => onNavigate('admin')} className="hover:text-indigo-600 transition cursor-pointer">
                Admin Management Portal
              </button>
            </li>
            <li>
              <span className="text-slate-400">Firestore Cloud Database</span>
            </li>
            <li>
              <span className="text-slate-400">Role-Based Access Control</span>
            </li>
            <li>
              <span className="text-slate-400">Real-Time Inventory Sync</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-100 py-6 px-4 text-center text-[11px] text-slate-500 flex flex-col sm:flex-row items-center justify-between max-w-7xl mx-auto">
        <p>© 2026 NexusStore, Inc. All rights reserved. Powered by Firebase Firestore.</p>
        <p className="mt-2 sm:mt-0 flex items-center gap-1">
          Crafted with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline" /> for modern web commerce.
        </p>
      </div>
    </footer>
  );
};

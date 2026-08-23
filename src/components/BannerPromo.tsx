import React, { useState } from 'react';
import { Sparkles, Copy, Check, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';

interface BannerPromoProps {
  onExploreDeals: () => void;
}

export const BannerPromo: React.FC<BannerPromoProps> = ({ onExploreDeals }) => {
  const [copied, setCopied] = useState(false);
  const { applyCoupon } = useCart();

  const handleCopy = () => {
    navigator.clipboard?.writeText('PROMO20');
    applyCoupon('PROMO20');
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="bg-slate-900 text-white text-xs sm:text-sm py-2 px-4 border-b border-slate-800">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white/10 text-indigo-300">
            <Sparkles className="w-3.5 h-3.5" />
          </span>
          <span className="font-normal text-slate-200">
            Summer Tech Fest: <span className="text-white font-semibold">20% OFF</span> orders over $150 with code
          </span>
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/15 hover:bg-white/25 text-white font-mono text-xs transition cursor-pointer border border-white/20"
            title="Click to copy & apply"
          >
            PROMO20
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <span className="hidden md:inline text-slate-400">Free Express Shipping on orders over $100</span>
          <button
            onClick={onExploreDeals}
            className="text-slate-300 hover:text-white font-medium inline-flex items-center gap-1 transition cursor-pointer"
          >
            Explore Deals <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

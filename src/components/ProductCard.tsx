import React, { useState } from 'react';
import { Star, ShoppingBag, Eye, Check, AlertCircle, Layers } from 'lucide-react';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { useCompare } from '../context/CompareContext';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onSelect }) => {
  const { addToCart } = useCart();
  const { isInCompare, toggleCompare } = useCompare();
  const [isHovered, setIsHovered] = useState(false);
  const [addedRecently, setAddedRecently] = useState(false);

  const isCompared = isInCompare(product.id);

  const discountPercent =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : null;

  const isLowStock = product.stock > 0 && product.stock <= 5;
  const isOutOfStock = product.stock <= 0;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock) return;
    addToCart(product, 1);
    setAddedRecently(true);
    setTimeout(() => setAddedRecently(false), 2000);
  };

  const handleToggleCompare = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleCompare(product);
  };

  return (
    <div
      onClick={() => onSelect(product)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group bg-white border border-slate-200 hover:border-slate-300 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-md flex flex-col cursor-pointer relative"
      id={`product-card-${product.id}`}
    >
      {/* Product Image Container */}
      <div className="relative w-full pt-[75%] bg-slate-100 overflow-hidden">
        <img
          src={isHovered && product.images[1] ? product.images[1] : product.images[0]}
          alt={product.title}
          className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Badges Overlay */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {discountPercent && (
            <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-500 text-white shadow-xs tracking-tight">
              -{discountPercent}% OFF
            </span>
          )}
          {product.featured && (
            <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-900 text-white shadow-xs">
              Featured
            </span>
          )}
        </div>

        {/* Stock status indicator badge & Compare quick button */}
        <div className="absolute top-3 right-3 z-10 flex flex-col items-end gap-1.5">
          {isOutOfStock ? (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1 backdrop-blur-xs">
              <AlertCircle className="w-3 h-3" /> Sold Out
            </span>
          ) : isLowStock ? (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1 backdrop-blur-xs animate-pulse">
              Only {product.stock} left
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 backdrop-blur-xs">
              In Stock
            </span>
          )}

          {/* Quick Compare Action Pill */}
          <button
            type="button"
            onClick={handleToggleCompare}
            title={isCompared ? 'Remove from compare' : 'Add to compare (up to 3)'}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 shadow-sm transition-all cursor-pointer backdrop-blur-md ${
              isCompared
                ? 'bg-indigo-600 text-white border border-indigo-500 ring-2 ring-indigo-600/30'
                : 'bg-white/90 hover:bg-white text-slate-700 border border-slate-200 hover:text-indigo-600'
            }`}
            id={`compare-toggle-${product.id}`}
          >
            <Layers className="w-3 h-3" />
            <span>{isCompared ? 'Comparing' : 'Compare'}</span>
          </button>
        </div>

        {/* Hover Quick View Trigger */}
        <div className="absolute inset-0 bg-slate-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2 pointer-events-none">
          <span className="px-3.5 py-1.5 rounded-xl bg-white/95 text-slate-900 text-xs font-semibold flex items-center gap-1.5 shadow-md border border-slate-200 backdrop-blur-xs">
            <Eye className="w-3.5 h-3.5 text-slate-600" />
            Quick View
          </span>
        </div>
      </div>

      {/* Product Details Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Category & Rating */}
          <div className="flex items-center justify-between text-xs mb-1.5 text-slate-500">
            <span className="uppercase tracking-wider font-semibold text-[10px] text-indigo-600">
              {product.category}
            </span>
            <div className="flex items-center gap-1 text-amber-500 font-medium">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span className="text-slate-700 text-xs font-semibold">{product.rating}</span>
              <span className="text-slate-400 text-[11px]">({product.ratingCount})</span>
            </div>
          </div>

          {/* Title */}
          <h3 className="font-semibold text-slate-900 text-sm line-clamp-2 mb-1.5 group-hover:text-indigo-600 transition-colors">
            {product.title}
          </h3>

          {/* Description snippet */}
          <p className="text-xs text-slate-500 line-clamp-2 mb-3">
            {product.description}
          </p>
        </div>

        {/* Price & Action Row */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 mt-auto">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-bold text-slate-900 tracking-tight">
                ${product.price.toFixed(2)}
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-xs text-slate-400 line-through">
                  ${product.originalPrice.toFixed(2)}
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-500">Free delivery eligible</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleQuickAdd}
              disabled={isOutOfStock}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 cursor-pointer shadow-xs ${
                isOutOfStock
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                  : addedRecently
                  ? 'bg-emerald-600 text-white scale-95'
                  : 'bg-slate-900 hover:bg-slate-800 text-white active:scale-95'
              }`}
              id={`quick-add-${product.id}`}
              title={isOutOfStock ? 'Product out of stock' : 'Add to cart'}
            >
              {addedRecently ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Added
                </>
              ) : isOutOfStock ? (
                'Sold Out'
              ) : (
                <>
                  <ShoppingBag className="w-3.5 h-3.5" />
                  Add
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

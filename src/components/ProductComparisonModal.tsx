import React, { useState, useMemo } from 'react';
import {
  X,
  Star,
  ShoppingBag,
  Check,
  AlertCircle,
  Plus,
  Trash2,
  ExternalLink,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Truck,
  RotateCcw,
  Tag,
  Layers,
  Search,
} from 'lucide-react';
import { Product } from '../types';
import { useCompare } from '../context/CompareContext';
import { useCart } from '../context/CartContext';
import { SAMPLE_PRODUCTS } from '../data/sampleProducts';

interface ProductComparisonModalProps {
  allProducts?: Product[];
  onSelectProduct: (product: Product) => void;
}

export const ProductComparisonModal: React.FC<ProductComparisonModalProps> = ({
  allProducts = [],
  onSelectProduct,
}) => {
  const {
    comparedProducts,
    removeFromCompare,
    clearCompare,
    addToCompare,
    isCompareModalOpen,
    setIsCompareModalOpen,
  } = useCompare();

  const { addToCart } = useCart();
  const [highlightDifferences, setHighlightDifferences] = useState(false);
  const [isAddingSlotOpen, setIsAddingSlotOpen] = useState(false);
  const [slotSearchQuery, setSlotSearchQuery] = useState('');
  const [addedToast, setAddedToast] = useState<string | null>(null);

  // Close modal helper
  const handleClose = () => {
    setIsCompareModalOpen(false);
    setIsAddingSlotOpen(false);
    setSlotSearchQuery('');
  };

  const handleAddToCart = (product: Product) => {
    if (product.stock <= 0) return;
    addToCart(product, 1);
    setAddedToast(`Added ${product.title} to your cart!`);
    setTimeout(() => setAddedToast(null), 3000);
  };

  const handleViewDetail = (product: Product) => {
    handleClose();
    onSelectProduct(product);
  };

  // Compile all unique specification names across the compared products
  const allSpecNames = useMemo(() => {
    const specSet = new Set<string>();
    comparedProducts.forEach((p) => {
      p.specs?.forEach((s) => {
        if (s.name) specSet.add(s.name.trim());
      });
    });
    return Array.from(specSet);
  }, [comparedProducts]);

  // Determine lowest price and highest rating among compared items
  const bestMetrics = useMemo(() => {
    if (comparedProducts.length === 0) return { minPriceId: null, maxRatingId: null };

    let minPrice = Infinity;
    let minPriceId: string | null = null;
    let maxRating = -1;
    let maxRatingId: string | null = null;

    comparedProducts.forEach((p) => {
      if (p.price < minPrice) {
        minPrice = p.price;
        minPriceId = p.id;
      }
      if (p.rating > maxRating) {
        maxRating = p.rating;
        maxRatingId = p.id;
      }
    });

    return { minPriceId, maxRatingId };
  }, [comparedProducts]);

  // Candidates for quick-add slot
  const candidateProducts = useMemo(() => {
    const pool = allProducts && allProducts.length > 0 ? allProducts : SAMPLE_PRODUCTS;
    const comparedIds = new Set(comparedProducts.map((p) => p.id));
    return (pool || [])
      .filter((p) => !comparedIds.has(p.id))
      .filter((p) => {
        if (!slotSearchQuery.trim()) return true;
        const q = slotSearchQuery.toLowerCase();
        return (
          p.title.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.tags?.some((t) => t.toLowerCase().includes(q))
        );
      })
      .slice(0, 8);
  }, [allProducts, comparedProducts, slotSearchQuery]);

  if (!isCompareModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div
        className="bg-white border border-slate-200 rounded-3xl w-full max-w-6xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden relative animate-scale-in my-auto text-slate-900"
        id="product-comparison-modal"
      >
        {/* Header Bar */}
        <div className="px-5 sm:px-8 py-4 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                  Product Comparison
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {comparedProducts.length} of 3 items
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Compare technical specifications, price points, and verified ratings side-by-side
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Highlight Differences toggle */}
            {comparedProducts.length > 1 && (
              <button
                type="button"
                onClick={() => setHighlightDifferences(!highlightDifferences)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition cursor-pointer border ${
                  highlightDifferences
                    ? 'bg-amber-50 border-amber-300 text-amber-900 font-semibold'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
                title="Highlight rows where products differ"
              >
                <Sparkles className={`w-3.5 h-3.5 ${highlightDifferences ? 'text-amber-500 fill-amber-500' : 'text-slate-400'}`} />
                <span>Highlight Differences</span>
              </button>
            )}

            {/* Clear All */}
            {comparedProducts.length > 0 && (
              <button
                type="button"
                onClick={clearCompare}
                className="px-3 py-1.5 rounded-xl text-xs font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition cursor-pointer flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Clear All</span>
              </button>
            )}

            {/* Close */}
            <button
              type="button"
              onClick={handleClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition cursor-pointer"
              id="close-compare-modal-btn"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Main Scrollable Content */}
        <div className="overflow-y-auto p-4 sm:p-6 md:p-8 flex-1 space-y-6">
          {comparedProducts.length === 0 ? (
            /* Empty state */
            <div className="p-12 text-center rounded-3xl bg-slate-50 border border-slate-200 space-y-4 max-w-md mx-auto my-8">
              <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 text-slate-400 flex items-center justify-center mx-auto shadow-xs">
                <Layers className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">No products selected for comparison</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Browse the catalog and click "Compare" on any product to examine features side-by-side.
                </p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs cursor-pointer"
              >
                Browse Catalog
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[680px]">
                {/* 1. Header Grid - Product Cards Overview */}
                <div
                  className="grid gap-4 items-stretch pb-6 border-b border-slate-200"
                  style={{
                    gridTemplateColumns: `200px repeat(${Math.max(1, comparedProducts.length)}, minmax(220px, 1fr)) ${
                      comparedProducts.length < 3 ? 'minmax(180px, 1fr)' : ''
                    }`,
                  }}
                >
                  {/* Left Label Column */}
                  <div className="flex flex-col justify-end p-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Product Overview
                    </span>
                    <span className="text-sm font-semibold text-slate-700 mt-1">
                      Side-by-Side Review
                    </span>
                  </div>

                  {/* Compared Product Columns */}
                  {comparedProducts.map((prod) => {
                    const isBestPrice = bestMetrics.minPriceId === prod.id && comparedProducts.length > 1;
                    const isBestRating = bestMetrics.maxRatingId === prod.id && comparedProducts.length > 1;

                    return (
                      <div
                        key={prod.id}
                        className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between relative shadow-xs group"
                        id={`compare-card-${prod.id}`}
                      >
                        {/* Remove button */}
                        <button
                          type="button"
                          onClick={() => removeFromCompare(prod.id)}
                          className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition cursor-pointer z-10"
                          title="Remove from comparison"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>

                        {/* Badges */}
                        <div className="flex flex-wrap gap-1 mb-2 pr-6">
                          {isBestPrice && (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200 flex items-center gap-1">
                              <Tag className="w-2.5 h-2.5" /> Lowest Price
                            </span>
                          )}
                          {isBestRating && (
                            <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200 flex items-center gap-1">
                              <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" /> Top Rated
                            </span>
                          )}
                        </div>

                        {/* Image */}
                        <div
                          onClick={() => handleViewDetail(prod)}
                          className="relative aspect-4/3 rounded-xl overflow-hidden bg-slate-100 border border-slate-100 mb-3 cursor-pointer group-hover:opacity-95"
                        >
                          <img
                            src={prod.images[0]}
                            alt={prod.title}
                            className="w-full h-full object-cover object-center group-hover:scale-105 transition duration-300"
                          />
                        </div>

                        {/* Meta */}
                        <div className="space-y-1 flex-1">
                          <span className="text-[10px] font-semibold text-indigo-600 uppercase tracking-wider">
                            {prod.category}
                          </span>
                          <h4
                            onClick={() => handleViewDetail(prod)}
                            className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-2 hover:text-indigo-600 transition cursor-pointer"
                          >
                            {prod.title}
                          </h4>
                          <div className="flex items-center gap-1 text-xs text-amber-500 font-semibold pt-0.5">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            <span>{prod.rating.toFixed(1)}</span>
                            <span className="text-[11px] text-slate-400 font-normal">
                              ({prod.ratingCount} reviews)
                            </span>
                          </div>
                        </div>

                        {/* Price & CTA */}
                        <div className="pt-3 mt-3 border-t border-slate-100 space-y-2">
                          <div className="flex items-baseline gap-2">
                            <span className="text-xl font-extrabold text-slate-900 tracking-tight">
                              ${prod.price.toFixed(2)}
                            </span>
                            {prod.originalPrice && prod.originalPrice > prod.price && (
                              <span className="text-xs text-slate-400 line-through">
                                ${prod.originalPrice.toFixed(2)}
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleAddToCart(prod)}
                              disabled={prod.stock <= 0}
                              className="w-full py-2 px-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-40"
                              id={`compare-add-cart-${prod.id}`}
                            >
                              <ShoppingBag className="w-3.5 h-3.5" />
                              <span>Add</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleViewDetail(prod)}
                              className="w-full py-2 px-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold flex items-center justify-center gap-1 transition cursor-pointer"
                              id={`compare-view-${prod.id}`}
                            >
                              <span>Details</span>
                              <ExternalLink className="w-3 h-3 text-slate-400" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Add Product Slot if < 3 items */}
                  {comparedProducts.length < 3 && (
                    <div className="border-2 border-dashed border-slate-200 hover:border-slate-300 rounded-2xl p-4 flex flex-col items-center justify-center text-center bg-slate-50/50 min-h-[300px]">
                      {!isAddingSlotOpen ? (
                        <div className="space-y-3">
                          <div className="w-10 h-10 rounded-full bg-white border border-slate-200 text-slate-400 flex items-center justify-center mx-auto shadow-xs">
                            <Plus className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800">Add Another Item</p>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              Compare up to 3 products simultaneously
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setIsAddingSlotOpen(true)}
                            className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 text-xs font-semibold shadow-xs transition cursor-pointer"
                            id="add-comparison-slot-btn"
                          >
                            + Select Product
                          </button>
                        </div>
                      ) : (
                        <div className="w-full space-y-3 text-left">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-900">Choose Product</span>
                            <button
                              type="button"
                              onClick={() => setIsAddingSlotOpen(false)}
                              className="text-slate-400 hover:text-slate-600"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="relative">
                            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              placeholder="Search products..."
                              value={slotSearchQuery}
                              onChange={(e) => setSlotSearchQuery(e.target.value)}
                              className="w-full pl-8 pr-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-indigo-500"
                            />
                          </div>

                          <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                            {candidateProducts.map((cand) => (
                              <button
                                key={cand.id}
                                type="button"
                                onClick={() => {
                                  addToCompare(cand);
                                  setIsAddingSlotOpen(false);
                                  setSlotSearchQuery('');
                                }}
                                className="w-full p-1.5 rounded-lg bg-white hover:bg-indigo-50 border border-slate-200 flex items-center gap-2 text-left transition cursor-pointer group"
                              >
                                <img
                                  src={cand.images[0]}
                                  alt=""
                                  className="w-8 h-8 rounded-md object-cover shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-[11px] font-semibold text-slate-900 truncate group-hover:text-indigo-600">
                                    {cand.title}
                                  </p>
                                  <p className="text-[10px] text-slate-500">${cand.price.toFixed(2)}</p>
                                </div>
                                <Plus className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 2. Structured Comparison Table Sections */}
                <div className="space-y-6 pt-6">
                  {/* Category & General Section */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-2 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5" /> Pricing & Availability
                    </h3>

                    <div className="bg-slate-50/70 border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-200 text-xs">
                      {/* Price Row */}
                      <ComparisonRow
                        label="Regular Price"
                        highlight={highlightDifferences}
                        isDifferent={
                          new Set(comparedProducts.map((p) => p.price)).size > 1
                        }
                        values={comparedProducts.map((p) => (
                          <span
                            key={p.id}
                            className={`font-bold ${
                              bestMetrics.minPriceId === p.id && comparedProducts.length > 1
                                ? 'text-emerald-600'
                                : 'text-slate-900'
                            }`}
                          >
                            ${p.price.toFixed(2)}
                            {bestMetrics.minPriceId === p.id && comparedProducts.length > 1 && (
                              <span className="ml-1 text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-semibold">
                                Best
                              </span>
                            )}
                          </span>
                        ))}
                      />

                      {/* Original MSRP Row */}
                      <ComparisonRow
                        label="MSRP / Original Price"
                        highlight={highlightDifferences}
                        isDifferent={
                          new Set(comparedProducts.map((p) => p.originalPrice || p.price)).size > 1
                        }
                        values={comparedProducts.map((p) => (
                          <span key={p.id} className="text-slate-600">
                            {p.originalPrice ? `$${p.originalPrice.toFixed(2)}` : 'Standard'}
                          </span>
                        ))}
                      />

                      {/* Discount % */}
                      <ComparisonRow
                        label="Savings & Discount"
                        highlight={highlightDifferences}
                        isDifferent={
                          new Set(
                            comparedProducts.map((p) =>
                              p.originalPrice ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100) : 0
                            )
                          ).size > 1
                        }
                        values={comparedProducts.map((p) => {
                          const disc =
                            p.originalPrice && p.originalPrice > p.price
                              ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)
                              : 0;
                          return (
                            <span key={p.id}>
                              {disc > 0 ? (
                                <span className="font-semibold text-rose-600">-{disc}% OFF</span>
                              ) : (
                                <span className="text-slate-400">Regular</span>
                              )}
                            </span>
                          );
                        })}
                      />

                      {/* Inventory Stock Status */}
                      <ComparisonRow
                        label="Availability"
                        highlight={highlightDifferences}
                        isDifferent={
                          new Set(comparedProducts.map((p) => (p.stock <= 0 ? 'out' : p.stock <= 5 ? 'low' : 'in'))).size > 1
                        }
                        values={comparedProducts.map((p) => {
                          if (p.stock <= 0) {
                            return (
                              <span key={p.id} className="text-rose-600 font-semibold flex items-center gap-1">
                                <AlertCircle className="w-3.5 h-3.5" /> Out of stock
                              </span>
                            );
                          }
                          if (p.stock <= 5) {
                            return (
                              <span key={p.id} className="text-amber-600 font-semibold flex items-center gap-1">
                                <AlertCircle className="w-3.5 h-3.5" /> Low Stock ({p.stock} left)
                              </span>
                            );
                          }
                          return (
                            <span key={p.id} className="text-emerald-600 font-semibold flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" /> In Stock ({p.stock} units)
                            </span>
                          );
                        })}
                      />

                      {/* SKU */}
                      <ComparisonRow
                        label="Product SKU"
                        highlight={false}
                        isDifferent={false}
                        values={comparedProducts.map((p) => (
                          <span key={p.id} className="font-mono text-slate-500">
                            {p.sku || 'N/A'}
                          </span>
                        ))}
                      />
                    </div>
                  </div>

                  {/* Customer Sentiment & Ratings */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-2 flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5" /> Customer Ratings & Reviews
                    </h3>

                    <div className="bg-slate-50/70 border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-200 text-xs">
                      {/* Overall Rating */}
                      <ComparisonRow
                        label="Average Rating"
                        highlight={highlightDifferences}
                        isDifferent={
                          new Set(comparedProducts.map((p) => p.rating)).size > 1
                        }
                        values={comparedProducts.map((p) => (
                          <div key={p.id} className="flex items-center gap-1.5">
                            <div className="flex items-center text-amber-500">
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                              <span className="font-bold text-slate-900 ml-1">
                                {p.rating.toFixed(1)}
                              </span>
                            </div>
                            <span className="text-slate-400 text-[11px]">/ 5.0</span>
                            {bestMetrics.maxRatingId === p.id && comparedProducts.length > 1 && (
                              <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-semibold ml-1">
                                Highest
                              </span>
                            )}
                          </div>
                        ))}
                      />

                      {/* Total Review Count */}
                      <ComparisonRow
                        label="Verified Reviews"
                        highlight={highlightDifferences}
                        isDifferent={
                          new Set(comparedProducts.map((p) => p.ratingCount)).size > 1
                        }
                        values={comparedProducts.map((p) => (
                          <span key={p.id} className="font-medium text-slate-700">
                            {p.ratingCount} reviews
                          </span>
                        ))}
                      />

                      {/* Recommendation % */}
                      <ComparisonRow
                        label="Customer Recommendation"
                        highlight={highlightDifferences}
                        isDifferent={false}
                        values={comparedProducts.map((p) => {
                          const pct = Math.min(99, Math.max(88, Math.round(p.rating * 19.5)));
                          return (
                            <span key={p.id} className="text-emerald-700 font-semibold flex items-center gap-1">
                              <Check className="w-3 h-3 text-emerald-600" />
                              {pct}% recommend
                            </span>
                          );
                        })}
                      />
                    </div>
                  </div>

                  {/* Technical Specifications Matrix */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-2 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5" /> Technical Specifications
                    </h3>

                    {allSpecNames.length === 0 ? (
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 text-center">
                        Standard specifications apply. Check individual product pages for detailed manuals.
                      </div>
                    ) : (
                      <div className="bg-slate-50/70 border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-200 text-xs">
                        {allSpecNames.map((specName) => {
                          const specValues = comparedProducts.map((p) => {
                            const found = p.specs?.find(
                              (s) => s.name.trim().toLowerCase() === specName.trim().toLowerCase()
                            );
                            return found ? found.value : null;
                          });

                          const uniqueValues = new Set(specValues.filter(Boolean));
                          const isDifferent = uniqueValues.size > 1 || specValues.some((v) => v === null);

                          return (
                            <ComparisonRow
                              key={specName}
                              label={specName}
                              highlight={highlightDifferences}
                              isDifferent={isDifferent}
                              values={comparedProducts.map((p, idx) => (
                                <span
                                  key={p.id}
                                  className={
                                    specValues[idx]
                                      ? 'text-slate-800 font-medium'
                                      : 'text-slate-400 italic'
                                  }
                                >
                                  {specValues[idx] || '—'}
                                </span>
                              ))}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Services & Guarantees */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-2 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5" /> Guarantees & Shipping
                    </h3>

                    <div className="bg-slate-50/70 border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-200 text-xs">
                      <ComparisonRow
                        label="Warranty Protection"
                        highlight={false}
                        isDifferent={false}
                        values={comparedProducts.map((p) => (
                          <span key={p.id} className="text-slate-700 flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-slate-500" /> 2 Years Hardware
                          </span>
                        ))}
                      />
                      <ComparisonRow
                        label="Shipping Dispatch"
                        highlight={false}
                        isDifferent={false}
                        values={comparedProducts.map((p) => (
                          <span key={p.id} className="text-slate-700 flex items-center gap-1">
                            <Truck className="w-3.5 h-3.5 text-slate-500" /> Free 2-3 Day Express
                          </span>
                        ))}
                      />
                      <ComparisonRow
                        label="Returns Policy"
                        highlight={false}
                        isDifferent={false}
                        values={comparedProducts.map((p) => (
                          <span key={p.id} className="text-slate-700 flex items-center gap-1">
                            <RotateCcw className="w-3.5 h-3.5 text-slate-500" /> 30-Day Money Back
                          </span>
                        ))}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Sticky Bar */}
        <div className="px-5 sm:px-8 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-4 shrink-0">
          <span className="text-xs text-slate-500">
            Tip: You can select up to 3 products from any category to compare side by side.
          </span>
          <button
            type="button"
            onClick={handleClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition shadow-xs cursor-pointer"
          >
            Close Comparison
          </button>
        </div>

        {/* Live Notification Toast inside modal */}
        {addedToast && (
          <div className="absolute bottom-16 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-xl border border-slate-700 text-xs flex items-center gap-2 animate-slide-up">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{addedToast}</span>
          </div>
        )}
      </div>
    </div>
  );
};

interface ComparisonRowProps {
  label: string;
  values: React.ReactNode[];
  highlight: boolean;
  isDifferent: boolean;
}

const ComparisonRow: React.FC<ComparisonRowProps> = ({
  label,
  values,
  highlight,
  isDifferent,
}) => {
  return (
    <div
      className={`grid items-center px-4 py-3 transition-colors ${
        highlight && isDifferent ? 'bg-amber-50/60' : 'hover:bg-slate-100/50'
      }`}
      style={{
        gridTemplateColumns: `200px repeat(${values.length}, minmax(220px, 1fr))`,
      }}
    >
      <div className="font-semibold text-slate-600 pr-4 flex items-center gap-1.5">
        <span>{label}</span>
        {highlight && isDifferent && (
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" title="Different between items" />
        )}
      </div>
      {values.map((val, idx) => (
        <div key={idx} className="pr-4">
          {val}
        </div>
      ))}
    </div>
  );
};

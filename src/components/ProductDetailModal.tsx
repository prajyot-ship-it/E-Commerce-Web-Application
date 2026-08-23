import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  Star,
  ShoppingBag,
  Zap,
  Shield,
  Truck,
  RotateCcw,
  Check,
  AlertCircle,
  Plus,
  Minus,
  MessageSquarePlus,
  ThumbsUp,
  LogIn,
  SlidersHorizontal,
  Sparkles,
  ChevronDown,
  ArrowRight,
  Layers,
} from 'lucide-react';
import { Product, Review } from '../types';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useCompare } from '../context/CompareContext';
import { productService } from '../services/productService';
import { SAMPLE_PRODUCTS } from '../data/sampleProducts';

interface ProductDetailModalProps {
  product: Product | null;
  allProducts?: Product[];
  onSelectProduct?: (product: Product) => void;
  onClose: () => void;
  onInstantCheckout?: (product: Product, quantity: number) => void;
  onOpenAuth?: () => void;
}

type SortOption = 'newest' | 'highest' | 'lowest' | 'helpful';

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  allProducts = [],
  onSelectProduct,
  onClose,
  onInstantCheckout,
  onOpenAuth,
}) => {
  const modalScrollRef = useRef<HTMLDivElement>(null);
  const { addToCart, openCart } = useCart();
  const { userProfile, currentUser } = useAuth();
  const { isInCompare, toggleCompare, openCompareModal, comparedProducts } = useCompare();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'overview' | 'specs' | 'reviews'>('overview');
  
  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [showAddReview, setShowAddReview] = useState(false);
  const [selectedStarFilter, setSelectedStarFilter] = useState<number | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  
  // Review form state
  const [newRating, setNewRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [recommend, setRecommend] = useState<boolean>(true);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [helpfulVotedIds, setHelpfulVotedIds] = useState<string[]>([]);

  // Check if current user is logged in
  const isAuthenticated = Boolean(userProfile || currentUser);

  // Subscribe to real-time reviews for this product
  useEffect(() => {
    if (product) {
      setSelectedImageIndex(0);
      setQuantity(1);
      setShowAddReview(false);
      setSelectedStarFilter('all');
      setFormError(null);
      setIsLoadingReviews(true);

      const unsub = productService.subscribeToProductReviews(product.id, (freshReviews) => {
        setReviews(freshReviews);
        setIsLoadingReviews(false);
      });

      return () => unsub();
    }
  }, [product]);

  // Derived rating metrics
  const {
    averageRating,
    totalReviewCount,
    ratingDistribution,
    recommendPercentage,
  } = useMemo(() => {
    if (!product) {
      return {
        averageRating: 5.0,
        totalReviewCount: 0,
        ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        recommendPercentage: 100,
      };
    }

    if (reviews.length === 0) {
      return {
        averageRating: product.rating || 5.0,
        totalReviewCount: product.ratingCount || 0,
        ratingDistribution: {
          5: Math.round((product.ratingCount || 0) * 0.75),
          4: Math.round((product.ratingCount || 0) * 0.20),
          3: Math.round((product.ratingCount || 0) * 0.05),
          2: 0,
          1: 0,
        },
        recommendPercentage: 96,
      };
    }

    const dist: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let sum = 0;
    let recommendCount = 0;

    reviews.forEach((r) => {
      const rounded = Math.min(5, Math.max(1, Math.round(r.rating)));
      dist[rounded] = (dist[rounded] || 0) + 1;
      sum += r.rating;
      if (r.recommend !== false) {
        recommendCount++;
      }
    });

    const avg = Number((sum / reviews.length).toFixed(1));
    const recPct = Math.round((recommendCount / reviews.length) * 100);

    return {
      averageRating: avg,
      totalReviewCount: reviews.length,
      ratingDistribution: dist,
      recommendPercentage: recPct,
    };
  }, [product, reviews]);

  // Filtered and sorted reviews
  const displayedReviews = useMemo(() => {
    let list = [...reviews];

    // Filter by star rating
    if (selectedStarFilter !== 'all') {
      list = list.filter((r) => Math.round(r.rating) === selectedStarFilter);
    }

    // Sort
    switch (sortBy) {
      case 'newest':
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'highest':
        list.sort((a, b) => b.rating - a.rating);
        break;
      case 'lowest':
        list.sort((a, b) => a.rating - b.rating);
        break;
      case 'helpful':
        list.sort((a, b) => (b.helpfulCount || 0) - (a.helpfulCount || 0));
        break;
    }

    return list;
  }, [reviews, selectedStarFilter, sortBy]);

  // Basic Similarity Algorithm to find Related Products
  // Weights: Same Category (dominant 50%), Shared Tags Jaccard (30%), Price Proximity (15%), Rating/Popularity (5%)
  const relatedProducts = useMemo(() => {
    if (!product) return [];

    const pool = allProducts && allProducts.length > 0 ? allProducts : SAMPLE_PRODUCTS;
    const candidates = pool.filter((p) => p.id !== product.id);

    const currentCat = (product.category || '').toLowerCase().trim();
    const currentTags = (product.tags || []).map((t) => t.toLowerCase().trim());
    const currentPrice = product.price || 1;

    const scored = candidates.map((cand) => {
      let score = 0;
      const candCat = (cand.category || '').toLowerCase().trim();
      const candTags = (cand.tags || []).map((t) => t.toLowerCase().trim());
      const candPrice = cand.price || 1;

      // 1. Same Category bonus (50 pts for exact category match)
      const isSameCategory = candCat === currentCat;
      if (isSameCategory) {
        score += 50;
      }

      // 2. Tag Jaccard similarity (Up to 30 pts)
      const sharedTags = currentTags.filter((t) => candTags.includes(t));
      const totalUniqueTags = new Set([...currentTags, ...candTags]).size;
      const tagSimilarity = totalUniqueTags > 0 ? sharedTags.length / totalUniqueTags : 0;
      score += tagSimilarity * 30;

      // 3. Price proximity score (Up to 15 pts)
      const maxPrice = Math.max(candPrice, currentPrice, 1);
      const priceDiffRatio = Math.abs(candPrice - currentPrice) / maxPrice;
      const priceScore = Math.max(0, (1 - priceDiffRatio) * 15);
      score += priceScore;

      // 4. Rating & review volume boost (Up to 5 pts)
      const ratingBoost = ((cand.rating || 4.5) / 5) * 5;
      score += ratingBoost;

      // Descriptive similarity tag
      let matchLabel = 'Recommended';
      if (isSameCategory && sharedTags.length > 0) {
        matchLabel = `Same Category & #${sharedTags[0]}`;
      } else if (isSameCategory) {
        matchLabel = `Same Category (${cand.category})`;
      } else if (sharedTags.length > 0) {
        matchLabel = `Shared #${sharedTags[0]}`;
      }

      const matchPercent = Math.min(99, Math.max(68, Math.round(score)));

      return {
        product: cand,
        score,
        matchPercent,
        sharedTags,
        matchLabel,
        isSameCategory,
      };
    });

    // Prioritize same category items first, then descending score
    scored.sort((a, b) => {
      if (a.isSameCategory && !b.isSameCategory) return -1;
      if (!a.isSameCategory && b.isSameCategory) return 1;
      return b.score - a.score;
    });

    return scored.slice(0, 4);
  }, [product, allProducts]);

  const handleSelectRelated = (rel: Product) => {
    if (onSelectProduct) {
      onSelectProduct(rel);
    }
    // Reset view options for new product and scroll smoothly to top
    setSelectedImageIndex(0);
    setQuantity(1);
    modalScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddRelatedToCart = (e: React.MouseEvent, rel: Product) => {
    e.stopPropagation();
    if (rel.stock <= 0) return;
    addToCart(rel, 1);
    setToastMessage(`Added ${rel.title} to your cart!`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  if (!product) return null;

  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;
  const savings = product.originalPrice ? product.originalPrice - product.price : 0;

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addToCart(product, quantity);
    setToastMessage(`Added ${quantity} × ${product.title} to your cart!`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleBuyNow = () => {
    if (isOutOfStock) return;
    addToCart(product, quantity);
    onClose();
    if (onInstantCheckout) {
      onInstantCheckout(product, quantity);
    } else {
      openCart();
    }
  };

  const handleHelpfulToggle = async (reviewId: string) => {
    const activeUserId = userProfile?.uid || currentUser?.uid || 'guest-user';
    const isAlreadyVoted = helpfulVotedIds.includes(reviewId);

    if (isAlreadyVoted) {
      setHelpfulVotedIds((prev) => prev.filter((id) => id !== reviewId));
    } else {
      setHelpfulVotedIds((prev) => [...prev, reviewId]);
    }

    // Optimistically update local review state
    setReviews((prev) =>
      prev.map((rev) => {
        if (rev.id === reviewId) {
          const currentCount = rev.helpfulCount || 0;
          return {
            ...rev,
            helpfulCount: isAlreadyVoted ? Math.max(0, currentCount - 1) : currentCount + 1,
          };
        }
        return rev;
      })
    );

    await productService.toggleReviewHelpful(reviewId, product.id, activeUserId);
  };

  const handleQuickTagClick = (tagText: string) => {
    if (!reviewComment.includes(tagText)) {
      setReviewComment((prev) => (prev ? `${prev} ${tagText}` : tagText));
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!isAuthenticated) {
      setFormError('Please sign in to submit a review.');
      return;
    }

    if (!reviewTitle.trim()) {
      setFormError('Please provide a title or headline for your review.');
      return;
    }

    if (!reviewComment.trim() || reviewComment.trim().length < 10) {
      setFormError('Please write at least 10 characters detailing your experience.');
      return;
    }

    setIsSubmittingReview(true);
    try {
      const added = await productService.addReview({
        productId: product.id,
        userId: userProfile?.uid || currentUser?.uid || 'verified-shopper',
        userName: userProfile?.displayName || currentUser?.displayName || 'Verified Shopper',
        userAvatar: userProfile?.photoURL || currentUser?.photoURL || undefined,
        userEmail: userProfile?.email || currentUser?.email || undefined,
        rating: newRating,
        title: reviewTitle.trim(),
        comment: reviewComment.trim(),
        recommend,
        verifiedPurchase: true,
      });

      // Update state
      setReviews((prev) => [added, ...prev.filter((r) => r.id !== added.id)]);
      setShowAddReview(false);
      setReviewTitle('');
      setReviewComment('');
      setNewRating(5);
      setRecommend(true);
      setSelectedStarFilter('all');
      setToastMessage('Thank you! Your verified review has been published.');
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      console.error('Failed to submit review:', err);
      setFormError('Could not publish review. Please check your connection and try again.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const getRatingLabel = (rating: number) => {
    switch (rating) {
      case 5:
        return '5.0 — Excellent / Highly Recommended';
      case 4:
        return '4.0 — Very Good / Satisfied';
      case 3:
        return '3.0 — Average / Meets Expectations';
      case 2:
        return '2.0 — Fair / Room for Improvement';
      case 1:
        return '1.0 — Poor / Unsatisfied';
      default:
        return `${rating}.0`;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
      <div
        className="bg-white border border-slate-200 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden relative animate-scale-in my-auto text-slate-900"
        id="product-detail-modal"
      >
        {/* Modal Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-100">
              {product.category}
            </span>
            {product.sku && (
              <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                SKU: {product.sku}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            id="close-product-modal-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div ref={modalScrollRef} className="overflow-y-auto p-6 flex-1 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Gallery Column */}
            <div className="space-y-4">
              {/* Main Image */}
              <div className="aspect-4/3 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 relative group">
                <img
                  src={product.images[selectedImageIndex] || product.images[0]}
                  alt={product.title}
                  className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
                />
                {savings > 0 && (
                  <div className="absolute top-3 left-3 bg-rose-500 text-white font-bold text-xs px-2.5 py-1 rounded-lg shadow-xs">
                    Save ${savings.toFixed(2)}
                  </div>
                )}
              </div>

              {/* Thumbnails */}
              {product.images.length > 1 && (
                <div className="flex items-center gap-3 overflow-x-auto pb-1">
                  {product.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition cursor-pointer ${
                        selectedImageIndex === idx
                          ? 'border-slate-900 ring-2 ring-slate-900/10'
                          : 'border-slate-200 hover:border-slate-300 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Meta & Action Column */}
            <div className="space-y-5 flex flex-col justify-between">
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight leading-snug">
                  {product.title}
                </h1>

                {/* Rating summary */}
                <div className="flex items-center gap-3 mt-2.5 text-sm">
                  <div className="flex items-center gap-1 text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.floor(averageRating)
                            ? 'fill-amber-400 text-amber-400'
                            : i < averageRating
                            ? 'fill-amber-400/50 text-amber-400'
                            : 'text-slate-200'
                        }`}
                      />
                    ))}
                    <span className="font-bold text-slate-800 ml-1">
                      {averageRating.toFixed(1)}
                    </span>
                  </div>
                  <span className="text-slate-300">•</span>
                  <button
                    onClick={() => setActiveTab('reviews')}
                    className="text-indigo-600 hover:underline text-xs font-semibold cursor-pointer"
                  >
                    {totalReviewCount} customer reviews
                  </button>
                </div>

                {/* Price Display */}
                <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                      ${product.price.toFixed(2)}
                    </span>
                    {product.originalPrice && product.originalPrice > product.price && (
                      <span className="text-lg text-slate-400 line-through">
                        ${product.originalPrice.toFixed(2)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Free standard shipping & 30-day effortless returns.
                  </p>
                </div>

                {/* Inventory Status */}
                <div className="mt-4 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Availability:</span>
                  {isOutOfStock ? (
                    <span className="font-semibold text-rose-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" /> Out of Stock
                    </span>
                  ) : isLowStock ? (
                    <span className="font-semibold text-amber-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" /> Low Stock ({product.stock} units remaining)
                    </span>
                  ) : (
                    <span className="font-semibold text-emerald-600 flex items-center gap-1">
                      <Check className="w-4 h-4" /> In Stock ({product.stock} units ready to ship)
                    </span>
                  )}
                </div>

                {/* Tags */}
                {product.tags && product.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {product.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-md text-[11px] bg-slate-100 text-slate-600 border border-slate-200"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Quantity and CTA Buttons */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-4">
                  <span className="text-xs font-semibold text-slate-700">Quantity:</span>
                  <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1 || isOutOfStock}
                      className="px-3 py-2 text-slate-600 hover:bg-slate-200 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-4 py-1 text-sm font-bold text-slate-900 min-w-[36px] text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                      disabled={quantity >= product.stock || isOutOfStock}
                      className="px-3 py-2 text-slate-600 hover:bg-slate-200 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <button
                    onClick={handleAddToCart}
                    disabled={isOutOfStock}
                    className="w-full py-3 px-4 rounded-xl font-semibold text-sm bg-white hover:bg-slate-50 text-slate-900 border border-slate-300 flex items-center justify-center gap-2 shadow-xs transition disabled:opacity-40 cursor-pointer active:scale-98"
                    id="modal-add-to-cart-btn"
                  >
                    <ShoppingBag className="w-4 h-4 text-slate-700" />
                    Add to Cart
                  </button>

                  <button
                    onClick={handleBuyNow}
                    disabled={isOutOfStock}
                    className="w-full py-3 px-4 rounded-xl font-semibold text-sm bg-slate-900 hover:bg-slate-800 text-white shadow-sm flex items-center justify-center gap-2 transition disabled:opacity-40 cursor-pointer active:scale-98"
                    id="modal-buy-now-btn"
                  >
                    <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                    Buy Now
                  </button>
                </div>

                {/* Compare Product Button */}
                <div className="flex items-center justify-between gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => toggleCompare(product)}
                    className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition border cursor-pointer ${
                      isInCompare(product.id)
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-300'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                    id="modal-toggle-compare-btn"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>
                      {isInCompare(product.id)
                        ? 'Remove from Comparison'
                        : 'Add to Comparison (up to 3)'}
                    </span>
                  </button>

                  {comparedProducts.length > 0 && (
                    <button
                      type="button"
                      onClick={() => openCompareModal()}
                      className="py-2.5 px-3.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition flex items-center gap-1.5 cursor-pointer shrink-0"
                      id="modal-view-comparison-btn"
                    >
                      <span>View Compare ({comparedProducts.length})</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Trust Badges */}
                <div className="grid grid-cols-3 gap-2 pt-2 text-[11px] text-slate-500 text-center">
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                    <Shield className="w-4 h-4 text-slate-700 mx-auto mb-1" />
                    <span>2-Year Warranty</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                    <Truck className="w-4 h-4 text-slate-700 mx-auto mb-1" />
                    <span>Fast Dispatch</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                    <RotateCcw className="w-4 h-4 text-slate-700 mx-auto mb-1" />
                    <span>30-Day Returns</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation (Overview, Specs, Reviews) */}
          <div className="pt-6 border-t border-slate-100">
            <div className="flex border-b border-slate-200 gap-6 text-sm font-medium">
              <button
                onClick={() => setActiveTab('overview')}
                className={`pb-3 transition relative cursor-pointer ${
                  activeTab === 'overview'
                    ? 'text-slate-900 font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Overview
                {activeTab === 'overview' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900 rounded-full" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('specs')}
                className={`pb-3 transition relative cursor-pointer ${
                  activeTab === 'specs'
                    ? 'text-slate-900 font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Technical Specifications
                {activeTab === 'specs' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900 rounded-full" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`pb-3 transition relative cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'reviews'
                    ? 'text-slate-900 font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Verified Reviews & Ratings
                <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-700 font-semibold">
                  {totalReviewCount}
                </span>
                {activeTab === 'reviews' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900 rounded-full" />
                )}
              </button>
            </div>

            {/* Tab Contents */}
            <div className="py-4">
              {activeTab === 'overview' && (
                <div className="text-sm text-slate-600 leading-relaxed space-y-3">
                  <p>{product.description}</p>
                  <p className="text-slate-500">
                    Engineered for modern power users and professionals. Every unit undergoes rigorous quality assurance and is backed by the NexusStore comprehensive hardware guarantee.
                  </p>
                </div>
              )}

              {activeTab === 'specs' && (
                <div className="space-y-2">
                  {product.specs && product.specs.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      {product.specs.map((spec, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200"
                        >
                          <span className="text-slate-500 font-medium">{spec.name}</span>
                          <span className="text-slate-900 font-semibold text-right">{spec.value}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">Standard specifications apply for this model.</p>
                  )}
                </div>
              )}

              {activeTab === 'reviews' && (
                <div className="space-y-6">
                  {/* Rating Breakdown Dashboard Header */}
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                    {/* Average Score Box */}
                    <div className="md:col-span-4 text-center md:text-left flex flex-col items-center md:items-start justify-center border-b md:border-b-0 md:border-r border-slate-200 pb-4 md:pb-0 md:pr-4">
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-extrabold text-slate-900 tracking-tight">
                          {averageRating.toFixed(1)}
                        </span>
                        <span className="text-slate-400 font-medium text-sm">/ 5.0</span>
                      </div>
                      <div className="flex items-center gap-1 mt-1 text-amber-400">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${
                              star <= Math.floor(averageRating)
                                ? 'fill-amber-400 text-amber-400'
                                : star - 0.5 <= averageRating
                                ? 'fill-amber-400/50 text-amber-400'
                                : 'text-slate-300'
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-slate-500 mt-2 font-medium">
                        Based on {totalReviewCount} verified ratings
                      </p>
                      <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[11px] font-semibold border border-emerald-200">
                        <Check className="w-3.5 h-3.5" />
                        <span>{recommendPercentage}% recommend this item</span>
                      </div>
                    </div>

                    {/* Star Rating Distribution Bars */}
                    <div className="md:col-span-5 space-y-1.5">
                      {[5, 4, 3, 2, 1].map((starCount) => {
                        const count = ratingDistribution[starCount] || 0;
                        const total = Math.max(1, totalReviewCount);
                        const percentage = Math.round((count / total) * 100);
                        const isSelected = selectedStarFilter === starCount;

                        return (
                          <button
                            key={starCount}
                            type="button"
                            onClick={() =>
                              setSelectedStarFilter(isSelected ? 'all' : starCount)
                            }
                            className={`w-full flex items-center gap-2 text-xs text-slate-600 hover:text-slate-900 group cursor-pointer transition rounded-lg p-1 ${
                              isSelected ? 'bg-slate-200/70 font-bold' : ''
                            }`}
                          >
                            <span className="w-12 text-left font-medium flex items-center gap-1 text-[11px]">
                              {starCount} <Star className="w-3 h-3 fill-amber-400 text-amber-400 inline" />
                            </span>
                            <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-amber-400 rounded-full transition-all duration-500"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="w-8 text-right text-[11px] text-slate-500 font-mono">
                              {count}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Action Column */}
                    <div className="md:col-span-3 flex flex-col items-center md:items-end justify-center">
                      {!showAddReview ? (
                        <button
                          onClick={() => {
                            if (!isAuthenticated && onOpenAuth) {
                              onOpenAuth();
                            } else {
                              setShowAddReview(true);
                            }
                          }}
                          className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs flex items-center justify-center gap-2 transition cursor-pointer"
                          id="open-write-review-btn"
                        >
                          <MessageSquarePlus className="w-4 h-4" />
                          Write a Review
                        </button>
                      ) : (
                        <button
                          onClick={() => setShowAddReview(false)}
                          className="w-full py-2 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-300 transition cursor-pointer"
                        >
                          Close Form
                        </button>
                      )}
                      <p className="text-[10px] text-slate-400 mt-2 text-center md:text-right">
                        {isAuthenticated
                          ? `Posting as ${userProfile?.displayName || 'Authenticated User'}`
                          : 'Sign in required to post reviews'}
                      </p>
                    </div>
                  </div>

                  {/* Authentication Prompt if not logged in and user tries to review */}
                  {!isAuthenticated && (
                    <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2.5 text-indigo-950">
                        <LogIn className="w-5 h-5 text-indigo-600 shrink-0" />
                        <div>
                          <p className="font-bold text-slate-900">
                            Have you purchased or used this item?
                          </p>
                          <p className="text-slate-600 text-[11px]">
                            Sign in to share your experience with the community.
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => onOpenAuth && onOpenAuth()}
                        className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shrink-0 cursor-pointer shadow-xs transition"
                        id="signin-to-review-btn"
                      >
                        Sign In to Review
                      </button>
                    </div>
                  )}

                  {/* Add Review Form for Authenticated Users */}
                  {showAddReview && isAuthenticated && (
                    <form
                      onSubmit={handleSubmitReview}
                      className="p-5 rounded-2xl bg-white border border-slate-300 shadow-sm space-y-4 animate-fade-in"
                      id="product-review-form"
                    >
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">
                            Share Your Verified Review
                          </h4>
                          <p className="text-xs text-slate-500">
                            Help fellow shoppers make the right choice
                          </p>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                          <span className="font-semibold text-slate-900">
                            {userProfile?.displayName || currentUser?.displayName || 'Shopper'}
                          </span>
                          <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                            <Check className="w-3 h-3" /> Verified
                          </span>
                        </div>
                      </div>

                      {formError && (
                        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>{formError}</span>
                        </div>
                      )}

                      {/* Interactive Star Rating Picker */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-slate-700">
                          Overall Rating <span className="text-rose-500">*</span>
                        </label>
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="flex items-center gap-1 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
                            {[1, 2, 3, 4, 5].map((star) => {
                              const active = star <= (hoverRating ?? newRating);
                              return (
                                <button
                                  type="button"
                                  key={star}
                                  onMouseEnter={() => setHoverRating(star)}
                                  onMouseLeave={() => setHoverRating(null)}
                                  onClick={() => setNewRating(star)}
                                  className="p-1 text-slate-300 hover:scale-110 transition cursor-pointer"
                                  id={`star-select-${star}`}
                                >
                                  <Star
                                    className={`w-6 h-6 transition-colors ${
                                      active
                                        ? 'fill-amber-400 text-amber-400'
                                        : 'text-slate-300 hover:text-amber-300'
                                    }`}
                                  />
                                </button>
                              );
                            })}
                          </div>
                          <span className="text-xs font-semibold text-slate-700">
                            {getRatingLabel(hoverRating ?? newRating)}
                          </span>
                        </div>
                      </div>

                      {/* Recommendation Toggle */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-slate-700">
                          Would you recommend this product to others?
                        </label>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setRecommend(true)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border ${
                              recommend
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold'
                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            Yes, I recommend it
                          </button>
                          <button
                            type="button"
                            onClick={() => setRecommend(false)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border ${
                              !recommend
                                ? 'bg-rose-50 border-rose-300 text-rose-800 font-bold'
                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            <X className="w-3.5 h-3.5 text-rose-500" />
                            No, I do not recommend it
                          </button>
                        </div>
                      </div>

                      {/* Review Title Input */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Review Headline <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Exceptional sound clarity and premium finish"
                          value={reviewTitle}
                          onChange={(e) => setReviewTitle(e.target.value)}
                          maxLength={100}
                          required
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                          id="review-title-input"
                        />
                      </div>

                      {/* Quick Tag Suggestion Chips */}
                      <div className="space-y-1">
                        <span className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
                          <Sparkles className="w-3 h-3 text-indigo-500" /> Quick tags to add:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            'High build quality',
                            'Fast delivery',
                            'Great battery life',
                            'Exceeded expectations',
                            'Great value for money',
                            'Easy setup',
                          ].map((tag) => (
                            <button
                              type="button"
                              key={tag}
                              onClick={() => handleQuickTagClick(tag)}
                              className="px-2.5 py-1 rounded-lg text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition cursor-pointer"
                            >
                              + {tag}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Detailed Review Experience Textarea */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-semibold text-slate-700">
                            Detailed Review <span className="text-rose-500">*</span>
                          </label>
                          <span className="text-[10px] text-slate-400">
                            {reviewComment.length}/500 chars
                          </span>
                        </div>
                        <textarea
                          placeholder="What did you like or dislike about this product? How is the quality, build, and everyday performance?"
                          value={reviewComment}
                          onChange={(e) => setReviewComment(e.target.value)}
                          maxLength={500}
                          rows={3}
                          required
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition leading-relaxed"
                          id="review-comment-input"
                        />
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => setShowAddReview(false)}
                          className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmittingReview}
                          className="px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                          id="submit-review-btn"
                        >
                          {isSubmittingReview ? (
                            <>
                              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Publishing...
                            </>
                          ) : (
                            <>
                              <Check className="w-4 h-4" />
                              Publish Review
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Filter & Sort Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
                    {/* Star Filter Pills */}
                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                      <span className="text-slate-400 text-xs font-medium mr-1 flex items-center gap-1">
                        <SlidersHorizontal className="w-3.5 h-3.5" /> Filter:
                      </span>
                      <button
                        onClick={() => setSelectedStarFilter('all')}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                          selectedStarFilter === 'all'
                            ? 'bg-slate-900 text-white shadow-xs'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        All ({reviews.length})
                      </button>
                      {[5, 4, 3, 2, 1].map((s) => (
                        <button
                          key={s}
                          onClick={() => setSelectedStarFilter(s)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition cursor-pointer ${
                            selectedStarFilter === s
                              ? 'bg-slate-900 text-white font-bold shadow-xs'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                        >
                          {s} <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        </button>
                      ))}
                    </div>

                    {/* Sort Dropdown */}
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-slate-500">Sort by:</span>
                      <div className="relative">
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value as SortOption)}
                          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-medium appearance-none pr-7 focus:outline-none focus:border-indigo-500 cursor-pointer"
                        >
                          <option value="newest">Most Recent</option>
                          <option value="highest">Highest Rating</option>
                          <option value="lowest">Lowest Rating</option>
                          <option value="helpful">Most Helpful</option>
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  {/* Reviews List */}
                  <div className="space-y-3">
                    {isLoadingReviews ? (
                      <div className="p-8 text-center text-xs text-slate-500 space-y-2">
                        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
                        <p>Loading community reviews...</p>
                      </div>
                    ) : displayedReviews.length === 0 ? (
                      <div className="p-8 text-center rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                        <Star className="w-8 h-8 text-slate-300 mx-auto" />
                        <div>
                          <p className="text-sm font-semibold text-slate-800">
                            {selectedStarFilter !== 'all'
                              ? `No ${selectedStarFilter}-star reviews found`
                              : 'No reviews posted yet'}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {selectedStarFilter !== 'all'
                              ? 'Try clearing the star filter to see all feedback.'
                              : 'Be the first verified customer to share your thoughts!'}
                          </p>
                        </div>
                        {selectedStarFilter !== 'all' && (
                          <button
                            onClick={() => setSelectedStarFilter('all')}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 cursor-pointer"
                          >
                            Show All Reviews
                          </button>
                        )}
                      </div>
                    ) : (
                      displayedReviews.map((rev) => {
                        const hasVotedHelpful = helpfulVotedIds.includes(rev.id);
                        const formattedDate = new Date(rev.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        });

                        return (
                          <div
                            key={rev.id}
                            className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 transition-all space-y-3 shadow-xs"
                            id={`review-item-${rev.id}`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-3">
                                {rev.userAvatar ? (
                                  <img
                                    src={rev.userAvatar}
                                    alt={rev.userName}
                                    className="w-9 h-9 rounded-full object-cover border border-slate-200"
                                  />
                                ) : (
                                  <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-800 font-bold text-xs flex items-center justify-center border border-slate-200">
                                    {rev.userName.charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-slate-900">
                                      {rev.userName}
                                    </span>
                                    {rev.verifiedPurchase && (
                                      <span className="text-[10px] bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-md border border-emerald-100 flex items-center gap-1">
                                        <Check className="w-2.5 h-2.5" /> Verified Buyer
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[11px] text-slate-400">
                                    {formattedDate}
                                  </span>
                                </div>
                              </div>

                              {/* Star Rating Badge */}
                              <div className="flex items-center gap-1 bg-amber-50/60 px-2 py-1 rounded-lg border border-amber-100">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-3.5 h-3.5 ${
                                      i < rev.rating
                                        ? 'fill-amber-400 text-amber-400'
                                        : 'text-slate-200'
                                    }`}
                                  />
                                ))}
                                <span className="text-xs font-bold text-amber-700 ml-1">
                                  {rev.rating}.0
                                </span>
                              </div>
                            </div>

                            {/* Headline */}
                            <h5 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                              {rev.title}
                            </h5>

                            {/* Recommendation note */}
                            {rev.recommend !== false ? (
                              <p className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                                <Check className="w-3 h-3 text-emerald-600" /> Recommends this product
                              </p>
                            ) : (
                              <p className="text-[11px] text-rose-600 font-medium flex items-center gap-1">
                                <X className="w-3 h-3 text-rose-500" /> Does not recommend this product
                              </p>
                            )}

                            {/* Comment Body */}
                            <p className="text-xs text-slate-600 leading-relaxed">
                              {rev.comment}
                            </p>

                            {/* Footer / Helpful voting button */}
                            <div className="pt-2 flex items-center justify-between border-t border-slate-100 text-[11px] text-slate-500">
                              <span>Was this review helpful to you?</span>
                              <button
                                onClick={() => handleHelpfulToggle(rev.id)}
                                className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-medium transition cursor-pointer border ${
                                  hasVotedHelpful
                                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                                }`}
                              >
                                <ThumbsUp
                                  className={`w-3 h-3 ${
                                    hasVotedHelpful ? 'fill-white text-white' : 'text-slate-600'
                                  }`}
                                />
                                <span>
                                  Helpful ({rev.helpfulCount || (hasVotedHelpful ? 1 : 0)})
                                </span>
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Related Products Section */}
          {relatedProducts.length > 0 && (
            <div className="pt-8 border-t border-slate-200 space-y-4" id="related-products-section">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                      Related Products
                    </h3>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                      <Sparkles className="w-3 h-3 text-indigo-600" />
                      Category Match
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Items from the <span className="font-semibold text-slate-800">{product.category}</span> collection with matching attributes & price range
                  </p>
                </div>
                <span className="text-[11px] text-slate-400 font-medium">
                  {relatedProducts.length} similar products found
                </span>
              </div>

              {/* Related Products Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {relatedProducts.map(({ product: rel, matchPercent, matchLabel }) => {
                  const isRelOutOfStock = rel.stock <= 0;
                  const isRelLowStock = rel.stock > 0 && rel.stock <= 5;
                  const relSavings = rel.originalPrice ? rel.originalPrice - rel.price : 0;

                  return (
                    <div
                      key={rel.id}
                      onClick={() => handleSelectRelated(rel)}
                      className="group bg-white border border-slate-200 hover:border-slate-400 rounded-2xl p-3 flex flex-col justify-between transition-all duration-200 hover:shadow-md cursor-pointer relative"
                      id={`related-product-${rel.id}`}
                    >
                      {/* Image & Badges */}
                      <div className="relative aspect-4/3 rounded-xl overflow-hidden bg-slate-100 border border-slate-100 mb-3">
                        <img
                          src={rel.images[0]}
                          alt={rel.title}
                          className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
                        />
                        {/* Match percentage pill */}
                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold tracking-tight shadow-xs flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5 text-amber-300" />
                          <span>{matchPercent}% Match</span>
                        </div>

                        {relSavings > 0 && (
                          <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-rose-500 text-white text-[10px] font-bold shadow-xs">
                            Save ${relSavings.toFixed(0)}
                          </div>
                        )}
                      </div>

                      {/* Meta info */}
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-indigo-600 font-semibold uppercase tracking-wider text-[10px]">
                            {rel.category}
                          </span>
                          <div className="flex items-center gap-0.5 text-amber-500 font-bold">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            <span>{rel.rating.toFixed(1)}</span>
                            <span className="text-[10px] text-slate-400 font-normal">
                              ({rel.ratingCount})
                            </span>
                          </div>
                        </div>

                        <h4 className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug group-hover:text-indigo-600 transition-colors">
                          {rel.title}
                        </h4>

                        {/* Stock note */}
                        <div className="text-[10px]">
                          {isRelOutOfStock ? (
                            <span className="text-rose-600 font-medium">Out of stock</span>
                          ) : isRelLowStock ? (
                            <span className="text-amber-600 font-medium">Only {rel.stock} left</span>
                          ) : (
                            <span className="text-emerald-600 font-medium">In stock</span>
                          )}
                        </div>
                      </div>

                      {/* Price & Actions footer */}
                      <div className="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                        <div>
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-sm font-extrabold text-slate-900">
                              ${rel.price.toFixed(2)}
                            </span>
                            {rel.originalPrice && rel.originalPrice > rel.price && (
                              <span className="text-[11px] text-slate-400 line-through">
                                ${rel.originalPrice.toFixed(0)}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleCompare(rel);
                            }}
                            title={isInCompare(rel.id) ? 'Remove from compare' : 'Compare product'}
                            className={`p-1.5 rounded-lg transition cursor-pointer ${
                              isInCompare(rel.id)
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600'
                            }`}
                            id={`compare-related-${rel.id}`}
                          >
                            <Layers className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleAddRelatedToCart(e, rel)}
                            disabled={isRelOutOfStock}
                            title="Add to cart"
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-700 transition cursor-pointer disabled:opacity-30 disabled:hover:bg-slate-100 disabled:hover:text-slate-700"
                            id={`add-related-${rel.id}`}
                          >
                            <ShoppingBag className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSelectRelated(rel)}
                            className="p-1.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition cursor-pointer flex items-center gap-1 text-[11px] font-semibold px-2 shadow-xs"
                            id={`view-related-${rel.id}`}
                          >
                            <span>View</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Toast alert inside modal */}
        {toastMessage && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xl flex items-center gap-2 animate-fade-in z-50 border border-slate-800">
            <Check className="w-4 h-4 text-emerald-400" />
            {toastMessage}
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import {
  SlidersHorizontal,
  Grid,
  List,
  Star,
  Check,
  RotateCcw,
  Sparkles,
  Laptop,
  Headphones,
  Watch,
  Briefcase,
  Camera,
  Layers,
  ArrowUpDown,
  Filter,
} from 'lucide-react';
import { Product } from '../types';
import { SAMPLE_CATEGORIES } from '../data/sampleProducts';
import { ProductCard } from './ProductCard';

interface ProductCatalogProps {
  products: Product[];
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  onSelectProduct: (product: Product) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

export const ProductCatalog: React.FC<ProductCatalogProps> = ({
  products,
  selectedCategory,
  onSelectCategory,
  onSelectProduct,
  searchQuery,
  setSearchQuery,
}) => {
  const [priceMax, setPriceMax] = useState<number>(2000);
  const [minRating, setMinRating] = useState<number>(0);
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<string>('featured');
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // Category Icon mapper
  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Laptop':
        return <Laptop className="w-4 h-4" />;
      case 'Headphones':
        return <Headphones className="w-4 h-4" />;
      case 'Watch':
        return <Watch className="w-4 h-4" />;
      case 'Briefcase':
        return <Briefcase className="w-4 h-4" />;
      case 'Camera':
        return <Camera className="w-4 h-4" />;
      default:
        return <Layers className="w-4 h-4" />;
    }
  };

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    const list = products || [];
    return list
      .filter((p) => {
        if (!p) return false;
        // Category filter
        if (selectedCategory !== 'all' && p.category !== selectedCategory) {
          return false;
        }
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = (p.title || '').toLowerCase().includes(q);
          const matchDesc = (p.description || '').toLowerCase().includes(q);
          const matchTag = (p.tags || []).some((t) => (t || '').toLowerCase().includes(q));
          if (!matchTitle && !matchDesc && !matchTag) return false;
        }
        // Price filter
        if (p.price > priceMax) return false;
        // Rating filter
        if (p.rating < minRating) return false;
        // In-stock filter
        if (inStockOnly && p.stock <= 0) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price-low') return a.price - b.price;
        if (sortBy === 'price-high') return b.price - a.price;
        if (sortBy === 'rating') return b.rating - a.rating;
        if (sortBy === 'newest') return (b.id || '').localeCompare(a.id || '');
        // default featured
        return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
      });
  }, [products, selectedCategory, searchQuery, priceMax, minRating, inStockOnly, sortBy]);

  const handleResetFilters = () => {
    onSelectCategory('all');
    setSearchQuery('');
    setPriceMax(2000);
    setMinRating(0);
    setInStockOnly(false);
    setSortBy('featured');
  };

  // Featured banner product
  const featuredProduct = products.find((p) => p.featured) || products[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in text-slate-900">
      {/* Hero Showcase Banner */}
      {selectedCategory === 'all' && !searchQuery && featuredProduct && (
        <div className="relative rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-xl p-6 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-xl space-y-4 text-left z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-indigo-300 border border-white/10">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Featured Release 2026
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              {featuredProduct.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 line-clamp-2">
              {featuredProduct.description}
            </p>
            <div className="flex items-baseline gap-3 pt-1">
              <span className="text-3xl font-extrabold text-white font-mono">
                ${featuredProduct.price.toFixed(2)}
              </span>
              {featuredProduct.originalPrice && (
                <span className="text-base text-slate-400 line-through">
                  ${featuredProduct.originalPrice.toFixed(2)}
                </span>
              )}
            </div>
            <div className="pt-2 flex items-center gap-3">
              <button
                onClick={() => onSelectProduct(featuredProduct)}
                className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm transition cursor-pointer shadow-md shadow-indigo-600/30"
              >
                Discover Specs & Buy
              </button>
            </div>
          </div>

          <div className="w-full md:w-80 aspect-4/3 rounded-2xl overflow-hidden border border-slate-800 shadow-xl shrink-0 group cursor-pointer bg-slate-950" onClick={() => onSelectProduct(featuredProduct)}>
            <img
              src={featuredProduct.images[0]}
              alt={featuredProduct.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
        </div>
      )}

      {/* Category Pills Bar */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            Explore Categories
          </h2>
          <span className="text-xs text-slate-500">{products.length} Products Catalog</span>
        </div>

        <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => onSelectCategory('all')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-semibold flex items-center gap-2 transition shrink-0 cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>All Products</span>
            <span className="text-[10px] opacity-75">({products.length})</span>
          </button>

          {SAMPLE_CATEGORIES.map((cat) => {
            const count = products.filter((p) => p.category === cat.slug).length;
            const isSelected = selectedCategory === cat.slug;

            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.slug)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-semibold flex items-center gap-2 transition shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
                }`}
              >
                {getCategoryIcon(cat.iconName)}
                <span>{cat.name}</span>
                <span className="text-[10px] opacity-75">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter and Sort Toolbar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        {/* Left: Filter badges & Active query */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            onClick={() => setIsFilterDrawerOpen(!isFilterDrawerOpen)}
            className={`px-3 py-2 rounded-xl flex items-center gap-1.5 font-semibold transition cursor-pointer ${
              isFilterDrawerOpen || minRating > 0 || inStockOnly || priceMax < 2000
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Refine Filters</span>
            {(minRating > 0 || inStockOnly || priceMax < 2000) && (
              <span className="w-2 h-2 rounded-full bg-indigo-600" />
            )}
          </button>

          {searchQuery && (
            <div className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 flex items-center gap-1">
              <span>Query: "{searchQuery}"</span>
              <button
                onClick={() => setSearchQuery('')}
                className="text-slate-400 hover:text-slate-700 ml-1 cursor-pointer"
              >
                ×
              </button>
            </div>
          )}

          {(selectedCategory !== 'all' || searchQuery || minRating > 0 || inStockOnly || priceMax < 2000) && (
            <button
              onClick={handleResetFilters}
              className="text-xs text-rose-600 hover:underline flex items-center gap-1 cursor-pointer ml-1 font-medium"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          )}
        </div>

        {/* Right: Sort selector */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 hidden sm:inline font-medium">Sort by:</span>
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-500 font-medium cursor-pointer text-xs"
              id="product-sort-select"
            >
              <option value="featured">Featured / Best Match</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Customer Rating (Highest)</option>
              <option value="newest">New Arrivals</option>
            </select>
          </div>
        </div>
      </div>

      {/* Filter Drawer / Panel */}
      {isFilterDrawerOpen && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 grid grid-cols-1 sm:grid-cols-3 gap-6 animate-fade-in text-xs shadow-sm">
          {/* Max Price Slider */}
          <div className="space-y-2">
            <div className="flex justify-between font-semibold">
              <span className="text-slate-700">Max Price</span>
              <span className="text-indigo-600 font-mono font-bold">${priceMax}</span>
            </div>
            <input
              type="range"
              min="50"
              max="2000"
              step="50"
              value={priceMax}
              onChange={(e) => setPriceMax(Number(e.target.value))}
              className="w-full accent-slate-900 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>$50</span>
              <span>$1000</span>
              <span>$2000</span>
            </div>
          </div>

          {/* Min Rating Filter */}
          <div className="space-y-2">
            <span className="font-semibold text-slate-700 block">Minimum Rating</span>
            <div className="flex gap-2">
              {[0, 4, 4.5, 4.8].map((rat) => (
                <button
                  key={rat}
                  onClick={() => setMinRating(rat)}
                  className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1 cursor-pointer transition ${
                    minRating === rat
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  {rat === 0 ? 'All' : `${rat}+`}
                </button>
              ))}
            </div>
          </div>

          {/* Stock Availability */}
          <div className="space-y-2">
            <span className="font-semibold text-slate-700 block">Inventory Filter</span>
            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="w-4 h-4 rounded text-slate-900 focus:ring-slate-800"
              />
              <span className="text-slate-700">Show In-Stock Items Only</span>
            </label>
          </div>
        </div>
      )}

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-4 shadow-xs">
          <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <SlidersHorizontal className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No products found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            We couldn't find any products matching your active filters. Try adjusting your search query or price range.
          </p>
          <button
            onClick={handleResetFilters}
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition cursor-pointer"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onSelect={onSelectProduct}
            />
          ))}
        </div>
      )}
    </div>
  );
};

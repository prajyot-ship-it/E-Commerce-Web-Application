import React, { useState, useRef, useEffect } from 'react';
import {
  ShoppingBag,
  Search,
  Truck,
  ShieldCheck,
  User as UserIcon,
  LogOut,
  ChevronDown,
  Menu,
  X,
  SlidersHorizontal,
  Package,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useCompare } from '../context/CompareContext';
import { Product } from '../types';

interface NavbarProps {
  currentView: 'shop' | 'tracking' | 'orders' | 'admin';
  setCurrentView: (view: 'shop' | 'tracking' | 'orders' | 'admin') => void;
  products: Product[];
  onSelectProduct: (product: Product) => void;
  onOpenAuth: () => void;
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  setCurrentView,
  products,
  onSelectProduct,
  onOpenAuth,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  setSearchQuery,
}) => {
  const { userProfile, role, logout, setDemoUser, switchRole } = useAuth();
  const { itemCount, openCart } = useCart();
  const { comparedProducts, openCompareModal } = useCompare();
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter search suggestions
  const searchSuggestions = searchQuery.trim()
    ? products
        .filter((p) =>
          p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.tags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
        )
        .slice(0, 5)
    : [];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 text-slate-800 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => {
                setCurrentView('shop');
                onSelectCategory('all');
              }}
              className="flex items-center gap-2.5 group cursor-pointer focus:outline-none"
              id="brand-logo-btn"
            >
              <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center shadow-xs group-hover:bg-indigo-600 transition-colors duration-200">
                <ShoppingBag className="w-4.5 h-4.5 text-white" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xl font-bold tracking-tight text-slate-900">
                  Nexus<span className="text-indigo-600">Store</span>
                </span>
                <span className="text-[10px] text-slate-500 tracking-wider font-mono -mt-1 uppercase">
                  Premium Tech & Gear
                </span>
              </div>
            </button>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1">
              <button
                onClick={() => {
                  setCurrentView('shop');
                  onSelectCategory('all');
                }}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition cursor-pointer ${
                  currentView === 'shop'
                    ? 'bg-slate-100 text-slate-900 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
                id="nav-catalog-btn"
              >
                Store Catalog
              </button>

              <button
                onClick={() => setCurrentView('tracking')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-1.5 cursor-pointer ${
                  currentView === 'tracking'
                    ? 'bg-slate-100 text-slate-900 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
                id="nav-tracking-btn"
              >
                <Truck className="w-4 h-4 text-slate-500" />
                Track Order
              </button>

              <button
                onClick={() => setCurrentView('orders')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-1.5 cursor-pointer ${
                  currentView === 'orders'
                    ? 'bg-slate-100 text-slate-900 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
                id="nav-myorders-btn"
              >
                <Package className="w-4 h-4 text-slate-500" />
                My Orders
              </button>

              {role === 'admin' && (
                <button
                  onClick={() => setCurrentView('admin')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-1.5 cursor-pointer ${
                    currentView === 'admin'
                      ? 'bg-slate-900 text-white font-semibold shadow-xs'
                      : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-100'
                  }`}
                  id="nav-admin-btn"
                >
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  Admin Dashboard
                </button>
              )}
            </nav>
          </div>

          {/* Search Bar with live autocomplete */}
          <div className="flex-1 max-w-md relative hidden sm:block" ref={searchRef}>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search products, brands, tech..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition shadow-xs"
                id="header-search-input"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Suggestions Dropdown */}
            {isSearchFocused && searchSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50 divide-y divide-slate-100">
                <div className="px-3 py-2 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                  <span>Matching Products</span>
                  <span>{searchSuggestions.length} found</span>
                </div>
                {searchSuggestions.map((prod) => (
                  <button
                    key={prod.id}
                    onClick={() => {
                      onSelectProduct(prod);
                      setIsSearchFocused(false);
                    }}
                    className="w-full p-2.5 flex items-center gap-3 hover:bg-slate-50 transition text-left cursor-pointer"
                  >
                    <img
                      src={prod.images[0]}
                      alt={prod.title}
                      className="w-10 h-10 rounded-lg object-cover bg-slate-100 border border-slate-100 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-800 truncate">{prod.title}</p>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                        <span className="text-slate-900 font-semibold">${prod.price.toFixed(2)}</span>
                        <span>•</span>
                        <span className="capitalize">{prod.category}</span>
                        <span>•</span>
                        <span className={prod.stock > 0 ? 'text-emerald-600' : 'text-rose-600'}>
                          {prod.stock > 0 ? `${prod.stock} in stock` : 'Out of stock'}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2.5">
            {/* Quick Role Switcher Pill */}
            <div className="hidden sm:flex items-center bg-slate-100 rounded-full p-0.5 border border-slate-200">
              <button
                onClick={() => {
                  switchRole('user');
                  setDemoUser('user');
                }}
                className={`px-2.5 py-1 text-xs rounded-full font-medium transition cursor-pointer ${
                  role === 'user'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Switch to Customer Mode"
                id="role-switch-user-btn"
              >
                Customer
              </button>
              <button
                onClick={() => {
                  switchRole('admin');
                  setDemoUser('admin');
                }}
                className={`px-2.5 py-1 text-xs rounded-full font-medium transition flex items-center gap-1 cursor-pointer ${
                  role === 'admin'
                    ? 'bg-slate-900 text-white shadow-xs font-semibold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Switch to Admin Mode"
                id="role-switch-admin-btn"
              >
                <ShieldCheck className="w-3 h-3" />
                Admin
              </button>
            </div>

            {/* User Profile Menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/70 border border-slate-200 text-sm transition cursor-pointer text-slate-800"
                id="user-menu-btn"
              >
                {userProfile?.photoURL ? (
                  <img
                    src={userProfile.photoURL}
                    alt={userProfile.displayName}
                    className="w-6 h-6 rounded-full object-cover ring-1 ring-slate-300"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                    {userProfile?.displayName ? userProfile.displayName.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
                <span className="hidden md:inline font-medium text-xs max-w-[100px] truncate text-slate-700">
                  {userProfile?.displayName || 'Sign In'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50 text-slate-700">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-xs font-medium text-slate-400">Signed in as</p>
                    <p className="text-sm font-semibold text-slate-900 truncate">{userProfile?.displayName}</p>
                    <p className="text-xs text-slate-500 truncate">{userProfile?.email}</p>
                    <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                      <ShieldCheck className="w-3 h-3" />
                      Role: {role.toUpperCase()}
                    </div>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        setCurrentView('orders');
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full px-4 py-2 text-left text-xs hover:bg-slate-50 flex items-center gap-2 transition cursor-pointer text-slate-700"
                    >
                      <Package className="w-4 h-4 text-slate-400" />
                      My Order History & Receipts
                    </button>
                    <button
                      onClick={() => {
                        setCurrentView('tracking');
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full px-4 py-2 text-left text-xs hover:bg-slate-50 flex items-center gap-2 transition cursor-pointer text-slate-700"
                    >
                      <Truck className="w-4 h-4 text-slate-400" />
                      Live Order Tracking
                    </button>

                    {role === 'admin' && (
                      <button
                        onClick={() => {
                          setCurrentView('admin');
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full px-4 py-2 text-left text-xs hover:bg-indigo-50 text-indigo-700 flex items-center gap-2 font-medium transition cursor-pointer"
                      >
                        <ShieldCheck className="w-4 h-4 text-indigo-600" />
                        Admin Management Console
                      </button>
                    )}
                  </div>

                  <div className="border-t border-slate-100 pt-1">
                    <div className="px-4 py-1.5 text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                      Switch Demo Role
                    </div>
                    <button
                      onClick={() => {
                        setDemoUser('admin');
                        switchRole('admin');
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full px-4 py-1.5 text-left text-xs hover:bg-slate-50 flex items-center justify-between text-indigo-600 font-medium transition cursor-pointer"
                    >
                      <span>Demo Admin Profile</span>
                      <span className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-100">Admin</span>
                    </button>
                    <button
                      onClick={() => {
                        setDemoUser('user');
                        switchRole('user');
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full px-4 py-1.5 text-left text-xs hover:bg-slate-50 flex items-center justify-between text-slate-700 transition cursor-pointer"
                    >
                      <span>Demo Customer Profile</span>
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">User</span>
                    </button>

                    <div className="border-t border-slate-100 mt-1 pt-1">
                      <button
                        onClick={() => {
                          onOpenAuth();
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full px-4 py-2 text-left text-xs hover:bg-slate-50 text-slate-700 flex items-center gap-2 transition cursor-pointer"
                      >
                        <UserIcon className="w-4 h-4 text-slate-400" />
                        Sign In / Register with Email
                      </button>
                      <button
                        onClick={() => {
                          logout();
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full px-4 py-2 text-left text-xs hover:bg-rose-50 text-rose-600 flex items-center gap-2 transition cursor-pointer"
                      >
                        <LogOut className="w-4 h-4 text-rose-500" />
                        Log Out
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Compare Drawer trigger */}
            <button
              onClick={openCompareModal}
              className={`relative p-2.5 rounded-xl border transition cursor-pointer flex items-center justify-center ${
                comparedProducts.length > 0
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'
                  : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
              }`}
              id="header-compare-btn"
              aria-label="Compare Products"
              title={
                comparedProducts.length > 0
                  ? `Compare ${comparedProducts.length} selected products`
                  : 'Product Comparison (up to 3)'
              }
            >
              <Layers className="w-5 h-5" />
              {comparedProducts.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-indigo-600 text-white text-[10px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white animate-scale-in">
                  {comparedProducts.length}
                </span>
              )}
            </button>

            {/* Shopping Cart Button */}
            <button
              onClick={openCart}
              className="relative p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition transform active:scale-95 cursor-pointer flex items-center justify-center"
              id="header-cart-btn"
              aria-label="Shopping Cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-indigo-600 text-white text-[11px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white animate-scale-in">
                  {itemCount}
                </span>
              )}
            </button>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 lg:hidden cursor-pointer"
              id="mobile-menu-toggle-btn"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Search input */}
        <div className="py-2.5 sm:hidden border-t border-slate-100">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-xs text-slate-500">Current Role Mode:</span>
            <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
              <button
                onClick={() => {
                  switchRole('user');
                  setDemoUser('user');
                }}
                className={`px-3 py-1 text-xs rounded-md ${
                  role === 'user' ? 'bg-white text-slate-900 font-semibold shadow-xs' : 'text-slate-500'
                }`}
              >
                Customer
              </button>
              <button
                onClick={() => {
                  switchRole('admin');
                  setDemoUser('admin');
                }}
                className={`px-3 py-1 text-xs rounded-md ${
                  role === 'admin' ? 'bg-slate-900 text-white font-semibold' : 'text-slate-500'
                }`}
              >
                Admin
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                setCurrentView('shop');
                setIsMobileMenuOpen(false);
              }}
              className={`p-2.5 rounded-lg text-xs font-medium text-center ${
                currentView === 'shop' ? 'bg-slate-100 text-slate-900 font-semibold' : 'bg-slate-50 text-slate-600'
              }`}
            >
              Store Catalog
            </button>
            <button
              onClick={() => {
                setCurrentView('tracking');
                setIsMobileMenuOpen(false);
              }}
              className={`p-2.5 rounded-lg text-xs font-medium text-center ${
                currentView === 'tracking' ? 'bg-slate-100 text-slate-900 font-semibold' : 'bg-slate-50 text-slate-600'
              }`}
            >
              Track Order
            </button>
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                openCompareModal();
              }}
              className="p-2.5 rounded-lg text-xs font-medium text-center bg-indigo-50 text-indigo-700 flex items-center justify-center gap-1.5"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Compare ({comparedProducts.length})</span>
            </button>
            <button
              onClick={() => {
                setCurrentView('orders');
                setIsMobileMenuOpen(false);
              }}
              className={`p-2.5 rounded-lg text-xs font-medium text-center ${
                currentView === 'orders' ? 'bg-slate-100 text-slate-900 font-semibold' : 'bg-slate-50 text-slate-600'
              }`}
            >
              My Orders
            </button>
            {role === 'admin' && (
              <button
                onClick={() => {
                  setCurrentView('admin');
                  setIsMobileMenuOpen(false);
                }}
                className={`p-2.5 rounded-lg text-xs font-semibold text-center ${
                  currentView === 'admin' ? 'bg-slate-900 text-white' : 'bg-indigo-50 text-indigo-700'
                }`}
              >
                Admin Console
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

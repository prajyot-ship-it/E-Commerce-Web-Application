import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider, useCart } from './context/CartContext';
import { CompareProvider } from './context/CompareContext';
import { Navbar } from './components/Navbar';
import { BannerPromo } from './components/BannerPromo';
import { ProductCatalog } from './components/ProductCatalog';
import { ProductDetailModal } from './components/ProductDetailModal';
import { ProductComparisonModal } from './components/ProductComparisonModal';
import { CompareFloatingBar } from './components/CompareFloatingBar';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { OrderTrackingView } from './components/OrderTrackingView';
import { UserOrdersView } from './components/UserOrdersView';
import { AdminDashboard } from './components/AdminDashboard';
import { AuthModal } from './components/AuthModal';
import { Footer } from './components/Footer';
import { Product, Order } from './types';
import { productService } from './services/productService';
import { SAMPLE_PRODUCTS } from './data/sampleProducts';

const MainAppContent: React.FC = () => {
  const { role } = useAuth();
  const { isCartOpen, setIsCartOpen } = useCart();

  const [currentView, setCurrentView] = useState<'shop' | 'tracking' | 'orders' | 'admin'>('shop');
  const [products, setProducts] = useState<Product[]>(SAMPLE_PRODUCTS);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState<boolean>(false);
  const [activeTrackingId, setActiveTrackingId] = useState<string | undefined>(undefined);

  // Subscribe to real-time product updates from Firestore
  useEffect(() => {
    const unsub = productService.subscribeToProducts((updated) => {
      if (updated && updated.length > 0) {
        setProducts(updated);
      }
    });

    return () => unsub();
  }, []);

  const handleRefreshCatalog = async () => {
    const fresh = await productService.getProducts();
    setProducts(fresh);
  };

  const handleOrderSuccess = (order: Order) => {
    setActiveTrackingId(order.orderNumber);
    setCurrentView('tracking');
  };

  const handleTrackOrderFromHistory = (orderId: string) => {
    setActiveTrackingId(orderId);
    setCurrentView('tracking');
  };

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      {/* Top Banner Promo */}
      <BannerPromo
        onExploreDeals={() => {
          setCurrentView('shop');
          setSelectedCategory('all');
        }}
      />

      {/* Main Navbar */}
      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        products={products}
        onSelectProduct={(prod) => setSelectedProduct(prod)}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        selectedCategory={selectedCategory}
        onSelectCategory={(cat) => setSelectedCategory(cat)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {/* Main Content Router */}
      <main className="flex-1">
        {currentView === 'shop' && (
          <ProductCatalog
            products={products}
            selectedCategory={selectedCategory}
            onSelectCategory={(cat) => setSelectedCategory(cat)}
            onSelectProduct={(prod) => setSelectedProduct(prod)}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        )}

        {currentView === 'tracking' && (
          <OrderTrackingView
            initialOrderId={activeTrackingId}
            onNavigateToShop={() => {
              setCurrentView('shop');
              setSelectedCategory('all');
            }}
          />
        )}

        {currentView === 'orders' && (
          <UserOrdersView
            onTrackOrder={handleTrackOrderFromHistory}
            onShopNow={() => {
              setCurrentView('shop');
              setSelectedCategory('all');
            }}
          />
        )}

        {currentView === 'admin' && (
          <AdminDashboard
            products={products}
            onRefreshCatalog={handleRefreshCatalog}
          />
        )}
      </main>

      {/* Global Modals & Floating Drawers */}
      <ProductDetailModal
        product={selectedProduct}
        allProducts={products}
        onSelectProduct={(p) => setSelectedProduct(p)}
        onClose={() => setSelectedProduct(null)}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onInstantCheckout={() => {
          setSelectedProduct(null);
          setIsCheckoutModalOpen(true);
        }}
      />

      <ProductComparisonModal
        allProducts={products}
        onSelectProduct={(p) => setSelectedProduct(p)}
      />

      <CompareFloatingBar />

      <CartDrawer
        onProceedToCheckout={() => {
          setIsCartOpen(false);
          setIsCheckoutModalOpen(true);
        }}
      />

      <CheckoutModal
        isOpen={isCheckoutModalOpen}
        onClose={() => setIsCheckoutModalOpen(false)}
        onOrderSuccess={handleOrderSuccess}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* Footer */}
      <Footer
        onNavigate={(view) => setCurrentView(view)}
        onSelectCategory={(cat) => {
          setCurrentView('shop');
          setSelectedCategory(cat);
        }}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <CompareProvider>
          <MainAppContent />
        </CompareProvider>
      </CartProvider>
    </AuthProvider>
  );
}

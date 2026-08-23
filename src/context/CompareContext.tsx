import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product } from '../types';

interface CompareContextType {
  comparedProducts: Product[];
  addToCompare: (product: Product) => boolean;
  removeFromCompare: (productId: string) => void;
  toggleCompare: (product: Product) => void;
  clearCompare: () => void;
  isInCompare: (productId: string) => boolean;
  isCompareModalOpen: boolean;
  setIsCompareModalOpen: (open: boolean) => void;
  openCompareModal: () => void;
  compareToast: string | null;
  setCompareToast: (msg: string | null) => void;
}

const CompareContext = createContext<CompareContextType | undefined>(undefined);

const MAX_COMPARE_LIMIT = 3;
const STORAGE_KEY = 'nexus_compared_products';

export const CompareProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [comparedProducts, setComparedProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [compareToast, setCompareToast] = useState<string | null>(null);

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(comparedProducts));
    } catch (e) {
      console.warn('Could not save compared products to localStorage', e);
    }
  }, [comparedProducts]);

  const showToast = (msg: string) => {
    setCompareToast(msg);
    setTimeout(() => {
      setCompareToast((curr) => (curr === msg ? null : curr));
    }, 3500);
  };

  const isInCompare = (productId: string) => {
    return comparedProducts.some((p) => p.id === productId);
  };

  const addToCompare = (product: Product): boolean => {
    if (isInCompare(product.id)) {
      showToast(`"${product.title}" is already in your comparison list.`);
      return true;
    }

    if (comparedProducts.length >= MAX_COMPARE_LIMIT) {
      showToast(`You can compare up to ${MAX_COMPARE_LIMIT} items at a time. Remove an item to add another.`);
      return false;
    }

    setComparedProducts((prev) => [...prev, product]);
    showToast(`Added "${product.title}" to compare (${comparedProducts.length + 1}/${MAX_COMPARE_LIMIT})`);
    return true;
  };

  const removeFromCompare = (productId: string) => {
    const item = comparedProducts.find((p) => p.id === productId);
    setComparedProducts((prev) => prev.filter((p) => p.id !== productId));
    if (item) {
      showToast(`Removed "${item.title}" from comparison.`);
    }
  };

  const toggleCompare = (product: Product) => {
    if (isInCompare(product.id)) {
      removeFromCompare(product.id);
    } else {
      addToCompare(product);
    }
  };

  const clearCompare = () => {
    setComparedProducts([]);
    showToast('Comparison list cleared.');
  };

  const openCompareModal = () => {
    if (comparedProducts.length === 0) {
      showToast('Select at least one product to compare.');
      return;
    }
    setIsCompareModalOpen(true);
  };

  return (
    <CompareContext.Provider
      value={{
        comparedProducts,
        addToCompare,
        removeFromCompare,
        toggleCompare,
        clearCompare,
        isInCompare,
        isCompareModalOpen,
        setIsCompareModalOpen,
        openCompareModal,
        compareToast,
        setCompareToast,
      }}
    >
      {children}
    </CompareContext.Provider>
  );
};

export const useCompare = (): CompareContextType => {
  const context = useContext(CompareContext);
  if (!context) {
    throw new Error('useCompare must be used within a CompareProvider');
  }
  return context;
};

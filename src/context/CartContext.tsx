import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, Product, Coupon } from '../types';
import { AVAILABLE_COUPONS } from '../data/sampleProducts';

interface CartContextType {
  cart: CartItem[];
  itemCount: number;
  subtotal: number;
  discountAmount: number;
  shippingFee: number;
  taxAmount: number;
  total: number;
  coupon: Coupon | null;
  shippingTier: 'standard' | 'express' | 'overnight';
  isCartOpen: boolean;
  addToCart: (product: Product, quantity?: number, variant?: { color?: string; size?: string }) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  applyCoupon: (code: string) => { success: boolean; message: string };
  removeCoupon: () => void;
  setShippingTier: (tier: 'standard' | 'express' | 'overnight') => void;
  setIsCartOpen: (open: boolean) => void;
  openCart: () => void;
  closeCart: () => void;
  freeShippingThreshold: number;
  amountNeededForFreeShipping: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('nexus_store_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [coupon, setCoupon] = useState<Coupon | null>(() => {
    try {
      const saved = localStorage.getItem('nexus_store_coupon');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [shippingTier, setShippingTier] = useState<'standard' | 'express' | 'overnight'>('standard');
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('nexus_store_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    if (coupon) {
      localStorage.setItem('nexus_store_coupon', JSON.stringify(coupon));
    } else {
      localStorage.removeItem('nexus_store_coupon');
    }
  }, [coupon]);

  const addToCart = (product: Product, quantity = 1, variant?: { color?: string; size?: string }) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex((item) => item.product.id === product.id);
      if (existingIndex > -1) {
        const updated = [...prev];
        const newQty = Math.min(product.stock, updated[existingIndex].quantity + quantity);
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty,
          selectedColor: variant?.color || updated[existingIndex].selectedColor,
          selectedSize: variant?.size || updated[existingIndex].selectedSize,
        };
        return updated;
      } else {
        return [
          ...prev,
          {
            product,
            quantity: Math.min(product.stock, quantity),
            selectedColor: variant?.color,
            selectedSize: variant?.size,
          },
        ];
      }
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          const validQty = Math.min(item.product.stock, quantity);
          return { ...item, quantity: validQty };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setCart([]);
    setCoupon(null);
  };

  const applyCoupon = (code: string): { success: boolean; message: string } => {
    const clean = code.trim().toUpperCase();
    const found = AVAILABLE_COUPONS.find((c) => c.code === clean);
    if (!found) {
      return { success: false, message: 'Invalid coupon code. Try WELCOME10 or PROMO20.' };
    }

    if (subtotal < found.minOrder) {
      return {
        success: false,
        message: `Order must be at least $${found.minOrder} to apply coupon ${found.code}.`,
      };
    }

    setCoupon(found);
    return { success: true, message: `Coupon ${found.code} applied successfully! (${found.discountPercent}% OFF)` };
  };

  const removeCoupon = () => {
    setCoupon(null);
  };

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  // Calculations
  const itemCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = Number(
    cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0).toFixed(2)
  );

  const freeShippingThreshold = 100;
  const amountNeededForFreeShipping = Math.max(0, Number((freeShippingThreshold - subtotal).toFixed(2)));

  let discountAmount = 0;
  if (coupon && subtotal >= coupon.minOrder) {
    discountAmount = Number(((subtotal * coupon.discountPercent) / 100).toFixed(2));
    if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
      discountAmount = coupon.maxDiscount;
    }
  }

  let shippingFee = 0;
  if (shippingTier === 'express') {
    shippingFee = 9.99;
  } else if (shippingTier === 'overnight') {
    shippingFee = 19.99;
  } else {
    // standard
    shippingFee = subtotal >= freeShippingThreshold || subtotal === 0 ? 0 : 7.99;
  }

  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxAmount = Number((taxableAmount * 0.08).toFixed(2)); // 8% sales tax
  const total = Number((taxableAmount + shippingFee + taxAmount).toFixed(2));

  return (
    <CartContext.Provider
      value={{
        cart,
        itemCount,
        subtotal,
        discountAmount,
        shippingFee,
        taxAmount,
        total,
        coupon,
        shippingTier,
        isCartOpen,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        applyCoupon,
        removeCoupon,
        setShippingTier,
        setIsCartOpen,
        openCart,
        closeCart,
        freeShippingThreshold,
        amountNeededForFreeShipping,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};

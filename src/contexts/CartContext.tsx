'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

interface CartItem {
  bundleTypeId: string;
  quantity: number;
  name?: {
    en: string;
    es: string;
  };
  price?: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (bundleTypeId: string) => void;
  updateQuantity: (bundleTypeId: string, quantity: number) => void;
  clearCart: () => void;
  total: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = useCallback((item: CartItem) => {
    setItems(currentItems => {
      const existingItem = currentItems.find(i => i.bundleTypeId === item.bundleTypeId);
      if (existingItem) {
        return currentItems.map(i => 
          i.bundleTypeId === item.bundleTypeId 
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        );
      }
      return [...currentItems, item];
    });
  }, []);

  const removeItem = useCallback((bundleTypeId: string) => {
    setItems(currentItems => currentItems.filter(item => item.bundleTypeId !== bundleTypeId));
  }, []);

  const updateQuantity = useCallback((bundleTypeId: string, quantity: number) => {
    setItems(currentItems =>
      currentItems.map(item =>
        item.bundleTypeId === bundleTypeId ? { ...item, quantity } : item
      )
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const total = items.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, total }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
} 
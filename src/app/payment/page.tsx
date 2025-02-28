'use client';

import React, { Suspense } from "react";
import { Header } from "@/components/header";
import { PageTransition } from "@/components/page-transition";
import { Spinner } from "@/components/spinner";
import { useCart } from "@/contexts/CartContext";
import { useLanguageContext } from "@/contexts/LanguageContext";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

function CartSummary() {
  const { items, total, removeItem, updateQuantity } = useCart();
  const { language } = useLanguageContext();

  if (items.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">
          {language === 'en' ? 'Your cart is empty' : 'Tu carrito está vacío'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <Card key={item.bundleTypeId} className="p-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-medium">
                {item.name?.[language]}
              </h3>
              <p className="text-sm text-gray-500">
                {formatCurrency(item.price || 0)}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateQuantity(item.bundleTypeId, Math.max(1, item.quantity - 1))}
                  className="p-1 rounded-full hover:bg-gray-100"
                >
                  -
                </button>
                <span className="w-8 text-center">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.bundleTypeId, item.quantity + 1)}
                  className="p-1 rounded-full hover:bg-gray-100"
                >
                  +
                </button>
              </div>
              <button
                onClick={() => removeItem(item.bundleTypeId)}
                className="text-red-500 hover:text-red-600"
              >
                ×
              </button>
            </div>
          </div>
        </Card>
      ))}
      <div className="pt-4 border-t">
        <div className="flex justify-between items-center">
          <span className="font-medium">
            {language === 'en' ? 'Total' : 'Total'}:
          </span>
          <span className="font-bold text-lg">
            {formatCurrency(total)}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 to-white pt-16">
      <Header title={{ en: "Payment", es: "Pago" }} />
      <PageTransition key="payment">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <Suspense
              fallback={
                <div className="flex-1 flex items-center justify-center">
                  <Spinner size="lg" />
                </div>
              }
            >
              <CartSummary />
            </Suspense>
          </div>
        </div>
      </PageTransition>
    </div>
  );
}

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store"; 
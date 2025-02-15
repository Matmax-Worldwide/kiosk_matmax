"use client";
import React, { Suspense } from "react";
import { Header } from "@/components/header";
import { PageTransition } from "@/components/page-transition";
import { Spinner } from "@/components/spinner";
import { PackageSelector } from "@/components/buy-packages/package-selector";

export default function BuyBundleTypesPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 to-white pt-16">
      <Header title={{ en: "Buy Packages", es: "Comprar Paquetes" }} />
      <PageTransition key="buy-packages">
        <Suspense 
          fallback={
            <div className="flex-1 flex items-center justify-center">
              <Spinner size="lg" />
            </div>
          }
        >
          <PackageSelector />
        </Suspense>
      </PageTransition>
    </div>
  );
} 
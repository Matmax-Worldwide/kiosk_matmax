import React, { Suspense } from "react";
import { Header } from "@/components/header";
import { Spinner } from "@/components/spinner";
import { PageTransition } from "@/components/page-transition";
import { PaymentContent } from "./payment-content";

export default function PaymentPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <Header title={{ en: "Payment", es: "Pago" }} />
      <PageTransition key="payment">
        <Suspense 
          fallback={
            <div className="flex-1 flex items-center justify-center">
              <Spinner size="lg" />
            </div>
          }
        >
          <PaymentContent />
        </Suspense>
      </PageTransition>
    </main>
  );
}

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store"; 
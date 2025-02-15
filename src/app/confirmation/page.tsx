import React, { Suspense } from "react";
import { Header } from "@/components/header";
import { Spinner } from "@/components/spinner";
import { PageTransition } from "@/components/page-transition";
import { ConfirmationContent } from "./confirmation-content";

export default function ConfirmationPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-green-50/50">
      <Header title={{ en: "Purchase Confirmation", es: "Confirmación de Compra" }} />
      <PageTransition key="confirmation">
        <Suspense 
          fallback={
            <div className="flex-1 flex items-center justify-center">
              <Spinner size="lg" />
            </div>
          }
        >
          <ConfirmationContent />
        </Suspense>
      </PageTransition>
    </main>
  );
}

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store"; 
import React, { Suspense } from "react";
import { Header } from "@/components/header";
import { Spinner } from "@/components/spinner";
import { PageTransition } from "@/components/page-transition";
import { CheckInContent } from "./check-in-content";

export default function CheckInPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <Header title={{ en: "Check-in", es: "Check-in" }} />
      <PageTransition key="check-in">
        <Suspense 
          fallback={
            <div className="flex-1 flex items-center justify-center">
              <Spinner size="lg" />
            </div>
          }
        >
          <CheckInContent />
        </Suspense>
      </PageTransition>
    </main>
  );
}

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store"; 
import React, { Suspense } from "react";
import { Header } from "@/components/header";
import { Spinner } from "@/components/spinner";
import { PageTransition } from "@/components/page-transition";
import { ExistingContent } from "./existing-content";

export default function ExistingUserPage() {
  return (
    <div className="min-h-screen flex flex-col pt-16 bg-gradient-to-b">
      <Header title={{ en: "Find Your Account", es: "Encuentra tu Cuenta" }} />
      <PageTransition key="existing">
        <Suspense 
          fallback={
            <div className="flex-1 flex items-center justify-center">
              <Spinner size="lg" />
            </div>
          }
        >
          <ExistingContent />
        </Suspense>
      </PageTransition>
    </div>
  );
}

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

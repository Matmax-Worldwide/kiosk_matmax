import React, { Suspense } from "react";
import { Header } from "@/components/header";
import { Spinner } from "@/components/spinner";
import { PageTransition } from "@/components/page-transition";
import { ClassPassContent } from "./class-pass-content";

export default function ClassPassPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <Header title={{ en: "Class Pass", es: "Pase de Clase" }} />
      <PageTransition key="class-pass">
        <Suspense 
          fallback={
            <div className="flex-1 flex items-center justify-center">
              <Spinner size="lg" />
            </div>
          }
        >
          <ClassPassContent />
        </Suspense>
      </PageTransition>
    </main>
  );
}

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

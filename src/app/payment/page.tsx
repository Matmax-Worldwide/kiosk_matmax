'use client';

import React, { Suspense } from "react";
import { Header } from "@/components/header";
import { PageTransition } from "@/components/page-transition";
import { Spinner } from "@/components/spinner";
import { ReservationContent } from "./reservation-content";

export default function ReservationPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 to-white pt-16">
      <Header title={{ en: "Reservation", es: "Reserva" }} />
      <PageTransition key="reservation">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <Suspense
              fallback={
                <div className="flex-1 flex items-center justify-center">
                  <Spinner size="lg" />
                </div>
              }
            >
              <ReservationContent />
            </Suspense>
          </div>
        </div>
      </PageTransition>
    </div>
  );
}

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store"; 
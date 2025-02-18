"use client";

import React, { Suspense } from "react";
import { Header } from "@/components/header";
import { Spinner } from "@/components/spinner";
import { PageTransition } from "@/components/page-transition";
import { UserDetailsContent } from "./user-details-content";
import { useQuery } from "@apollo/client";
import { GET_CONSUMER } from "@/lib/graphql/queries";
import { useSearchParams } from "next/navigation";

// Componente separado para manejar la lógica del header dinámico
function DynamicHeader() {
  const searchParams = useSearchParams();
  const consumerId = searchParams.get('consumerId');

  const { data: consumerData, loading } = useQuery(GET_CONSUMER, {
    variables: { id: consumerId },
    skip: !consumerId,
  });

  if (loading) {
    return (
      <Header 
        title={{ 
          en: "Loading...", 
          es: "Cargando..." 
        }} 
      />
    );
  }

  const consumer = consumerData?.consumer;
  const fullName = consumer ? `${consumer.firstName} ${consumer.lastName}` : '';

  return (
    <Header 
      title={{ 
        en: fullName || "User Details", 
        es: fullName || "Detalles de Usuario" 
      }} 
    />
  );
}

export default function UserDetailsPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-green-50/50">
      <Suspense 
        fallback={
          <Header 
            title={{ 
              en: "Loading...", 
              es: "Cargando..." 
            }} 
          />
        }
      >
        <DynamicHeader />
      </Suspense>
      <PageTransition key="user-details">
        <Suspense 
          fallback={
            <div className="flex-1 flex items-center justify-center">
              <Spinner size="lg" />
            </div>
          }
        >
          <UserDetailsContent />
        </Suspense>
      </PageTransition>
    </main>
  );
}

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store"; 
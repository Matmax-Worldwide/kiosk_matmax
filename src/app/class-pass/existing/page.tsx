"use client";
import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/header";
import { Card } from "@/components/ui/card";
import { useLanguageContext } from "@/contexts/LanguageContext";
import { UserSearch } from "@/components/forms/user-search";
import { PageTransition } from "@/components/page-transition";

export default function ExistingUserPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language } = useLanguageContext();
  const packageId = searchParams.get('packageId');

  const handleUserSelect = (consumer: { id: string }) => {
    const userId = consumer.id;
    router.push(`/buy-packages/payment?packageId=${packageId}&userId=${userId}`);
  };

  return (
    <div className="min-h-screen flex flex-col pt-16">
      <Header title={{ en: "Select Existing User", es: "Seleccionar Usuario Existente" }} />
      <PageTransition>
        <div className="flex-1 p-6">
          <div className="max-w-2xl mx-auto">
            <Card className="p-6">
              <h2 className="text-xl font-medium mb-4">
                {language === "en" ? "Select a User" : "Selecciona un Usuario"}
              </h2>
              <UserSearch onSelect={handleUserSelect} />
            </Card>
          </div>
        </div>
      </PageTransition>
    </div>
  );
} 
"use client";
import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/header";
import { Card } from "@/components/ui/card";
import { useLanguageContext } from "@/contexts/LanguageContext";
import { UserSearch } from "@/components/forms/user-search";
import { PageTransition } from "@/components/page-transition";
import { Button } from "@/components/ui/button";

export default function ExistingUserPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language } = useLanguageContext();
  const packageId = searchParams.get('packageId');
  const classId = searchParams.get('classId'); // Optional

  if (!packageId) {
    return (
      <div className="min-h-screen flex flex-col pt-16">
        <Header title={{ en: "Error", es: "Error" }} />
        <PageTransition>
          <div className="flex-1 p-6">
            <div className="max-w-2xl mx-auto">
              <Card className="p-6 text-center">
                <p className="text-red-600 mb-4">
                  {language === "en"
                    ? "Missing required parameters. Please select a package first."
                    : "Faltan parámetros requeridos. Por favor, seleccione un paquete primero."}
                </p>
                <Button
                  onClick={() => router.push('/buy-packages')}
                  variant="default"
                >
                  {language === "en" ? "Return to Packages" : "Volver a Paquetes"}
                </Button>
              </Card>
            </div>
          </div>
        </PageTransition>
      </div>
    );
  }

  const handleUserSelect = (consumer: { id: string }) => {
    const userId = consumer.id;
    let url = `/payment?packageId=${packageId}&userId=${userId}`;
    if (classId) {
      url += `&classId=${classId}`;
    }
    router.push(url);
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

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

"use client";
import React, { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguageContext } from "@/contexts/LanguageContext";
import { UserPlus, Users } from "lucide-react";
import { PageTransition } from "@/components/page-transition";

function SelectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language } = useLanguageContext();
  const packageId = searchParams.get('packageId');
  const classId = searchParams.get('classId');

  // Only packageId is required now
  if (!packageId) {
    return (
      <div className="flex-1 p-6 pt-16">
        <Card className="p-6 text-center">
          <p className="text-red-600 mb-4">
            {language === "en"
              ? "Missing required parameters. Please select a package first."
              : "Faltan parámetros requeridos. Por favor, seleccione un paquete primero."}
          </p>
          <Button
            onClick={() => router.push('/class-pass')}
            variant="default"
          >
            {language === "en" ? "Return to Packages" : "Volver a Paquetes"}
          </Button>
        </Card>
      </div>
    );
  }

  // Build the query string conditionally
  const buildQueryString = () => {
    return classId
      ? `?packageId=${packageId}&classId=${classId}`
      : `?packageId=${packageId}`;
  };

  return (
    <div className="flex-1 p-6 pt-16">
      <div className="max-w-2xl mx-auto">
        <Card className="p-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-medium mb-2">
              {language === "en" ? "Do you have an account?" : "¿Tienes una cuenta?"}
            </h2>
            <p className="text-gray-600">
              {language === "en"
                ? "Choose an option to continue"
                : "Elige una opción para continuar"}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={() => router.push(`/existing${buildQueryString()}`)}
              variant="outline"
              className="p-6 h-auto flex flex-col items-center"
            >
              <Users className="h-8 w-8 mb-2" />
              <span className="font-medium">
                {language === "en" ? "Existing User" : "Usuario Existente"}
              </span>
              <span className="text-sm text-gray-500">
                {language === "en"
                  ? "I already have an account"
                  : "Ya tengo una cuenta"}
              </span>
            </Button>

            <Button
              onClick={() => router.push(`/new${buildQueryString()}`)}
              variant="outline"
              className="p-6 h-auto flex flex-col items-center"
            >
              <UserPlus className="h-8 w-8 mb-2" />
              <span className="font-medium">
                {language === "en" ? "New User" : "Usuario Nuevo"}
              </span>
              <span className="text-sm text-gray-500">
                {language === "en"
                  ? "Create a new account"
                  : "Crear una cuenta nueva"}
              </span>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default function SelectUserTypePage() {
  return (
    <div className="min-h-screen flex flex-col pt-16">
      <Header title={{ en: "Select Account Type", es: "Seleccionar Tipo de Cuenta" }} />
      <PageTransition>
        <Suspense fallback={<div>Loading...</div>}>
          <SelectContent />
        </Suspense>
      </PageTransition>
    </div>
  );
}

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

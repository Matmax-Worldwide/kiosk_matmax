"use client";
import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/header";
import { Card } from "@/components/ui/card";
import { RegistrationForm } from "@/components/forms/registration-form";
import { useLanguageContext } from "@/contexts/LanguageContext";
import { PageTransition } from "@/components/page-transition";
import { useMutation } from "@apollo/client";
import { CREATE_CONSUMER } from "@/lib/graphql/queries"; // Adjust the path as necessary


function NewUserContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language } = useLanguageContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const packageId = searchParams.get('packageId');

  const [createConsumer] = useMutation(CREATE_CONSUMER);

  const handleSubmit = async (data: { firstName: string; lastName: string; email: string; phoneNumber?: string }) => {
    if (!packageId) {
      router.push("/buy-packages");
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await createConsumer({ variables: { input: data } });
      const newUserId = response.data.createConsumer.id;
      router.push(`/buy-packages/payment?packageId=${packageId}&userId=${newUserId}`);
    } catch (error) {
      console.error("Registration error:", error);
      
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 p-6">
      <div className="max-w-2xl mx-auto">
        <Card className="p-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-medium mb-2">
              {language === "en" ? "Create your account" : "Crea tu cuenta"}
            </h2>
            <p className="text-gray-600">
              {language === "en"
                ? "Enter your details to purchase the package"
                : "Ingresa tus datos para comprar el paquete"}
            </p>
          </div>
          <RegistrationForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
        </Card>
      </div>
    </div>
  );
}

export default function BuyPackagesNewUserPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header title={{ en: "Create Account", es: "Crear Cuenta" }} />
      <PageTransition>
        <Suspense fallback={<div>Loading...</div>}>
          <NewUserContent />
        </Suspense>
      </PageTransition>
    </div>
  );
}

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store"; 
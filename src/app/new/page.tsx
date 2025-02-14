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
import { motion } from "framer-motion";
import { UserPlus } from "lucide-react";

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
      router.push(`/payment?packageId=${packageId}&userId=${newUserId}`);
    } catch (error) {
      console.error("Registration error:", error);
      
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 p-6">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-4xl mx-auto mb-8"
        >
          <h2 className="text-3xl font-bold mb-3 bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
            {language === "en" ? "Create your account" : "Crea tu cuenta"}
          </h2>
          <p className="text-xl text-gray-600">
            {language === "en"
              ? "Enter your details to purchase the package"
              : "Ingresa tus datos para comprar el paquete"}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-8 bg-white/90 backdrop-blur-sm border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-r from-green-600 to-teal-600 flex items-center justify-center text-white mx-auto mb-6">
              <UserPlus className="h-8 w-8" />
            </div>
            <RegistrationForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
          </Card>
        </motion.div>
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
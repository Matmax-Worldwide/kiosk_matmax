"use client";
import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/header";
import { Card } from "@/components/ui/card";
import { RegistrationForm } from "@/components/forms/registration-form";
import { PageTransition } from "@/components/page-transition";
import { useMutation } from "@apollo/client";
import { CREATE_CONSUMER } from "@/lib/graphql/queries"; // Adjust the path as necessary
import { motion } from "framer-motion";
import { UserPlus } from "lucide-react";

function NewUserContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const packageId = searchParams.get("packageId");
  const classId = searchParams.get("classId");

  const [createConsumer] = useMutation(CREATE_CONSUMER);

  const handleSubmit = async (data: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
  }) => {
    try {
      setIsSubmitting(true);

      const response = await createConsumer({ variables: { input: data } });
      const newUserId = response.data.createConsumer.id;

      // Build URL parameters
      const params = new URLSearchParams();
      if (packageId) params.append("packageId", packageId);
      if (classId) params.append("classId", classId);
      if (newUserId) params.append("userId", newUserId);

      // Determine next route based on parameters
      let nextRoute = "/class-pass"; // Default route
      if (packageId) {
        nextRoute = "/payment";
      } else if (classId) {
        nextRoute = "/buy-packages";
      }

      router.push(
        `${nextRoute}${params.toString() ? `?${params.toString()}` : ""}`
      );
    } catch (error) {
      console.error("Registration error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 pt-16">
      <div className="w-full h-full mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-8 bg-white/90 backdrop-blur-sm border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 h-[calc(100vh-64px)]">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-r from-green-600 to-teal-600 flex items-center justify-center text-white mx-auto mb-6">
              <UserPlus className="h-8 w-8" />
            </div>
            <RegistrationForm
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
            />
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

export default function BuyPackagesNewUserPage() {
  return (
    <div className="min-h-screen flex flex-col ">
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

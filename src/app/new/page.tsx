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
import { SuccessOverlay } from "@/components/ui/success-overlay";

function NewUserContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showNewUserOverlay, setShowNewUserOverlay] = useState(false);
  
  const bundleTypeId = searchParams.get("bundleTypeId");
  const classId = searchParams.get("classId");
  const activity = searchParams.get("activity");
  const instructor = searchParams.get("instructor");
  const time = searchParams.get("time");
  const day = searchParams.get("day");
  const now = searchParams.get("now");
  const checkin = searchParams.get("checkin");
  const buyPackages = searchParams.get("buyPackages");

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

      setShowNewUserOverlay(true);

      // Build URL parameters
      const params = new URLSearchParams();
      
      // Si hay bundleTypeId, ir a payment con el userId y bundleTypeId
      if (bundleTypeId) {
        params.append("bundleTypeId", bundleTypeId);
        params.append("consumerId", newUserId);
        
        // Agregar parámetros adicionales si hay una clase seleccionada
        if (classId) {
          params.append("classId", classId);
          if (activity) params.append("activity", activity);
          if (instructor) params.append("instructor", instructor);
          if (time) params.append("time", time);
          if (day) params.append("day", day);
          if (now) params.append("now", now);
        }
        
        setTimeout(() => {
          router.push(`/payment?${params.toString()}`);
        }, 1500);
        return;
      }

      // Si hay buyPackages=true, ir a buy-packages con el consumerId
      if (buyPackages === "true") {
        params.append("consumerId", newUserId);
        
        setTimeout(() => {
          router.push(`/buy-packages?${params.toString()}`);
        }, 1500);
        return;
      }

      // Si solo hay classId, ir a buy-packages
      if (classId) {
        params.append("classId", classId);
        params.append("consumerId", newUserId);
        if (activity) params.append("activity", activity);
        if (instructor) params.append("instructor", instructor);
        if (time) params.append("time", time);
        if (day) params.append("day", day);
        if (now) params.append("now", now);
        if (checkin) params.append("checkin", "true");
        
        setTimeout(() => {
          router.push(`/buy-packages?${params.toString()}`);
        }, 1500);
        return;
      }

      // Si no hay parámetros, ir a buy-packages
      params.append("consumerId", newUserId);
      if (checkin) params.append("checkin", "true");
      
      setTimeout(() => {
        router.push(`/buy-packages?${params.toString()}`);
      }, 1500);

    } catch (error) {
      console.error("Registration error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 pt-16">
      <div className="w-full h-full mx-auto">
        {/* New User Success Overlay */}
        <SuccessOverlay
          aria-live="polite"
          show={showNewUserOverlay}
          title={{
            en: "Account Created Successfully!",
            es: "¡Cuenta Creada Exitosamente!"
          }}
          message={{
            en: "Your account has been created. You will be redirected...",
            es: "Tu cuenta ha sido creada. Serás redirigido..."
          }}
          variant="new-user"
          duration={1500}
        />

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

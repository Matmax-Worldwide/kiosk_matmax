"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserSearch } from "@/components/forms/user-search";
import { useLanguageContext } from "@/contexts/LanguageContext";
import { useNotificationContext } from "@/contexts/NotificationContext";
import { Spinner } from "@/components/spinner";

interface Consumer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
}

export default function CheckInPage() {
  const router = useRouter();
  const { language } = useLanguageContext();
  const { addNotification } = useNotificationContext();
  const [loading, setLoading] = useState(false);

  const handleUserSelect = async (consumer: Consumer) => {
    try {
      setLoading(true);
      // Here you would typically navigate to a page showing the user's reservations
      // or handle the check-in process
      router.push(`/check-in/${consumer.id}`);
    } catch (error) {
      console.error("Check-in error:", error);
      addNotification(
        {
          en: "Failed to process check-in",
          es: "Error al procesar el registro"
        },
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header title={{ en: "Check-In", es: "Check-In" }} />
      <div className="flex-1 p-6">
        <div className="max-w-2xl mx-auto">
          <Card className="p-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-medium mb-2">
                {language === "en" ? "Find Your Booking" : "Encuentra tu Reserva"}
              </h2>
              <p className="text-gray-600">
                {language === "en"
                  ? "Enter your name or email to find your booking"
                  : "Ingresa tu nombre o correo para encontrar tu reserva"}
              </p>
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <Spinner size="lg" />
              </div>
            ) : (
              <UserSearch onSelect={handleUserSelect} />
            )}

            <div className="mt-8 text-center">
              <Button
                variant="ghost"
                onClick={() => router.push("/")}
              >
                {language === "en" ? "Return to Home" : "Volver al Inicio"}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
} 
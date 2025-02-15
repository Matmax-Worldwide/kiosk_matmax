"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { useLanguageContext } from "@/contexts/LanguageContext";
import { UserSearch } from "@/components/forms/user-search";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { SuccessOverlay } from "@/components/ui/success-overlay";

export function ExistingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language } = useLanguageContext();
  const [showSearchOverlay, setShowSearchOverlay] = useState(false);
  const packageId = searchParams.get('packageId');
  const classId = searchParams.get('classId');

  const handleUserSelect = (consumer: { id: string }) => {
    setShowSearchOverlay(true);

    const params = new URLSearchParams();
    if (packageId) params.append('packageId', packageId);
    if (classId) params.append('classId', classId);
    if (consumer.id) params.append('userId', consumer.id);

    // Determine next route based on parameters
    let nextRoute = '/class-pass'; // Default route
    if (packageId) {
      nextRoute = '/payment';
    } else if (classId) {
      nextRoute = '/buy-packages';
    }

    setTimeout(() => {
      router.push(`${nextRoute}${params.toString() ? `?${params.toString()}` : ''}`);
    }, 1500);
  };

  return (
    <>
      {/* Existing User Success Overlay */}
      <SuccessOverlay
        show={showSearchOverlay}
        title={{
          en: "Account Found!",
          es: "¡Cuenta Encontrada!"
        }}
        message={{
          en: "We found your account. You will be redirected...",
          es: "Hemos encontrado tu cuenta. Serás redirigido..."
        }}
        variant="existing-user"
        duration={1500}
      />

      <div className="flex-1 p-6">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-4xl mx-auto mb-8"
          >
            <h2 className="text-3xl font-bold mb-3 bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
              {language === "en" ? "Find Your Account" : "Encuentra tu Cuenta"}
            </h2>
            <p className="text-xl text-gray-600">
              {language === "en"
                ? packageId
                  ? "Search your account to purchase the package"
                  : "Search your account to continue"
                : packageId
                  ? "Busca tu cuenta para comprar el paquete"
                  : "Busca tu cuenta para continuar"}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-8 bg-white/90 backdrop-blur-sm border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-r from-green-600 to-teal-600 flex items-center justify-center text-white mx-auto mb-6">
                <Search className="h-8 w-8" />
              </div>
              <UserSearch onSelect={handleUserSelect} />
            </Card>
          </motion.div>
        </div>
      </div>
    </>
  );
} 
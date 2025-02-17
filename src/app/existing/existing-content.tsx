"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { UserSearchOptions } from "@/components/forms/user-search-options";
import { motion } from "framer-motion";
import { SuccessOverlay } from "@/components/ui/success-overlay";

interface SearchResult {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  bundles?: Array<{
    id: string;
    status: string;
    remainingUses: number;
    bundleType: {
      id: string;
      name: string;
      price: number;
    };
  }>;
}

export function ExistingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showSearchOverlay, setShowSearchOverlay] = useState(false);
  
  const packageId = searchParams.get('packageId');
  const classId = searchParams.get('classId');
  const bundleTypeId = searchParams.get('bundleTypeId');

  const handleUserSearch = (consumer: SearchResult) => {
    handleDirectNavigation(consumer);
  };

  const handleDirectNavigation = (consumer: SearchResult) => {
    setShowSearchOverlay(true);
    setTimeout(() => {
      const params = new URLSearchParams();
      params.append('consumerId', consumer.id);
      if (classId) params.append('classId', classId);
      if (bundleTypeId) params.append('bundleTypeId', bundleTypeId);
      if (packageId) params.append('packageId', packageId);
      
      router.push(`/user-details?${params.toString()}`);
    }, 1500);
  };

  return (
    <main className="bg-gradient-to-b from-white to-gray-50">
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

      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-10 bg-white/95 backdrop-blur-sm border border-green-100 
              shadow-xl hover:shadow-2xl transition-all duration-500 rounded-2xl">
              <UserSearchOptions 
                onSelect={handleUserSearch} 
                onTextChange={() => {}}
              />
            </Card>
          </motion.div>
        </div>
      </div>
    </main>
  );
} 
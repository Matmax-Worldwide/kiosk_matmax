"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { UserSearchOptions } from "@/components/forms/user-search-options";
import { motion } from "framer-motion";

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
  
  const packageId = searchParams.get('packageId');
  const classId = searchParams.get('classId');
  const bundleTypeId = searchParams.get('bundleTypeId');
  const buyPackages = searchParams.get('buyPackages');

  const handleUserSearch = (consumer: SearchResult) => {
    handleDirectNavigation(consumer);
  };

  const handleDirectNavigation = (consumer: SearchResult) => {
    setTimeout(() => {
      const params = new URLSearchParams();
      params.append('consumerId', consumer.id);
      
      
      if (classId) params.append('classId', classId);
      if (bundleTypeId) params.append('bundleTypeId', bundleTypeId);
      if (packageId) params.append('packageId', packageId);
      if (buyPackages === 'true') params.append('buyPackages', 'true');
      if (searchParams.get('now')) params.append('now', 'true');

      router.push(`/user-details?${params.toString()}`);
      
      
    }, 1500);
  };

  return (
    <main className="">
      <div className="container mx-auto px-4 pt-16">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-10 bg-white/95 backdrop-blur-sm hover:shadow-2xl transition-all duration-500 rounded-2xl">
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
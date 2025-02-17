"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@apollo/client";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Search, User2, Loader2 } from "lucide-react";
import { SEARCH_CONSUMERS } from "@/lib/graphql/queries";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useLanguageContext } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { maskEmail, maskPhoneNumber } from "@/lib/utils/mask-data";

interface Consumer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
}

function SearchSkeletonLoader() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="mt-4 space-y-2"
    >
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="p-3 rounded-lg bg-white shadow-sm border border-gray-100"
        >
          <div className="flex items-center gap-3">
            <Skeleton className="w-5 h-5 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-5 w-48 mb-1" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </div>
      ))}
    </motion.div>
  );
}

export function CheckInContent() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const { language } = useLanguageContext();
  const [isSearching, setIsSearching] = useState(false);

  // Search consumers query
  const { data: searchData, loading: searchLoading } = useQuery(SEARCH_CONSUMERS, {
    variables: { query: searchQuery, limit: 5 },
    skip: searchQuery.length < 3,
  });

  const handleConsumerSelect = (consumerId: string) => {
    router.push(`/check-in/${consumerId}`);
  };

  return (
    <div className="mx-auto px-4 py-8 mt-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto"
      >
        <Card className="p-10 bg-white/95 backdrop-blur-sm hover:shadow-2xl transition-all duration-500 rounded-2xl">


          <div className="space-y-3">
            <Input
              type="text"
              placeholder={language === "en" 
                ? "Search by name, email or phone" 
                : "Buscar por nombre, correo o teléfono"}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchQuery.length >= 2) {
                  e.preventDefault();
                  setIsSearching(true);
                }
              }}
              className={cn(
                "text-lg py-6 pl-6 pr-6 rounded-2xl border-2 focus-visible:ring-offset-0",
                "border-gray-200 focus-visible:border-green-500 focus-visible:ring-green-500",
                "transition-all duration-200"
              )}
            />
            <Button
              size="lg"
              type="button"
              className={cn(
                "w-full h-14 rounded-xl text-lg font-medium transition-all duration-200",
                searchQuery.length < 2 
                  ? "bg-gray-100 text-gray-400" 
                  : "bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white shadow-md hover:shadow-lg"
              )}
              disabled={searchQuery.length < 2 || isSearching}
              onClick={() => {
                if (searchQuery.length >= 2) {
                  setIsSearching(true);
                }
              }}
            >
              {isSearching ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  {language === "en" ? "Searching..." : "Buscando..."}
                </>
              ) : (
                <>
                  <Search className="h-5 w-5 mr-2" />
                  {language === "en" ? "Search User" : "Buscar Usuario"}
                </>
              )}
            </Button>
          </div>

          {/* Search Results with Loading State */}
          <AnimatePresence>
            {searchQuery.length >= 3 && (
              searchLoading ? (
                <SearchSkeletonLoader />
              ) : (
                searchData?.searchConsumers && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mt-4 space-y-2"
                  >
                    {searchData.searchConsumers.map((consumer: Consumer) => (
                      <motion.div
                        key={consumer.id}
                        whileHover={{ scale: 1.02 }}
                        className="p-4 rounded-lg bg-white shadow-sm hover:shadow-md
                        cursor-pointer border border-gray-100"
                        onClick={() => handleConsumerSelect(consumer.id)}
                      >
                        <div className="flex items-center gap-3">
                          <User2 className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="font-medium">
                              {`${consumer.firstName} ${consumer.lastName}`}
                            </p>
                            <p className="text-sm text-gray-500">{maskEmail(consumer.email)}</p>
                            {consumer.phoneNumber && (
                              <p className="text-sm text-gray-500">
                                {maskPhoneNumber(consumer.phoneNumber)}
                              </p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )
              )
            )}
          </AnimatePresence>
        </Card>
      </motion.div>
    </div>
  );
} 
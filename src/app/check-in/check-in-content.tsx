"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
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
import { SuccessOverlay } from "@/components/ui/success-overlay";
import debounce from "lodash/debounce";

interface SearchResult {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
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
  const [inputValue, setInputValue] = useState("");
  const { language } = useLanguageContext();
  const [isSearching, setIsSearching] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SearchResult | null>(null);
  const [showResults, setShowResults] = useState(false);

  // Search consumers query
  const { data: searchData, loading } = useQuery(SEARCH_CONSUMERS, {
    variables: { query: inputValue, limit: 5 },
    skip: inputValue.length < 2,
    onError: (error) => {
      console.error('Search error:', error);
      setIsSearching(false);
    }
  });

  const handleSearch = useCallback(() => {
    if (inputValue.length >= 2) {
      setIsSearching(true);
      setShowResults(true);
      setTimeout(() => setIsSearching(false), 500);
    }
  }, [inputValue]);

  const debouncedSearch = useMemo(
    () => debounce(handleSearch, 300),
    [handleSearch]
  );

  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  const handleConsumerSelect = (consumer: SearchResult) => {
    setSelectedUser(consumer);
    setShowOverlay(true);
  };

  const handleOverlayComplete = () => {
    if (selectedUser) {
      setTimeout(() => {
        router.push(`/check-in/${selectedUser.id}`);
      }, 800);
    }
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
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                if (e.target.value.length < 2) {
                  setShowResults(false);
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
                inputValue.length < 2 
                  ? "bg-gray-100 text-gray-400" 
                  : "bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white shadow-md hover:shadow-lg"
              )}
              disabled={inputValue.length < 2 || isSearching}
              onClick={debouncedSearch}
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
          <AnimatePresence mode="wait">
            {showResults && (
              <>
                {isSearching || loading ? (
                  <SearchSkeletonLoader />
                ) : searchData?.searchConsumers && searchData.searchConsumers.length > 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mt-4 space-y-2"
                  >
                    {searchData.searchConsumers.map((consumer: SearchResult) => (
                      <motion.div
                        key={consumer.id}
                        whileHover={{ scale: 1.02 }}
                        className="p-4 rounded-lg bg-white shadow-sm hover:shadow-md
                        cursor-pointer border border-gray-100"
                        onClick={() => handleConsumerSelect(consumer)}
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
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-4 text-center text-gray-500"
                  >
                    {language === "en" 
                      ? "No users found. Try a different search term." 
                      : "No se encontraron usuarios. Intenta con otros términos."}
                  </motion.div>
                )}
              </>
            )}
          </AnimatePresence>

          {/* Success Overlay */}
          <SuccessOverlay
            aria-live="polite"
            show={showOverlay}
            title={{
              en: `Welcome ${selectedUser?.firstName || ''}!`,
              es: `¡Bienvenido ${selectedUser?.firstName || ''}!`
            }}
            message={{
              en: "Preparing your check-in...",
              es: "Preparando tu check-in..."
            }}
            variant="checkin"
            duration={1500}
            onComplete={handleOverlayComplete}
          />
        </Card>
      </motion.div>
    </div>
  );
} 
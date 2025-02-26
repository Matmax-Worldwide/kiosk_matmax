"use client";

import { useState, useCallback, useMemo, useEffect, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@apollo/client";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Search, User2, Loader2, AlertCircle } from "lucide-react";
import { SEARCH_CONSUMERS } from "@/lib/graphql/queries";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useLanguageContext } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { maskEmail, maskPhoneNumber } from "@/lib/utils/mask-data";
import debounce from "lodash/debounce";
import { NoUsersFound } from "@/components/ui/custom/no-users-found";

interface Consumer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
}

// Memoized skeleton loader component
const SearchSkeletonLoader = memo(() => (
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
));
SearchSkeletonLoader.displayName = 'SearchSkeletonLoader';

// Memoized consumer result item component
const ConsumerResultItem = memo(({ consumer, onClick }: { consumer: Consumer; onClick: () => void }) => {
  const [isClicked, setIsClicked] = useState(false);

  const handleClick = () => {
    setIsClicked(true);
    onClick();
  };

  return (
    <motion.div
      className={cn(
        "p-4 rounded-lg bg-white shadow-sm cursor-pointer border border-gray-100 transition-all duration-200",
        "hover:shadow-md hover:border-green-500 hover:bg-green-50/50 active:bg-green-100/50",
        isClicked && "shadow-md border-green-500 bg-green-50/50"
      )}
      onClick={handleClick}
      layout
    >
      <div className="flex items-center gap-3 transition-colors duration-200">
        <User2 className="w-5 h-5 text-gray-400" />
        <div>
          <p className="font-medium">{`${consumer.firstName} ${consumer.lastName}`}</p>
          <p className="text-sm text-gray-500">{maskEmail(consumer.email)}</p>
          {consumer.phoneNumber && (
            <p className="text-sm text-gray-500">{maskPhoneNumber(consumer.phoneNumber)}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
});
ConsumerResultItem.displayName = 'ConsumerResultItem';

// Memoized search results component
const SearchResults = memo(({ 
  isSearching, 
  loading, 
  searchData, 
  onConsumerClick,
  setInputValue,
  setShowResults,
  setError,
  inputValue
}: { 
  isSearching: boolean;
  loading: boolean;
  searchData: { searchConsumers: Consumer[] };
  onConsumerClick: (id: string) => void;
  setInputValue: (value: string) => void;
  setShowResults: (value: boolean) => void;
  setError: (value: string | null) => void;
  inputValue: string;
}) => {
  if (isSearching || loading) return <SearchSkeletonLoader />;
  
  if (searchData?.searchConsumers?.length > 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="mt-4 space-y-2"
      >
        {searchData.searchConsumers.map((consumer: Consumer) => (
          <ConsumerResultItem
            key={consumer.id}
            consumer={consumer}
            onClick={() => onConsumerClick(consumer.id)}
          />
        ))}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mt-4"
    >
      <NoUsersFound 
        searchQuery={inputValue}
        onTryNewSearch={() => {
          setInputValue("");
          setShowResults(false);
          setError(null);
        }}
      />
    </motion.div>
  );
});

SearchResults.displayName = "SearchResults";

export function CheckInContent() {
  const router = useRouter();
  const [inputValue, setInputValue] = useState("");
  const { language } = useLanguageContext();
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search consumers query with fetchPolicy optimization
  const { data: searchData, loading, refetch: refetchSearch } = useQuery(SEARCH_CONSUMERS, {
    variables: { query: inputValue, limit: 5 },
    skip: inputValue.length < 2,
    fetchPolicy: 'cache-first',
    nextFetchPolicy: 'cache-first',
    onError: (error) => {
      console.error("Search error:", error);
      setIsSearching(false);
    },
  });

  const handleSearch = useCallback(async () => {
    if (inputValue.length >= 2) {
      setIsSearching(true);
      await refetchSearch();
      setShowResults(true);
      setTimeout(() => setIsSearching(false), 300);
    }
  }, [inputValue, refetchSearch]);

  const debouncedSearch = useMemo(
    () => debounce(handleSearch, 300),
    [handleSearch]
  );

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    if (value.length < 2) {
      setShowResults(false);
    }
  }, []);

  const handleConsumerClick = useCallback((id: string) => {
    router.push(`/check-in/${id}`);
  }, [router]);

  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  const buttonClassName = useMemo(() => cn(
    "w-full h-14 rounded-xl text-lg font-medium transition-all duration-200",
    inputValue.length < 2
      ? "bg-gray-100 text-gray-400"
      : "bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white shadow-md hover:shadow-lg"
  ), [inputValue.length]);

  const inputClassName = useMemo(() => cn(
    "text-lg py-6 pl-6 pr-6 rounded-2xl border-2 focus-visible:ring-offset-0",
    "border-gray-200 focus-visible:border-green-500 focus-visible:ring-green-500",
    "transition-all duration-200"
  ), []);

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
              placeholder={
                language === "en"
                  ? "Search by name, email or phone"
                  : "Buscar por nombre, correo o teléfono"
              }
              value={inputValue}
              onChange={handleInputChange}
              className={inputClassName}
            />
            <Button
              size="lg"
              type="button"
              className={buttonClassName}
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

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center space-x-2 text-red-500 mt-3"
            >
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {showResults && (
              <SearchResults
                isSearching={isSearching}
                loading={loading}
                searchData={searchData}
                onConsumerClick={handleConsumerClick}
                setInputValue={setInputValue}
                setShowResults={setShowResults}
                setError={setError}
                inputValue={inputValue}
              />
            )}
          </AnimatePresence>
        </Card>
      </motion.div>
    </div>
  );
}

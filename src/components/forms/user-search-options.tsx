"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLanguageContext } from "@/contexts/LanguageContext";
import { AlertCircle, Search, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLazyQuery } from "@apollo/client";
import { SEARCH_CONSUMERS } from "@/lib/graphql/queries";
import { useRouter, useSearchParams } from "next/navigation";
import { maskEmail, maskPhoneNumber } from "@/lib/utils/mask-data";

interface Consumer {
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

interface UserSearchOptionsProps {
  onSelect: (consumer: Consumer, type: "unified") => void;
  onTextChange?: (text: string) => void;
}

export function UserSearchOptions({ onSelect, onTextChange }: UserSearchOptionsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language } = useLanguageContext();
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<Consumer[]>([]);
  const [selectedConsumer, setSelectedConsumer] = useState<Consumer | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const classId = searchParams.get('classId');
  const bundleTypeId = searchParams.get('bundleTypeId');
  const redirectToPayment = searchParams.get('redirectToPayment');

  const [searchConsumers] = useLazyQuery(SEARCH_CONSUMERS, {
    onCompleted: (data) => {
      setIsSearching(false);
      if (data.searchConsumers && data.searchConsumers.length > 0) {
        setSearchResults(data.searchConsumers);
        setError(null);
      } else {
        setSearchResults([]);
        setError(language === "en" 
          ? "No users found matching your search" 
          : "No se encontraron usuarios con tu búsqueda");
      }
    },
    onError: () => {
      setIsSearching(false);
      setError(language === "en" 
        ? "Error searching for users" 
        : "Error al buscar usuarios");
    }
  });

  const handleConsumerSelect = (consumer: Consumer) => {
    setSelectedConsumer(consumer);
    onSelect(consumer, "unified");

    setTimeout(() => {
      const params = new URLSearchParams();
      
      // Si hay bundleTypeId y redirectToPayment, ir a payment
      if (bundleTypeId && redirectToPayment === 'true') {
        params.append('bundleTypeId', bundleTypeId);
        params.append('consumerId', consumer.id);
        router.push(`/payment?${params.toString()}`);
        return;
      }

      // Si no, seguir el flujo normal
      params.append('consumerId', consumer.id);
      if (classId) params.append('classId', classId);
      if (bundleTypeId) params.append('bundleTypeId', bundleTypeId);
      router.push(`/user-details?${params.toString()}`);
    }, 1500);
  };

  const handleBundleSelection = (bundleId: string) => {
    if (!classId || !selectedConsumer) return;
    
    const params = new URLSearchParams();
    params.append('consumerId', selectedConsumer.id);
    params.append('bundleId', bundleId);
    params.append('classId', classId);
    router.push(`/payment?${params.toString()}`);
  };

  const activeBundles = selectedConsumer?.bundles?.filter(bundle => 
    bundle.status === 'ACTIVE' && bundle.remainingUses > 0
  ) || [];

  const handleSearch = () => {
    if (inputValue.length >= 2) {
      setIsSearching(true);
      searchConsumers({ 
        variables: { 
          query: inputValue,
          limit: 10
        } 
      });
    }
  };

  return (
    <div className="w-full space-y-4">
      <div className="space-y-3">
        <Input
          type="text"
          placeholder={language === "en" 
            ? "Search by name, email or phone" 
            : "Buscar por nombre, correo o teléfono"}
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setError(null);
            onTextChange?.(e.target.value);
            setSearchResults([]);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && inputValue.length >= 2) {
              e.preventDefault();
              handleSearch();
            }
          }}
          className={cn(
            "text-lg py-6 pl-6 pr-6 rounded-2xl border-2 focus-visible:ring-offset-0",
            error ? "border-red-500 focus-visible:ring-red-500" : "border-gray-200 focus-visible:border-green-500 focus-visible:ring-green-500",
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
          onClick={handleSearch}
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
          className="flex items-center space-x-2 text-red-500"
        >
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">{error}</span>
        </motion.div>
      )}

      <AnimatePresence>
        {searchResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-2"
          >
            {searchResults.map((user) => (
              <Card
                key={user.id}
                onClick={() => handleConsumerSelect(user)}
                className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {`${user.firstName} ${user.lastName}`}
                    </p>
                    <p className="text-sm text-gray-500">
                      {maskEmail(user.email)}
                    </p>
                    {user.phoneNumber && (
                      <p className="text-sm text-gray-500">
                        {maskPhoneNumber(user.phoneNumber)}
                      </p>
                    )}
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
              </Card>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {selectedConsumer && activeBundles.length > 0 && classId && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-gray-700">
              {language === "en" ? "Active Packages" : "Paquetes Activos"}
            </h3>
            {activeBundles.map(bundle => (
              <Card 
                key={bundle.id}
                className="p-4 bg-white/95 backdrop-blur-sm border-green-50"
              >
                <h4 className="font-semibold text-lg mb-2">{bundle.bundleType.name}</h4>
                <p className="text-gray-600 mb-3">
                  {language === "en" ? "Remaining uses:" : "Usos restantes:"} {bundle.remainingUses}
                </p>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleBundleSelection(bundle.id);
                  }}
                  className="w-full bg-gradient-to-r from-green-600 to-teal-600 
                    hover:from-green-700 hover:to-teal-700 text-white"
                >
                  {language === "en" ? "Use this package" : "Usar este paquete"}
                </Button>
              </Card>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
} 
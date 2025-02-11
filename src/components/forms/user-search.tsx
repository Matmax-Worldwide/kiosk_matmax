"use client";
import React, { useState } from "react";
import { useLanguageContext } from "@/contexts/LanguageContext";
import { useNotificationContext } from "@/contexts/NotificationContext";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { useLazyQuery } from "@apollo/client";
import { SEARCH_CONSUMERS } from "@/lib/graphql/queries";

interface Consumer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
}

interface UserSearchProps {
  onSelect: (consumer: Consumer) => void;
}

export function UserSearch({ onSelect }: UserSearchProps) {
  const { language } = useLanguageContext();
  const { addNotification } = useNotificationContext();
  const [query, setQuery] = useState("");
  const [searchConsumers, { loading, data }] = useLazyQuery(SEARCH_CONSUMERS);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (query.length < 3) {
      addNotification(
        {
          en: "Please enter at least 3 characters",
          es: "Por favor ingrese al menos 3 caracteres"
        },
        "warning"
      );
      return;
    }

    try {
      await searchConsumers({ 
        variables: { 
          query,
          limit: 10
        } 
      });
    } catch (error) {
      console.error("Search error:", error);
      addNotification(
        {
          en: "Failed to search users",
          es: "Error al buscar usuarios"
        },
        "error"
      );
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSearch} className="flex flex-col space-y-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={
            language === "en"
              ? "Enter name or email..."
              : "Ingresa nombre o correo..."
          }
          className="w-full p-4 text-lg border-2 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
        />
        <Button
          type="submit"
          className="w-full h-14 text-lg bg-green-600 hover:bg-green-700 text-white font-medium !bg-green-600"
          disabled={loading || query.length < 3}
        >
          {loading ? (
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white"></div>
          ) : (
            <>
              <Search className="w-6 h-6 mr-2" />
              {language === "en" ? "Search" : "Buscar"}
            </>
          )}
        </Button>
      </form>

      {data?.searchConsumers?.length > 0 && (
        <div className="border rounded-lg divide-y">
          {data.searchConsumers.map((consumer: Consumer) => (
            <button
              key={consumer.id}
              onClick={() => onSelect(consumer)}
              className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
            >
              <div className="font-medium text-lg">
                {`${consumer.firstName} ${consumer.lastName}`}
              </div>
              <div className="text-sm text-gray-500">{consumer.email}</div>
              {consumer.phoneNumber && (
                <div className="text-sm text-gray-500">{consumer.phoneNumber}</div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
} 
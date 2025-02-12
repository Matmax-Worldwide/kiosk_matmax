"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Globe, Calendar } from "lucide-react";
import { BilingualText } from "@/types/index";
import { useLanguageContext } from "@/contexts/LanguageContext";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface HeaderProps {
  title: BilingualText;
  showBackButton?: boolean;
  onBack?: () => void;
}

export function Header({ title, showBackButton = true, onBack }: HeaderProps) {
  const router = useRouter();
  const { language, setLanguage } = useLanguageContext();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  const handleLanguageToggle = () => {
    setLanguage(language === "en" ? "es" : "en");
  };

  const shouldShowBackButton = showBackButton && title[language] !== "Welcome" && title[language] !== "Bienvenido";

  const today = new Date();
  const formattedDate = format(today, "EEEE, d 'de' MMMM yyyy", {
    locale: language === "es" ? es : undefined
  });

  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            {shouldShowBackButton && (
              <button
                onClick={handleBack}
                className="mr-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            <div className="flex flex-col">
              <h1 className="text-xl font-semibold text-gray-900">
                {title[language]}
              </h1>
              <div className="flex items-center gap-1 text-sm text-gray-500 mt-0.5">
                <Calendar className="h-4 w-4" />
                <span className="capitalize">{formattedDate}</span>
              </div>
            </div>
          </div>
          <button
            onClick={handleLanguageToggle}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors flex items-center gap-2"
            aria-label="Cambiar idioma / Change language"
          >
            <span className="text-sm font-medium">
              {language === "es" ? "Change language" : "Cambiar idioma"}
            </span>
            <Globe className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
} 
"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Globe } from "lucide-react";
import { BilingualText } from "@/types/index";
import { useLanguageContext } from "@/contexts/LanguageContext";

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
            <h1 className="text-xl font-semibold text-gray-900">
              {title[language]}
            </h1>
          </div>
          <button
            onClick={handleLanguageToggle}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors flex items-center gap-2"
            aria-label="Cambiar idioma / Change language"
          >
            <Globe className="h-5 w-5" />
            <span className="text-sm font-medium">{language.toUpperCase()}</span>
          </button>
        </div>
      </div>
    </header>
  );
} 
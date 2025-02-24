"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Calendar } from "lucide-react";
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


  const shouldShowBackButton = showBackButton && title[language] !== "Welcome" && title[language] !== "Bienvenido" && title[language] !== "Purchase Confirmation" && title[language] !== "Confirmación de Compra";

  const today = new Date();
  const formattedDate = format(today, language === "en" ? "EEEE, MMMM d, yyyy" : "EEEE, d 'de' MMMM yyyy", {
    locale: language === "es" ? es : undefined
  });


  return (
    <>
      <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-b z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              {shouldShowBackButton && (
                <button
                  onClick={handleBack}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
              )}
              <h1 className="text-xl font-semibold text-gray-900">
                {title[language]}
              </h1>
            </div>

            <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-lg border border-green-100 p-1.5 flex gap-2 active:shadow-xl transition-all duration-500 active:border-green-200">
              <button
                onClick={() => language === "es" && setLanguage("en")}
                className={`px-4 py-1.5 rounded-xl transition-all duration-500 font-medium text-sm
                ${
                  language === "en"
                    ? "bg-gradient-to-r from-green-500 to-teal-500 text-white shadow-md"
                    : "text-green-700 active:bg-green-50"
                }`}
              >
                English
              </button>
              <button
                onClick={() => language === "en" && setLanguage("es")}
                className={`px-4 py-1.5 rounded-xl transition-all duration-500 font-medium text-sm
                ${
                  language === "es"
                    ? "bg-gradient-to-r from-green-500 to-teal-500 text-white shadow-md"
                    : "text-green-700 active:bg-green-50"
                }`}
              >
                Español
              </button>
            </div>

            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Calendar className="h-4 w-4" />
              <span className="capitalize">{formattedDate}</span>
            </div>
          </div>
        </div>
      </header>
    </>
  );
} 
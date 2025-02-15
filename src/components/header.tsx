"use client";
import React, { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ArrowLeft, Globe, Calendar } from "lucide-react";
import { BilingualText } from "@/types/index";
import { useLanguageContext } from "@/contexts/LanguageContext";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { SuccessOverlay } from "@/components/ui/success-overlay";

interface HeaderProps {
  title: BilingualText;
  showBackButton?: boolean;
  onBack?: () => void;
}

export function Header({ title, showBackButton = true, onBack }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { language, setLanguage } = useLanguageContext();
  const [showBackOverlay, setShowBackOverlay] = useState(false);

  const getOverlayConfig = () => {
    switch (pathname) {
      case "/class-pass":
        return {
          variant: "schedule" as const,
          title: {
            en: "Returning to Schedule",
            es: "Volviendo al Horario"
          },
          message: {
            en: "You will be redirected to the schedule view",
            es: "Serás redirigido a la vista del horario"
          }
        };
      case "/schedule":
        return {
          variant: "new-user" as const,
          title: {
            en: "Returning to Home",
            es: "Volviendo al Inicio"
          },
          message: {
            en: "You will be redirected to the home page",
            es: "Serás redirigido a la página principal"
          }
        };
      case "/user-selection":
        return {
          variant: "existing-user" as const,
          title: {
            en: "Canceling Registration",
            es: "Cancelando Registro"
          },
          message: {
            en: "You will be redirected to the previous page",
            es: "Serás redirigido a la página anterior"
          }
        };
      default:
        return {
          variant: "success" as const,
          title: {
            en: "Going Back",
            es: "Volviendo Atrás"
          },
          message: {
            en: "You will be redirected to the previous page",
            es: "Serás redirigido a la página anterior"
          }
        };
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      setShowBackOverlay(true);
      setTimeout(() => {
        router.back();
      }, 1500);
    }
  };

  const handleLanguageToggle = () => {
    setLanguage(language === "en" ? "es" : "en");
  };

  const shouldShowBackButton = showBackButton && title[language] !== "Welcome" && title[language] !== "Bienvenido" && title[language] !== "Purchase Confirmation" && title[language] !== "Confirmación de Compra";

  const today = new Date();
  const formattedDate = format(today, "EEEE, d 'de' MMMM yyyy", {
    locale: language === "es" ? es : undefined
  });

  const overlayConfig = getOverlayConfig();

  return (
    <>
      <SuccessOverlay
        show={showBackOverlay}
        title={overlayConfig.title}
        message={overlayConfig.message}
        variant={overlayConfig.variant}
        duration={1500}
      />

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
            
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Calendar className="h-4 w-4" />
              <span className="capitalize">{formattedDate}</span>
            </div>

            <div className="min-w-[100px] flex justify-end">
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
        </div>
      </header>
    </>
  );
} 
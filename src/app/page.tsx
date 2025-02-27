"use client";
// import { motion, AnimatePresence } from "framer-motion";
import { motion } from "framer-motion";
import { useLanguageContext } from "@/contexts/LanguageContext";
import { Package2, CalendarDays } from "lucide-react";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import CheckInButton from "@/components/CheckInButton";
import ActionButton from "@/components/ActionButton";
import LanguageSelector from "@/components/LanguageSelector";

export default function Home() {
  const { language, setLanguage } = useLanguageContext();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const mainActions = [
    {
      icon: CalendarDays,
      title: "Reservar Ahora",
      titleEn: "Book Now",
      description: "Reserva o revisa el horario",
      descriptionEn: "Book your next class or check schedule",
      href: "/class-pass",
      gradient: "from-green-600 to-teal-600",
      overlayType: "schedule" as const,
    },
    {
      icon: Package2,
      title: "Comprar Paquetes",
      titleEn: "Buy Packages",
      description: "Ver y comprar paquetes de clases",
      descriptionEn: "View and purchase packages",
      href: "/buy-packages",
      gradient: "from-green-600 to-teal-600",
      overlayType: "packages" as const,
    },
  ];

  if (!isClient) {
    return null; // Prevent hydration issues
  }

  return (
    <main className="min-h-screen">

      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="flex justify-center mb-8">
          <Image
            src="/img/matmax.svg"
            alt="MatMax Logo"
            width={300}
            height={150}
            priority
          />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-4xl mx-auto mb-16"
        >
          <p className="text-xl text-gray-600">
            {language === "en"
              ? "Choose an option to get started"
              : "Elige una opción para comenzar"}
          </p>
        </motion.div>

        {/* Main Actions Grid */}
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-12">
          {mainActions.map((action, index) => (
            <ActionButton
              key={index}
              {...action}
              language={language}
              index={index}
            />
          ))}
        </div>

        {/* Check-in Section */}
        <CheckInButton language={language} />

        {/* Add some bottom padding to prevent content from being cut off */}
        <div className="h-20" />

        <LanguageSelector language={language} setLanguage={setLanguage} />
      </div>
    </main>
  );
}

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

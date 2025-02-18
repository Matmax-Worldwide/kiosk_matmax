"use client";
// import { motion, AnimatePresence } from "framer-motion";
import { motion } from "framer-motion";
import { useLanguageContext } from "@/contexts/LanguageContext";
import {
  ArrowRight,
  Package2,
  CalendarDays,
  UserCheck,
  //   Clock,
  //   ShoppingBag,
  //   Calendar,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React from "react";

export default function Home() {
  const { language, setLanguage } = useLanguageContext();
  const router = useRouter();

  const handleNavigation = (route: string) => {
    setTimeout(() => {
      router.push(route);
    }, 1500);
  };

  const mainActions = [
    {
      icon: <CalendarDays className="w-8 h-8" />,
      title: "Reservar Ahora",
      titleEn: "Book Now",
      description: "Reserva tu próxima clase o revisa el horario",
      descriptionEn: "Book your next class or check schedule",
      href: "/class-pass",
      gradient: "from-green-600 to-teal-600",
      overlayType: "schedule" as const,
    },
    {
      icon: <Package2 className="w-8 h-8" />,
      title: "Comprar Paquetes",
      titleEn: "Buy Class Packages",
      description: "Ver y comprar paquetes de clases",
      descriptionEn: "View and purchase class packages",
      href: "/buy-packages",
      gradient: "from-green-600 to-teal-600",
      overlayType: "packages" as const,
    },
  ];

  //   const infoItems = [
  //     {
  //       icon: <Clock className="w-5 h-5" />,
  //       title: "Clase Actual",
  //       description: "Yoga Flow - 10:00 AM",
  //       detail: "Traer mat y ropa cómoda",
  //     },
  //     {
  //       icon: <ShoppingBag className="w-5 h-5" />,
  //       title: "Oferta",
  //       description: "Bolsters de Yoga -20%",
  //       detail: "Con MatPass activo",
  //     },
  //     {
  //       icon: <Calendar className="w-5 h-5" />,
  //       title: "Próximamente",
  //       description: "Taller de Meditación",
  //       detail: "Este sábado 10 AM",
  //     },
  //   ];

  //   useEffect(() => {
  //     const timer = setInterval(() => {
  //       setInfoIndex((current) => (current + 1) % infoItems.length);
  //     }, 5000);
  //     return () => clearInterval(timer);
  //   }, [infoItems.length]);

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
            <motion.div
              key={index}
              initial={{ opacity: 0, x: index === 0 ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.2 }}
              whileHover={{ scale: 1.02 }}
              className="relative group h-full"
            >
              <div
                onClick={() => handleNavigation(action.href)}
                className="h-full cursor-pointer"
              >
                <div
                  className={`bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl
transition-all duration-300 border-2 border-transparent
hover:border-2 hover:border-opacity-50 h-full
hover:border-gradient-to-r ${action.gradient}`}
                >
                  <div
                    className={`w-16 h-16 rounded-xl bg-gradient-to-r ${action.gradient}
flex items-center justify-center text-white mb-6`}
                  >
                    {action.icon}
                  </div>
                  <h3 className="text-2xl font-bold mb-3">
                    {language === "en" ? action.titleEn : action.title}
                  </h3>
                  <p className="text-gray-600">
                    {language === "en"
                      ? action.descriptionEn
                      : action.description}
                  </p>
                  <div
                    className="absolute bottom-8 right-8 opacity-0
group-hover:opacity-100 transition-opacity"
                  >
                    <ArrowRight className="w-6 h-6 text-gray-400" />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Check-in Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="max-w-4xl mx-auto text-center"
        >
          <div className="mb-6">
            <h2
              className="text-2xl mb-2 font-bold bg-gradient-to-r from-green-600
to-teal-600 bg-clip-text text-transparent"
            >
              {language === "en"
                ? "Already have a reservation?"
                : "¿Ya tienes una reserva?"}
            </h2>
            <p className="text-gray-600">
              {language === "en"
                ? "Check-in for your class here"
                : "Haz check-in para tu clase aquí"}
            </p>
          </div>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <div
              onClick={() => handleNavigation("/check-in")}
              className="bg-gradient-to-r from-green-600 to-teal-600 text-white
                p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 
                flex items-center justify-center gap-3 group cursor-pointer"
            >
              <UserCheck className="w-8 h-8 transition-transform group-hover:scale-110" />
              <span className="text-xl font-semibold">Check-in</span>
              <ArrowRight
                className="w-6 h-6 opacity-0 group-hover:opacity-100
transition-all"
              />
            </div>
          </motion.div>
        </motion.div>

        {/* Info Section - Above Footer */}
        {/* <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-4xl mx-auto mt-16 mb-8"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={infoIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="bg-white/90 backdrop-blur-md rounded-2xl shadow-lg border
  border-gray-100 p-6"
              >
                <div className="flex items-center justify-between gap-8">
                  <div className="flex items-center gap-6">
                    <div
                      className="w-16 h-16 rounded-xl bg-gray-50 flex items-center
  justify-center"
                    >
                      <div className="text-blue-600">
                        {infoItems[infoIndex].icon}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-800">
                          {infoItems[infoIndex].title}
                        </h3>
                        <span className="text-gray-400">•</span>
                        <p className="text-lg text-gray-700">
                          {infoItems[infoIndex].description}
                        </p>
                      </div>
                      <p className="text-base text-gray-500">
                        {infoItems[infoIndex].detail}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-3">
                    <div className="flex gap-2">
                      {[...Array(infoItems.length)].map((_, idx) => (
                        <div
                          key={idx}
                          className={`w-2 h-2 rounded-full transition-all duration-300 ${
                            idx === infoIndex
                              ? "bg-blue-600 scale-125"
                              : "bg-gray-200"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.div> */}

        {/* Add some bottom padding to prevent content from being cut off */}
        <div className="h-20" />

        {/* Language Selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex justify-center w-full mb-12"
        >
          <div
            className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-lg 
            border border-green-100 p-1.5 flex gap-2 hover:shadow-xl 
            transition-all duration-500 hover:border-green-200"
          >
            <button
              onClick={() => language === "es" && setLanguage("en")}
              className={`px-6 py-2.5 rounded-xl transition-all duration-500 font-medium
              ${
                language === "en"
                  ? "bg-gradient-to-r from-green-500 to-teal-500 text-white shadow-md"
                  : "text-green-700 hover:bg-green-50"
              }`}
            >
              English
            </button>
            <button
              onClick={() => language === "en" && setLanguage("es")}
              className={`px-6 py-2.5 rounded-xl transition-all duration-500 font-medium
              ${
                language === "es"
                  ? "bg-gradient-to-r from-green-500 to-teal-500 text-white shadow-md"
                  : "text-green-700 hover:bg-green-50"
              }`}
            >
              Español
            </button>
          </div>
        </motion.div>
      </div>
    </main>
  );
}

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Calendar, Home, Package2 } from "lucide-react";
import { useLanguageContext } from "@/contexts/LanguageContext";
import { useRouter } from "next/navigation";
import React from "react";

interface ChangeClassProps {
  consumerId: string;
  classId?: string;
  now?: string;
}

export function ChangeClassComponent({ consumerId, classId, now }: ChangeClassProps) {
  const router = useRouter();
  const { language } = useLanguageContext();
  const [isNavigatingToSchedule, setIsNavigatingToSchedule] = React.useState(false);
  const [isNavigatingToPackages, setIsNavigatingToPackages] = React.useState(false);
  const [isNavigatingToHome, setIsNavigatingToHome] = React.useState(false);

  const handleViewOtherTimes = () => {
    setIsNavigatingToSchedule(true);
    router.push('/schedule');
  };

  const handleBuyNewPackage = () => {
    setIsNavigatingToPackages(true);
    const params = new URLSearchParams();
    params.append('consumerId', consumerId);
    if (classId) params.append('classId', classId);
    if (now) params.append('now', now);
    router.push(`/buy-packages?${params.toString()}`);
  };

  const handleReturnHome = () => {
    setIsNavigatingToHome(true);
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 mt-16">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-4xl mx-auto mb-12"
        >
          <div className="w-24 h-24 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Calendar className="w-14 h-14 text-white" />
          </div>
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
            {language === "en" ? "Existing Reservation" : "Reserva Existente"}
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            {language === "en"
              ? "You already have a reservation for this time slot. What would you like to do?"
              : "Ya tienes una reserva para este horario. ¿Qué te gustaría hacer?"}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={handleViewOtherTimes}
                disabled={isNavigatingToSchedule}
                className="w-full sm:w-auto bg-gradient-to-r from-green-600 to-teal-600 text-white hover:from-green-700 hover:to-teal-700 transition-all duration-300 h-14 px-8 rounded-2xl text-lg font-semibold shadow-lg hover:shadow-xl"
              >
                <Calendar className="w-6 h-6 mr-2" />
                {language === "en" ? "View Other Times" : "Ver Otros Horarios"}
              </Button>
            </motion.div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={handleBuyNewPackage}
                disabled={isNavigatingToPackages}
                className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 h-14 px-8 rounded-2xl text-lg font-semibold shadow-lg hover:shadow-xl"
              >
                <Package2 className="w-6 h-6 mr-2" />
                {language === "en" ? "Buy New Package" : "Comprar Nuevo Paquete"}
              </Button>
            </motion.div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={handleReturnHome}
                disabled={isNavigatingToHome}
                variant="outline"
                className="w-full sm:w-auto border-2 border-green-200 hover:bg-green-50 text-green-700 h-14 px-8 rounded-2xl text-lg font-semibold group"
              >
                <Home className="w-6 h-6 mr-2 transition-transform group-hover:scale-110" />
                {language === "en" ? "Return to Home" : "Volver al Inicio"}
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
} 
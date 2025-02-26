"use client";

import React, { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useLanguageContext } from "@/contexts/LanguageContext";
import {
  CheckCircle2,
  Calendar,
  Home,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { motion } from "framer-motion"
import { maskEmail } from "@/lib/utils/mask-data";

export function ConfirmationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language } = useLanguageContext();
  const [countdown, setCountdown] = React.useState(10);
  const [isMounted, setIsMounted] = React.useState(false);
  const [isTimerActive, setIsTimerActive] = React.useState(true);
  const [isLoading, setIsLoading] = React.useState(false);

  // Get all parameters
  const consumerId = searchParams.get("consumerId");
  const email = searchParams.get("email");
  const classId = searchParams.get("classId");

  // Handle client-side mounting
  useEffect(() => {
    setIsMounted(true);
    setCountdown(10);
  }, []);

  // Handle countdown
  useEffect(() => {
    if (!isMounted || !isTimerActive) return;

    const timer = setInterval(() => {
      setCountdown((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [isMounted, isTimerActive]);

  // Handle navigation when countdown reaches 0
  useEffect(() => {
    if (countdown === 0 && isTimerActive) {
      router.push("/");
    }
  }, [countdown, router, isTimerActive]);

  const handleScheduleClick = async () => {
    setIsLoading(true);
    setIsTimerActive(false);
    if (consumerId) {
      router.push(`/schedule?consumerId=${consumerId}`);
    } else {
      router.push("/schedule");
    }
  };

  const handleHomeClick = () => {
    router.push("/");
  };

  const getButtonText = () => {
    if (!isMounted) {
      return language === "en" ? "Return to Home" : "Volver al Inicio";
    }
    return language === "en" 
      ? `Return to Home${countdown !== null ? ` (${countdown}s)` : ''}`
      : `Volver al Inicio${countdown !== null ? ` (${countdown}s)` : ''}`;
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto px-4 py-16 md:py-24"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-4xl mx-auto mb-12"
        >
          <div className="w-24 h-24 rounded-full bg-gradient-to-r from-green-500 to-teal-500 flex items-center justify-center mx-auto mb-6 shadow-lg">
            <CheckCircle2 className="w-14 h-14 text-white" />
          </div>
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
            {classId
              ? language === "en"
                ? "Purchase and Reservation Successful!"
                : "¡Compra y Reserva Exitosa!"
              : language === "en"
              ? "Purchase Successful!"
              : "¡Compra Exitosa!"}
          </h2>
          <p className="text-xl text-gray-600 mb-4">
            {classId
              ? language === "en"
                ? "Your purchase has been confirmed and your class has been successfully reserved."
                : "Tu compra ha sido confirmada y tu clase ha sido reservada exitosamente."
              : language === "en"
              ? "Your purchase has been confirmed and processed successfully."
              : "Tu compra ha sido confirmada y procesada exitosamente."}
          </p>
          <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-2xl p-6 max-w-md mx-auto border border-green-100/50 shadow-sm">
            <p className="text-gray-600 mb-2">
              {language === "en"
                ? "We've sent a confirmation email to:"
                : "Hemos enviado un correo de confirmación a:"}
            </p>
            <p className="text-lg font-semibold text-green-700 mb-2">
              {email ? maskEmail(email) : "-"}
            </p>
            <p className="text-sm text-gray-500">
              {language === "en"
                ? "Please check your inbox and spam folder"
                : "Por favor revisa tu bandeja de entrada y carpeta de spam"}
            </p>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="max-w-4xl mx-auto text-center"
        >
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {classId ? (
              <>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    onClick={handleScheduleClick}
                    disabled={isLoading}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 h-14 px-8 rounded-2xl text-lg font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                    ) : (
                      <Calendar className="w-6 h-6 mr-2" />
                    )}
                    {language === "en"
                      ? isLoading ? "Loading..." : "Book Another Class"
                      : isLoading ? "Cargando..." : "Reservar Otra Clase"}
                  </Button>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    onClick={handleHomeClick}
                    variant="outline"
                    className="border-2 border-green-200 hover:bg-green-50 text-green-700 h-14 px-8 rounded-2xl text-lg font-semibold group"
                  >
                    <Home className="w-6 h-6 mr-2 transition-transform group-hover:scale-110" />
                    {getButtonText()}
                    <ArrowRight className="w-5 h-5 ml-2 opacity-0 group-hover:opacity-100 transition-all" />
                  </Button>
                </motion.div>
              </>
            ) : (
              <>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    onClick={handleScheduleClick}
                    className="bg-gradient-to-r from-green-600 to-teal-600 text-white hover:from-green-700 hover:to-teal-700 transition-all duration-300 h-14 px-8 rounded-2xl text-lg font-semibold shadow-lg hover:shadow-xl"
                  >
                    <Calendar className="w-6 h-6 mr-2" />
                    {language === "en" ? "View Schedule" : "Ver Horario"}
                  </Button>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    onClick={handleHomeClick}
                    variant="outline"
                    className="border-2 border-green-200 hover:bg-green-50 text-green-700 h-14 px-8 rounded-2xl text-lg font-semibold group"
                  >
                    <Home className="w-6 h-6 mr-2 transition-transform group-hover:scale-110" />
                    {getButtonText()}
                    <ArrowRight className="w-5 h-5 ml-2 opacity-0 group-hover:opacity-100 transition-all" />
                  </Button>
                </motion.div>
              </>
            )}
          </div>
        </motion.div>

        {/* Mensaje adicional para usuarios con reserva */}
        {classId && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="max-w-4xl mx-auto text-center mt-8"
          >
            <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
              <p className="text-blue-700 mb-2 font-medium">
                {language === "en"
                  ? "You can now check in for your class or book another one!"
                  : "¡Ahora puedes hacer check-in para tu clase o reservar otra!"}
              </p>
              <p className="text-blue-600 text-sm">
                {language === "en"
                  ? "Remember to arrive 10 minutes before your class starts"
                  : "Recuerda llegar 10 minutos antes del inicio de tu clase"}
              </p>
            </div>
          </motion.div>
        )}
      </motion.div>
    </>
  );
}

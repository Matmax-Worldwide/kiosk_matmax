"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useLanguageContext } from "@/contexts/LanguageContext";
import {
  CheckCircle2,
  User,
  Calendar,
  Home,
  ArrowRight,
  Package,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { motion } from "framer-motion";
import { SuccessOverlay } from "@/components/ui/success-overlay";
import { maskEmail } from "@/lib/utils/mask-data";
import { useQuery } from "@apollo/client";
import { GET_BUNDLE_USAGES } from "@/lib/graphql/queries";

interface BundleUsages {
  id: string;
  remainingUses: number;
}

export function ConfirmationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language } = useLanguageContext();
  const [showScheduleOverlay, setShowScheduleOverlay] = React.useState(false);
  const [paymentMethodText, setPaymentMethodText] = React.useState("");
  const [mounted, setMounted] = React.useState(false);

  // Get all parameters
  const purchaseId = searchParams.get("purchaseId");
  const consumerId = searchParams.get("consumerId");
  const paymentMethod = searchParams.get("paymentMethod");
  const firstName = searchParams.get("firstName");
  const lastName = searchParams.get("lastName");
  const email = searchParams.get("email");
  const packageName = searchParams.get("packageName");
  const packagePrice = searchParams.get("packagePrice");
  const bundleId = searchParams.get("bundleId");
  const classId = searchParams.get("classId");
  const className = searchParams.get("className");
  const classDate = searchParams.get("classDate");
  const professorName = searchParams.get("professorName");
  const reservationId = searchParams.get("reservationId");

  // Fetch updated bundle information if we have a bundleId
  const { data: bundleData, loading } = useQuery<{ bundle: BundleUsages }>(GET_BUNDLE_USAGES, {
    variables: { id: bundleId },
    skip: !bundleId || !mounted,
    fetchPolicy: "network-only",
    nextFetchPolicy: "network-only",
  });

  // Set mounted state after initial render
  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!purchaseId && !paymentMethod && bundleData?.bundle) {
      setPaymentMethodText("Paquete Existente");
      return;
    }

    switch (paymentMethod) {
      case "CARD":
        setPaymentMethodText("Tarjeta Crédito/Débito");
        break;
      case "QR":
        setPaymentMethodText("Yape / Plin");
        break;
      case "CASH":
        setPaymentMethodText("Efectivo");
        break;
      default:
        setPaymentMethodText("");
    }
  }, [paymentMethod, bundleData, purchaseId]);

  const handleScheduleClick = () => {
    setShowScheduleOverlay(true);
  };

  const handleHomeClick = () => {
    router.push("/");
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "";
    try {
      return format(new Date(dateString), "EEEE d 'de' MMMM, HH:mm", {
        locale: language === "es" ? es : undefined,
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return dateString;
    }
  };

  const formatPrice = (price: string | null) => {
    if (!price) return "0.00";
    try {
      return Number(price).toFixed(2);
    } catch (error) {
      console.error("Error formatting price:", error);
      return "0.00";
    }
  };

  // Determine if we should show remaining uses
  const showRemainingUses = bundleData?.bundle?.remainingUses !== undefined;

  return (
    <>
      {/* Schedule Overlay */}
      <SuccessOverlay
        aria-live="polite"
        show={showScheduleOverlay}
        title={{
          en: "Opening Schedule",
          es: "Abriendo Horario",
        }}
        message={{
          en: "You will be redirected to view the class schedule",
          es: "Serás redirigido para ver el horario de clases",
        }}
        variant="schedule"
        duration={1500}
        onComplete={() => {
          if (consumerId) {
            router.push(`/schedule?consumerId=${consumerId}`);
          } else {
            router.push("/schedule");
          }
        }}
      />
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

        {/* Purchase Details Grid */}
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-12">
          {/* Order Info Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="relative group h-full"
          >
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-2 hover:border-opacity-50 hover:border-gradient-to-r from-blue-600 to-indigo-600 h-full">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center text-white mb-6">
                <User className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold mb-4">
                {language === "en"
                  ? "Order Information"
                  : "Información de la Orden"}
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">
                    {language === "en" ? "Order ID" : "ID de Orden"}
                  </p>
                  <p className="font-semibold text-gray-700">{purchaseId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">
                    {language === "en" ? "Customer" : "Cliente"}
                  </p>
                  <p className="font-semibold text-gray-700">
                    {firstName && lastName ? firstName + " " + lastName : ""}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">
                    {language === "en" ? "Email" : "Correo"}
                  </p>
                  <p className="font-semibold text-gray-700">
                    {email ? maskEmail(email) : ""}
                  </p>
                </div>
              </div>
              <div className="absolute bottom-8 right-8 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRight className="w-6 h-6 text-gray-400" />
              </div>
            </div>
          </motion.div>

          {/* Package Info Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="relative group h-full"
          >
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-2 hover:border-opacity-50 hover:border-gradient-to-r from-purple-600 to-pink-600 h-full">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center text-white mb-6">
                <Package className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold mb-4">
                {language === "en"
                  ? "Package Information"
                  : "Información del Paquete"}
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">
                    {language === "en" ? "Package Name" : "Nombre del Paquete"}
                  </p>
                  <p className="font-semibold text-gray-700">{packageName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">
                    {mounted && showRemainingUses
                      ? language === "en"
                        ? "Remaining Uses"
                        : "Usos Restantes"
                      : language === "en"
                      ? "Price"
                      : "Precio"}
                  </p>
                  <p className="font-semibold text-gray-700">
                    {mounted && showRemainingUses
                      ? loading
                        ? "..." // Show loading state
                        : `${bundleData?.bundle?.remainingUses} ${
                            language === "en" ? "uses" : "usos"
                          }`
                      : `S/. ${formatPrice(packagePrice)}`}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">
                    {language === "en" ? "Payment Method" : "Método de Pago"}
                  </p>
                  <p className="font-semibold text-gray-700">
                    {paymentMethodText}
                  </p>
                </div>
              </div>
              <div className="absolute bottom-8 right-8 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRight className="w-6 h-6 text-gray-400" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Class Info Section - Only show if classId exists */}
        {classId && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="max-w-4xl mx-auto mb-12"
          >
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-2 hover:border-opacity-50 hover:border-gradient-to-r from-amber-500 to-orange-500">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center text-white mb-6">
                <Calendar className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold mb-4">
                {language === "en"
                  ? "Class Information"
                  : "Información de la Clase"}
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">
                      {language === "en" ? "Class Name" : "Nombre de la Clase"}
                    </p>
                    <p className="font-semibold text-gray-700">{className}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">
                      {language === "en" ? "Professor" : "Profesor"}
                    </p>
                    <p className="font-semibold text-gray-700">
                      {professorName}
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  {classDate && (
                    <div>
                      <p className="text-sm text-gray-500">
                        {language === "en" ? "Date & Time" : "Fecha y Hora"}
                      </p>
                      <p className="font-semibold text-gray-700">
                        {formatDate(classDate)}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-500">
                      {language === "en" ? "Reservation ID" : "ID de Reserva"}
                    </p>
                    <p className="font-semibold text-gray-700">
                      {reservationId}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

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
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 h-14 px-8 rounded-2xl text-lg font-semibold shadow-lg hover:shadow-xl"
                  >
                    <Calendar className="w-6 h-6 mr-2" />
                    {language === "en"
                      ? "Book Another Class"
                      : "Reservar Otra Clase"}
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
                    {language === "en" ? "Return to Home" : "Volver al Inicio"}
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
                    {language === "en" ? "Return to Home" : "Volver al Inicio"}
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

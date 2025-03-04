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
  Package,
  CreditCard,
  DollarSign,
  QrCode,
  Bitcoin,
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
  const [bundles, setBundles] = React.useState<Array<{id: string, name: string, price: number, quantity: number}>>([]);

  // Get all parameters
  const consumerId = searchParams.get("consumerId");
  const email = searchParams.get("email");
  const classId = searchParams.get("classId");
  const paymentMethod = searchParams.get("paymentMethod");
  const total = searchParams.get("total");
  const bundleCount = searchParams.get("bundleCount");
  const coupon = searchParams.get("coupon");
  const discount = searchParams.get("discount");

  // Handle client-side mounting and bundle data extraction
  useEffect(() => {
    setIsMounted(true);
    setCountdown(10);
    
    // Extract bundle information from URL params
    if (bundleCount) {
      const count = parseInt(bundleCount);
      const extractedBundles = [];
      
      for (let i = 0; i < count; i++) {
        const bundleId = searchParams.get(`bundleId${i}`);
        const bundleName = searchParams.get(`bundleName${i}`);
        const bundlePrice = searchParams.get(`bundlePrice${i}`);
        const bundleQuantity = searchParams.get(`bundleQuantity${i}`);
        
        if (bundleId && bundleName && bundlePrice && bundleQuantity) {
          extractedBundles.push({
            id: bundleId,
            name: bundleName,
            price: parseFloat(bundlePrice),
            quantity: parseInt(bundleQuantity)
          });
        }
      }
      
      setBundles(extractedBundles);
    }
  }, [searchParams, bundleCount]);

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

  const getPaymentMethodIcon = () => {
    switch (paymentMethod) {
      case 'card':
        return <CreditCard className="w-6 h-6 text-blue-500" />;
      case 'cash':
        return <DollarSign className="w-6 h-6 text-green-500" />;
      case 'qr':
        return <QrCode className="w-6 h-6 text-purple-500" />;
      case 'crypto':
        return <Bitcoin className="w-6 h-6 text-orange-500" />;
      default:
        return null;
    }
  };

  const getPaymentMethodText = () => {
    switch (paymentMethod) {
      case 'card':
        return language === 'en' ? 'Credit/Debit Card' : 'Tarjeta de Crédito/Débito';
      case 'cash':
        return language === 'en' ? 'Cash' : 'Efectivo';
      case 'qr':
        return language === 'en' ? 'QR Plin/Yape' : 'QR Plin/Yape';
      case 'crypto':
        return language === 'en' ? 'Cryptocurrency' : 'Criptomoneda';
      default:
        return language === 'en' ? 'Not specified' : 'No especificado';
    }
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
          
          {email && (
            <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-2xl p-6 max-w-md mx-auto border border-green-100/50 shadow-sm mb-6">
              <p className="text-gray-600 mb-2">
                {language === "en"
                  ? "We've sent a confirmation email to:"
                  : "Hemos enviado un correo de confirmación a:"}
              </p>
              <p className="text-lg font-semibold text-green-700 mb-2">
                {maskEmail(email)}
              </p>
              <p className="text-sm text-gray-500">
                {language === "en"
                  ? "Please check your inbox and spam folder"
                  : "Por favor revisa tu bandeja de entrada y carpeta de spam"}
              </p>
            </div>
          )}
          
          {/* Purchase Summary */}
          {bundles.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl p-6 max-w-2xl mx-auto border border-gray-100 shadow-sm mb-6"
            >
              <h3 className="text-xl font-semibold mb-4 flex items-center justify-center">
                <Package className="w-5 h-5 mr-2 text-green-600" />
                {language === "en" ? "Purchase Summary" : "Resumen de Compra"}
              </h3>
              
              <div className="divide-y divide-gray-100">
                {bundles.map((bundle, index) => (
                  <div key={bundle.id} className="py-3 flex justify-between items-center">
                    <div className="text-left">
                      <p className="font-medium text-gray-800">
                        <span className="inline-flex items-center justify-center w-6 h-6 bg-green-100 text-green-800 rounded-full mr-2 text-xs font-bold">
                          {index + 1}
                        </span>
                        {bundle.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {language === "en" ? "Quantity" : "Cantidad"}: {bundle.quantity}
                      </p>
                    </div>
                    <p className="font-semibold text-gray-800">
                      S/ {(bundle.price * bundle.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
                
                {discount && parseFloat(discount) > 0 && (
                  <div className="py-3 flex justify-between items-center text-green-600">
                    <p className="font-medium">
                      {language === "en" ? "Discount" : "Descuento"}
                      {coupon && ` (${coupon})`}
                    </p>
                    <p className="font-semibold">- S/ {parseFloat(discount).toFixed(2)}</p>
                  </div>
                )}
                
                <div className="py-3 flex justify-between items-center">
                  <p className="font-bold text-gray-900">{language === "en" ? "Total" : "Total"}</p>
                  <p className="font-bold text-gray-900">S/ {total ? parseFloat(total).toFixed(2) : "0.00"}</p>
                </div>
              </div>
              
              {paymentMethod && (
                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-center">
                  <div className="flex items-center bg-gray-50 px-4 py-2 rounded-full">
                    {getPaymentMethodIcon()}
                    <span className="ml-2 text-gray-700">{getPaymentMethodText()}</span>
                  </div>
                </div>
              )}
            </motion.div>
          )}
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
                    {language === "en" ? "Book now" : "Reservar ahora"}
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

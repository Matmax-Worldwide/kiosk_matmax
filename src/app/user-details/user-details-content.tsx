'use client';

import { useQuery } from "@apollo/client";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GET_CONSUMER, GET_CONSUMER_RESERVATIONS, GET_ALLOCATION } from "@/lib/graphql/queries";
import { Spinner } from "@/components/spinner";
import { Package2, Clock, ChevronRight, Calendar, Home, User } from "lucide-react";
import type { Bundle } from "@/types/bundle";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguageContext } from "@/contexts/LanguageContext";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { maskEmail, maskPhoneNumber } from "@/lib/utils/mask-data";
import React from "react";

interface Reservation {
  status: string;
  timeSlot: {
    allocation: {
      id: string;
    };
  };
}

export function UserDetailsContent() {
  const router = useRouter();
  const { language } = useLanguageContext();
  const searchParams = useSearchParams();
  const consumerId = searchParams.get('consumerId');
  const classId = searchParams.get('classId');
  const [isNavigatingToPayment, setIsNavigatingToPayment] = React.useState(false);
  const [isNavigatingToPackages, setIsNavigatingToPackages] = React.useState(false);

  // Verificar primero si existe una reserva
  const { data: reservationsData, loading: reservationsLoading } = useQuery(GET_CONSUMER_RESERVATIONS, {
    variables: { 
      consumerId,
      allocationId: classId 
    },
    skip: !consumerId || !classId,
    fetchPolicy: 'network-only'
  });

  const { data: consumerData, loading: consumerLoading } = useQuery(GET_CONSUMER, {
    variables: { id: consumerId },
    skip: !consumerId,
  });

  const { data: allocationData, loading: allocationLoading } = useQuery(GET_ALLOCATION, {
    variables: { id: classId },
    skip: !classId,
  });


  if (consumerLoading || reservationsLoading || allocationLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 mt-16">
        <div className="flex justify-center items-center min-h-[400px]">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  // Verificar si existe una reserva
  const existingReservation = reservationsData?.consumer?.reservations?.find(
    (reservation: Reservation) => 
      reservation.timeSlot.allocation.id === classId && 
      ['PENDING', 'CONFIRMED'].includes(reservation.status)
  );

  // Si hay una reserva existente, mostrar mensaje y opciones alternativas
  if (existingReservation) {
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
                  onClick={() => router.push('/schedule')}
                  className="w-full sm:w-auto bg-gradient-to-r from-green-600 to-teal-600 text-white hover:from-green-700 hover:to-teal-700 transition-all duration-300 h-14 px-8 rounded-2xl text-lg font-semibold shadow-lg hover:shadow-xl"
                >
                  <Calendar className="w-6 h-6 mr-2" />
                  {language === "en" ? "View Other Times" : "Ver Otros Horarios"}
                </Button>
              </motion.div>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={() => router.push(`/buy-packages?consumerId=${consumerId}`)}
                  className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 h-14 px-8 rounded-2xl text-lg font-semibold shadow-lg hover:shadow-xl"
                >
                  <Package2 className="w-6 h-6 mr-2" />
                  {language === "en" ? "Buy New Package" : "Comprar Nuevo Paquete"}
                </Button>
              </motion.div>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={() => router.push('/')}
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

  const consumer = consumerData?.consumer;
  const activeBundles = (consumer?.bundles as Bundle[])?.filter(bundle => bundle.status === 'ACTIVE') || [];
  const recentBundles = activeBundles.slice(0, 3);

  const handleBundleSelection = (bundle: Bundle) => {
    setIsNavigatingToPayment(true);
    const queryParams = new URLSearchParams({
      consumerId: consumerId as string,
      bundleId: bundle.id
    });
    
    if (classId) {
      queryParams.append('classId', classId);
    }
    
    router.push(`/payment?${queryParams.toString()}`);
  };

  const handleViewAllPackages = () => {
    setIsNavigatingToPackages(true);
    router.push(`/buy-packages?consumerId=${consumerId}${classId ? `&classId=${classId}` : ''}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 mt-16">
      <div className="container mx-auto px-4 py-8">

        
        {/* User Details Card */}
        {consumer && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-2 hover:border-opacity-50 hover:border-gradient-to-r from-purple-600 to-pink-600">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center text-white mb-6">
                <User className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold mb-4">
                {`${consumer.firstName} ${consumer.lastName}`}
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">
                      {language === "en" ? "Email" : "Correo"}
                    </p>
                    <p className="font-semibold text-gray-700">
                      {maskEmail(consumer.email)}
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">
                      {language === "en" ? "Phone" : "Teléfono"}
                    </p>
                    <p className="font-semibold text-gray-700">
                      {maskPhoneNumber(consumer.phoneNumber)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Class Details Card */}
        {allocationData?.allocation && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-2 hover:border-opacity-50 hover:border-gradient-to-r from-amber-500 to-orange-500">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center text-white mb-6">
                <Calendar className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold mb-4">
                {language === "en" ? "Class Information" : "Información de la Clase"}
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">
                      {language === "en" ? "Class Name" : "Nombre de la Clase"}
                    </p>
                    <p className="font-semibold text-gray-700">
                      {allocationData.allocation.timeSlot.sessionType.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">
                      {language === "en" ? "Professor" : "Profesor"}
                    </p>
                    <p className="font-semibold text-gray-700">
                      {allocationData.allocation.timeSlot.agent.name}
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">
                      {language === "en" ? "Date & Time" : "Fecha y Hora"}
                    </p>
                    <p className="font-semibold text-gray-700">
                      {format(new Date(allocationData.allocation.startTime), "EEEE d 'de' MMMM, HH:mm", {
                        locale: language === 'es' ? es : undefined
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">
                      {language === "en" ? "Duration" : "Duración"}
                    </p>
                    <p className="font-semibold text-gray-700">
                      {allocationData.allocation.timeSlot.sessionType.defaultDuration} {language === "en" ? "minutes" : "minutos"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}


        {/* Active Packages Section */}
        <div className="space-y-6">
          {recentBundles.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-semibold text-gray-800">
                  {language === "en" ? "Use Active Package" : "Usar Paquete Activo"}
                </h3>
                <Clock className="h-6 w-6 text-green-600" />
              </div>
              <div className="space-y-4">
                {recentBundles.map((bundle, index) => (
                  <motion.div
                    key={bundle.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="p-4 hover:shadow-lg transition-all duration-300 bg-white/95 backdrop-blur-sm border-green-50">
                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg text-gray-800">{bundle.bundleType.name}</h4>
                          <span className="text-green-600 text-sm font-medium">
                            {language === "en" ? "Remaining:" : "Restantes:"} {bundle.remainingUses}
                          </span>
                        </div>
                        <Button 
                          onClick={() => handleBundleSelection(bundle)}
                          className="bg-gradient-to-r from-green-600 to-teal-600 
                            hover:from-green-700 hover:to-teal-700 text-white px-6 py-3
                            shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl
                            transform hover:scale-105 min-w-[140px]"
                          disabled={bundle.remainingUses <= 0 || isNavigatingToPayment}
                          size="default"
                        >
                          {isNavigatingToPayment ? (
                            <>
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                className="mr-2"
                              >
                                <Clock className="w-4 h-4" />
                              </motion.div>
                              {language === "en" ? "Loading..." : "Cargando..."}
                            </>
                          ) : bundle.remainingUses > 0 ? (
                            <>
                              <Package2 className="w-4 h-4 mr-2" />
                              {language === "en" ? "Use Package" : "Usar Paquete"}
                            </>
                          ) : (
                            language === "en" ? "Empty" : "Vacío"
                          )}
                        </Button>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Buy More Packages Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-8"
          >
            <motion.button
              onClick={handleViewAllPackages}
              disabled={isNavigatingToPackages}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              aria-busy={isNavigatingToPackages}
              aria-label={language === "en" ? "View All Packages" : "Ver Todos los Paquetes"}
              className="w-full bg-white/90 backdrop-blur-sm text-gray-500 py-3 px-6 
                rounded-xl hover:bg-white/95 transition-all duration-300 
                flex items-center justify-center gap-2 border border-gray-200 
                font-semibold text-lg shadow-sm hover:shadow-md group
                disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isNavigatingToPackages ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                    className="mr-2"
                  >
                    <Clock className="w-5 h-5" />
                  </motion.div>
                  <span>{language === "en" ? "Loading..." : "Cargando..."}</span>
                </>
              ) : (
                <>
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={language}
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -10, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {language === "en" ? "Buy More Packages" : "Comprar Más Paquetes"}
                    </motion.span>
                  </AnimatePresence>
                  <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </motion.button>
          </motion.div>
        </div>
      </div>
    </div>
  );
} 
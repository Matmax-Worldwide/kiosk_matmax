'use client';

import { useQuery, useMutation, gql } from "@apollo/client";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GET_CONSUMER, GET_ALLOCATION } from "@/lib/graphql/queries";
import { Spinner } from "@/components/spinner";
import { Package2, Clock, ChevronRight } from "lucide-react";
import { ChangeClassComponent } from "@/components/ui/change-class";

import { motion, AnimatePresence } from "framer-motion";
import { useLanguageContext } from "@/contexts/LanguageContext";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { maskEmail, maskPhoneNumber } from "@/lib/utils/mask-data";
import React, { useEffect } from "react";
import { toast } from 'sonner';
import { Bundle, Reservation } from "@/types/graphql";

const UPDATE_BUNDLE_STATUS = gql`
  mutation UpdateBundleStatus($id: ID!, $status: BundleStatus!) {
    updateBundle(id: $id, input: { status: $status }) {
      id
      status
      remainingUses
    }
  }
`;

export function UserDetailsContent() {
  const router = useRouter();
  const { language } = useLanguageContext();
  const searchParams = useSearchParams();
  const consumerId = searchParams.get('consumerId');
  const classId = searchParams.get('classId');
  const now = searchParams.get('now');
  const [isNavigatingToPayment, setIsNavigatingToPayment] = React.useState(false);
  const [isNavigatingToPackages, setIsNavigatingToPackages] = React.useState(false);
  const checkedBundles = React.useRef(new Set<string>());

  const [updateBundleStatus] = useMutation(UPDATE_BUNDLE_STATUS);

  const { data: consumerData, loading: consumerLoading } = useQuery(GET_CONSUMER, {
    variables: { id: consumerId },
    skip: !consumerId,
  });

  const { data: allocationData, loading: allocationLoading } = useQuery(GET_ALLOCATION, {
    variables: { id: classId },
    skip: !classId,
  });

  // Efecto para revisar paquetes con 0 usos al cargar la página
  useEffect(() => {
    const checkAndExpireBundles = async () => {
      if (consumerData?.consumer?.bundles) {
        const activeBundlesWithZeroUses = consumerData.consumer.bundles.filter(
          (bundle: Bundle) => bundle.status === 'ACTIVE' && 
                    bundle.remainingUses === 0 && 
                    !checkedBundles.current?.has(bundle.id)
        );

        await Promise.all(
          activeBundlesWithZeroUses.map((bundle: Bundle) =>
            updateBundleStatus({ variables: { id: bundle.id, status: "EXPIRED" } })
          )
        );

        if (activeBundlesWithZeroUses.length > 0) {
          toast.info(
            language === 'en'
              ? `Found ${activeBundlesWithZeroUses.length} package(s) with 0 uses remaining and expired them.`
              : `Se encontraron ${activeBundlesWithZeroUses.length} paquete(s) con 0 usos restantes y fueron expirados.`,
            {
              duration: 5000,
              position: "top-center",
            }
          );
        }
      }
    };

    checkAndExpireBundles();
  }, [consumerData?.consumer?.bundles, updateBundleStatus, checkedBundles, language]);

  if (consumerLoading || allocationLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 mt-16">
        <div className="flex justify-center items-center min-h-[400px]">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  // Verificar si existe una reserva
  const existingReservation = consumerData?.consumer?.reservations?.find(
    (reservation: Reservation) => 
      reservation.allocation.id === classId
  );

  // Si hay una reserva existente, mostrar el componente de cambio de clase
  if (existingReservation) {
    return (
      <ChangeClassComponent 
        consumerId={consumerId as string}
        classId={classId as string}
        now={now as string}
      />
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
      if (now) {
        queryParams.append('now', now);
      }
      router.push(`/payment?${queryParams.toString()}`);
    } else {
      // Navigate to schedule page when no classId is present
      router.push(`/schedule?${queryParams.toString()}`);
    }
  };

  const handleViewAllPackages = () => {
    setIsNavigatingToPackages(true);
    const params = new URLSearchParams();
    params.append('consumerId', consumerId as string);
    if (classId) params.append('classId', classId);
    if (now) params.append('now', now);
    router.push(`/buy-packages?${params.toString()}`);
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
          {recentBundles.length > 0 ? (
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
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-r from-purple-50 to-pink-50 p-8 rounded-2xl shadow-md border border-purple-100"
            >
              <div className="text-center space-y-4">
                <div className="inline-block p-4 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full">
                  <Package2 className="h-10 w-10 text-purple-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800">
                  {language === "en" ? "Your Yoga Journey Awaits" : "Tu Camino de Yoga te Espera"}
                </h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  {language === "en" 
                    ? "Elevate your practice with our packages. Unlock unlimited potential and find your inner balance." 
                    : "Eleva tu práctica con nuestros paquetes. Desbloquea un potencial ilimitado y encuentra tu equilibrio interior."}
                </p>
                <motion.button
                  onClick={handleViewAllPackages}
                  disabled={isNavigatingToPackages}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  className="mt-6 bg-gradient-to-r from-purple-600 to-pink-600 
                    hover:from-purple-700 hover:to-pink-700 text-white py-4 px-8 
                    rounded-xl shadow-lg hover:shadow-xl transition-all duration-300
                    font-bold text-lg flex items-center justify-center gap-2 mx-auto
                    disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isNavigatingToPackages ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                      >
                        <Clock className="w-5 h-5" />
                      </motion.div>
                      <span>{language === "en" ? "Loading..." : "Cargando..."}</span>
                    </>
                  ) : (
                    <>
                      <Package2 className="w-5 h-5" />
                      <AnimatePresence mode="wait">
                        <motion.span
                          key={language}
                          initial={{ y: 10, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          exit={{ y: -10, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          {language === "en" ? "Explore Packages" : "Explorar Paquetes"}
                        </motion.span>
                      </AnimatePresence>
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Buy More Packages Button - Only show if user has active packages */}
          {recentBundles.length > 0 && (
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
          )}
        </div>
      </div>
    </div>
  );
} 
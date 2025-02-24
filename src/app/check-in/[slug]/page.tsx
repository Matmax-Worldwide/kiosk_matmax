"use client";

import { useQuery, useMutation } from "@apollo/client";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Calendar,
  User2,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  CalendarPlus,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { GET_CONSUMER, UPDATE_RESERVATION_STATUS } from "@/lib/graphql/queries";
import { Skeleton } from "@/components/ui/skeleton";
import React from "react";
import { useLanguageContext } from "@/contexts/LanguageContext";

interface Bundle {
  id: string;
  bundleType: {
    name: string;
  };
  remainingUses: number;
  status: string;
  validFrom: string;
  validTo: string;
}

interface Reservation {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: string;
  bundle: {
    id: string;
    bundleType: {
      name: string;
    };
    remainingUses: number;
  };
  allocation: {
    startTime: string;
    timeSlot: {
      sessionType: {
        name: string;
      };
      agent: {
        name: string;
      };
    };
  };
}

function CheckInSkeletonLoader() {
  return (
    <div className="container mx-auto px-4 py-8 mt-16">
      <div className="max-w-4xl mx-auto">
        {/* Consumer Info Card Skeleton */}
        <Card className="p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <Skeleton className="h-8 w-64 mb-2" />
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-6 w-40" />
            </div>
            <Skeleton className="h-8 w-8" />
          </div>

          {/* Active Bundles Section */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-4" />
                      <Skeleton className="h-5 w-48" />
                    </div>
                    <Skeleton className="h-5 w-32" />
                  </div>
                  <div className="flex items-center justify-between text-xs mt-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Today's Reservations Skeleton */}
        <Skeleton className="h-8 w-48 mb-4" />
        {[1, 2].map((i) => (
          <div key={i} className="bg-white rounded-xl shadow-md p-6 border border-gray-100 mb-4">
            <div className="flex justify-between items-start">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5" />
                  <div className="flex flex-col">
                    <Skeleton className="h-5 w-20 mb-1" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5" />
                  <Skeleton className="h-5 w-24" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5" />
                  <Skeleton className="h-5 w-40" />
                </div>
                <Skeleton className="h-4 w-56" />
              </div>
              <Skeleton className="h-10 w-28" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CheckInDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { language } = useLanguageContext();
  const consumerId = params.slug as string;
  const [isNavigating, setIsNavigating] = React.useState(false);
  const [isCheckingIn, setIsCheckingIn] = React.useState(false);
  const [showSuccess, setShowSuccess] = React.useState(false);
  const [isBuyingPackage, setIsBuyingPackage] = React.useState(false);
  const [isBookingClass, setIsBookingClass] = React.useState(false);

  // Get consumer details query
  const { data: consumerData, loading, refetch: refetchConsumer } = useQuery(GET_CONSUMER, {
    variables: { id: consumerId },
  });

  // Update reservation mutation
  const [updateReservation] = useMutation(UPDATE_RESERVATION_STATUS, {
    onCompleted: async () => {
      await refetchConsumer();
      setShowSuccess(true);
      setTimeout(() => {
        router.push('/');
      }, 3000);
    },
    onError: (error) => {
      console.error("Error during check-in:", error);
      setIsCheckingIn(false);
    }
  });

  const handleCheckIn = async (reservationId: string) => {
    try {
      setIsCheckingIn(true);
      await updateReservation({
        variables: {
          id: reservationId,
          status: "VALIDATED",
        },
      });
    } catch (error) {
      console.error("Error during check-in:", error);
      setIsCheckingIn(false);
    }
  };

  const getTodayReservations = (reservations: Reservation[] = []) => {
    const today = new Date();
    return reservations.filter((reservation) => {
      const reservationDate = new Date(reservation.allocation.startTime);
      return (
        reservationDate.getDate() === today.getDate() &&
        reservationDate.getMonth() === today.getMonth() &&
        reservationDate.getFullYear() === today.getFullYear()
      );
    });
  };

  const getActiveBundles = (bundles: Bundle[] = []) => {
    return bundles.filter(
      (bundle) => bundle.status === "ACTIVE" && bundle.remainingUses > 0
    );
  };

  const isValidDate = (dateString: string) => {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  };

  const formatDate = (dateString: string, formatStr: string) => {
    if (!isValidDate(dateString)) return "Fecha inválida";
    return format(new Date(dateString), formatStr, { locale: es });
  };

  if (loading) {
    return (
      <>
        <Header title={{ en: "Check-in", es: "Check-in" }} />
        <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white mt-16">
          <CheckInSkeletonLoader />
        </main>
      </>
    );
  }

  const activeBundles = getActiveBundles(consumerData.consumer.bundles);
  const todayReservations = getTodayReservations(
    consumerData.consumer.reservations
  );

  return (
    <>
      <Header title={{ en: "Check-in", es: "Check-in" }} />
      <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white mt-16">
        {/* Success Overlay */}
        <AnimatePresence>
          {showSuccess && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="bg-white rounded-lg p-8 flex flex-col items-center gap-4 max-w-sm mx-4"
              >
                <CheckCircle2 className="w-16 h-16 text-green-500" />
                <h2 className="text-2xl font-bold text-center">
                  {language === "en" ? "Check-in Successful!" : "¡Check-in Exitoso!"}
                </h2>
                <p className="text-gray-600 text-center">
                  {language === "en" 
                    ? "You will be redirected to the home page..." 
                    : "Serás redirigido a la página principal..."}
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Consumer Info Card */}
            <Card className="p-6 mb-6 hover:shadow-lg transition-all duration-300">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
                    {consumerData.consumer.firstName}{" "}
                    {consumerData.consumer.lastName}
                  </h2>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-gray-600">
                      <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span>{consumerData.consumer.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span>{consumerData.consumer.phoneNumber}</span>
                    </div>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-green-500/10 to-teal-500/10 flex items-center justify-center">
                  <Package className="w-6 h-6 text-teal-600" />
                </div>
              </div>

              {/* Active Bundles Section */}
              {activeBundles.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">
                    {language === "en" ? "Active Packages" : "Paquetes Activos"}
                  </h4>
                  <div className="space-y-3">
                    {activeBundles.map((bundle) => (
                      <div
                        key={bundle.id}
                        className="bg-gradient-to-r from-gray-50 to-gray-50/50 rounded-xl p-4 hover:shadow-md transition-all duration-300"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-teal-500" />
                            <span className="text-sm font-medium">
                              {bundle.bundleType.name}
                            </span>
                          </div>
                          <span className="text-sm font-semibold text-teal-600">
                            {language === "en" 
                              ? `${bundle.remainingUses} classes remaining`
                              : `${bundle.remainingUses} clases restantes`
                            }
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>
                              {language === "en" ? "From: " : "Desde: "}
                              {formatDate(bundle.validFrom, "eee dd MMM yyyy")}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>
                              {language === "en" ? "To: " : "Hasta: "}
                              {formatDate(bundle.validTo, "eee dd MMM yyyy")}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            {/* Today's Reservations */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                {language === "en" ? "Today's Reservations" : "Reservas para hoy"}
              </h3>
              {todayReservations.map((reservation: Reservation) => (
                <motion.div
                  key={reservation.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-blue-500" />
                        <div className="flex flex-col">
                          <span className="font-medium capitalize">
                            {formatDate(reservation.allocation.startTime, "eee")}
                          </span>
                          <span className="text-sm text-gray-600">
                            {formatDate(reservation.allocation.startTime, "d 'de' MMMM")}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-green-500" />
                        <span>
                          {formatDate(reservation.allocation.startTime, "HH:mm")} hrs
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User2 className="w-5 h-5 text-purple-500" />
                        <span>
                          {reservation.allocation.timeSlot.agent.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg">
                        <Package className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          {reservation.bundle.bundleType.name} -{" "}
                          {language === "en" 
                            ? `${reservation.bundle.remainingUses} classes remaining`
                            : `${reservation.bundle.remainingUses} clases restantes`
                          }
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-3">
                      {reservation.status === "CONFIRMED" ? (
                        <Button
                          onClick={() => handleCheckIn(reservation.id)}
                          className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white shadow-md hover:shadow-lg transform hover:scale-102 active:scale-98 transition-all duration-200"
                          disabled={isCheckingIn}
                        >
                          {isCheckingIn ? (
                            <>
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                className="mr-2"
                              >
                                <Clock className="w-5 h-5" />
                              </motion.div>
                              {language === "en" ? "Checking in..." : "Registrando..."}
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-5 h-5 mr-2" />
                              Check-in
                            </>
                          )}
                        </Button>
                      ) : (
                        <div className="flex items-center gap-2 text-gray-500 bg-gray-50 px-4 py-2 rounded-lg">
                          <XCircle className="w-5 h-5" />
                          <span>{reservation.status}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}

              {todayReservations.length === 0 && (
                <div className="text-center py-12">
                  <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
                    <div className="space-y-6">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center">
                          <Calendar className="w-8 h-8 text-gray-400" />
                        </div>
                        <div className="text-gray-600 text-lg">
                          {language === "en" 
                            ? "No reservations found for today"
                            : "No hay reservas para hoy"}
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-6">
                        {activeBundles.length > 0 ? (
                          <>
                            <div className="text-center text-gray-500">
                              {language === "en"
                                ? "You have active packages. Would you like to make a reservation?"
                                : "Tienes paquetes activos. ¿Deseas hacer una reserva?"}
                            </div>
                            <Button
                              onClick={async () => {
                                setIsNavigating(true);
                                router.push(`/schedule?consumerId=${params.slug}`);
                              }}
                              className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white shadow-md hover:shadow-lg transform hover:scale-102 active:scale-98 transition-all duration-200 py-6"
                              disabled={isNavigating}
                            >
                              {isNavigating ? (
                                <>
                                  <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                    className="mr-2"
                                  >
                                    <Clock className="w-5 h-5" />
                                  </motion.div>
                                  {language === "en" ? "Loading..." : "Cargando..."}
                                </>
                              ) : (
                                <>
                                  <CalendarPlus className="w-5 h-5 mr-2" />
                                  {language === "en" ? "Book Now" : "Reservar Ahora"}
                                </>
                              )}
                            </Button>
                          </>
                        ) : (
                          <>
                            <div className="text-center">
                              <p className="text-gray-600 text-lg mb-2">
                                {language === "en" 
                                  ? "No active packages available"
                                  : "No hay paquetes activos disponibles"}
                              </p>
                              <p className="text-gray-500">
                                {language === "en"
                                  ? "Choose an option to get started:"
                                  : "Elige una opción para comenzar:"}
                              </p>
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                              <Button
                                onClick={() => {
                                  setIsBuyingPackage(true);
                                  router.push(`/buy-packages?consumerId=${params.slug}`);
                                }}
                                className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white shadow-md hover:shadow-lg transform hover:scale-102 active:scale-98 transition-all duration-200 py-6"
                                disabled={isBuyingPackage}
                              >
                                {isBuyingPackage ? (
                                  <>
                                    <motion.div
                                      animate={{ rotate: 360 }}
                                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                      className="mr-2"
                                    >
                                      <Clock className="w-5 h-5" />
                                    </motion.div>
                                    {language === "en" ? "Loading..." : "Cargando..."}
                                  </>
                                ) : (
                                  <>
                                    <Package className="w-5 h-5 mr-2" />
                                    {language === "en" ? "Buy Packages" : "Comprar Paquetes"}
                                  </>
                                )}
                              </Button>
                              <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                  <div className="w-full border-t border-gray-200"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                  <span className="px-2 bg-white text-gray-500">
                                    {language === "en" ? "or" : "o"}
                                  </span>
                                </div>
                              </div>
                              <Button
                                onClick={() => {
                                  setIsBookingClass(true);
                                  router.push(`/class-pass?consumerId=${params.slug}`);
                                }}
                                className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-md hover:shadow-lg transform hover:scale-102 active:scale-98 transition-all duration-200 py-6"
                                disabled={isBookingClass}
                              >
                                {isBookingClass ? (
                                  <>
                                    <motion.div
                                      animate={{ rotate: 360 }}
                                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                      className="mr-2"
                                    >
                                      <Clock className="w-5 h-5" />
                                    </motion.div>
                                    {language === "en" ? "Loading..." : "Cargando..."}
                                  </>
                                ) : (
                                  <>
                                    <CalendarPlus className="w-5 h-5 mr-2" />
                                    {language === "en" ? "Book Individual Class" : "Reservar Clase Individual"}
                                  </>
                                )}
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

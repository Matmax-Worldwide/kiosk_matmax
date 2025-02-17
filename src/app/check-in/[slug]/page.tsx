"use client";

import { useQuery, useMutation } from "@apollo/client";
import { motion } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Calendar,
  User2,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  CalendarPlus,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { GET_CONSUMER, UPDATE_RESERVATION_STATUS } from "@/lib/graphql/queries";
import { Skeleton } from "@/components/ui/skeleton";

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
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Button Skeleton */}
        <Skeleton className="h-10 w-24 mb-6" />

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
  const { toast } = useToast();
  const consumerId = params.slug as string;

  // Get consumer details query
  const { data: consumerData, loading } = useQuery(GET_CONSUMER, {
    variables: { id: consumerId },
  });

  // Update reservation mutation
  const [updateReservation] = useMutation(UPDATE_RESERVATION_STATUS, {
    onCompleted: (data) => {
      toast({
        title: "Check-in exitoso",
        description: `${data.updateReservation.forConsumer.fullName} ha sido registrado para la clase de ${data.updateReservation.allocation.timeSlot.sessionType.name}`,
      });
      setTimeout(() => {
        router.push('/');
      }, 1500);
    },
    onError: () => {
      toast({
        title: "Error",
        description:
          "No se pudo realizar el check-in. Por favor, intenta nuevamente.",
        variant: "destructive",
      });
    },
  });

  const handleCheckIn = async (reservationId: string) => {
    try {
      await updateReservation({
        variables: {
          id: reservationId,
          status: "VALIDATED",
        },
      });
    } catch (error) {
      console.error("Error during check-in:", error);
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
        <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
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
      <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Back Button */}
            <Button
              variant="ghost"
              className="mb-6"
              onClick={() => router.push("/check-in")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a búsqueda
            </Button>

            {/* Consumer Info Card */}
            <Card className="p-6 mb-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-2">
                    {consumerData.consumer.firstName}{" "}
                    {consumerData.consumer.lastName}
                  </h2>
                  <p className="text-gray-600">{consumerData.consumer.email}</p>
                  <p className="text-gray-600">
                    {consumerData.consumer.phoneNumber}
                  </p>
                </div>
                <Package className="w-8 h-8 text-gray-400" />
              </div>

              {/* Active Bundles Section
              {activeBundles.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">
                    Paquetes Activos
                  </h4>
                  <div className="space-y-3">
                    {activeBundles.map((bundle) => (
                      <div
                        key={bundle.id}
                        className="bg-gray-50 rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Ticket className="w-4 h-4 text-blue-500" />
                            <span className="text-sm font-medium">
                              {bundle.bundleType.name}
                            </span>
                          </div>
                          <span className="text-sm font-semibold text-blue-600">
                            {bundle.remainingUses} clases restantes
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>
                              Desde: {formatDate(bundle.validFrom, "d MMM yyyy")}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>
                              Hasta: {formatDate(bundle.validTo, "d MMM yyyy")}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )} */}
            </Card>

            {/* Today's Reservations */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                Reservas para hoy
              </h3>
              {todayReservations.map((reservation: Reservation) => (
                <motion.div
                  key={reservation.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white rounded-xl shadow-md p-6 border border-gray-100"
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
                      <div>
                        <span className="text-sm text-gray-500">
                          {reservation.bundle.bundleType.name} -{" "}
                          {reservation.bundle.remainingUses} clases restantes
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-3">
                      {reservation.status === "CONFIRMED" ? (
                        <Button
                          onClick={() => handleCheckIn(reservation.id)}
                          className="bg-green-500 hover:bg-green-600"
                        >
                          <CheckCircle2 className="w-5 h-5 mr-2" />
                          Check-in
                        </Button>
                      ) : (
                        <div className="flex items-center gap-2 text-gray-500">
                          <XCircle className="w-5 h-5" />
                          <span>{reservation.status}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}

              {todayReservations.length === 0 && (
                <div className="text-center py-8">
                  {activeBundles.length > 0 ? (
                    <div className="space-y-4">
                      <p className="text-gray-500">No hay reservas para hoy</p>
                      <Button
                        onClick={() =>
                          router.push(
                            `/schedule?consumerId=${consumerId}`
                          )
                        }
                        className="bg-blue-500 hover:bg-blue-600"
                      >
                        <CalendarPlus className="w-5 h-5 mr-2" />
                        Reservar Ahora
                      </Button>
                    </div>
                  ) : (
                    <p className="text-gray-500">
                      No hay reservas para hoy ni paquetes activos disponibles
                    </p>
                  )}
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

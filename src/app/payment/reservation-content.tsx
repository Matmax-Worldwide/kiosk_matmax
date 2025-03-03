"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useLanguageContext } from "@/contexts/LanguageContext";
import {
  Calendar,
  User2,
  Package,
  Loader2,
  CheckCircle2
} from "lucide-react";
import { useQuery, useMutation } from "@apollo/client";
import {
  GET_CONSUMER,
  GET_BUNDLE,
  GET_ALLOCATION,
  BundleStatus,
  CREATE_RESERVATION,
  GET_CONSUMER_RESERVATIONS,
} from "@/lib/graphql/queries";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { SuccessOverlay } from "@/components/ui/success-overlay";
import { maskEmail, maskPhoneNumber } from "@/lib/utils/mask-data";

interface ConsumerReservation {
  status: string;
  timeSlot: {
    allocation: {
      id: string;
    };
  };
}

// Loading skeleton component
function ReservationSkeletonLoader() {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-6 w-1/2" />
      </div>

      <div className="space-y-4">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>

      <div className="space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>

      <Skeleton className="h-12 w-full rounded-lg" />
    </div>
  );
}

export function ReservationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language } = useLanguageContext();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showReservationExists, setShowReservationExists] = useState(false);
  const [existingReservationError, setExistingReservationError] = useState<{
    message: { en: string; es: string };
    options: { en: string; es: string }[];
  } | null>(null);

  const consumerId = searchParams.get("consumerId");
  const bundleId = searchParams.get("bundleId");
  const classId = searchParams.get("classId");
  const now = searchParams.get("now") === "true";
  const checkin = searchParams.get("checkin");

  const { data: consumerData, loading: consumerLoading, refetch: refetchConsumer } = useQuery(
    GET_CONSUMER,
    {
      variables: { id: consumerId },
      skip: !consumerId,
    }
  );

  const { data: bundleData, loading: bundleLoading, refetch: refetchBundle } = useQuery(
    GET_BUNDLE,
    {
      variables: { id: bundleId },
      skip: !bundleId,
    }
  );

  const { data: allocationData, loading: allocationLoading, refetch: refetchAllocation } = useQuery(
    GET_ALLOCATION,
    {
      variables: { id: classId },
      skip: !classId,
    }
  );

  const { data: reservationsData } = useQuery(GET_CONSUMER_RESERVATIONS, {
    variables: { 
      consumerId,
      allocationId: classId 
    },
    skip: !consumerId || !classId,
    fetchPolicy: 'network-only'
  });

  const [createReservation] = useMutation(CREATE_RESERVATION);

  useEffect(() => {
    if (!consumerId || !bundleId || !classId) {
      router.push("/class-pass");
    }
  }, [consumerId, bundleId, classId, router]);

  // Loading state
  const isLoading =
    consumerLoading || bundleLoading || (classId && allocationLoading);
  if (isLoading) {
    return <ReservationSkeletonLoader />;
  }

  // Get package name
  const getPackageName = () => {
    try {
      if (!bundleData) return language === "en" ? "Loading package..." : "Cargando paquete...";

      // For existing bundle
      if (bundleId && bundleData.bundle?.bundleType?.name) {
        return bundleData.bundle.bundleType.name;
      }
      
      // Default case if no name is found
      return language === "en" ? "Unknown Package" : "Paquete Desconocido";
    } catch (error) {
      console.error("Error getting package name:", error);
      return language === "en" ? "Unknown Package" : "Paquete Desconocido";
    }
  };

  const handleCreateReservation = async () => {
    // Initial validations
    if (!consumerId) {
      setError(language === "en" ? "Consumer ID is required." : "Se requiere ID del consumidor.");
      return;
    }

    if (!bundleId) {
      setError(language === "en" ? "Bundle ID is required." : "Se requiere ID del paquete.");
      return;
    }

    if (!classId) {
      setError(language === "en" ? "Class ID is required." : "Se requiere ID de la clase.");
      return;
    }

    // Check for existing reservations first
    if (classId && reservationsData?.consumer?.reservations) {
      const existingReservation = reservationsData.consumer.reservations.find(
        (reservation: ConsumerReservation) => 
          reservation.timeSlot.allocation.id === classId && 
          ['PENDING', 'CONFIRMED'].includes(reservation.status)
      );

      if (existingReservation) {
        setShowReservationExists(true);
        setExistingReservationError({
          message: {
            en: "You already have a reservation for this class.",
            es: "Ya tienes una reserva para esta clase."
          },
          options: [
            {
              en: "View Other Times",
              es: "Ver Otros Horarios"
            },
            {
              en: "Buy New Package",
              es: "Comprar Nuevo Paquete"
            },
            {
              en: "Return Home",
              es: "Volver al Inicio"
            }
          ]
        });
        return;
      }
    }

    try {
      setIsProcessing(true);
      setError(null);

      // Create reservation
      if (!allocationData?.allocation?.timeSlot?.id || !allocationData.allocation.startTime) {
        throw new Error(
          language === "en"
            ? "Class information is not available"
            : "La información de la clase no está disponible"
        );
      }

      const { data: reservationResponse } = await createReservation({
        variables: {
          input: {
            bundleId: bundleId,
            timeSlotId: allocationData.allocation.timeSlot.id,
            startTime: new Date(allocationData.allocation.startTime).toISOString(),
            forConsumerId: consumerId,
            status: now ? "VALIDATED" : "CONFIRMED",
          },
        },
      });

      if (!reservationResponse?.createReservation) {
        throw new Error(
          language === "en"
            ? "Failed to create reservation. Please try again."
            : "Error al crear la reserva. Por favor intente de nuevo."
        );
      }

      const reservationData = reservationResponse.createReservation;

      // Refetch all data to ensure it's up to date
      await Promise.all([
        refetchConsumer(),
        refetchBundle(),
        classId && refetchAllocation(),
      ]);

      // Show success message before navigation
      setShowSuccess(true);

      // If checkin=true, redirect to schedule
      if (checkin === 'true') {
        setTimeout(() => {
          router.push(`/schedule?consumerId=${consumerId}`);
        }, 2000);
        return;
      }

      // Construct URL parameters for success page
      const params = new URLSearchParams({
        consumerId: consumerId.toString(),
        packageName: getPackageName(),
        bundleId: bundleId || "",
        remainingUses: bundleData?.bundle?.remainingUses?.toString() || "0",
        reservationId: reservationData.id || "",
        classId: classId,
        className: allocationData.allocation.timeSlot?.sessionType?.name || "",
        classDate: allocationData.allocation.startTime?.toString() || "",
        professorName: allocationData.allocation.timeSlot?.agent?.name || "",
        consumerName: consumerData?.consumer?.name || "",
        consumerEmail: consumerData?.consumer?.email || "",
        consumerPhone: consumerData?.consumer?.phone || "",
      });

      // Navigate to success page after a short delay
      setTimeout(() => {
        router.push(`/confirmation?${params.toString()}`);
      }, 2000);
    } catch (error: unknown) {
      console.error("Reservation error:", error);
      const errorMessage = error instanceof Error ? error.message : (language === "en" ? "An error occurred" : "Ocurrió un error");
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleViewOtherTimes = () => {
    router.push(`/schedule?consumerId=${consumerId}`);
  };

  const handleBuyNewPackage = () => {
    router.push(`/class-pass?consumerId=${consumerId}`);
  };

  const handleReturnHome = () => {
    router.push("/");
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "EEEE, d 'de' MMMM, h:mm a", {
        locale: language === "es" ? es : undefined,
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return dateString;
    }
  };

  // If there's an existing reservation error, show it
  if (showReservationExists && existingReservationError) {
    return (
      <div className="space-y-8 py-4">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-red-600">
            {existingReservationError.message[language]}
          </h2>
        </div>

        <div className="space-y-4 pt-4">
          <Button
            onClick={handleViewOtherTimes}
            className="w-full py-6 text-lg bg-blue-600 hover:bg-blue-700"
          >
            {existingReservationError.options[0][language]}
          </Button>
          <Button
            onClick={handleBuyNewPackage}
            className="w-full py-6 text-lg bg-green-600 hover:bg-green-700"
          >
            {existingReservationError.options[1][language]}
          </Button>
          <Button
            onClick={handleReturnHome}
            className="w-full py-6 text-lg"
            variant="outline"
          >
            {existingReservationError.options[2][language]}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
        <SuccessOverlay
          title={{
            en: "Reservation Created!",
            es: "¡Reserva Creada!",
          }}
          message={{
            en: "Your reservation has been successfully created.",
            es: "Tu reserva ha sido creada exitosamente.",
          }}
          show={showSuccess}
        />

      <div className="space-y-8 py-4">
        <div>
          <h1 className="text-2xl font-bold mb-2">
            {language === "en" ? "Confirm Reservation" : "Confirmar Reserva"}
          </h1>
          <p className="text-gray-600">
            {language === "en"
              ? "Please review the details below and confirm your reservation."
              : "Por favor revisa los detalles a continuación y confirma tu reserva."}
          </p>
        </div>

        {/* Consumer Information */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">
            {language === "en" ? "Your Information" : "Tu Información"}
          </h2>
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-blue-50 rounded-full">
                <User2 className="h-6 w-6 text-blue-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium">
                  {consumerData?.consumer?.firstName + " " + consumerData?.consumer?.lastName || (language === "en" ? "Unknown User" : "Usuario Desconocido")}
                </h3>
                <p className="text-sm text-gray-500">
                  {consumerData?.consumer?.email
                    ? maskEmail(consumerData.consumer.email)
                    : ""}
                </p>
                <p className="text-sm text-gray-500">
                  {consumerData?.consumer?.phone
                    ? maskPhoneNumber(consumerData.consumer.phone)
                    : ""}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Package Information */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">
            {language === "en" ? "Package Information" : "Información del Paquete"}
          </h2>
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-green-50 rounded-full">
                <Package className="h-6 w-6 text-green-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium">{getPackageName()}</h3>
                <p className="text-sm text-gray-500">
                  {language === "en" ? "Remaining uses: " : "Usos restantes: "}
                  {bundleData?.bundle?.remainingUses || 0}
                </p>
                <p className="text-sm text-gray-500">
                  {language === "en" ? "Status: " : "Estado: "}
                  {bundleData?.bundle?.status === BundleStatus.ACTIVE
                    ? language === "en"
                      ? "Active"
                      : "Activo"
                    : language === "en"
                    ? "Inactive"
                    : "Inactivo"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Class Information */}
        {classId && allocationData?.allocation && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">
              {language === "en" ? "Class Information" : "Información de la Clase"}
            </h2>
            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-purple-50 rounded-full">
                  <Calendar className="h-6 w-6 text-purple-500" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">
                    {allocationData.allocation.timeSlot?.sessionType?.name || (language === "en" ? "Unknown Class" : "Clase Desconocida")}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {allocationData.allocation.startTime
                      ? formatDate(allocationData.allocation.startTime)
                      : language === "en"
                      ? "Unknown date"
                      : "Fecha desconocida"}
                  </p>
                  <p className="text-sm text-gray-500">
                    {language === "en" ? "Instructor: " : "Instructor: "}
                    {allocationData.allocation.timeSlot?.agent?.name || (language === "en" ? "Unknown" : "Desconocido")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
            {error}
          </div>
        )}

        {/* Confirm Reservation Button */}
        <Button
          onClick={handleCreateReservation}
          disabled={isProcessing}
          className="w-full py-6 text-lg bg-green-600 hover:bg-green-700"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              {language === "en" ? "Processing..." : "Procesando..."}
            </>
          ) : (
            <>
              <CheckCircle2 className="mr-2 h-5 w-5" />
              {language === "en" ? "Confirm Reservation" : "Confirmar Reserva"}
            </>
          )}
        </Button>

        {/* Cancel Button */}
        <Button
          onClick={() => router.back()}
          variant="outline"
          className="w-full py-6 text-lg"
          disabled={isProcessing}
        >
          {language === "en" ? "Cancel" : "Cancelar"}
        </Button>
      </div>
    </>
  );
} 
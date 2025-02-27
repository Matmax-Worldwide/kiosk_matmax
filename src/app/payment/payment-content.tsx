"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useLanguageContext } from "@/contexts/LanguageContext";
import {
  Banknote,
  CreditCard,
  QrCode,
  Calendar,
  User2,
  Package,
  Loader2,
} from "lucide-react";
import { useQuery, useMutation } from "@apollo/client";
import {
  GET_CONSUMER,
  GET_BUNDLE_TYPE,
  GET_BUNDLE,
  CREATE_BUNDLE,
  GET_ALLOCATION,
  BundleStatus,
  CREATE_RESERVATION,
  GET_CONSUMER_RESERVATIONS,
} from "@/lib/graphql/queries";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
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

type PaymentMethod = "CARD" | "CASH" | "QR";

interface PaymentMethodCardProps {
  method: PaymentMethod;
  icon: React.ReactElement;
  title: { en: string; es: string };
  subtitle: string | { en: string; es: string };
  selected: boolean;
  onClick: () => void;
}

function PaymentMethodCard({
  icon,
  title,
  subtitle,
  selected,
  onClick,
}: PaymentMethodCardProps) {
  const { language } = useLanguageContext();

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="w-full"
    >
      <div
        className={`p-4 cursor-pointer transition-all duration-300 bg-white rounded-xl border ${
          selected ? "border-green-500 bg-green-50/50" : "border-gray-100"
        } hover:shadow-md`}
        role="button"
        tabIndex={0}
        onKeyUp={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            onClick();
          }
        }}
        onClick={onClick}
      >
        <div className="flex items-center space-x-4">
          {/* Radio Button */}
          <div
            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
              selected ? "border-green-500" : "border-gray-300"
            }`}
          >
            {selected && <div className="w-3 h-3 rounded-full bg-green-500" />}
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {title[language]}
                </h3>
                <p className="text-sm text-gray-600">
                  {typeof subtitle === "string" ? subtitle : subtitle[language]}
                </p>
              </div>
              <div
                className={`w-10 h-10 rounded-lg ${
                  selected ? "bg-green-500" : "bg-gray-100"
                } flex items-center justify-center transition-colors duration-300`}
              >
                <div
                  className={`w-5 h-5 ${
                    selected ? "text-white" : "text-gray-600"
                  }`}
                >
                  {icon}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function PaymentSkeletonLoader() {
  return (
    <div className="container mx-auto px-4 py-16 md:py-24">
      <div className="max-w-4xl mx-auto">
        <Skeleton className="h-10 w-80 mx-auto mb-4" />
        <Skeleton className="h-6 w-96 mx-auto mb-8" />

        {/* Top Grid Skeleton */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Consumer Info Skeleton */}
          <div className="bg-white p-6 rounded-2xl shadow-sm">
            <Skeleton className="h-14 w-14 rounded-xl mb-4" />
            <Skeleton className="h-6 w-48 mb-4" />
            <div className="space-y-4">
              <div>
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-5 w-48" />
              </div>
              <div>
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-5 w-40" />
              </div>
            </div>
          </div>

          {/* Package Info Skeleton */}
          <div className="bg-white p-6 rounded-2xl shadow-sm">
            <Skeleton className="h-14 w-14 rounded-xl mb-4" />
            <Skeleton className="h-6 w-48 mb-4" />
            <div className="space-y-4">
              <div>
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-5 w-48" />
              </div>
              <div>
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-5 w-32" />
              </div>
            </div>
          </div>
        </div>

        {/* Payment Methods Skeleton */}
        <div className="bg-gray-50 p-6 rounded-2xl shadow-sm mb-6">
          <Skeleton className="h-8 w-40 mx-auto mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white p-6 rounded-2xl shadow-sm">
                <div className="flex flex-col items-center text-center space-y-3">
                  <Skeleton className="h-14 w-14 rounded-xl" />
                  <div>
                    <Skeleton className="h-5 w-32 mb-2" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Class Info Skeleton */}
        <div className="bg-white p-6 rounded-2xl shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <Skeleton className="h-14 w-14 rounded-xl" />
            <div>
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i}>
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-5 w-40" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function PaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language } = useLanguageContext();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(
    null
  );
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
  const bundleTypeId = searchParams.get("bundleTypeId");
  const classId = searchParams.get("classId");
  const now = searchParams.get("now") === "true";

  const { data: consumerData, loading: consumerLoading, refetch: refetchConsumer } = useQuery(
    GET_CONSUMER,
    {
      variables: { id: consumerId },
      skip: !consumerId,
    }
  );

  const { data: bundleData, loading: bundleLoading, refetch: refetchBundle } = useQuery(
    bundleId ? GET_BUNDLE : GET_BUNDLE_TYPE,
    {
      variables: { id: bundleId || bundleTypeId },
      skip: !bundleId && !bundleTypeId,
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

  const [createBundle] = useMutation(CREATE_BUNDLE);
  const [createReservation] = useMutation(CREATE_RESERVATION);

  useEffect(() => {
    if (!consumerId || (!bundleId && !bundleTypeId)) {
      router.push("/class-pass");
    }
  }, [consumerId, bundleId, bundleTypeId, router]);

  // Loading state
  const isLoading =
    consumerLoading || bundleLoading || (classId && allocationLoading);
  if (isLoading) {
    return <PaymentSkeletonLoader />;
  }

  const getPaymentMethodText = () => {
    switch (selectedMethod) {
      case "CARD":
        return "Tarjeta de Crédito/Débito / Credit/Debit div";
      case "QR":
        return "Pago con QR / QR Payment";
      case "CASH":
        return "Efectivo / Cash";
    }
  };

  // Move getPackageName outside handlePayment
  const getPackageName = () => {
    try {
      if (!bundleData) return language === "en" ? "Loading package..." : "Cargando paquete...";

      // For existing bundle
      if (bundleId && bundleData.bundle?.bundleType?.name) {
        return bundleData.bundle.bundleType.name;
      }
      // For new bundle
      if (bundleTypeId && bundleData.bundleType?.name) {
        return bundleData.bundleType.name;
      }
      // If we have bundleType from the earlier validation
      if (bundleData.bundleType?.name) {
        return bundleData.bundleType.name;
      }
      // Default case if no name is found
      return language === "en" ? "Unknown Package" : "Paquete Desconocido";
    } catch (error) {
      console.error("Error getting package name:", error);
      return language === "en" ? "Unknown Package" : "Paquete Desconocido";
    }
  };

  const handlePayment = async () => {
    // Initial validations
    if (!consumerId) {
      setError(language === "en" ? "Consumer ID is required." : "Se requiere ID del consumidor.");
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

    // Validate that we have either bundleId or bundleTypeId, but not both
    if ((!bundleId && !bundleTypeId) || (bundleId && bundleTypeId)) {
      setError(
        language === "en"
          ? "Invalid bundle information."
          : "Información de paquete inválida."
      );
      return;
    }

    // If creating new bundle (bundleTypeId), require payment method
    if (bundleTypeId && !selectedMethod) {
      setError(
        language === "en"
          ? "Please select a payment method."
          : "Por favor seleccione un método de pago."
      );
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);

      let finalBundleId = bundleId;

      // Scenario 1: Create new bundle and reservation
      if (bundleTypeId) {
        const validFrom = new Date();
        const validTo = new Date();
        validTo.setDate(validFrom.getDate() + 30);

        try {
          let note = `${language === "en" ? "Payment Method" : "Método de pago"}: ${getPaymentMethodText() || ""}`;
          if (classId && allocationData?.allocation?.timeSlot?.sessionType?.name) {
            note += ` - ${language === "en" ? "Reserved Class" : "Clase reservada"}: ${allocationData.allocation.timeSlot.sessionType.name}`;
          }

          const { data: newBundleData } = await createBundle({
            variables: {
              input: {
                consumerId,
                status: BundleStatus.ACTIVE,
                bundleTypeId,
                validFrom: validFrom.toISOString(),
                validTo: validTo.toISOString(),
                note,
              },
            },
          });

          if (!newBundleData?.createBundle?.id) {
            throw new Error(
              language === "en"
                ? "Failed to create bundle. Please try again."
                : "Error al crear el paquete. Por favor intente de nuevo."
            );
          }

          finalBundleId = newBundleData.createBundle.id;
        } catch (bundleError) {
          console.error("Error creating bundle:", bundleError);
          throw new Error(
            language === "en"
              ? "Failed to create bundle. Please try again."
              : "Error al crear el paquete. Por favor intente de nuevo."
          );
        }
      }

      // Create reservation (for both scenarios if classId exists)
      let reservationData;
      if (classId && finalBundleId) {
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
              bundleId: finalBundleId,
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

        reservationData = reservationResponse.createReservation;
      }

      // Refetch all data to ensure it's up to date
      await Promise.all([
        refetchConsumer(),
        refetchBundle(),
        classId && refetchAllocation(),
      ]);

      // Show success message before navigation
      setShowSuccess(true);

      // Construct URL parameters based on scenario
      const params = new URLSearchParams({
        consumerId: consumerId.toString(),
        packageName: getPackageName(),
        ...(bundleTypeId ? {
          purchaseId: finalBundleId || "",
          bundleId: finalBundleId || "",
          paymentMethod: selectedMethod || "",
          packagePrice: bundleData?.bundleType?.price?.toString() || "0",
        } : {
          bundleId: finalBundleId || "",
          remainingUses: bundleData?.bundle?.remainingUses?.toString() || "0",
        }),
        ...(reservationData ? {
          reservationId: reservationData.id || "",
        } : {}),
        ...(classId && allocationData?.allocation ? {
          classId: classId,
          className: allocationData.allocation.timeSlot?.sessionType?.name || "",
          classDate: allocationData.allocation.startTime?.toString() || "",
          professorName: allocationData.allocation.timeSlot?.agent?.name || "",
        } : {}),
        ...(consumerData?.consumer ? {
          firstName: consumerData.consumer.firstName || "",
          lastName: consumerData.consumer.lastName || "",
          email: consumerData.consumer.email || "",
        } : {}),
      });

      // Wait for 2 seconds before navigating
      setTimeout(() => {
        router.push(`/confirmation?${params.toString()}`);
      }, 2000);
    } catch (err) {
      console.error("Payment error:", err);
      setError(
        language === "en"
          ? bundleId
            ? "Failed to create reservation. Please try again."
            : "Failed to process payment. Please try again."
          : bundleId
          ? "Error al crear la reserva. Por favor intente de nuevo."
          : "Error al procesar el pago. Por favor intente de nuevo."
      );
      setIsProcessing(false);
      setShowSuccess(false);
    }
  };

  // Add navigation handlers
  const handleViewOtherTimes = () => {
    router.push('/schedule');
  };

  const handleBuyNewPackage = () => {
    router.push('/buy-packages');
  };

  const handleReturnHome = () => {
    router.push('/');
  };

  // Verificar si tenemos los datos necesarios
  if (!consumerData?.consumer) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-red-600">
          {language === "en"
            ? "Unable to load user information. Please try again."
            : "No se pudo cargar la información del usuario. Por favor intente de nuevo."}
        </p>
        <Button onClick={() => router.back()} className="mt-4">
          {language === "en" ? "Go Back" : "Volver"}
        </Button>
      </div>
    );
  }

  // Verificar si tenemos la información del bundle o bundleType
  const isExistingBundle = bundleId?.length === 36;
  if (
    (isExistingBundle && !bundleData?.bundle) ||
    (!isExistingBundle && !bundleData?.bundleType)
  ) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-red-600">
          {language === "en"
            ? "Unable to load package information. Please try again."
            : "No se pudo cargar la información del paquete. Por favor intente de nuevo."}
        </p>
        <Button onClick={() => router.back()} className="mt-4">
          {language === "en" ? "Go Back" : "Volver"}
        </Button>
      </div>
    );
  }

  const consumer = consumerData.consumer;
  // Si es un bundle existente, usar bundleType del bundle, si no, usar bundleType directamente
  const bundleType = isExistingBundle
    ? bundleData.bundle.bundleType
    : bundleData.bundleType;
  const allocation = allocationData?.allocation;
  const classDate = allocation ? new Date(allocation.startTime) : null;

  return (
    <div className="container mx-auto px-4 py-16 md:py-24">
      <SuccessOverlay
        aria-live="polite"
        show={showSuccess}
        title={{
          en: "Payment Processing",
          es: "Procesando Pago",
        }}
        message={{
          en: "Your payment is being processed. Please wait a moment...",
          es: "Tu pago está siendo procesado. Por favor espera un momento...",
        }}
        variant="payment"
        duration={2000}
      />

      {/* Add Reservation Exists Modal */}
      {showReservationExists && existingReservationError && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl shadow-xl p-8 max-w-lg w-full mx-4"
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-yellow-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {existingReservationError.message[language]}
              </h3>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleViewOtherTimes}
                className="w-full px-6 py-3 rounded-xl text-white bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 transition-all duration-200 font-medium"
              >
                {existingReservationError.options[0][language]}
              </button>
              <button
                onClick={handleBuyNewPackage}
                className="w-full px-6 py-3 rounded-xl text-green-700 bg-green-50 hover:bg-green-100 transition-all duration-200 font-medium"
              >
                {existingReservationError.options[1][language]}
              </button>
              <button
                onClick={handleReturnHome}
                className="w-full px-6 py-3 rounded-xl text-gray-600 hover:bg-gray-50 transition-all duration-200 font-medium"
              >
                {existingReservationError.options[2][language]}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      <div className="max-w-4xl mx-auto">
        {/* Información del Usuario y del Paquete */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Consumer Info div */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-6 rounded-2xl shadow-lg border-2 border-transparent"
          >
            <div className="w-14 h-14 rounded-xl bg-gradient-to-r from-green-600 to-teal-600 flex items-center justify-center text-white mb-4">
              <User2 className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold mb-3">
              {language === "en"
                ? "Consumer Information"
                : "Información del Usuario"}
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">
                  {language === "en" ? "Customer" : "Cliente"}
                </p>
                <p className="font-semibold text-gray-700">
                  {consumer.firstName + " " + consumer.lastName}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">
                  {language === "en" ? "Email" : "Correo"}
                </p>
                <p className="font-semibold text-gray-700">
                  {maskEmail(consumer.email)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">
                  {language === "en" ? "Phone" : "Teléfono"}
                </p>
                <p className="font-semibold text-gray-700">
                  {maskPhoneNumber(consumer.phoneNumber)}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Package Info div */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white p-6 rounded-2xl shadow-lg border-2 border-transparent"
          >
            <div className="w-14 h-14 rounded-xl bg-gradient-to-r from-green-600 to-teal-600 flex items-center justify-center text-white mb-4">
              <Package className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold mb-3">
              {language === "en"
                ? "Package Information"
                : "Información del Paquete"}
            </h3>
            <div className="space-y-2">
              <div>
                <p className="text-sm text-gray-500">
                  {language === "en" ? "Package Name" : "Nombre del Paquete"}
                </p>
                <p className="font-semibold text-gray-700">{bundleType.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">
                  {isExistingBundle
                    ? language === "en"
                      ? "Remaining Uses"
                      : "Usos Restantes"
                    : language === "en"
                    ? "Price"
                    : "Precio"}
                </p>
                <p className="font-semibold text-gray-700">
                  {isExistingBundle
                    ? `${bundleData.bundle.remainingUses} ${
                        language === "en" ? "uses" : "usos"
                      }`
                    : `S/. ${bundleType.price.toFixed(2)}`}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Información de la Clase (si existe) */}
        {allocation && classDate && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-6 rounded-2xl shadow-lg border-2 border-transparent"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-r from-green-600 to-teal-600 flex items-center justify-center text-white">
                <Calendar className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-xl font-bold">
                  {language === "en"
                    ? "Class Information"
                    : "Información de la Clase"}
                </h3>
                <p className="text-gray-600">
                  {allocation.timeSlot.sessionType.name}
                </p>
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500">
                  {language === "en" ? "Professor" : "Profesor"}
                </p>
                <p className="font-semibold text-gray-700">
                  {allocation.timeSlot.agent.name}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">
                  {language === "en" ? "Date & Time" : "Fecha y Hora"}
                </p>
                <p className="font-semibold text-gray-700">
                  {format(classDate, "EEEE d 'de' MMMM, HH:mm", {
                    locale: language === "es" ? es : undefined,
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">
                  {language === "en" ? "Availability" : "Disponibilidad"}
                </p>
                <p className="font-semibold text-gray-700">
                  {allocation.currentReservations}/
                  {allocation.timeSlot.sessionType.maxConsumers}{" "}
                  {language === "en" ? "spots taken" : "lugares ocupados"}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        <hr className="my-8 border-gray-200" />

        {/* Sección de Métodos de Pago o Botón de Confirmación */}
        {isExistingBundle ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-8"
          >
            <Button
              onClick={handlePayment}
              className="w-full bg-gradient-to-r from-green-600 to-teal-600 text-white hover:from-green-700 hover:to-teal-700 h-14 text-lg font-semibold rounded-2xl shadow-lg hover:shadow-xl"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>
                    {language === "en" ? "Processing..." : "Procesando..."}
                  </span>
                </div>
              ) : language === "en" ? (
                "Confirm Reservation"
              ) : (
                "Confirmar Reserva"
              )}
            </Button>
          </motion.div>
        ) : (
          <div className="p-6 rounded-2xl mb-8">
            <h3 className="text-2xl font-bold text-center mb-6">
              {language === "en" ? "Payment Methods" : "Métodos de Pago"}
            </h3>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-3 max-w-2xl mx-auto"
            >
              <PaymentMethodCard
                method="CARD"
                icon={<CreditCard className="w-full h-full" />}
                title={{
                  en: "Credit/Debit Card",
                  es: "Tarjeta Crédito/Débito",
                }}
                subtitle={{
                  en: "Pay securely with your card",
                  es: "Paga de forma segura con tu tarjeta",
                }}
                selected={selectedMethod === "CARD"}
                onClick={() => setSelectedMethod("CARD")}
              />

              <PaymentMethodCard
                method="CASH"
                icon={<Banknote className="w-full h-full" />}
                title={{ en: "Cash", es: "Efectivo" }}
                subtitle={{
                  en: "Pay with cash",
                  es: "Paga con efectivo",
                }}
                selected={selectedMethod === "CASH"}
                onClick={() => setSelectedMethod("CASH")}
              />

              <PaymentMethodCard
                method="QR"
                icon={<QrCode className="w-full h-full" />}
                title={{ en: "Yape / Plin", es: "Yape / Plin" }}
                subtitle={{
                  en: "Pay using QR",
                  es: "Paga usando QR",
                }}
                selected={selectedMethod === "QR"}
                onClick={() => setSelectedMethod("QR")}
              />
            </motion.div>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm text-center">{error}</p>
          </div>
        )}

        {!isExistingBundle && selectedMethod && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-8"
          >
            <Button
              onClick={handlePayment}
              className="w-full bg-gradient-to-r from-green-600 to-teal-600 text-white hover:from-green-700 hover:to-teal-700 h-14 text-lg font-semibold rounded-2xl shadow-lg hover:shadow-xl"
              disabled={isProcessing}
            >
              {language === "en"
                ? isProcessing
                  ? "Processing..."
                  : "Complete Payment"
                : isProcessing
                ? "Procesando..."
                : "Completar Pago"}
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}

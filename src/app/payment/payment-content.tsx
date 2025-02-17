"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguageContext } from "@/contexts/LanguageContext";
import { Banknote, CreditCard, QrCode, Calendar, User2, Package, Loader2, Home } from "lucide-react";
import { useQuery, useMutation } from '@apollo/client';
import { GET_CONSUMER, GET_BUNDLE_TYPE, GET_BUNDLE, CREATE_BUNDLE, GET_ALLOCATION, BundleStatus, CREATE_RESERVATION, GET_CONSUMER_RESERVATIONS } from '@/lib/graphql/queries';
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { SuccessOverlay } from "@/components/ui/success-overlay";
import { useToast } from "@/hooks/use-toast";
import { maskEmail, maskPhoneNumber } from "@/lib/utils/mask-data";

type PaymentMethod = "CARD" | "CASH" | "QR";

interface Reservation {
  id: string;
  status: "PENDING" | "CONFIRMED" | "VALIDATED" | "CANCELLED";
  timeSlot: {
    id: string;
    allocation: {
      id: string;
      startTime: string;
      endTime: string;
      status: string;
      currentReservations: number;
    };
  };
  bundle: {
    id: string;
    remainingUses: number;
  };
  forConsumer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
}

interface PaymentMethodCardProps {
  method: PaymentMethod;
  icon: React.ReactNode;
  title: { en: string; es: string };
  subtitle: string | { en: string; es: string };
  selected: boolean;
  onClick: () => void;
}

function PaymentMethodCard({ icon, title, subtitle, selected, onClick }: PaymentMethodCardProps) {
  const { language } = useLanguageContext();

  return (
    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
      <Card 
        className={`p-6 cursor-pointer transition-all duration-300 bg-white/90 backdrop-blur-sm border border-gray-100 shadow-lg hover:shadow-xl ${
          selected ? 'border-green-500 bg-green-50' : ''
        }`}
        onClick={onClick}
      >
        <div className="flex flex-col items-center text-center space-y-3">
          {icon}
          <div>
            <h3 className="text-xl font-bold mb-2">{title[language]}</h3>
            <p className="text-gray-600">
              {typeof subtitle === 'string' ? subtitle : subtitle[language]}
            </p>
          </div>
        </div>
      </Card>
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
  const { toast } = useToast();
  const { language } = useLanguageContext();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [hasExistingReservation, setHasExistingReservation] = useState(false);

  const consumerId = searchParams.get('consumerId');
  const bundleId = searchParams.get('bundleId');
  const bundleTypeId = searchParams.get('bundleTypeId');
  const classId = searchParams.get('classId');

  // Verificar primero si existe una reserva
  const { data: reservationsData, loading: reservationsLoading } = useQuery(GET_CONSUMER_RESERVATIONS, {
    variables: { 
      consumerId,
      allocationId: classId 
    },
    skip: !consumerId || !classId,
    fetchPolicy: 'network-only'
  });

  const { data: consumerData, loading: consumerLoading, error: consumerError } = useQuery(GET_CONSUMER, {
    variables: { id: consumerId },
    skip: !consumerId,
  });

  const { data: bundleData, loading: bundleLoading, error: bundleError } = useQuery(
    bundleId ? GET_BUNDLE : GET_BUNDLE_TYPE,
    {
      variables: { id: bundleId || bundleTypeId },
      skip: !bundleId && !bundleTypeId,
    }
  );

  const { data: allocationData, loading: allocationLoading } = useQuery(GET_ALLOCATION, {
    variables: { id: classId },
    skip: !classId,
  });

  const [createBundle] = useMutation(CREATE_BUNDLE);
  const [createReservation] = useMutation(CREATE_RESERVATION);

  // Todos los useEffect al inicio
  useEffect(() => {
    if (!reservationsLoading && reservationsData?.consumer?.reservations) {
      const existingReservation = reservationsData.consumer.reservations.find(
        (reservation: Reservation) => 
          reservation.timeSlot.allocation.id === classId && 
          ['PENDING', 'CONFIRMED'].includes(reservation.status)
      );

      if (existingReservation) {
        setHasExistingReservation(true);
        toast({
          title: language === "en" ? "Existing Reservation" : "Reserva Existente",
          description: language === "en" 
            ? "You already have a reservation for this class."
            : "Ya tienes una reserva para esta clase.",
          variant: "default",
        });
      }
    }
  }, [reservationsData, reservationsLoading, classId, language, toast]);

  useEffect(() => {
    if (bundleError) {
      toast({
        title: "Error",
        description: language === "en" 
          ? "Could not load package information. Please try again."
          : "No se pudo cargar la información del paquete. Por favor intente de nuevo.",
        variant: "destructive",
      });
    }
  }, [bundleError, language, toast]);

  useEffect(() => {
    if (consumerError) {
      toast({
        title: "Error",
        description: language === "en" 
          ? "Could not load user information. Please try again."
          : "No se pudo cargar la información del usuario. Por favor intente de nuevo.",
        variant: "destructive",
      });
    }
  }, [consumerError, language, toast]);

  useEffect(() => {
    if (!consumerId || (!bundleId && !bundleTypeId)) {
      router.push('/class-pass');
    }
  }, [consumerId, bundleId, bundleTypeId, router]);

  // Loading state
  const isLoading = reservationsLoading || consumerLoading || bundleLoading || (classId && allocationLoading);
  if (isLoading) {
    return <PaymentSkeletonLoader />;
  }

  // Si hay una reserva existente, mostrar opciones alternativas
  if (hasExistingReservation) {
    return (
      <div className="container mx-auto px-4 py-16 md:py-24">
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

            {bundleTypeId && (
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={() => {
                    const params = new URLSearchParams({
                      bundleTypeId,
                      consumerId: consumerId as string
                    });
                    router.push(`/payment?${params.toString()}`);
                  }}
                  className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 h-14 px-8 rounded-2xl text-lg font-semibold shadow-lg hover:shadow-xl"
                >
                  <Package className="w-6 h-6 mr-2" />
                  {language === "en" ? "Just Buy Package" : "Solo Comprar Paquete"}
                </Button>
              </motion.div>
            )}

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
    );
  }

  const getPaymentMethodText = () => {
    switch (selectedMethod) {
      case 'CARD':
        return 'Tarjeta de Crédito/Débito / Credit/Debit Card';
      case 'QR':
        return 'Pago con QR / QR Payment';
      case 'CASH':
        return 'Efectivo / Cash';
    }
  };
  
  const handlePayment = async () => {
    // Si es bundleTypeId necesitamos método de pago, si es bundleId no
    if ((!selectedMethod && !bundleId) || !consumerId || (!bundleId && !bundleTypeId)) return;

    try {
      setIsProcessing(true);
      setError(null);

      let finalBundleId;
      let reservationData;

      // Caso 1: Usar bundle existente
      if (bundleId) {
        finalBundleId = bundleId;
      } 
      // Caso 2: Crear nuevo bundle
      else if (bundleTypeId) {
        const validFrom = new Date();
        const validTo = new Date();
        validTo.setDate(validFrom.getDate() + 30);

        const { data: newBundleData } = await createBundle({
          variables: {
            input: {
              consumerId: consumerId,
              status: BundleStatus.ACTIVE,
              bundleTypeId: bundleTypeId,
              validFrom: validFrom.toISOString(),
              validTo: validTo.toISOString(),
              note: `Método de pago: ${getPaymentMethodText()}${classId ? ` - Clase reservada: ${allocationData?.allocation?.timeSlot?.sessionType?.name || 'N/A'}` : ''}`,
            }
          }
        });
        finalBundleId = newBundleData.createBundle.id;
      }

      // Si existe classId, crear una reserva
      if (classId && finalBundleId && allocationData?.allocation) {
        const { data: reservationResponse } = await createReservation({
          variables: {
            input: {
              bundleId: finalBundleId,
              timeSlotId: allocationData.allocation.timeSlot.id,
              startTime: new Date(allocationData.allocation.startTime).toISOString(),
              forConsumerId: consumerId,
              status: "CONFIRMED"
            }
          }
        });
        reservationData = reservationResponse?.createReservation;
      }

      // Show success message before navigation
      setShowSuccess(true);
      
      // Construct URL with params
      const params = new URLSearchParams({
        ...(bundleId ? {
          reservationId: reservationData?.id,
          bundleId: finalBundleId,
          consumerId,
          remainingUses: bundleData.bundle.remainingUses.toString(),
        } : {
          purchaseId: finalBundleId,
          bundleId: finalBundleId,
          consumerId,
          paymentMethod: selectedMethod,
          packagePrice: bundleData.bundleType.price.toString(),
        }),
        ...(classId && { 
          classId,
          className: allocationData?.allocation?.timeSlot?.sessionType?.name,
          classDate: allocationData?.allocation?.startTime,
          professorName: allocationData?.allocation?.timeSlot?.agent?.name,
        }),
        ...(consumerData?.consumer && {
          firstName: consumerData.consumer.firstName,
          lastName: consumerData.consumer.lastName,
          email: consumerData.consumer.email
        }),
        packageName: bundleData.bundleType.name
      });

      // Wait for 2 seconds before navigating
      setTimeout(() => {
        router.push(`/confirmation?${params.toString()}`);
      }, 2000);
    } catch (err) {
      console.error('Payment error:', err);
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

  // Verificar si tenemos los datos necesarios
  if (!consumerData?.consumer) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-red-600">
          {language === "en" 
            ? "Unable to load user information. Please try again." 
            : "No se pudo cargar la información del usuario. Por favor intente de nuevo."}
        </p>
        <Button 
          onClick={() => router.back()} 
          className="mt-4"
        >
          {language === "en" ? "Go Back" : "Volver"}
        </Button>
      </div>
    );
  }

  // Verificar si tenemos la información del bundle o bundleType
  const isExistingBundle = bundleId?.length === 36;
  if ((isExistingBundle && !bundleData?.bundle) || (!isExistingBundle && !bundleData?.bundleType)) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-red-600">
          {language === "en" 
            ? "Unable to load package information. Please try again." 
            : "No se pudo cargar la información del paquete. Por favor intente de nuevo."}
        </p>
        <Button 
          onClick={() => router.back()} 
          className="mt-4"
        >
          {language === "en" ? "Go Back" : "Volver"}
        </Button>
      </div>
    );
  }

  const consumer = consumerData.consumer;
  // Si es un bundle existente, usar bundleType del bundle, si no, usar bundleType directamente
  const bundleType = isExistingBundle ? bundleData.bundle.bundleType : bundleData.bundleType;
  const allocation = allocationData?.allocation;
  const classDate = allocation ? new Date(allocation.startTime) : null;

  return (
    <div className="container mx-auto px-4 py-16 md:py-24">
      <SuccessOverlay
        show={showSuccess}
        title={{
          en: "Payment Processing",
          es: "Procesando Pago"
        }}
        message={{
          en: "Your payment is being processed. Please wait a moment...",
          es: "Tu pago está siendo procesado. Por favor espera un momento..."
        }}
        variant="payment"
        duration={2000}
      />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-4xl mx-auto mb-8"
      >
        <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
          {isExistingBundle 
            ? (language === "en" ? "Confirm Reservation" : "Confirmar Reserva")
            : (language === "en" ? "Select Payment Method" : "Seleccionar Método de Pago")
          }
        </h2>
        <p className="text-xl text-gray-600">
          {isExistingBundle
            ? (language === "en" 
                ? "Please review and confirm your class reservation"
                : "Por favor revisa y confirma tu reserva de clase")
            : (language === "en"
                ? "Choose your preferred payment method to complete your purchase"
                : "Elige tu método de pago preferido para completar tu compra")
          }
        </p>
      </motion.div>

      <div className="max-w-4xl mx-auto">
        {/* Información del Usuario y del Paquete */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Consumer Info Card */}
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
              {language === "en" ? "Consumer Information" : "Información del Usuario"}
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

          {/* Package Info Card */}
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
              {language === "en" ? "Package Information" : "Información del Paquete"}
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
                    ? (language === "en" ? "Remaining Uses" : "Usos Restantes")
                    : (language === "en" ? "Price" : "Precio")
                  }
                </p>
                <p className="font-semibold text-gray-700">
                  {isExistingBundle 
                    ? `${bundleData.bundle.remainingUses} ${language === "en" ? "uses" : "usos"}`
                    : `S/. ${bundleType.price.toFixed(2)}`
                  }
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
            className="bg-white p-6 rounded-2xl shadow-lg border-2 border-transparent mb-8"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-r from-green-600 to-teal-600 flex items-center justify-center text-white">
                <Calendar className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-xl font-bold">
                  {language === "en" ? "Class Information" : "Información de la Clase"}
                </h3>
                <p className="text-gray-600">{allocation.timeSlot.sessionType.name}</p>
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500">
                  {language === "en" ? "Professor" : "Profesor"}
                </p>
                <p className="font-semibold text-gray-700">{allocation.timeSlot.agent.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">
                  {language === "en" ? "Date & Time" : "Fecha y Hora"}
                </p>
                <p className="font-semibold text-gray-700">
                  {format(classDate, "EEEE d 'de' MMMM, HH:mm", {
                    locale: language === 'es' ? es : undefined
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">
                  {language === "en" ? "Availability" : "Disponibilidad"}
                </p>
                <p className="font-semibold text-gray-700">
                  {allocation.currentReservations}/{allocation.timeSlot.sessionType.maxConsumers} {language === "en" ? "spots taken" : "lugares ocupados"}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Separador visual y botones de pago/confirmación */}
        {!hasExistingReservation && (
          <>
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
                      <span>{language === "en" ? "Processing..." : "Procesando..."}</span>
                    </div>
                  ) : (
                    language === "en" ? "Confirm Reservation" : "Confirmar Reserva"
                  )}
                </Button>
              </motion.div>
            ) : (
              <div className="bg-gray-50 p-6 rounded-2xl shadow-md mb-8">
                <h3 className="text-2xl font-bold text-center mb-4">
                  {language === "en" ? "Payment Methods" : "Métodos de Pago"}
                </h3>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="grid grid-cols-1 md:grid-cols-3 gap-4"
                >
                  <PaymentMethodCard
                    method="CARD"
                    icon={
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-r from-green-600 to-teal-600 flex items-center justify-center text-white">
                        <CreditCard className="w-7 h-7" />
                      </div>
                    }
                    title={{ en: "Credit/Debit Card", es: "Tarjeta Crédito/Débito" }}
                    subtitle={{ 
                      en: "Pay securely with your card",
                      es: "Paga de forma segura con tu tarjeta"
                    }}
                    selected={selectedMethod === "CARD"}
                    onClick={() => setSelectedMethod("CARD")}
                  />

                  <PaymentMethodCard
                    method="CASH"
                    icon={
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-r from-green-600 to-teal-600 flex items-center justify-center text-white">
                        <Banknote className="w-7 h-7" />
                      </div>
                    }
                    title={{ en: "Cash", es: "Efectivo" }}
                    subtitle={{ 
                      en: "Pay with cash",
                      es: "Paga con efectivo"
                    }}
                    selected={selectedMethod === "CASH"}
                    onClick={() => setSelectedMethod("CASH")}
                  />

                  <PaymentMethodCard
                    method="QR"
                    icon={
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-r from-green-600 to-teal-600 flex items-center justify-center text-white">
                        <QrCode className="w-7 h-7" />
                      </div>
                    }
                    title={{ en: "Yape / Plin", es: "Yape / Plin" }}
                    subtitle={{ 
                      en: "Pay using QR",
                      es: "Paga usando QR"
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
                    ? isProcessing ? "Processing..." : "Complete Payment"
                    : isProcessing ? "Procesando..." : "Completar Pago"}
                </Button>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
} 
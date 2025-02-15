"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguageContext } from "@/contexts/LanguageContext";
import { Banknote, CreditCard, QrCode, Calendar, User2, Package } from "lucide-react";
import { useQuery, useMutation } from '@apollo/client';
import { GET_CONSUMER, GET_BUNDLE_TYPE, CREATE_BUNDLE, GET_ALLOCATION, BundleStatus, CREATE_RESERVATION } from '@/lib/graphql/queries';
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { SuccessOverlay } from "@/components/ui/success-overlay";

type PaymentMethod = "CARD" | "CASH" | "QR";

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
  const { language } = useLanguageContext();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const userId = searchParams.get('userId');
  const packageId = searchParams.get('packageId');
  const classId = searchParams.get('classId');

  const { data: consumerData, loading: consumerLoading } = useQuery(GET_CONSUMER, {
    variables: { id: userId },
    skip: !userId,
  });

  const { data: bundleTypeData, loading: bundleTypeLoading } = useQuery(GET_BUNDLE_TYPE, {
    variables: { id: packageId },
    skip: !packageId,
  });

  const { data: allocationData, loading: allocationLoading } = useQuery(GET_ALLOCATION, {
    variables: { id: classId },
    skip: !classId,
  });

  const [createBundle] = useMutation(CREATE_BUNDLE);
  const [createReservation] = useMutation(CREATE_RESERVATION);

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
  
  useEffect(() => {
    if (!userId || !packageId) {
      router.push('/class-pass');
    }
  }, [userId, packageId, router]);

  const handlePayment = async () => {
    if (!selectedMethod || !userId || !packageId) return;

    try {
      setIsProcessing(true);
      setError(null);

      const validFrom = new Date();
      const validTo = new Date();
      validTo.setDate(validFrom.getDate() + 30);

      const { data: bundleData } = await createBundle({
        variables: {
          input: {
            consumerId: userId,
            status: BundleStatus.ACTIVE,
            bundleTypeId: packageId,
            validFrom: validFrom.toISOString(),
            validTo: validTo.toISOString(),
            note: `Método de pago: ${getPaymentMethodText()}${classId ? ` - Clase reservada: ${allocationData?.allocation?.timeSlot?.sessionType?.name || 'N/A'}` : ''}`,
          }
        }
      });

      // Si existe classId, crear una reserva
      let reservationData;
      if (classId && bundleData?.createBundle?.id && allocationData?.allocation) {
        const { data: reservationResponse } = await createReservation({
          variables: {
            input: {
              bundleId: bundleData.createBundle.id,
              timeSlotId: allocationData.allocation.timeSlot.id,
              startTime: new Date(allocationData.allocation.startTime).toISOString(),
              forConsumerId: userId,
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
        purchaseId: bundleData.createBundle.id,
        packageId,
        userId,
        paymentMethod: selectedMethod,
        ...(classId && { 
          classId,
          className: allocationData?.allocation?.timeSlot?.sessionType?.name,
          classDate: allocationData?.allocation?.startTime,
          professorName: allocationData?.allocation?.timeSlot?.agent?.name,
          reservationId: reservationData?.id
        }),
        ...(consumerData?.consumer && {
          firstName: consumerData.consumer.firstName,
          lastName: consumerData.consumer.lastName,
          email: consumerData.consumer.email
        }),
        ...(bundleTypeData?.bundleType && {
          packageName: bundleTypeData.bundleType.name,
          packagePrice: bundleTypeData.bundleType.price.toString()
        })
      });

      // Wait for 2 seconds before navigating
      setTimeout(() => {
        router.push(`/confirmation?${params.toString()}`);
      }, 2000);
    } catch (err) {
      console.error('Payment error:', err);
      setError(
        language === "en"
          ? "Failed to process payment. Please try again."
          : "Error al procesar el pago. Por favor intente de nuevo."
      );
      setIsProcessing(false);
      setShowSuccess(false);
    }
  };

  const isLoading = consumerLoading || bundleTypeLoading || (classId && allocationLoading);

  if (isLoading) {
    return <PaymentSkeletonLoader />;
  }

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
          {language === "en" ? "Select Payment Method" : "Seleccionar Método de Pago"}
        </h2>
        <p className="text-xl text-gray-600">
          {language === "en"
            ? "Choose your preferred payment method to complete your purchase"
            : "Elige tu método de pago preferido para completar tu compra"}
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
            <div className="space-y-2">
              <div>
                <p className="text-sm text-gray-500">
                  {language === "en" ? "Full Name" : "Nombre Completo"}
                </p>
                <p className="font-semibold text-gray-700">
                  {consumerData.consumer.firstName} {consumerData.consumer.lastName}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">
                  {language === "en" ? "Email" : "Correo"}
                </p>
                <p className="font-semibold text-gray-700">{consumerData.consumer.email}</p>
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
                <p className="font-semibold text-gray-700">{bundleTypeData.bundleType.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">
                  {language === "en" ? "Price" : "Precio"}
                </p>
                <p className="font-semibold text-green-600">S/. {bundleTypeData.bundleType.price}</p>
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

        {/* Separador visual */}
        <hr className="my-8 border-gray-200" />

        {/* Sección de Métodos de Pago */}
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

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm text-center">{error}</p>
          </div>
        )}

        {selectedMethod && (
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
      </div>
    </div>
  );
} 
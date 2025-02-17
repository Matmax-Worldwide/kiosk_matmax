'use client';

import { useQuery } from "@apollo/client";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GET_CONSUMER, GET_CONSUMER_RESERVATIONS } from "@/lib/graphql/queries";
import { Spinner } from "@/components/spinner";
import { ArrowLeft, Package2, Clock, ChevronRight, Calendar, Home } from "lucide-react";
import type { Bundle } from "@/types/bundle";
import { useToast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";
import { useLanguageContext } from "@/contexts/LanguageContext";

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
  const { toast } = useToast();
  const { language } = useLanguageContext();
  const searchParams = useSearchParams();
  const consumerId = searchParams.get('consumerId');
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

  if (consumerError) {
    toast({
      title: "Error",
      description: language === "en" 
        ? "Could not load user information"
        : "No se pudo cargar la información del usuario",
      variant: "destructive",
    });
  }

  if (consumerLoading || reservationsLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spinner size="lg" />
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
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
        <div className="container mx-auto px-4 py-8">
          <Button 
            variant="ghost" 
            onClick={() => router.back()}
            className="mb-8 hover:bg-gray-100"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {language === "en" ? "Back" : "Volver"}
          </Button>

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

  const handleBack = () => {
    router.back();
  };

  const handleBundleSelection = (bundle: Bundle) => {
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
    router.push(`/buy-packages?consumerId=${consumerId}${classId ? `&classId=${classId}` : ''}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          onClick={handleBack}
          className="mb-8 hover:bg-gray-100"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {language === "en" ? "Back" : "Volver"}
        </Button>

        {consumer && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="p-8 mb-12 bg-white/95 backdrop-blur-sm border-green-100 shadow-lg">
              <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
                {consumer.firstName} {consumer.lastName}
              </h2>
              <div className="space-y-2 text-gray-600">
                <p className="flex items-center">
                  <span className="w-24 text-gray-500">{language === "en" ? "Email:" : "Correo:"}</span>
                  {consumer.email}
                </p>
                <p className="flex items-center">
                  <span className="w-24 text-gray-500">{language === "en" ? "Phone:" : "Teléfono:"}</span>
                  {consumer.phoneNumber}
                </p>
              </div>
            </Card>
          </motion.div>
        )}

        <div className="space-y-12">
          {recentBundles.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-semibold text-gray-800">
                  {language === "en" ? "Active Packages" : "Paquetes Activos"}
                </h3>
                <Clock className="h-6 w-6 text-green-600" />
              </div>
              <div className="grid gap-6 md:grid-cols-3">
                {recentBundles.map((bundle, index) => (
                  <motion.div
                    key={bundle.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="p-6 hover:shadow-lg transition-all duration-300 bg-white/95 backdrop-blur-sm border-green-50">
                      <h4 className="font-semibold text-lg mb-3">{bundle.bundleType.name}</h4>
                      <p className="text-gray-600 mb-4">
                        {language === "en" ? "Remaining uses:" : "Usos restantes:"} {bundle.remainingUses}
                      </p>
                      <Button 
                        onClick={() => handleBundleSelection(bundle)}
                        className="w-full bg-gradient-to-r from-green-600 to-teal-600 
                          hover:from-green-700 hover:to-teal-700 text-white"
                        disabled={bundle.remainingUses <= 0}
                      >
                        {bundle.remainingUses > 0 
                          ? (language === "en" ? "Use this package" : "Usar este paquete")
                          : (language === "en" ? "Package depleted" : "Paquete agotado")}
                      </Button>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-center"
          >
            <Button 
              onClick={handleViewAllPackages}
              className="px-8 py-6 text-lg bg-gradient-to-r from-green-600 to-teal-600 
                hover:from-green-700 hover:to-teal-700 text-white shadow-lg 
                hover:shadow-xl transition-all duration-300 group"
            >
              <Package2 className="h-5 w-5 mr-2" />
              {language === "en" ? "Buy more packages" : "Comprar más paquetes"}
              <ChevronRight className="h-5 w-5 ml-2 transform group-hover:translate-x-1 transition-transform" />
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
} 
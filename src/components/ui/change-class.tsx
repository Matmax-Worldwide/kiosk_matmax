import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Calendar, Home, Package } from "lucide-react";
import { useLanguageContext } from "@/contexts/LanguageContext";
import { useRouter } from "next/navigation";
import React from "react";
import { useQuery } from "@apollo/client";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { GET_CONSUMER_RESERVATIONS } from "@/lib/graphql/queries";

interface ChangeClassProps {
  consumerId: string;
  classId?: string;
  now?: string;
}

export function ChangeClassComponent({ consumerId, classId }: ChangeClassProps) {
  const router = useRouter();
  const { language } = useLanguageContext();
  const [isNavigatingToSchedule, setIsNavigatingToSchedule] = React.useState(false);
  const [isNavigatingToHome, setIsNavigatingToHome] = React.useState(false);

  const { data: reservationsData, loading } = useQuery(GET_CONSUMER_RESERVATIONS, {
    variables: { 
      consumerId,
      allocationId: classId 
    },
    skip: !consumerId || !classId,
    fetchPolicy: 'network-only'
  });

  const reservation = reservationsData?.consumer?.reservations[0];

  const handleViewOtherTimes = () => {
    setIsNavigatingToSchedule(true);
    router.push('/schedule?consumerId=' + consumerId);
  };

  const handleReturnHome = () => {
    setIsNavigatingToHome(true);
    router.push('/');
  };

  const formatDate = (date: string) => {
    return format(new Date(date), 'PPP p', { locale: language === 'es' ? es : undefined });
  };

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

          {loading ? (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600" />
            </div>
          ) : reservation ? (
            <div className="space-y-6 mb-8">
              <p className="text-xl text-gray-600">
                {language === "en"
                  ? "You already have a reservation for this time slot:"
                  : "Ya tienes una reserva para este horario:"}
              </p>
              
              <div className="bg-white rounded-xl shadow-md p-6 max-w-lg mx-auto">
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-2 text-amber-600">
                    <Calendar className="w-5 h-5" />
                    <span className="font-medium">
                      {formatDate(reservation.allocation.startTime)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-center gap-2 text-green-600">
                    <Package className="w-5 h-5" />
                    <span className="font-medium">
                      {reservation.bundle.bundleType.name}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-sm text-gray-500 mt-4">
                {language === "en" 
                  ? "Check your email for the reservation details. For support, please contact us via WhatsApp."
                  : "Revisa tu correo para los detalles de la reserva. Para soporte, contáctanos por WhatsApp."}
              </div>
            </div>
          ) : (
            <p className="text-xl text-gray-600 mb-8">
              {language === "en"
                ? "You already have a reservation for this time slot. What would you like to do?"
                : "Ya tienes una reserva para este horario. ¿Qué te gustaría hacer?"}
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={handleViewOtherTimes}
                disabled={isNavigatingToSchedule}
                className="w-full sm:w-auto bg-gradient-to-r from-green-600 to-teal-600 text-white hover:from-green-700 hover:to-teal-700 transition-all duration-300 h-14 px-8 rounded-2xl text-lg font-semibold shadow-lg hover:shadow-xl"
              >
                <Calendar className="w-6 h-6 mr-2" />
                {language === "en" ? "View Other Times" : "Ver Otros Horarios"}
              </Button>
            </motion.div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={handleReturnHome}
                disabled={isNavigatingToHome}
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
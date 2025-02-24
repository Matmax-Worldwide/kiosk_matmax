import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { UserCheck, ArrowRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

const CheckInButton = ({ language }: { language: string }) => {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleNavigation = (url: string) => {
    setIsRedirecting(true);
    router.push(url);
  };

  // Clases base para el botón
  const baseClasses =
    "bg-gradient-to-r text-white p-6 rounded-2xl shadow-lg transition-all duration-300 flex items-center justify-center gap-3 group cursor-pointer";

  // Gradiente oscuro si ya se hizo click
  const gradientClasses = isRedirecting
    ? "from-green-800 to-teal-800"
    : "from-green-600 to-teal-600";

  // El efecto hover solo se aplica si aún no se ha hecho click
  const hoverEffect = !isRedirecting ? { scale: 1.02 } : {};

  if (!isClient) {
    return null; // Prevent initial flash during hydration
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="max-w-4xl mx-auto text-center"
    >
      <div className="mb-6">
        <h2 className="text-2xl mb-2 font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
          {language === "en" ? "Already have a reservation?" : "¿Ya tienes una reserva?"}
        </h2>
        <p className="text-gray-600">
          {language === "en"
            ? "Check-in for your class here"
            : "Haz check-in para tu clase aquí"}
        </p>
      </div>
      <motion.div
        onClick={() => {
          if (!isRedirecting) handleNavigation("/check-in");
        }}
        animate={{ scale: isRedirecting ? 0.98 : 1 }}
        whileHover={hoverEffect}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            if (!isRedirecting) handleNavigation("/check-in");
          }
        }}
        className={`${baseClasses} ${gradientClasses} ${isRedirecting ? "pointer-events-none" : ""}`}
      >
        <UserCheck className="w-8 h-8 transition-transform group-hover:scale-110" />
        <span className="text-xl font-semibold">Check-in</span>
        {isRedirecting ? (
          <Loader2 className="w-6 h-6 animate-spin" />
        ) : (
          <ArrowRight className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-all" />
        )}
      </motion.div>
    </motion.div>
  );
};

export default CheckInButton;

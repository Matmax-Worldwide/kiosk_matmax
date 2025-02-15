import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CheckCircle2, 
  XCircle, 
  Calendar, 
  Home, 
  Package2, 
  CreditCard, 
  User2, 
  ArrowRight,
  Clock,
  CalendarDays,
  CalendarCheck,
  Star,
  UserPlus,
  Users,
  Sparkles,
  Search,
  Mail,
  Phone,
  PackageOpen,
  ShoppingCart,
  Tag
} from "lucide-react";
import { useLanguageContext } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

interface SuccessOverlayProps {
  show: boolean;
  title: {
    en: string;
    es: string;
  };
  message?: {
    en: string;
    es: string;
  };
  icon?: React.ReactNode;
  duration?: number;
  onComplete?: () => void;
  variant?: "success" | "error" | "warning" | "info" | "schedule" | "home" | "payment" | "packages" | "user" | "checkin" | "new-user" | "existing-user";
  className?: string;
}

const variants = {
  success: "text-white",
  error: "text-white",
  warning: "text-white",
  info: "text-white",
  schedule: "text-white",
  home: "text-white",
  payment: "text-white",
  packages: "text-white",
  user: "text-white",
  checkin: "text-white",
  "new-user": "text-white",
  "existing-user": "text-white"
};

const defaultIcons = {
  success: <CheckCircle2 className="w-24 h-24 stroke-[1.5]" />,
  error: <XCircle className="w-24 h-24 stroke-[1.5]" />,
  warning: <CheckCircle2 className="w-24 h-24 stroke-[1.5]" />,
  info: <CheckCircle2 className="w-24 h-24 stroke-[1.5]" />,
  schedule: <Calendar className="w-24 h-24 stroke-[1.5]" />,
  home: <Home className="w-24 h-24 stroke-[1.5]" />,
  payment: <CreditCard className="w-24 h-24 stroke-[1.5]" />,
  packages: <Package2 className="w-24 h-24 stroke-[1.5]" />,
  user: <User2 className="w-24 h-24 stroke-[1.5]" />,
  checkin: <Clock className="w-24 h-24 stroke-[1.5]" />,
  "new-user": <UserPlus className="w-24 h-24 stroke-[1.5]" />,
  "existing-user": <Users className="w-24 h-24 stroke-[1.5]" />
};

const gradients = {
  success: "from-green-600 to-teal-600",
  error: "from-red-600 to-pink-600",
  warning: "from-yellow-600 to-orange-600",
  info: "from-blue-600 to-indigo-600",
  schedule: "from-blue-600 to-indigo-600",
  home: "from-green-600 to-teal-600",
  payment: "from-green-600 to-emerald-600",
  packages: "from-purple-600 to-indigo-600",
  user: "from-indigo-600 to-blue-600",
  checkin: "from-teal-600 to-cyan-600",
  "new-user": "from-violet-600 to-purple-600",
  "existing-user": "from-blue-600 to-indigo-600"
};

// Diagonal lines animation
const DiagonalLines = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(10)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute h-[150%] w-1 bg-white/10 -rotate-45 transform"
          initial={{ top: "-50%", left: `${i * 15}%` }}
          animate={{ 
            top: "100%",
            left: `${i * 15}%`,
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.2,
            ease: "linear"
          }}
        />
      ))}
    </div>
  );
};

// Calendar specific animations
const CalendarAnimation = () => {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {[CalendarDays, CalendarCheck, Star].map((Icon, index) => (
        <motion.div
          key={index}
          className="absolute"
          initial={{ scale: 0, rotate: 0, opacity: 0 }}
          animate={{ 
            scale: [0, 1.2, 1],
            rotate: [0, 15, 0],
            opacity: [0, 1, 0]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: index * 0.6,
            ease: "easeInOut"
          }}
        >
          <Icon className="w-16 h-16 text-white/30" />
        </motion.div>
      ))}
    </div>
  );
};

// New User specific animations
const NewUserAnimation = () => {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {[UserPlus, Mail, Phone, Sparkles].map((Icon, index) => (
        <motion.div
          key={index}
          className="absolute"
          initial={{ scale: 0, rotate: 0, opacity: 0 }}
          animate={{ 
            scale: [0, 1.2, 1],
            rotate: [0, index % 2 === 0 ? 15 : -15, 0],
            opacity: [0, 1, 0]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: index * 0.5,
            ease: "easeInOut"
          }}
        >
          <Icon className="w-16 h-16 text-white/30" />
        </motion.div>
      ))}
    </div>
  );
};

// Existing User specific animations
const ExistingUserAnimation = () => {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {[Users, Search, Star].map((Icon, index) => (
        <motion.div
          key={index}
          className="absolute"
          initial={{ 
            scale: 0, 
            rotate: 0, 
            opacity: 0,
            x: index * 50 - 50
          }}
          animate={{ 
            scale: [0, 1.2, 1],
            rotate: [0, 10, 0],
            opacity: [0, 1, 0],
            x: [index * 50 - 50, 0, index * 50 - 50]
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            delay: index * 0.4,
            ease: "easeInOut"
          }}
        >
          <Icon className="w-16 h-16 text-white/30" />
        </motion.div>
      ))}
      
      {/* Búsqueda circular animada */}
      <motion.div
        className="absolute w-32 h-32 border-2 border-white/20 rounded-full"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ 
          scale: [0, 1.5, 1],
          opacity: [0, 0.2, 0]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    </div>
  );
};

// Buy Packages specific animations
const BuyPackagesAnimation = () => {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {[Package2, PackageOpen, ShoppingCart, Tag].map((Icon, index) => (
        <motion.div
          key={index}
          className="absolute"
          initial={{ 
            scale: 0, 
            rotate: 0, 
            opacity: 0,
            y: 50
          }}
          animate={{ 
            scale: [0, 1.2, 1],
            rotate: [0, index % 2 === 0 ? 15 : -15, 0],
            opacity: [0, 1, 0],
            y: [50, 0, -50]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: index * 0.4,
            ease: "easeInOut"
          }}
        >
          <Icon className="w-16 h-16 text-white/30" />
        </motion.div>
      ))}
      
      {/* Círculo decorativo */}
      <motion.div
        className="absolute w-40 h-40 border-2 border-white/20 rounded-full"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ 
          scale: [0, 1.5, 1],
          opacity: [0, 0.2, 0],
          rotate: [0, 180]
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Destellos */}
      {[...Array(4)].map((_, i) => (
        <motion.div
          key={`sparkle-${i}`}
          className="absolute w-2 h-2 bg-white/30 rounded-full"
          initial={{ 
            scale: 0,
            opacity: 0,
            x: 0,
            y: 0
          }}
          animate={{ 
            scale: [0, 1, 0],
            opacity: [0, 1, 0],
            x: [0, (i % 2 === 0 ? 100 : -100) * Math.cos(i * Math.PI/2)],
            y: [0, (i % 2 === 0 ? -100 : 100) * Math.sin(i * Math.PI/2)]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: i * 0.3,
            ease: "easeOut"
          }}
        />
      ))}
    </div>
  );
};

interface ProgressBarProps {
  duration: number;
  onComplete?: () => void;
  variant?: keyof typeof gradients;
}

const ProgressBar = ({ duration, onComplete, variant = "success" }: ProgressBarProps & { variant?: keyof typeof gradients }) => {
  const [progress, setProgress] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsedTime = Date.now() - startTime;
      const newProgress = Math.min((elapsedTime / duration) * 100, 100);
      setProgress(newProgress);

      if (newProgress >= 100 && !isCompleted) {
        setIsCompleted(true);
        clearInterval(interval);
        if (onComplete) {
          onComplete();
        }
      }
    }, 10);

    return () => clearInterval(interval);
  }, [duration, onComplete, isCompleted]);

  return (
    <div className="relative w-full max-w-md">
      {/* Background track */}
      <div className="w-full h-2 rounded-full bg-gray-100/20 overflow-hidden backdrop-blur-sm">
        {/* Progress indicator */}
        <motion.div
          className={cn(
            "h-full rounded-full bg-gradient-to-r shadow-lg",
            gradients[variant]
          )}
          initial={{ width: "0%" }}
          animate={{ 
            width: `${progress}%`,
            transition: { duration: 0.1, ease: "linear" }
          }}
        />
      </div>
      
      {/* Percentage text */}
      <motion.div 
        className="absolute -top-6 left-0 right-0 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <span className={cn(
          "text-sm font-medium bg-gradient-to-r bg-clip-text text-transparent",
          gradients[variant]
        )}>
          {isCompleted ? "100" : Math.round(progress)}%
        </span>
      </motion.div>
    </div>
  );
};

export function SuccessOverlay({
  show,
  title,
  message,
  icon,
  duration = 2000,
  onComplete,
  variant = "success",
  className,
}: SuccessOverlayProps) {
  const { language } = useLanguageContext();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleProgressComplete = () => {
    setIsRedirecting(true);
    if (onComplete) {
      onComplete();
    }
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={cn(
            "fixed inset-0 z-50 flex items-center justify-center bg-white/95 backdrop-blur-sm",
            className
          )}
        >
          {/* Background animations */}
          <DiagonalLines />
          {variant === 'schedule' && <CalendarAnimation />}
          {variant === 'new-user' && <NewUserAnimation />}
          {variant === 'existing-user' && <ExistingUserAnimation />}
          {variant === 'packages' && <BuyPackagesAnimation />}

          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="flex flex-col items-center space-y-6 text-center p-8 relative z-10"
          >
            <motion.div
              initial={{ scale: 0.8, rotate: -10 }}
              animate={{ 
                scale: [0.8, 1.2, 1],
                rotate: [-10, 10, 0]
              }}
              transition={{
                duration: 0.5,
                ease: "easeOut"
              }}
              className={cn(
                "text-gradient bg-gradient-to-r p-6 rounded-full shadow-lg relative",
                gradients[variant],
                variants[variant]
              )}
            >
              {icon || defaultIcons[variant]}
              
              {/* Pulse effect */}
              <motion.div
                className={cn(
                  "absolute inset-0 rounded-full bg-gradient-to-r",
                  gradients[variant]
                )}
                initial={{ opacity: 0, scale: 1 }}
                animate={{ 
                  opacity: [0, 0.2, 0],
                  scale: [1, 1.5, 1]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="space-y-4"
            >
              <h2 className={cn(
                "text-4xl font-bold bg-gradient-to-r bg-clip-text text-transparent",
                gradients[variant]
              )}>
                {title[language]}
              </h2>
              {message && (
                <p className="text-xl text-gray-600 max-w-md">
                  {message[language]}
                </p>
              )}
            </motion.div>

            {/* Progress Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="w-full max-w-md mt-8"
            >
              <ProgressBar 
                duration={duration} 
                onComplete={handleProgressComplete}
                variant={variant}
              />
            </motion.div>

            {/* Redirecting text */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ 
                opacity: isRedirecting ? [0, 1, 0.5] : 0,
                y: isRedirecting ? [0, -5, 0] : 0
              }}
              transition={{ 
                repeat: Infinity,
                duration: 2,
                delay: 0.4 
              }}
              className={cn(
                "flex items-center gap-2 mt-2",
                variants[variant]
              )}
            >
              <ArrowRight className="w-5 h-5" />
              <span className="text-sm font-medium">
                {language === "en" ? "Redirecting..." : "Redirigiendo..."}
              </span>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 
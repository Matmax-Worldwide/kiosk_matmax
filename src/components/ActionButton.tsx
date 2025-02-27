import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Loader2, LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";

interface ActionButtonProps {
  icon: LucideIcon;
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  href: string;
  gradient: string; // Ejemplo: "from-green-600 to-teal-600"
  language: string;
  index: number;
}

const ActionButton = ({
  icon: Icon,
  title,
  titleEn,
  description,
  descriptionEn,
  href,
  gradient,
  language,
  index,
}: ActionButtonProps) => {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleNavigation = () => {
    setIsRedirecting(true);
    setTimeout(() => {
      router.push(href);
    }, 1500);
  };

  if (!isClient) return null;

  // Cambiamos el degradado si se está redireccionando
  const appliedGradient = isRedirecting ? "from-green-700 to-teal-700" : gradient;

  return (
    <motion.div
      initial={{ opacity: 0, x: index === 0 ? -20 : 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.2 }}
      whileHover={!isRedirecting ? { scale: 1.02 } : {}}
      whileTap={!isRedirecting ? { scale: 0.95 } : {}}
      className="relative group h-full"
    >
      <div
        onClick={() => !isRedirecting && handleNavigation()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !isRedirecting) {
            handleNavigation();
          }
        }}
        className="h-full cursor-pointer"
      >
        <div
          className={`p-8 max-sm:p-4 rounded-2xl max-sm:rounded-xl shadow-lg transition-all duration-300 border-2 border-transparent text-slate-900 ${
            isRedirecting
              ? "scale-[0.98] shadow-xl border-opacity-50"
              : "hover:scale-[1.02] hover:border-2 hover:border-opacity-50"
          }`}
        >
          <div className="flex flex-col items-center gap-6 max-sm:gap-4">
            <div
              className={`w-16 h-16 max-sm:w-12 max-sm:h-12 rounded-xl bg-gradient-to-r ${appliedGradient} flex items-center justify-center mb-2 max-sm:mb-0 transition-transform group-hover:scale-110 text-white flex-shrink-0 max-sm:absolute max-sm:left-4 max-sm:top-1/2 max-sm:-translate-y-1/2`}
            >
              <Icon className="w-8 h-8 max-sm:w-6 max-sm:h-6" />
            </div>
            <div className="flex-1 min-w-0 text-center max-sm:text-left max-sm:pl-20">
              <h3 className="text-2xl max-sm:text-xl font-bold mb-3 max-sm:mb-1 truncate">
                {language === "en" ? titleEn : title}
              </h3>
              <p className="text-base max-sm:text-sm text-slate-700 line-clamp-2">
                {language === "en" ? descriptionEn : description}
              </p>
            </div>
          </div>
          <div className="absolute bottom-8 right-8 max-sm:hidden transition-all">
            {isRedirecting ? (
              <Loader2 className="w-6 h-6 animate-spin text-slate-700" />
            ) : (
              <ArrowRight className="w-6 h-6 text-gray-100 opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ActionButton;

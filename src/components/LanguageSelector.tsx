import { motion } from "framer-motion";
import { Language } from "@/contexts/LanguageContext";

interface LanguageSelectorProps {
  language: Language;
  setLanguage: (lang: Language) => void;
}

const LanguageSelector = ({ language, setLanguage }: LanguageSelectorProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="flex justify-center w-full mb-12"
    >
      <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-lg border border-green-100 p-1.5 flex gap-2 active:shadow-xl transition-all duration-500 active:border-green-200">
        <button
          onClick={() => language === "es" && setLanguage("en")}
          className={`px-6 py-2.5 rounded-xl transition-all duration-500 font-medium
            hover:scale-[1.02] active:scale-[0.98]
            ${
              language === "en"
                ? "bg-gradient-to-r from-green-500 to-teal-500 text-white shadow-md hover:from-green-400 hover:to-teal-400 active:from-green-600 active:to-teal-600"
                : "text-green-700 hover:bg-green-50 active:bg-green-100"
            }`}
        >
          English
        </button>
        <button
          onClick={() => language === "en" && setLanguage("es")}
          className={`px-6 py-2.5 rounded-xl transition-all duration-500 font-medium
            hover:scale-[1.02] active:scale-[0.98]
            ${
              language === "es"
                ? "bg-gradient-to-r from-green-500 to-teal-500 text-white shadow-md hover:from-green-400 hover:to-teal-400 active:from-green-600 active:to-teal-600"
                : "text-green-700 hover:bg-green-50 active:bg-green-100"
            }`}
        >
          Español
        </button>
      </div>
    </motion.div>
  );
};

export default LanguageSelector; 
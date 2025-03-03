"use client";
import React, { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/header";
import { Card } from "@/components/ui/card";
import { UserPlus, Users, ArrowRight, Loader2 } from "lucide-react";
import { useLanguageContext } from "@/contexts/LanguageContext";
import { PageTransition } from "@/components/page-transition";
import { motion } from "framer-motion";

function SelectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language } = useLanguageContext();
  const [activeButton, setActiveButton] = React.useState<"new" | "existing" | null>(null);

  // const classId = searchParams.get('classId');
  const bundleTypeId = searchParams.get('bundleTypeId');
  const buyPackages = searchParams.get('buyPackages');
  const reservation = searchParams.get('reservation');

  // // Use useEffect for navigation when conditions are met
  // React.useEffect(() => {
  //   // Si no hay ni classId ni bundleTypeId, redirigir a buy-packages
  //   if (!classId && !bundleTypeId && !buyPackages) {
  //     router.push("/");
  //   }
  // }, [classId, bundleTypeId, buyPackages, router]);

  const handleNavigation = (path: string, type: 'new' | 'existing') => {
    // Evitar doble click si ya se ha activado alguno
    if (activeButton) return;
    setActiveButton(type);

    if (type === 'new') {
      setTimeout(() => {
        const params = new URLSearchParams(searchParams.toString());
        router.push(`${path}${params.toString() ? `?${params.toString()}` : ''}`);
      }, 1500);
      return;
    }

    if (type === 'existing') {
      setTimeout(() => {
        const params = new URLSearchParams(searchParams.toString());
        if (bundleTypeId) {
          params.append('redirectToPayment', 'true');
        }
        // Add buyPackages or reservation parameter if they exist
        if (buyPackages === 'true') {
          params.append('buyPackages', 'true');
        }
        if (reservation === 'true') {
          params.append('reservation', 'true');
        }
        router.push(`${path}${params.toString() ? `?${params.toString()}` : ''}`);
      }, 1500);
      return;
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {/* Nuevo Usuario */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={!activeButton ? { scale: 1.02 } : {}}
          whileTap={!activeButton ? { scale: 0.98 } : {}}
          className="relative group"
        >
          <div
            onClick={() => handleNavigation("/new", "new")}
            className="cursor-pointer"
          >
            <Card
              className={`p-8 transition-all duration-300 bg-white/90 backdrop-blur-sm border ${
                activeButton === "new" ? "shadow-xl border-gray-300" : "hover:shadow-xl border border-gray-100"
              }`}
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div
                  className={`w-16 h-16 rounded-xl bg-gradient-to-r ${
                    activeButton === "new" ? "from-green-700 to-teal-700" : "from-green-600 to-teal-600"
                  } flex items-center justify-center text-white`}
                >
                  <UserPlus className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">
                    {language === "en" ? "New User" : "Usuario Nuevo"}
                  </h3>
                  <p className="text-gray-600">
                    {language === "en"
                      ? "Create a new account"
                      : "Crear una cuenta nueva"}
                  </p>
                </div>
                {activeButton === "new" ? (
                  <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                ) : (
                  <ArrowRight className="w-6 h-6 text-gray-400 opacity-0 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-1 transition-all duration-300" />
                )}
              </div>
            </Card>
          </div>
        </motion.div>

        {/* Usuario Existente */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={!activeButton ? { scale: 1.02 } : {}}
          whileTap={!activeButton ? { scale: 0.98 } : {}}
          className="relative group"
        >
          <div
            onClick={() => handleNavigation("/existing", "existing")}
            className="cursor-pointer"
          >
            <Card
              className={`p-8 transition-all duration-300 bg-white/90 backdrop-blur-sm border ${
                activeButton === "existing" ? "shadow-xl border-gray-300" : "hover:shadow-xl border border-gray-100"
              }`}
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div
                  className={`w-16 h-16 rounded-xl bg-gradient-to-r ${
                    activeButton === "existing" ? "from-green-700 to-teal-700" : "from-green-600 to-teal-600"
                  } flex items-center justify-center text-white`}
                >
                  <Users className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">
                    {language === "en" ? "Existing User" : "Usuario Existente"}
                  </h3>
                  <p className="text-gray-600">
                    {language === "en"
                      ? "I already have an account"
                      : "Ya tengo una cuenta"}
                  </p>
                </div>
                {activeButton === "existing" ? (
                  <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                ) : (
                  <ArrowRight className="w-6 h-6 text-gray-400 opacity-0 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-1 transition-all duration-300" />
                )}
              </div>
            </Card>
          </div>
        </motion.div>
      </div>
    </>
  );
}

export default function UserSelectionPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <Header title={{ en: "User Selection", es: "Selección de Usuario" }} />
      <div className="container mx-auto px-4 py-16 md:py-24">
        <PageTransition>
          <Suspense fallback={<div>Loading...</div>}>
            <SelectContent />
          </Suspense>
        </PageTransition>
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

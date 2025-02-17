"use client";
import React, { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/header";
import { Card } from "@/components/ui/card";
import { UserPlus, Users, ArrowRight } from "lucide-react";
import { useLanguageContext } from "@/contexts/LanguageContext";
import { PageTransition } from "@/components/page-transition";
import { motion } from "framer-motion";
import { SuccessOverlay } from "@/components/ui/success-overlay";

function SelectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language } = useLanguageContext();
  const [showNewUserOverlay, setShowNewUserOverlay] = React.useState(false);

  const classId = searchParams.get('classId');
  const bundleTypeId = searchParams.get('bundleTypeId');

  const handleNavigation = (path: string, type: 'new' | 'existing') => {
    // Si es usuario nuevo, mostrar overlay y navegar
    if (type === 'new') {
      setShowNewUserOverlay(true);
      setTimeout(() => {
        const params = new URLSearchParams(searchParams.toString());
        router.push(`${path}${params.toString() ? `?${params.toString()}` : ''}`);
      }, 1500);
      return;
    }

    // Si es usuario existente
    if (type === 'existing') {
      setTimeout(() => {
        const params = new URLSearchParams(searchParams.toString());
        // Si hay bundleTypeId, navegar a existing manteniendo el bundleTypeId
        if (bundleTypeId) {
          params.append('redirectToPayment', 'true');
        }
        router.push(`${path}${params.toString() ? `?${params.toString()}` : ''}`);
      }, 1500);
      return;
    }
  };

  // Si no hay ni classId ni bundleTypeId, redirigir a buy-packages
  if (!classId && !bundleTypeId) {
    router.push('/buy-packages');
    return null;
  }

  return (
    <>
      {/* New User Overlay */}
      <SuccessOverlay
        show={showNewUserOverlay}
        title={{
          en: "Creating New Account",
          es: "Creando Nueva Cuenta"
        }}
        message={{
          en: "You will be redirected to create a new account",
          es: "Serás redirigido para crear una nueva cuenta"
        }}
        variant="user"
        duration={1500}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="relative group"
        >
          <div
            onClick={() => handleNavigation('/new', 'new')}
            className="cursor-pointer"
          >
            <Card className="p-8 hover:shadow-xl transition-all duration-300 bg-white/90 backdrop-blur-sm border border-gray-100 group">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-r from-green-600 to-teal-600 flex items-center justify-center text-white">
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
                <ArrowRight className="w-6 h-6 text-gray-400 opacity-0 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-1 transition-all duration-300" />
              </div>
            </Card>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="relative group"
        >
          <div
            onClick={() => handleNavigation('/existing', 'existing')}
            className="cursor-pointer"
          >
            <Card className="p-8 hover:shadow-xl transition-all duration-300 bg-white/90 backdrop-blur-sm border border-gray-100 group">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-r from-green-600 to-teal-600 flex items-center justify-center text-white">
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
                <ArrowRight className="w-6 h-6 text-gray-400 opacity-0 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-1 transition-all duration-300" />
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

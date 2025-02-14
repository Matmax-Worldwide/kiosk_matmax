"use client";
import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/header";
import { Card } from "@/components/ui/card";
import { useLanguageContext } from "@/contexts/LanguageContext";
import { UserSearch } from "@/components/forms/user-search";
import { PageTransition } from "@/components/page-transition";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Search } from "lucide-react";

export default function ExistingUserPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language } = useLanguageContext();
  const packageId = searchParams.get('packageId');
  const classId = searchParams.get('classId'); // Optional

  if (!packageId) {
    return (
      <div className="min-h-screen flex flex-col pt-16 bg-gradient-to-b ">
        <Header title={{ en: "Error", es: "Error" }} />
        <PageTransition>
          <div className="flex-1 p-6">
            <div className="max-w-2xl mx-auto">
              <Card className="p-6 text-center">
                <p className="text-red-600 mb-4">
                  {language === "en"
                    ? "Missing required parameters. Please select a package first."
                    : "Faltan parámetros requeridos. Por favor, seleccione un paquete primero."}
                </p>
                <Button
                  onClick={() => router.push('/buy-packages')}
                  variant="default"
                  className="bg-gradient-to-r from-green-600 to-teal-600 text-white hover:from-green-700 hover:to-teal-700"
                >
                  {language === "en" ? "Return to Packages" : "Volver a Paquetes"}
                </Button>
              </Card>
            </div>
          </div>
        </PageTransition>
      </div>
    );
  }

  const handleUserSelect: (consumer: { id: string }) => void = (consumer) => {
    const userId = consumer.id;
    let url = `/payment?packageId=${packageId}&userId=${userId}`;
    if (classId) {
      url += `&classId=${classId}`;
    }
    router.push(url);
  };

  return (
    <div className="min-h-screen flex flex-col pt-16">
      <Header title={{ en: "Select Existing User", es: "Seleccionar Usuario Existente" }} />
      <PageTransition>
        <div className="flex-1 p-6">
          <div className="max-w-2xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center max-w-4xl mx-auto mb-8"
            >
              <h2 className="text-3xl font-bold mb-3 bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
                {language === "en" ? "Find Your Account" : "Encuentra tu Cuenta"}
              </h2>
              <p className="text-xl text-gray-600">
                {language === "en" 
                  ? "Search by name or email to continue"
                  : "Busca por nombre o email para continuar"}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="p-8 bg-white/90 backdrop-blur-sm border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-r from-green-600 to-teal-600 flex items-center justify-center text-white mx-auto mb-6">
                  <Search className="h-8 w-8" />
                </div>
                <UserSearch onSelect={handleUserSelect} />
              </Card>
            </motion.div>
          </div>
        </div>
      </PageTransition>
    </div>
  );
}

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

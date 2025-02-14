"use client";
import React, { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/header";
import { Card } from "@/components/ui/card";
import { UserPlus, Users, ArrowRight } from "lucide-react";
import { useLanguageContext } from "@/contexts/LanguageContext";
import { PageTransition } from "@/components/page-transition";
import { motion } from "framer-motion";

function SelectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language } = useLanguageContext();

  // Build the query string only if parameters exist
  const buildQueryString = () => {
    const params = new URLSearchParams(searchParams.toString());
    const queryString = params.toString();
    return queryString ? `?${queryString}` : '';
  };

  return (
    <div className="flex-1 p-6 pt-16">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-4xl mx-auto mb-8"
        >
          <h2 className="text-3xl font-bold mb-3 bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
            {language === "en" ? "Do you have an account?" : "¿Tienes una cuenta?"}
          </h2>
          <p className="text-xl text-gray-600">
            {language === "en"
              ? "Choose an option to continue"
              : "Elige una opción para continuar"}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card
              onClick={() => router.push(`/existing${buildQueryString()}`)}
              className="p-8 cursor-pointer hover:shadow-xl transition-all duration-300 bg-white/90 backdrop-blur-sm border border-gray-100 group"
            >
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
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card
              onClick={() => router.push(`/new${buildQueryString()}`)}
              className="p-8 cursor-pointer hover:shadow-xl transition-all duration-300 bg-white/90 backdrop-blur-sm border border-gray-100 group"
            >
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
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default function SelectUserTypePage() {
  return (
    <div className="min-h-screen flex flex-col pt-16">
      <Header title={{ en: "Select Account Type", es: "Seleccionar Tipo de Cuenta" }} />
      <PageTransition>
        <Suspense fallback={<div>Loading...</div>}>
          <SelectContent />
        </Suspense>
      </PageTransition>
    </div>
  );
}

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

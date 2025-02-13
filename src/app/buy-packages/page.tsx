"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { Card } from "@/components/ui/card";
import { useLanguageContext } from "@/contexts/LanguageContext";
import { PageTransition } from "@/components/page-transition";
import { Spinner } from "@/components/spinner";
import { formatCurrency } from "@/lib/utils";
import { GET_BUNDLE_TYPES } from "@/lib/graphql/queries";
import { useQuery } from "@apollo/client";
import { GetBundleQuery } from "@/types/graphql";
import { ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function BuyBundleTypesPage() {
  const router = useRouter();
  const { language } = useLanguageContext();

  const { data, loading, error } = useQuery<GetBundleQuery>(GET_BUNDLE_TYPES, { variables: { contextId: "ec966559-0580-4adb-bc6b-b150c56f935c"} });
  const bundleTypes = data?.bundleTypes;
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header title={{ en: "Buy Packages", es: "Comprar Paquetes" }} />
        <div className="flex-1 flex items-center justify-center">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header title={{ en: "Buy Packages", es: "Comprar Paquetes" }} />
        <div className="flex-1 p-6">
            <Card className="p-6 text-center">
                <p className="text-red-600 mb-4">{error.message}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              {language === "en" ? "Try Again" : "Intentar de nuevo"}
            </button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 to-white">
      <Header title={{ en: "Buy Packages", es: "Comprar Paquetes" }} />
      <PageTransition key="buy-packages">
        <div className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-3 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {language === "en" 
                  ? "Choose Your Perfect Package" 
                  : "Elige tu Paquete Perfecto"}
              </h2>
              <p className="text-gray-600 text-lg">
                {language === "en"
                  ? "Select the package that best fits your needs"
                  : "Selecciona el paquete que mejor se adapte a tus necesidades"}
              </p>
            </div>

            {/* Regular Classes Section */}
            <div className="mb-12">
              <div className="flex items-center mb-8">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
                <h3 className="px-6 text-xl font-semibold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
                  {language === "en" ? "Regular Classes" : "Clases Regulares"}
                </h3>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {bundleTypes
                  ?.filter(pkg => 
                    !pkg.name.toLowerCase().includes('invitado') &&
                    !pkg.name.toLowerCase().includes('hotel') &&
                    !pkg.name.toLowerCase().includes('co-work') &&
                    !pkg.name.toLowerCase().includes('acro')
                  )
                  .sort((a, b) => a.price - b.price)
                  .map((pkg) => (
                    <Card 
                      key={pkg.id}
                      className="p-6 hover:shadow-lg transition-all duration-300 cursor-pointer bg-white/90 backdrop-blur-sm border border-gray-100 hover:scale-[1.02] active:scale-[0.98] overflow-hidden group"
                      onClick={() => router.push(`/buy-packages/user-selection?packageId=${pkg.id}`)}
                    >
                      <div className="flex flex-col h-full">
                        <div className="flex-1">
                          <div className="text-2xl font-bold mb-2 bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
                            {pkg.name}
                          </div>
                          <div className="flex items-baseline gap-2 mb-4">
                            <div className="text-4xl font-bold tracking-tight">
                              {formatCurrency(pkg.price, pkg.currency)}
                            </div>
                            <div className="text-sm text-gray-500">
                              {language === "en" ? "per package" : "por paquete"}
                            </div>
                          </div>
                          <div className="space-y-3 mb-6">
                            <div className="flex items-center gap-2 text-gray-600">
                              <div className="w-1 h-1 rounded-full bg-green-500"></div>
                              <span>
                                {pkg.name.toLowerCase().includes('1 ') 
                                  ? (language === "en" ? "Single class access" : "Acceso a una clase")
                                  : (language === "en" ? `${pkg.name.split(' ')[0]} classes access` : `Acceso a ${pkg.name.split(' ')[0]} clases`)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                              <div className="w-1 h-1 rounded-full bg-green-500"></div>
                              <span>
                                {language === "en" ? "Valid for 30 days" : "Válido por 30 días"}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                              <div className="w-1 h-1 rounded-full bg-green-500"></div>
                              <span>
                                {language === "en" 
                                  ? "Access to all regular classes" 
                                  : "Acceso a todas las clases regulares"}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                              <div className="w-1 h-1 rounded-full bg-green-500"></div>
                              <span>
                                {formatCurrency(pkg.price / parseInt(pkg.name.split(' ')[0] || '1'), pkg.currency)}
                                {" "}
                                {language === "en" ? "per class" : "por clase"}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="mt-4">
                          <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white p-3 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 group cursor-pointer shadow-sm hover:shadow-md">
                            <AnimatePresence mode="wait">
                              <motion.span
                                key={language}
                                initial={{ y: 10, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: -10, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="font-semibold"
                              >
                                {language === "en" ? "Buy Now" : "Comprar Ahora"}
                              </motion.span>
                            </AnimatePresence>
                            <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-1 transition-all duration-300" />
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
              </div>
            </div>

            {/* Acro Classes Section */}
            <div>
              <div className="flex items-center mb-8">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
                <h3 className="px-6 text-xl font-semibold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
                  {language === "en" ? "Acro Classes" : "Clases de Acro"}
                </h3>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {bundleTypes
                  ?.filter(pkg => 
                    !pkg.name.toLowerCase().includes('invitado') &&
                    !pkg.name.toLowerCase().includes('hotel') &&
                    !pkg.name.toLowerCase().includes('co-work') &&
                    pkg.name.toLowerCase().includes('acro')
                  )
                  .sort((a, b) => a.price - b.price)
                  .map((pkg) => (
                    <Card 
                      key={pkg.id}
                      className="p-6 hover:shadow-lg transition-all duration-300 cursor-pointer bg-white/90 backdrop-blur-sm border border-gray-100 hover:scale-[1.02] active:scale-[0.98] overflow-hidden group"
                      onClick={() => router.push(`/buy-packages/user-selection?packageId=${pkg.id}`)}
                    >
                      <div className="flex flex-col h-full">
                        <div className="flex-1">
                          <div className="text-2xl font-bold mb-2 bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
                            {pkg.name}
                          </div>
                          <div className="flex items-baseline gap-2 mb-4">
                            <div className="text-4xl font-bold tracking-tight">
                              {formatCurrency(pkg.price, pkg.currency)}
                            </div>
                            <div className="text-sm text-gray-500">
                              {language === "en" ? "per package" : "por paquete"}
                            </div>
                          </div>
                          <div className="space-y-3 mb-6">
                            <div className="flex items-center gap-2 text-gray-600">
                              <div className="w-1 h-1 rounded-full bg-green-500"></div>
                              <span>
                                {pkg.name.toLowerCase().includes('1 ') 
                                  ? (language === "en" ? "Single class access" : "Acceso a una clase")
                                  : (language === "en" ? `${pkg.name.split(' ')[0]} classes access` : `Acceso a ${pkg.name.split(' ')[0]} clases`)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                              <div className="w-1 h-1 rounded-full bg-green-500"></div>
                              <span>
                                {language === "en" ? "Valid for 30 days" : "Válido por 30 días"}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                              <div className="w-1 h-1 rounded-full bg-green-500"></div>
                              <span>
                                {language === "en" 
                                  ? "Access to Acro classes only" 
                                  : "Acceso solo a clases de Acro"}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                              <div className="w-1 h-1 rounded-full bg-green-500"></div>
                              <span>
                                {formatCurrency(pkg.price / parseInt(pkg.name.split(' ')[0] || '1'), pkg.currency)}
                                {" "}
                                {language === "en" ? "per class" : "por clase"}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="mt-4">
                          <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white p-3 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 group cursor-pointer shadow-sm hover:shadow-md">
                            <AnimatePresence mode="wait">
                              <motion.span
                                key={language}
                                initial={{ y: 10, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: -10, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="font-semibold"
                              >
                                {language === "en" ? "Buy Now" : "Comprar Ahora"}
                              </motion.span>
                            </AnimatePresence>
                            <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-1 transition-all duration-300" />
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </PageTransition>
    </div>
  );
} 
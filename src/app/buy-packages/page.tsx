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
import { ArrowRight, Users, User } from "lucide-react";
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
      <div className="min-h-screen flex flex-col pt-16">
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
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 to-white pt-16">
      <Header title={{ en: "Buy Packages", es: "Comprar Paquetes" }} />
      <PageTransition key="buy-packages">
        <div className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bundleTypes
                ?.filter(pkg => 
                  !pkg.name.toLowerCase().includes('invitado') &&
                  !pkg.name.toLowerCase().includes('hotel') &&
                  !pkg.name.toLowerCase().includes('co-work') &&
                  !pkg.name.toLowerCase().includes('acro') &&
                  !pkg.name.toLowerCase().includes('1 ')
                )
                .sort((a, b) => a.price - b.price)
                .map((pkg) => (
                  <Card 
                    key={pkg.id}
                    className="p-6 hover:shadow-lg transition-all duration-300 cursor-pointer bg-white/90 backdrop-blur-sm border border-gray-100 hover:scale-[1.02] active:scale-[0.98] overflow-hidden group"
                    onClick={() => router.push(`/user-selection?packageId=${pkg.id}`)}
                  >
                    <div className="flex flex-col h-full">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-4">
                          <div className="w-full text-center text-2xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
                            {pkg.name.split(' ')[0].padStart(2, '0')} {pkg.name.toLowerCase().includes('acro') ? 'ACRO MATPASS' : 'MATPASS'}
                          </div>
                        </div>

                        {/* Price Section with Per Class Price */}
                        <div className="bg-gradient-to-br from-green-50 to-teal-50 p-4 rounded-xl mb-6">
                          <div className="flex items-baseline justify-center mb-2">
                            <div className="text-4xl font-bold tracking-tight text-gray-900">
                              {formatCurrency(pkg.price, pkg.currency)}
                            </div>
                          </div>
                          <div className="text-center border-t border-green-100 pt-2 mt-2">
                            <div className="text-lg font-bold text-green-600">
                              {formatCurrency(pkg.price / parseInt(pkg.name.split(' ')[0] || '1'), pkg.currency)}
                              {" "}
                              <span className="text-sm font-medium text-gray-600">
                                {language === "en" ? "per class" : "por clase"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3 mb-6">
                          <div className="flex items-center gap-2 text-gray-600">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                            <span>
                              {pkg.name.split(' ')[0]} {language === "en" ? "Passes to classes" : "Pases para clases"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                            <span>
                              {language === "en" ? "Valid for 30 days" : "Válido por 30 días"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                            <span>
                              {language === "en" 
                                ? "60-minute regular classes" 
                                : "Clases regulares de 60 minutos"}
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

            {/* Acro Classes Section */}
            <div className="mt-12">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold mb-3 bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
                  {language === "en" ? "Acro MatPass" : "Acro MatPass"}
                </h2>
                <p className="text-gray-600 text-lg">
                  {language === "en" 
                    ? "120-minute classes for you and your partner" 
                    : "Clases de 120 minutos para ti y tu pareja"}
                </p>
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
                      onClick={() => router.push(`/user-selection?packageId=${pkg.id}`)}
                    >
                      <div className="flex flex-col h-full">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-4">
                            <div className="w-full text-center text-2xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
                              {pkg.name.split(' ')[0].padStart(2, '0')} ACRO MATPASS
                            </div>
                          </div>

                          {(pkg.price === 160 || pkg.price === 530) ? (
                            <div className="bg-gradient-to-r from-green-600/10 to-teal-600/10 p-3 rounded-xl mb-4 flex items-center justify-center gap-2">
                              <Users className="w-5 h-5 text-green-600" />
                              <span className="text-green-700 font-medium text-lg">
                                {language === "en" ? "Double Pass" : "Pase Doble"}
                              </span>
                            </div>
                          ) : (
                            <div className="bg-gradient-to-r from-green-600/10 to-teal-600/10 p-3 rounded-xl mb-4 flex items-center justify-center gap-2">
                              <User className="w-5 h-5 text-green-600" />
                              <span className="text-green-700 font-medium text-lg">
                                {language === "en" ? "Single Pass" : "Pase Individual"}
                              </span>
                            </div>
                          )}

                          {/* Price Section with Per Class Price */}
                          <div className="bg-gradient-to-br from-green-50 to-teal-50 p-4 rounded-xl mb-6">
                            <div className="flex items-baseline justify-center mb-2">
                              <div className="text-4xl font-bold tracking-tight text-gray-900">
                                {formatCurrency(pkg.price, pkg.currency)}
                              </div>
                            </div>
                            <div className="text-center border-t border-green-100 pt-2 mt-2">
                              <div className="text-lg font-bold text-green-600">
                                {formatCurrency(
                                  (pkg.price === 160 || pkg.price === 530) 
                                    ? (pkg.price / parseInt(pkg.name.split(' ')[0] || '1') / 2)  // Divide by number of classes and by 2 people
                                    : (pkg.price / parseInt(pkg.name.split(' ')[0] || '1')),     // Only divide by number of classes
                                  pkg.currency
                                )}
                                {" "}
                                <span className="text-sm font-medium text-gray-600">
                                  {(pkg.price === 160 || pkg.price === 530)
                                    ? (language === "en" ? "per class per person" : "por clase por persona")
                                    : (language === "en" ? "per class" : "por clase")
                                  }
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-3 mb-6">
                            <div className="flex items-center gap-2 text-gray-600">
                              <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                              <span>
                                {pkg.name.split(' ')[0]} {language === "en" ? "Passes to classes" : "Pases para clases"}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                              <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                              <span>
                                {language === "en" ? "Valid for 30 days" : "Válido por 30 días"}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                              <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                              <span>
                                {language === "en" 
                                  ? "120-minute Acro classes" 
                                  : "Clases de Acro de 120 minutos"}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                              <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                              <span>
                                {language === "en" 
                                  ? (pkg.price === 160 || pkg.price === 530 ? "Pass for two people" : "Single pass")
                                  : (pkg.price === 160 || pkg.price === 530 ? "Pase para dos personas" : "Pase individual")}
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
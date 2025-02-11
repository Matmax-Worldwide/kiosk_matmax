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
    <div className="min-h-screen flex flex-col">
      <Header title={{ en: "Buy Packages", es: "Comprar Paquetes" }} />
      <PageTransition>
        <div className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-medium mb-2">
                {language === "en" 
                  ? "Choose Your Perfect Package" 
                  : "Elige tu Paquete Perfecto"}
              </h2>
              <p className="text-gray-600">
                {language === "en"
                  ? "Select the package that best fits your needs"
                  : "Selecciona el paquete que mejor se adapte a tus necesidades"}
              </p>
            </div>

            {/* Regular Classes Section */}
            <div className="mb-12">
              <div className="flex items-center mb-6">
                <div className="flex-1 h-px bg-gray-200"></div>
                <h3 className="px-4 text-xl font-semibold text-gray-700">
                  {language === "en" ? "Regular Classes" : "Clases Regulares"}
                </h3>
                <div className="flex-1 h-px bg-gray-200"></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {bundleTypes
                  ?.filter(pkg => 
                    !pkg.name.toLowerCase().includes('invitado') &&
                    !pkg.name.toLowerCase().includes('1 ') &&
                    !pkg.name.toLowerCase().includes('hotel') &&
                    !pkg.name.toLowerCase().includes('co-work') &&
                    !pkg.name.toLowerCase().includes('acro')
                  )
                  .sort((a, b) => a.price - b.price)
                  .map((pkg) => (
                    <Card 
                      key={pkg.id}
                      className="p-6 hover:shadow-lg transition-shadow cursor-pointer bg-white border-2 hover:border-blue-200"
                      onClick={() => router.push(`/buy-packages/select?packageId=${pkg.id}`)}
                    >
                      <div className="text-xl font-medium mb-2">{pkg.name}</div>
                      <div className="text-2xl font-bold mb-4 text-blue-600">
                        {formatCurrency(pkg.price, pkg.currency)}
                      </div>
                      <div className="space-y-2 text-sm text-gray-500">
                        <div>
                          {language === "en" 
                            ? `${pkg.numberOfClasses} Classes`
                            : `${pkg.numberOfClasses} Clases`}
                        </div>
                        <div>
                          {language === "en"
                            ? `Valid for ${pkg.usagePeriod} days`
                            : `Válido por ${pkg.usagePeriod} días`}
                        </div>
                      </div>
                    </Card>
                  ))}
              </div>
            </div>

            {/* Acro Classes Section */}
            <div>
              <div className="flex items-center mb-6">
                <div className="flex-1 h-px bg-gray-200"></div>
                <h3 className="px-4 text-xl font-semibold text-gray-700">
                  {language === "en" ? "Acro Classes" : "Clases de Acro"}
                </h3>
                <div className="flex-1 h-px bg-gray-200"></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {bundleTypes
                  ?.filter(pkg => 
                    !pkg.name.toLowerCase().includes('invitado') &&
                    !pkg.name.toLowerCase().includes('1 ') &&
                    !pkg.name.toLowerCase().includes('hotel') &&
                    !pkg.name.toLowerCase().includes('co-work') &&
                    pkg.name.toLowerCase().includes('acro')
                  )
                  .sort((a, b) => a.price - b.price)
                  .map((pkg) => (
                    <Card 
                      key={pkg.id}
                      className="p-6 hover:shadow-lg transition-shadow cursor-pointer bg-gradient-to-br from-purple-50 to-white border-2 hover:border-purple-200"
                      onClick={() => router.push(`/buy-packages/select?packageId=${pkg.id}`)}
                    >
                      <div className="text-xl font-medium mb-2">{pkg.name}</div>
                      <div className="text-2xl font-bold mb-4 text-purple-600">
                        {formatCurrency(pkg.price, pkg.currency)}
                      </div>
                      <div className="space-y-2 text-sm text-gray-500">
                        <div>
                          {language === "en" 
                            ? `${pkg.numberOfClasses} Classes`
                            : `${pkg.numberOfClasses} Clases`}
                        </div>
                        <div>
                          {language === "en"
                            ? `Valid for ${pkg.usagePeriod} days`
                            : `Válido por ${pkg.usagePeriod} días`}
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
"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguageContext } from "@/contexts/LanguageContext";
import { PageTransition } from "@/components/page-transition";
import { CalendarDays, Package2, UserCheck } from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const { language } = useLanguageContext();

  return (
    <div className="min-h-screen flex flex-col">
      <Header title={{ en: "Welcome", es: "Bienvenido" }} />
      <PageTransition>
        <div className="flex-1 p-6 bg-gradient-to-b from-gray-50 to-white">
          <div className="max-w-4xl mx-auto space-y-12">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                {language === "en" ? "What would you like to do?" : "¿Qué te gustaría hacer?"}
              </h2>
              <p className="text-gray-600 text-lg">
                {language === "en"
                  ? "Choose an option to get started"
                  : "Elige una opción para comenzar"}
              </p>
            </div>

            <div className="flex flex-col space-y-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card 
                  className="p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer bg-white border-blue-100"
                  onClick={() => router.push('/class-pass')}
                >
                  <div className="flex flex-col items-center text-center space-y-5">
                    <div className="p-4 rounded-full bg-blue-100">
                      <CalendarDays className="w-12 h-12 text-blue-600" />
                    </div>
                    <h3 className="text-2xl font-semibold text-blue-900">
                      {language === "en" ? "Reserve Now" : "Reserva Ahora"}
                    </h3>
                    <p className="text-blue-700 text-lg">
                      {language === "en"
                        ? "Book your next class or check your schedule"
                        : "Reserva tu próxima clase o revisa tu horario"}
                    </p>
                  </div>
                </Card>

                <Card 
                  className="p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer bg-white border-green-100"
                  onClick={() => router.push('/buy-packages')}
                >
                  <div className="flex flex-col items-center text-center space-y-5">
                    <div className="p-4 rounded-full bg-green-100">
                      <Package2 className="w-12 h-12 text-green-600" />
                    </div>
                    <h3 className="text-2xl font-semibold text-green-900">
                      {language === "en" ? "Buy Packages" : "Comprar Paquetes"}
                    </h3>
                    <p className="text-green-700 text-lg">
                      {language === "en"
                        ? "View and purchase class packages"
                        : "Ver y comprar paquetes de clases"}
                    </p>
                  </div>
                </Card>
              </div>

              <div className="flex flex-col items-center space-y-8 mt-8">
                <div className="text-center space-y-4">
                  <h3 className="text-2xl font-semibold text-gray-800 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600">
                    {language === "en" 
                      ? "Already have a reservation?"
                      : "¿Ya tienes una reserva?"}
                  </h3>
                  <p className="text-gray-600 text-xl font-medium tracking-wide">
                    {language === "en" 
                      ? "Check-in for your class here"
                      : "Haz check-in para tu clase aquí"}
                  </p>
                </div>
                <Button
                  onClick={() => router.push('/check-in')}
                  className="w-full h-16 text-xl font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  <UserCheck className="w-8 h-8 mr-3" />
                  Check-in
                </Button>
              </div>
            </div>
          </div>
        </div>
      </PageTransition>
    </div>
  );
}

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store"; 
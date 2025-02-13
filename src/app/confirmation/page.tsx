"use client";
import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguageContext } from "@/contexts/LanguageContext";
import { CheckCircle2, CreditCard, Package, User, Calendar } from "lucide-react";
import { PageTransition } from "@/components/page-transition";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function ConfirmationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language } = useLanguageContext();

  // Get all parameters
  const purchaseId = searchParams.get('purchaseId');
  const paymentMethod = searchParams.get('paymentMethod');
  const firstName = searchParams.get('firstName');
  const lastName = searchParams.get('lastName');
  const email = searchParams.get('email');
  const packageName = searchParams.get('packageName');
  const packagePrice = searchParams.get('packagePrice');
  
  // Class information
  const classId = searchParams.get('classId');
  const className = searchParams.get('className');
  const classDate = searchParams.get('classDate');
  const professorName = searchParams.get('professorName');
  const reservationId = searchParams.get('reservationId');

  const maskEmail = (email: string | null) => {
    if (!email) return '';
    const [username, domain] = email.split('@');
    if (!domain) return email;
    
    const maskedUsername = username.length > 3
      ? `${username.slice(0, 3)}${'*'.repeat(username.length - 3)}`
      : username;
    
    const [domainName, extension] = domain.split('.');
    if (!extension) return `${maskedUsername}@${domain}`;
    
    const maskedDomain = domainName.length > 1
      ? `${domainName[0]}${'*'.repeat(domainName.length - 1)}`
      : domainName;
    
    return `${maskedUsername}@${maskedDomain}.${extension}`;
  };

  const getPaymentMethodText = () => {
    switch (paymentMethod) {
      case 'CARD':
        return language === 'en' ? 'Credit/Debit Card' : 'Tarjeta Crédito/Débito';
      case 'QR':
        return 'Yape / Plin';
      case 'CASH':
        return language === 'en' ? 'Cash' : 'Efectivo';
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header title={{ en: "Purchase Confirmation", es: "Confirmación de Compra" }} />
      <PageTransition>
        <div className="flex-1 p-6 pt-16">
          <div className="max-w-2xl mx-auto pt-16">
            <Card className="p-6">
              {/* Success Message */}
              <div className="text-center mb-8">
                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-medium text-green-700 mb-2">
                  {classId 
                    ? language === "en" 
                      ? "Purchase and Reservation Successful!" 
                      : "¡Compra y Reserva Exitosa!"
                    : language === "en" 
                      ? "Purchase Successful!" 
                      : "¡Compra Exitosa!"
                  }
                </h2>
                <p className="text-gray-600 mb-2">
                  {classId
                    ? language === "en"
                      ? "Your purchase has been confirmed and your class has been successfully reserved."
                      : "Tu compra ha sido confirmada y tu clase ha sido reservada exitosamente."
                    : language === "en"
                      ? "Your purchase has been confirmed and processed successfully."
                      : "Tu compra ha sido confirmada y procesada exitosamente."
                  }
                </p>
                <div className="text-sm text-gray-500">
                  <p className="mb-1">
                    {language === "en"
                      ? "We've sent a confirmation email to:"
                      : "Hemos enviado un correo de confirmación a:"
                    }
                  </p>
                  <p className="font-medium">{maskEmail(email)}</p>
                  <p className="mt-1 text-xs">
                    {language === "en"
                      ? "Please check your inbox and spam folder"
                      : "Por favor revisa tu bandeja de entrada y carpeta de spam"
                    }
                  </p>
                </div>
              </div>

              {/* Purchase Details */}
              <div className="space-y-6 mb-8">
                {/* Order ID */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    {language === "en" ? "Order ID" : "ID de Orden"}
                  </p>
                  <p className="font-medium">{purchaseId}</p>
                </div>

                {/* User Info */}
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-blue-500 mt-1" />
                  <div>
                    <h3 className="font-medium mb-1">
                      {language === "en" ? "Customer Information" : "Información del Cliente"}
                    </h3>
                    <p>{firstName} {lastName}</p>
                    <p className="text-gray-600">{maskEmail(email)}</p>
                  </div>
                </div>

                {/* Package Info */}
                <div className="flex items-start gap-3">
                  <Package className="w-5 h-5 text-blue-500 mt-1" />
                  <div>
                    <h3 className="font-medium mb-1">
                      {language === "en" ? "Package Details" : "Detalles del Paquete"}
                    </h3>
                    <p>{packageName}</p>
                    <p className="text-gray-600">S/. {packagePrice}</p>
                  </div>
                </div>

                {/* Class Info - Only show if classId exists */}
                {classId && (
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-blue-500 mt-1" />
                    <div>
                      <h3 className="font-medium mb-1">
                        {language === "en" ? "Class Information" : "Información de la Clase"}
                      </h3>
                      <p>{className}</p>
                      <p className="text-gray-600">
                        {language === "en" ? "with" : "con"} {professorName}
                      </p>
                      {classDate && (
                        <p className="text-gray-600">
                          {format(new Date(classDate), "EEEE d 'de' MMMM, HH:mm", {
                            locale: language === 'es' ? es : undefined
                          })}
                        </p>
                      )}
                      <p className="text-sm text-gray-500 mt-1">
                        {language === "en" ? "Reservation ID: " : "ID de Reserva: "}
                        {reservationId}
                      </p>
                    </div>
                  </div>
                )}

                {/* Payment Method */}
                <div className="flex items-start gap-3">
                  <CreditCard className="w-5 h-5 text-blue-500 mt-1" />
                  <div>
                    <h3 className="font-medium mb-1">
                      {language === "en" ? "Payment Method" : "Método de Pago"}
                    </h3>
                    <p>{getPaymentMethodText()}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => router.push('/schedule')}
                  variant="default"
                  className="flex-1"
                >
                  {language === "en" ? "View Schedule" : "Ver Horario"}
                </Button>
                <Button
                  onClick={() => router.push('/')}
                  variant="outline"
                  className="flex-1"
                >
                  {language === "en" ? "Return to Home" : "Volver al Inicio"}
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </PageTransition>
    </div>
  );
}

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store"; 
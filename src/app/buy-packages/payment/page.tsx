"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguageContext } from "@/contexts/LanguageContext";
import { Banknote, CreditCard, QrCode } from "lucide-react";
import { useQuery } from '@apollo/client';
import { GET_CONSUMER, GET_BUNDLE_TYPE, CREATE_BUNDLE, BundleStatus } from '@/lib/graphql/queries';
import { useMutation } from '@apollo/client';

type PaymentMethod = "CARD" | "CASH" | "QR";

interface PaymentMethodCardProps {
  method: PaymentMethod;
  icon: React.ReactNode;
  title: { en: string; es: string };
  subtitle: string | { en: string; es: string };
  selected: boolean;
  onClick: () => void;
}

function PaymentMethodCard({ icon, title, subtitle, selected, onClick }: PaymentMethodCardProps) {
  const { language } = useLanguageContext();

  return (
    <Card 
      className={`p-6 cursor-pointer transition-all hover:border-blue-500 ${
        selected ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
      }`}
      onClick={onClick}
    >
      <div className="flex flex-col items-center text-center space-y-3">
        {icon}
        <div>
          <h3 className="font-medium">{title[language]}</h3>
          <p className="text-sm text-gray-500">
            {typeof subtitle === 'string' ? subtitle : subtitle[language]}
          </p>
        </div>
      </div>
    </Card>
  );
}

function PaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language } = useLanguageContext();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userId = searchParams.get('userId');
  const packageId = searchParams.get('packageId');

  const { data: consumerData, loading: consumerLoading, error: consumerError } = useQuery(GET_CONSUMER, {
    variables: { id: userId },
    skip: !userId,
  });

  const { data: bundleTypeData, loading: bundleTypeLoading, error: bundleTypeError } = useQuery(GET_BUNDLE_TYPE, {
    variables: { id: packageId },
    skip: !packageId,
  });

  const [createBundle] = useMutation(CREATE_BUNDLE);

  const getPaymentMethodText = () => {
    switch (selectedMethod) {
      case 'CARD':
        return 'Tarjeta de Crédito/Débito / Credit/Debit Card';
      case 'QR':
        return 'Pago con QR / QR Payment';
      case 'CASH':
        return 'Efectivo / Cash';
    }
  };
  
  useEffect(() => {
    if (!userId || !packageId) {
      router.push('/buy-packages');
    }
  }, [userId, packageId, router]);

  const handlePayment = async () => {
    if (!selectedMethod || !userId || !packageId) return;

    try {
      setIsProcessing(true);
      setError(null);

      const validFrom = new Date();
      const validTo = new Date();
      validTo.setDate(validFrom.getDate() + 30);

      const { data } = await createBundle({
        variables: {
          input: {
            consumerId: userId,
            status: BundleStatus.ACTIVE,
            bundleTypeId: packageId,
            validFrom: validFrom.toISOString(),
            validTo: validTo.toISOString(),
            note: `Método de pago: ${getPaymentMethodText()}`,
          }
        }
      });

      router.push(`/buy-packages/confirmation?purchaseId=${data.createBundle.id}`);
    } catch (err) {
      console.error('Payment error:', err);
      setError(
        language === "en"
          ? "Failed to process payment. Please try again."
          : "Error al procesar el pago. Por favor intente de nuevo."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  if (consumerLoading || bundleTypeLoading) return <div>Loading...</div>;
  if (consumerError || bundleTypeError) return <div>Error loading data</div>;

  return (
    <div className="flex-1 p-6">
      <div className="max-w-2xl mx-auto">
        <Card className="p-6">
          <h2 className="text-2xl font-medium text-center mb-6">
            {language === "en" ? "Select Payment Method" : "Seleccionar Método de Pago"}
          </h2>

          <div className="mb-6">
            <h3 className="text-lg font-medium">Consumer Information</h3>
            <p>Name: {consumerData.consumer.firstName} {consumerData.consumer.lastName}</p>
            <p>Email: {consumerData.consumer.email}</p>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-medium">Bundle Information</h3>
            <p>Bundle Type: {bundleTypeData.bundleType.name}</p>
            <p>Price: {bundleTypeData.bundleType.price}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <PaymentMethodCard
              method="CARD"
              icon={<CreditCard className="w-8 h-8 text-blue-500" />}
              title={{ en: "Credit/Debit Card", es: "Tarjeta Crédito/Débito" }}
              subtitle={{ 
                en: "Pay securely with your card",
                es: "Paga de forma segura con tu tarjeta"
              }}
              selected={selectedMethod === "CARD"}
              onClick={() => setSelectedMethod("CARD")}
            />

            <PaymentMethodCard
              method="CASH"
              icon={<Banknote className="w-8 h-8 text-green-500" />}
              title={{ en: "Cash", es: "Efectivo" }}
              subtitle={{ 
                en: "Pay with cash",
                es: "Paga con efectivo"
              }}
              selected={selectedMethod === "CASH"}
              onClick={() => setSelectedMethod("CASH")}
            />

            <PaymentMethodCard
              method="QR"
              icon={<QrCode className="w-8 h-8 text-purple-500" />}
              title={{ en: "Yape / Plin", es: "Yape / Plin" }}
              subtitle={{ 
                en: "Pay using QR",
                es: "Paga usando QR"
              }}
              selected={selectedMethod === "QR"}
              onClick={() => setSelectedMethod("QR")}
            />
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm text-center">{error}</p>
            </div>
          )}

          {selectedMethod && (
            <div className="mt-8">
              <Button
                onClick={handlePayment}
                variant="default"
                className="w-full"
                disabled={isProcessing}
              >
                {language === "en" 
                  ? isProcessing ? "Processing..." : "Complete Payment"
                  : isProcessing ? "Procesando..." : "Completar Pago"
                }
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header title={{ en: "Payment", es: "Pago" }} />
      <Suspense fallback={<div>Loading...</div>}>
        <PaymentContent />
      </Suspense>
    </div>
  );
}

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store"; 
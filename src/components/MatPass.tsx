'use client'

import { useState, useEffect } from 'react'
// import styles from './MatPass.module.css'
// import Image from 'next/image';
// import { AddToCartButton } from './AddToCartButton';
import { useQuery } from "@apollo/client";
import { GET_BUNDLE_TYPES } from "@/lib/graphql/queries";
import { Spinner } from "@/components/spinner";
import { GetBundleQuery } from "@/types/graphql";
import { useLanguageContext } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

// Interfaz para el parámetro CustomEvent
interface CustomEventParams {
  bubbles?: boolean;
  cancelable?: boolean;
  detail?: unknown;
}

// Polyfill para CustomEvent en navegadores antiguos
const customEventPolyfill = () => {
  if (typeof window === 'undefined') return;
  
  if (typeof window.CustomEvent === 'function') return;

  function CustomEvent(event: string, params?: CustomEventParams): CustomEvent {
    params = params || { bubbles: false, cancelable: false, detail: null };
    const evt = document.createEvent('CustomEvent');
    evt.initCustomEvent(event, !!params.bubbles, !!params.cancelable, params.detail || null);
    return evt as CustomEvent;
  }
  
  // @ts-expect-error - Sobreescribiendo para compatibilidad con navegadores antiguos
  window.CustomEvent = CustomEvent;
};

// Ejecutar polyfill inmediatamente
customEventPolyfill();

// Define custom event for cart interaction
const addToCartEvent = (item: { id: number, name: string, price: number, isPass?: boolean, productType?: string, bundleTypeId?: string }) => {
  try {
    // Verificar que document exista antes de usarlo
    if (typeof document === 'undefined') return;
    
    // Usar polyfill para compatibilidad máxima
    let event;
    if (typeof window.CustomEvent === 'function') {
      event = new CustomEvent('add-to-cart', { 
        detail: { ...item, quantity: 1 },
        bubbles: true 
      });
    } else {
      // Fallback usando API antigua para navegadores muy antiguos
      event = document.createEvent('CustomEvent');
      event.initCustomEvent('add-to-cart', true, false, { ...item, quantity: 1 });
    }
    
    document.dispatchEvent(event);
    console.log('Evento de carrito disparado exitosamente');
  } catch (error) {
    console.error('Error al disparar evento de carrito:', error);
    // Fallback: intentar usar un mecanismo alternativo o simplemente mostrar un mensaje al usuario
    alert(`Error al agregar al carrito: ${item.name}. Por favor intente nuevamente.`);
  }
};

interface MatPassProps {
  parentTab?: string;
}

const getPackageNumber = (name: string): number => {
  try {
    if (!name) return 1;
    const number = parseInt(name.split(' ')[0] || '1', 10);
    return isNaN(number) ? 1 : number;
  } catch (error) {
    console.error('Error al obtener número de paquete:', error);
    return 1; // Valor predeterminado seguro
  }
};

export default function MatPass({ parentTab = 'matpass' }: MatPassProps) {
  const [addedToCart, setAddedToCart] = useState<{[key: string]: boolean}>({})
  const [animatingCards, setAnimatingCards] = useState<{[key: string]: boolean}>({})
  const [hasError, setHasError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const { language } = useLanguageContext();
  
  const { data: bundleData, loading: bundleLoading, error: bundleError } = useQuery<GetBundleQuery>(GET_BUNDLE_TYPES, { 
    variables: { contextId: "ec966559-0580-4adb-bc6b-b150c56f935c"} 
  });

  // Manejar errores que podrían ocurrir durante la carga
  useEffect(() => {
    if (bundleError) {
      console.error('Error al cargar bundle types:', bundleError);
      setHasError(true);
      setErrorMessage(bundleError.message || 'Error al cargar los paquetes');
    }
  }, [bundleError]);

  const addToCart = (id: number, name: string, price: number, isPass: boolean = false, isAcro: boolean = false, bundleTypeId?: string) => {
    try {
      // Asegurarse de que el ID sea un número válido
      const validId = isNaN(id) ? (isAcro ? 9999 : isPass ? 7999 : 5999) : id;
      
      // Crear un identificador único que combine el ID con el tipo de pase
      const uniqueId = isAcro ? `acro_${validId}` : isPass ? `regular_${validId}` : `product_${validId}`;
      const productType = isAcro ? 'acro' : isPass ? 'regular' : 'product';
      
      // Debug logging
      console.log('===== AGREGAR AL CARRITO =====');
      console.log(`Item: ${name}`);
      console.log(`ID: ${validId}`);
      console.log(`Product Type: ${productType}`);
      console.log(`Bundle Type ID: ${bundleTypeId || 'undefined'}`);
      
      // Verificar que bundleTypes exista antes de usarlo
      const bundleTypes = bundleData?.bundleTypes || [];
      
      if (isPass && bundleTypes.length > 0) {
        // For passes, log the available bundle types to help debug
        console.log('Available Bundle Types:');
        bundleTypes.forEach(bt => {
          if (bt && bt.name && bt.id) {
            console.log(`- ${bt.name} (ID: ${bt.id})`);
          }
        });
        
        // Log the matching bundle type
        const matchingBundleType = bundleTypes.find(bt => 
          bt && bt.name && (isAcro 
            ? (bt.name.includes(`${validId}`) && bt.name.toLowerCase().includes('acro'))
            : (bt.name.includes(`${validId}`) && !bt.name.toLowerCase().includes('acro')))
        );
        console.log('Matching Bundle Type:', matchingBundleType);
      }
      console.log('=============================');
      
      // Trigger the custom event - usar versión protegida
      addToCartEvent({ id: validId, name, price, isPass, productType, bundleTypeId });
      
      // Show visual feedback that item was added - usar setTimeout con try/catch
      try {
        setAddedToCart(prev => ({ ...prev, [uniqueId]: true }));
        setAnimatingCards(prev => ({ ...prev, [uniqueId]: true }));
        
        setTimeout(() => {
          try {
            setAddedToCart(prev => ({ ...prev, [uniqueId]: false }));
          } catch (error) {
            console.error('Error al resetear estado de carrito:', error);
          }
        }, 1500);
        
        setTimeout(() => {
          try {
            setAnimatingCards(prev => ({ ...prev, [uniqueId]: false }));
          } catch (error) {
            console.error('Error al resetear animación:', error);
          }
        }, 600);
      } catch (error) {
        console.error('Error al mostrar feedback visual:', error);
      }
    } catch (error) {
      console.error('Error en función addToCart:', error);
      alert(`Lo sentimos, ocurrió un error al agregar al carrito. Por favor intente nuevamente.`);
    }
  }

  // Mostrar error si hay un problema con la carga
  if (hasError) {
    return (
      <div className="flex-1 p-6">
        <div className="p-6 text-center">
          <p className="text-red-600 mb-4">{errorMessage || 'Ocurrió un problema inesperado al cargar esta página'}</p>
          <Button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            {language === "en" ? "Try Again" : "Intentar de nuevo"}
          </Button>
        </div>
      </div>
    );
  }

  if (bundleLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (bundleError) {
    return (
      <div className="flex-1 p-6">
        <div className="p-6 text-center">
          <p className="text-red-600 mb-4">{bundleError.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            {language === "en" ? "Try Again" : "Intentar de nuevo"}
          </button>
        </div>
      </div>
    );
  }

  // Acceso seguro a los datos de bundle
  const bundleTypes = bundleData?.bundleTypes || [];
  
  // Extraer pases regulares con verificaciones
  const regularPasses = bundleTypes
    .filter(pkg => 
      pkg && pkg.name && (
        !pkg.name.toLowerCase().includes('invitado') &&
        !pkg.name.toLowerCase().includes('hotel') &&
        !pkg.name.toLowerCase().includes('co-work') &&
        !pkg.name.toLowerCase().includes('acro')
      )
    )
    .sort((a, b) => (a && b && a.price && b.price) ? a.price - b.price : 0)
    .map(pkg => {
      if (!pkg || !pkg.name || typeof pkg.price !== 'number') {
        // Elemento predeterminado seguro si faltan datos
        return {
          id: 7001,
          classes: 1,
          price: 0,
          perClass: 0,
          days: 30,
          features: [
            language === "en" ? "Valid for 30 days" : "Válido por 30 días",
            language === "en" ? "60-minute regular classes" : "Clases regulares de 60 minutos"
          ],
          popular: false
        };
      }
      
      const packageNumber = getPackageNumber(pkg.name);
      // Asegurarse de que el ID sea un número válido
      const validId = parseInt(pkg.id);
      return {
        id: isNaN(validId) ? 7000 + packageNumber : validId,
        classes: packageNumber,
        price: pkg.price,
        perClass: pkg.price / packageNumber,
        days: 30,
        features: [
          language === "en" ? "Valid for 30 days" : "Válido por 30 días",
          language === "en" ? "60-minute regular classes" : "Clases regulares de 60 minutos"
        ],
        popular: packageNumber === 8
      };
    });

  // Extraer pases de acro con verificaciones
  const acroPasses = bundleTypes
    .filter(pkg => 
      pkg && pkg.name && (
        !pkg.name.toLowerCase().includes('invitado') &&
        !pkg.name.toLowerCase().includes('hotel') &&
        !pkg.name.toLowerCase().includes('co-work') &&
        pkg.name.toLowerCase().includes('acro')
      )
    )
    .sort((a, b) => (a && b && a.price && b.price) ? a.price - b.price : 0)
    .map(pkg => {
      if (!pkg || !pkg.name || typeof pkg.price !== 'number') {
        // Elemento predeterminado seguro si faltan datos
        return {
          id: 9001,
          classes: 1,
          price: 0,
          perClass: 0,
          days: 30,
          features: [
            language === "en" ? "Valid for 30 days" : "Válido por 30 días",
            language === "en" ? "120-minute acro classes" : "Clases de acro de 120 minutos"
          ],
          popular: false,
          isDouble: false
        };
      }
      
      const packageNumber = getPackageNumber(pkg.name);
      const isDouble = pkg.price === 160 || pkg.price === 530;
      // Asegurarse de que el ID sea un número válido
      const validId = parseInt(pkg.id);
      return {
        id: isNaN(validId) ? (isDouble ? 9000 + packageNumber : 8000 + packageNumber) : validId,
        classes: packageNumber,
        price: pkg.price,
        perClass: isDouble ? pkg.price / packageNumber / 2 : pkg.price / packageNumber,
        days: 30,
        features: [
          language === "en" ? "Valid for 30 days" : "Válido por 30 días",
          isDouble 
            ? (language === "en" ? "For Two Persons" : "Para Dos Personas")
            : (language === "en" ? "120-minute acro classes" : "Clases de acro de 120 minutos")
        ],
        popular: packageNumber === 4 && !isDouble,
        isDouble
      };
    });

  // Envolver el renderizado principal con un try-catch para evitar errores no controlados
  try {
    return (
      <div className="p-5 w-full h-full overflow-y-auto bg-white text-gray-800 flex flex-col max-w-full mx-auto pb-16 relative overflow-x-hidden">
        {/* Content based on parent tab selection */}
        <div className="flex-1 overflow-y-auto">
          {/* MatPass Section */}
          <div className={`${parentTab === 'matpass' ? '' : 'hidden'}`}>
            <div className="w-full">
              <div id="regular-passes" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                {regularPasses.map(pass => (
                  <div 
                    key={pass.id} 
                    className={`bg-white border rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden ${animatingCards[`regular_${pass.id}`] ? 'animate-pulse' : ''}`}
                  >
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-4xl font-bold text-gray-800">{pass.classes}</div>
                        <div className="px-3 py-1 bg-sky-100 text-sky-800 rounded-full text-xs font-semibold uppercase">
                          MatPass
                        </div>
                      </div>
                      
                      <div className="mb-3 text-sm font-medium text-gray-500">
                        {language === "en" ? "Regular Yoga" : "Yoga Regular"}
                      </div>
                      
                      <div className="flex items-end gap-1 mb-2">
                        <div className="text-2xl font-bold text-gray-800">S/ {pass.price.toFixed(2)}</div>
                      </div>
                      
                      <div className="text-xs text-gray-500 mb-5">
                        S/ {pass.perClass.toFixed(2)} {language === "en" ? "per class" : "por clase"}
                      </div>
                      
                      <div className="space-y-2 mb-6">
                        {pass.features.map((feature, idx) => (
                          <div key={idx} className="flex items-center text-sm">
                            <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                            <span className="text-gray-600">{feature}</span>
                          </div>
                        ))}
                      </div>
                      
                      <Button 
                        className={`w-full font-semibold py-2.5 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${addedToCart[`regular_${pass.id}`] ? 'bg-green-600 hover:bg-green-700' : 'bg-sky-500 hover:bg-sky-600'} text-white`}
                        onClick={() => {
                          try {
                            const selectedBundleTypeId = bundleTypes.find(bt => 
                              bt && bt.name && bt.name.includes(`${pass.classes} `) && !bt.name.toLowerCase().includes('acro')
                            )?.id;
                            console.log(`Clicking "Agregar al carrito" for Regular MatPass ${pass.classes} classes`);
                            console.log(`Selected bundleTypeId: ${selectedBundleTypeId || 'undefined'}`);
                            console.log(`Matching bundle type:`, bundleTypes.find(bt => 
                              bt && bt.name && bt.name.includes(`${pass.classes} `) && !bt.name.toLowerCase().includes('acro')
                            ));
                            
                            addToCart(
                              pass.id, 
                              `${language === "en" ? "Regular Yoga" : "Yoga Regular"} - ${pass.classes} ${language === "en" ? "Classes" : "Clases"}`, 
                              pass.price, 
                              true, 
                              false,
                              selectedBundleTypeId
                            );
                          } catch (error) {
                            console.error('Error al hacer clic en Agregar al carrito:', error);
                            alert(language === "en" 
                              ? "There was an error adding this item to the cart. Please try again." 
                              : "Hubo un error al agregar este artículo al carrito. Por favor, inténtelo de nuevo."
                            );
                          }
                        }}
                      >
                        {addedToCart[`regular_${pass.id}`] ? (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            {language === 'en' ? 'Added' : 'Agregado'}
                          </>
                        ) : (
                          language === 'en' ? 'Add to Cart' : 'Agregar al Carrito'
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Acro MatPass Section */}
          <div className={`${parentTab === 'acromatpass' ? '' : 'hidden'}`}>
            <div className="w-full">
              <div id="acro-passes" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                {acroPasses.map(pass => (
                  <div 
                    key={pass.id} 
                    className={`bg-white border rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden ${animatingCards[`acro_${pass.id}`] ? 'animate-pulse' : ''}`}
                  >
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-4xl font-bold text-gray-800">{pass.classes}</div>
                        <div className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-semibold uppercase">
                          {pass.isDouble ? (language === "en" ? 'Double Pass' : 'Pase Doble') : 'AcroPass'}
                        </div>
                      </div>
                      
                      <div className="mb-3 text-sm font-medium text-gray-500">
                        {language === "en" ? "Acro Yoga" : "Acro Yoga"}
                      </div>
                      
                      <div className="flex items-end gap-1 mb-2">
                        <div className="text-2xl font-bold text-gray-800">S/ {pass.price.toFixed(2)}</div>
                      </div>
                      
                      <div className="text-xs text-gray-500 mb-5">
                        S/ {pass.perClass.toFixed(2)} {pass.isDouble ? (language === "en" ? 'each person' : 'por persona') : (language === "en" ? 'per class' : 'por clase')}
                      </div>
                      
                      <div className="space-y-2 mb-6">
                        {pass.features.map((feature, idx) => (
                          <div key={idx} className="flex items-center text-sm">
                            <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                            <span className="text-gray-600">{feature}</span>
                          </div>
                        ))}
                      </div>
                      
                      <Button 
                        className={`w-full font-semibold py-2.5 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${addedToCart[`acro_${pass.id}`] ? 'bg-green-600 hover:bg-green-700' : 'bg-purple-500 hover:bg-purple-600'} text-white`}
                        onClick={() => {
                          try {
                            const selectedBundleTypeId = bundleTypes.find(bt => 
                              bt && bt.name && bt.name.includes(`${pass.classes} `) && bt.name.toLowerCase().includes('acro')
                            )?.id;
                            console.log(`Clicking "Agregar al carrito" for Acro MatPass ${pass.classes} classes ${pass.isDouble ? "(Double Pack)" : ""}`);
                            console.log(`Selected bundleTypeId: ${selectedBundleTypeId || 'undefined'}`);
                            console.log(`Matching bundle type:`, bundleTypes.find(bt => 
                              bt && bt.name && bt.name.includes(`${pass.classes} `) && bt.name.toLowerCase().includes('acro')
                            ));
                            
                            addToCart(
                              pass.id, 
                              `Acro Yoga - ${pass.classes} ${language === "en" ? "Classes" : "Clases"} ${pass.isDouble ? (language === "en" ? "(Double Pack)" : "(Paquete Doble)") : ""}`, 
                              pass.price, 
                              true,
                              true,
                              selectedBundleTypeId
                            );
                          } catch (error) {
                            console.error('Error al hacer clic en Agregar al carrito para Acro:', error);
                            alert(language === "en" 
                              ? "There was an error adding this item to the cart. Please try again." 
                              : "Hubo un error al agregar este artículo al carrito. Por favor, inténtelo de nuevo."
                            );
                          }
                        }}
                      >
                        {addedToCart[`acro_${pass.id}`] ? (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            {language === 'en' ? 'Added' : 'Agregado'}
                          </>
                        ) : (
                          language === 'en' ? 'Add to Cart' : 'Agregar al Carrito'
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error fatal en renderizado de MatPass:', error);
    return (
      <div className="flex-1 p-6">
        <div className="p-6 text-center">
          <p className="text-red-600 mb-4">
            {language === "en" 
              ? "An unexpected error occurred while rendering this page. We're sorry for the inconvenience."
              : "Ocurrió un error inesperado al mostrar esta página. Lamentamos las molestias."}
          </p>
          <Button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            {language === "en" ? "Refresh Page" : "Refrescar Página"}
          </Button>
        </div>
      </div>
    );
  }
} 
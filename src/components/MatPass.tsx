'use client'

import { useState } from 'react'
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

// Define custom event for cart interaction
const addToCartEvent = (item: { id: number, name: string, price: number, isPass?: boolean, productType?: string, bundleTypeId?: string }) => {
  // Create and dispatch a custom event that KioskLayout can listen for
  const event = new CustomEvent('add-to-cart', { 
    detail: { ...item, quantity: 1 },
    bubbles: true 
  });
  document.dispatchEvent(event);
};

interface MatPassProps {
  parentTab?: string;
}

const getPackageNumber = (name: string): number => {
  const number = parseInt(name.split(' ')[0] || '1', 10);
  return isNaN(number) ? 1 : number;
};

export default function MatPass({ parentTab = 'matpass' }: MatPassProps) {
  const [addedToCart, setAddedToCart] = useState<{[key: string]: boolean}>({})
  const [animatingCards, setAnimatingCards] = useState<{[key: string]: boolean}>({})
  const { language } = useLanguageContext();
  
  const { data: bundleData, loading: bundleLoading, error: bundleError } = useQuery<GetBundleQuery>(GET_BUNDLE_TYPES, { 
    variables: { contextId: "ec966559-0580-4adb-bc6b-b150c56f935c"} 
  });

  const addToCart = (id: number, name: string, price: number, isPass: boolean = false, isAcro: boolean = false, bundleTypeId?: string) => {
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
    
    if (isPass) {
      // For passes, log the available bundle types to help debug
      console.log('Available Bundle Types:');
      bundleTypes.forEach(bt => {
        console.log(`- ${bt.name} (ID: ${bt.id})`);
      });
      
      // Log the matching bundle type
      const matchingBundleType = bundleTypes.find(bt => 
        isAcro 
          ? (bt.name.includes(`${validId}`) && bt.name.toLowerCase().includes('acro'))
          : (bt.name.includes(`${validId}`) && !bt.name.toLowerCase().includes('acro'))
      );
      console.log('Matching Bundle Type:', matchingBundleType);
    }
    console.log('=============================');
    
    // Trigger the custom event
    addToCartEvent({ id: validId, name, price, isPass, productType, bundleTypeId });
    
    // Show visual feedback that item was added
    setAddedToCart(prev => ({ ...prev, [uniqueId]: true }))
    setAnimatingCards(prev => ({ ...prev, [uniqueId]: true }))
    
    setTimeout(() => {
      setAddedToCart(prev => ({ ...prev, [uniqueId]: false }))
    }, 1500)
    
    setTimeout(() => {
      setAnimatingCards(prev => ({ ...prev, [uniqueId]: false }))
    }, 600)
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

  const bundleTypes = bundleData?.bundleTypes || [];
  const regularPasses = bundleTypes
    .filter(pkg => 
      !pkg.name.toLowerCase().includes('invitado') &&
      !pkg.name.toLowerCase().includes('hotel') &&
      !pkg.name.toLowerCase().includes('co-work') &&
      !pkg.name.toLowerCase().includes('acro')
    )
    .sort((a, b) => a.price - b.price)
    .map(pkg => {
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

  const acroPasses = bundleTypes
    .filter(pkg => 
      !pkg.name.toLowerCase().includes('invitado') &&
      !pkg.name.toLowerCase().includes('hotel') &&
      !pkg.name.toLowerCase().includes('co-work') &&
      pkg.name.toLowerCase().includes('acro')
    )
    .sort((a, b) => a.price - b.price)
    .map(pkg => {
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

  // Products data - reduced number to fit without scrolling
  const products = [
    {
      id: 101,
      name: 'Premium Yoga Mat',
      description: 'Extra-thick, non-slip surface for maximum comfort.',
      price: 120,
      width: 60,
      length: 183,
      thickness: 1.5,
      features: ['Premium non-slip material', 'Extra cushioning'],
      imageUrl: '/images/default.jpg'
    },
    {
      id: 102,
      name: 'Cork Yoga Block Set',
      description: 'Sustainable cork blocks to support your practice.',
      price: 85,
      width: 60,
      length: 183,
      thickness: 1.5,
      features: ['Eco-friendly cork', 'Set of 2 blocks'],
      imageUrl: '/images/default.jpg'
    },
    {
      id: 103,
      name: 'Meditation Cushion',
      description: 'Ergonomic design with organic cotton cover.',
      price: 95,
      width: 60,
      length: 183,
      thickness: 1.5,
    features: ['Organic cotton cover', 'Buckwheat filling'],
      imageUrl: '/images/default.jpg'
    }
  ];

  // Kombucha data - SCOBY brand with 5 flavors (limited to 3 for no scrolling)
  const kombuchaProducts = [
    {
      id: 201,
      name: 'SCOBY Ginger Lemon',
      description: 'Zesty ginger and lemon kombucha with a spicy kick.',
      price: 22,
      features: ['16 oz bottle', 'Probiotic-rich'],
      width: 60,
      length: 183,
      thickness: 1.5,
      imageUrl: '/images/default.jpg'
    },
    {
      id: 202,
      name: 'SCOBY Berry Blast',
      description: 'Mixed berry kombucha with hints of blackberry and raspberry.',
      price: 22,
      features: ['16 oz bottle', 'Low sugar'],
      width: 60,
      length: 183,
      thickness: 1.5,
      imageUrl: '/images/default.jpg'
    },
    {
      id: 203,
      name: 'SCOBY Tropical Passion',
      description: 'Exotic passion fruit and pineapple kombucha blend.',
      price: 22,
      features: ['16 oz bottle', 'All natural ingredients'],
      width: 60,
      length: 183,
      thickness: 1.5,
      imageUrl: '/images/default.jpg'
    }
  ];

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
                        const selectedBundleTypeId = bundleTypes.find(bt => bt.name.includes(`${pass.classes} `) && !bt.name.toLowerCase().includes('acro'))?.id;
                        console.log(`Clicking "Agregar al carrito" for Regular MatPass ${pass.classes} classes`);
                        console.log(`Selected bundleTypeId: ${selectedBundleTypeId || 'undefined'}`);
                        console.log(`Matching bundle type:`, bundleTypes.find(bt => bt.name.includes(`${pass.classes} `) && !bt.name.toLowerCase().includes('acro')));
                        
                        addToCart(
                          pass.id, 
                          `${language === "en" ? "Regular Yoga" : "Yoga Regular"} - ${pass.classes} ${language === "en" ? "Classes" : "Clases"}`, 
                          pass.price, 
                          true, 
                          false,
                          selectedBundleTypeId
                        );
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
                        const selectedBundleTypeId = bundleTypes.find(bt => bt.name.includes(`${pass.classes} `) && bt.name.toLowerCase().includes('acro'))?.id;
                        console.log(`Clicking "Agregar al carrito" for Acro MatPass ${pass.classes} classes ${pass.isDouble ? "(Double Pack)" : ""}`);
                        console.log(`Selected bundleTypeId: ${selectedBundleTypeId || 'undefined'}`);
                        console.log(`Matching bundle type:`, bundleTypes.find(bt => bt.name.includes(`${pass.classes} `) && bt.name.toLowerCase().includes('acro')));
                        
                        addToCart(
                          pass.id, 
                          `Acro Yoga - ${pass.classes} ${language === "en" ? "Classes" : "Clases"} ${pass.isDouble ? (language === "en" ? "(Double Pack)" : "(Paquete Doble)") : ""}`, 
                          pass.price, 
                          true,
                          true,
                          selectedBundleTypeId
                        );
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
        
        {/* Products Section */}
        <div className={`${parentTab === 'products' ? '' : 'hidden'}`}>
          <div className="w-full">
            <div id="products" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              {products.map(product => (
                <div 
                  key={product.id} 
                  className={`bg-white border rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden ${animatingCards[`product_${product.id}`] ? 'animate-pulse' : ''}`}
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-xl font-bold text-gray-800">{product.name}</div>
                    </div>
                    
                    <div className="flex items-end gap-1 mb-4">
                      <div className="text-2xl font-bold text-gray-800">S/ {product.price.toFixed(2)}</div>
                    </div>
                    
                    <div className="text-sm text-gray-600 mb-6">
                      {product.description}
                    </div>
                    
                    <div className="space-y-2 mb-6">
                      {product.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center text-sm">
                          <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                          <span className="text-gray-600">{feature}</span>
                        </div>
                      ))}
                    </div>
                    
                    <Button 
                      className={`w-full font-semibold py-2.5 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${addedToCart[`product_${product.id}`] ? 'bg-green-600 hover:bg-green-700' : 'bg-sky-500 hover:bg-sky-600'} text-white`}
                      onClick={() => {
                        const productBundleTypeId = 'ec966559-0580-4adb-bc6b-b150c56f935c'; // Default product bundle type ID
                        console.log(`Clicking "Agregar al carrito" for Product: ${product.name}`);
                        console.log(`Using default product bundleTypeId: ${productBundleTypeId}`);
                        
                        addToCart(
                          product.id, 
                          product.name, 
                          product.price, 
                          false, 
                          false,
                          productBundleTypeId
                        );
                      }}
                    >
                      {addedToCart[`product_${product.id}`] ? (
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
        
        {/* Kombucha Section */}
        <div className={`${parentTab === 'kombucha' ? '' : 'hidden'}`}>
          <div className="w-full">
            <div id="kombucha" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              {kombuchaProducts.map(product => (
                <div 
                  key={product.id} 
                  className={`bg-white border rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden ${animatingCards[`product_${product.id}`] ? 'animate-pulse' : ''}`}
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-xl font-bold text-gray-800">{product.name}</div>
                    </div>
                    
                    <div className="flex items-end gap-1 mb-4">
                      <div className="text-2xl font-bold text-gray-800">S/ {product.price.toFixed(2)}</div>
                    </div>
                    
                    <div className="text-sm text-gray-600 mb-6">
                      {product.description}
                    </div>
                    
                    <div className="space-y-2 mb-6">
                      {product.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center text-sm">
                          <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                          <span className="text-gray-600">{feature}</span>
                        </div>
                      ))}
                    </div>
                    
                    <Button 
                      className={`w-full font-semibold py-2.5 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${addedToCart[`product_${product.id}`] ? 'bg-green-600 hover:bg-green-700' : 'bg-sky-500 hover:bg-sky-600'} text-white`}
                      onClick={() => {
                        const productBundleTypeId = 'ec966559-0580-4adb-bc6b-b150c56f935c'; // Default product bundle type ID
                        console.log(`Clicking "Agregar al carrito" for Product: ${product.name}`);
                        console.log(`Using default product bundleTypeId: ${productBundleTypeId}`);
                        
                        addToCart(
                          product.id, 
                          product.name, 
                          product.price, 
                          false, 
                          false,
                          productBundleTypeId
                        );
                      }}
                    >
                      {addedToCart[`product_${product.id}`] ? (
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
} 
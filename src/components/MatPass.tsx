'use client'

import { useState } from 'react'
import styles from './MatPass.module.css'
import Image from 'next/image';
import { AddToCartButton } from './AddToCartButton';
import { useQuery } from "@apollo/client";
import { GET_BUNDLE_TYPES } from "@/lib/graphql/queries";
import { Spinner } from "@/components/spinner";
import { GetBundleQuery } from "@/types/graphql";
import { useLanguageContext } from "@/contexts/LanguageContext";

// Define custom event for cart interaction
const addToCartEvent = (item: { id: number, name: string, price: number, isPass?: boolean }) => {
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
  const [addedToCart, setAddedToCart] = useState<{[key: number]: boolean}>({})
  const [animatingCards, setAnimatingCards] = useState<{[key: number]: boolean}>({})
  const { language } = useLanguageContext();
  
  const { data: bundleData, loading: bundleLoading, error: bundleError } = useQuery<GetBundleQuery>(GET_BUNDLE_TYPES, { 
    variables: { contextId: "ec966559-0580-4adb-bc6b-b150c56f935c"} 
  });

  const addToCart = (id: number, name: string, price: number, isPass: boolean = false) => {
    // Trigger the custom event
    addToCartEvent({ id, name, price, isPass });
    
    // Show visual feedback that item was added
    setAddedToCart(prev => ({ ...prev, [id]: true }))
    setAnimatingCards(prev => ({ ...prev, [id]: true }))
    
    setTimeout(() => {
      setAddedToCart(prev => ({ ...prev, [id]: false }))
    }, 1500)
    
    setTimeout(() => {
      setAnimatingCards(prev => ({ ...prev, [id]: false }))
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
      return {
        id: parseInt(pkg.id),
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
      return {
        id: parseInt(pkg.id),
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
    <div className={styles.container}>
      {/* Content based on parent tab selection */}
      <div className={styles.contentArea}>
        {/* MatPass Section */}
        <div className={`${parentTab === 'matpass' ? '' : styles.hidden}`}>
          <div className={styles.compactLayout}>
            <div id="regular-passes" className={styles.compactPricingGrid}>
              {regularPasses.map(pass => (
                <div 
                  key={pass.id} 
                  className={`${styles.pricingCard} ${animatingCards[pass.id] ? styles.addToCartAnimation : ''}`}
                >
                  <div className={styles.numberSection}>
                    <div className={styles.number}>{pass.classes}</div>
                    <div className={styles.passText}>MatPass</div>
                  </div>
                  <div className={styles.priceSection}>
                    <div className={styles.price}>S/ {pass.price.toFixed(2)}</div>
                    <div className={styles.pricePerClass}>
                      S/ {pass.perClass.toFixed(2)} {language === "en" ? "per class" : "por clase"}
                    </div>
                  </div>
                  <div className={styles.actionSection}>
                    <AddToCartButton 
                      isAdded={addedToCart[pass.id]}
                      onClick={() => addToCart(pass.id, `${language === "en" ? "Regular" : "Regular"} ${pass.classes} ${language === "en" ? "Class Pack" : "Pase de Clases"}`, pass.price, true)}
                      buttonText={language === "en" ? "Buy Now" : "Comprar Ahora"}
                    />
                  </div>
                  <div className={styles.featureSection}>
                    {pass.features.map((feature, idx) => (
                      <div key={idx} className={styles.featureItem}>
                        <span className={styles.checkIcon}>✓</span>
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Acro MatPass Section */}
        <div className={`${parentTab === 'acromatpass' ? '' : styles.hidden}`}>
          <div className={styles.compactLayout}>
            <div id="acro-passes" className={styles.compactPricingGrid}>
              {acroPasses.map(pass => (
                <div 
                  key={pass.id} 
                  className={`${styles.pricingCard} ${animatingCards[pass.id] ? styles.addToCartAnimation : ''}`}
                >
                  <div className={styles.numberSection}>
                    <div className={styles.number}>{pass.classes}</div>
                    <div className={styles.passText}>{pass.isDouble ? (language === "en" ? 'Double Pass' : 'Pase Doble') : 'MatPass'}</div>
                  </div>
                  <div className={styles.priceSection}>
                    <div className={styles.price}>S/ {pass.price.toFixed(2)}</div>
                    <div className={styles.pricePerClass}>
                      S/ {pass.perClass.toFixed(2)} {pass.isDouble ? (language === "en" ? 'each person' : 'por persona') : (language === "en" ? 'per class' : 'por clase')}
                    </div>
                  </div>
                  <div className={styles.actionSection}>
                    <AddToCartButton 
                      isAdded={addedToCart[pass.id]}
                      onClick={() => addToCart(
                        pass.id, 
                        `Acro ${pass.classes} ${language === "en" ? "Class" : "Clase"} ${pass.isDouble ? (language === "en" ? "Double Pack" : "Paquete Doble") : (language === "en" ? "Pack" : "Paquete")}`, 
                        pass.price, 
                        true
                      )}
                      buttonText={language === "en" ? "Buy Now" : "Comprar Ahora"}
                    />
                  </div>
                  <div className={styles.featureSection}>
                    {pass.features.map((feature, idx) => (
                      <div key={idx} className={styles.featureItem}>
                        <span className={styles.checkIcon}>✓</span>
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Products Section */}
        <div className={`${parentTab === 'products' ? '' : styles.hidden}`}>
          <div className={styles.compactLayout}>
            <div id="products" className={styles.productGrid}>
              {products.map(product => (
                <div 
                  key={product.id} 
                  className={`${styles.pricingCard} ${animatingCards[product.id] ? styles.addToCartAnimation : ''}`}
                >
                  <div className={styles.numberSection}>
                    <Image 
                      width={product.width}
                      height={product.length}
                      src={product.imageUrl} 
                      alt={product.name} 
                      className={styles.productImage}
                    />
                  </div>
                  <div className={styles.priceSection}>
                    <div className={styles.number} style={{fontSize: '20px'}}>{product.name}</div>
                    <div className={styles.price}>S/ {product.price.toFixed(2)}</div>
                  </div>
                  <div className={styles.actionSection}>
                    <AddToCartButton 
                      isAdded={addedToCart[product.id]}
                      onClick={() => addToCart(product.id, product.name, product.price)}
                    />
                  </div>
                  <div className={styles.featureSection}>
                    {product.features.map((feature, idx) => (
                      <div key={idx} className={styles.featureItem}>
                        <span className={styles.checkIcon}>✓</span>
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Kombucha Section */}
        <div className={`${parentTab === 'kombucha' ? '' : styles.hidden}`}>
          <div className={styles.compactLayout}>
            <div id="kombucha" className={styles.productGrid}>
              {kombuchaProducts.map(product => (
                <div 
                  key={product.id} 
                  className={`${styles.pricingCard} ${animatingCards[product.id] ? styles.addToCartAnimation : ''}`}
                >
                  <div className={styles.numberSection}>
                    <Image 
                      width={product.width}
                      height={product.length}
                      src={product.imageUrl} 
                      alt={product.name} 
                      className={styles.productImage}
                    />
                  </div>
                  <div className={styles.priceSection}>
                    <div className={styles.number} style={{fontSize: '20px'}}>{product.name}</div>
                    <div className={styles.price}>S/ {product.price.toFixed(2)}</div>
                  </div>
                  <div className={styles.actionSection}>
                    <AddToCartButton 
                      isAdded={addedToCart[product.id]}
                      onClick={() => addToCart(product.id, product.name, product.price)}
                    />
                  </div>
                  <div className={styles.featureSection}>
                    {product.features.map((feature, idx) => (
                      <div key={idx} className={styles.featureItem}>
                        <span className={styles.checkIcon}>✓</span>
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 
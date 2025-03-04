'use client'

import React, { useState, useEffect } from 'react'
import { Trash2, Tag, X, CheckCircle, AlertCircle, CreditCard, DollarSign, Plus, Minus, Bitcoin, QrCode, Loader2 } from 'lucide-react'
import styles from './KioskLayout.module.css'
import { Header } from './header';
import { Button } from './ui/button';
import { useLanguageContext } from '@/contexts/LanguageContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery } from '@apollo/client';
import { CREATE_BUNDLE, BundleStatus, GET_CONSUMER } from '@/lib/graphql/queries';
import { Progress } from './ui/progress';

interface KioskLayoutProps {
  children: React.ReactNode;
}

interface ChildProps {
  parentTab: string;
}

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  isPass?: boolean;
  productType?: string;
  bundleTypeId?: string;
}

export default function KioskLayout({ children }: KioskLayoutProps) {
  const [activeTab, setActiveTab] = useState('matpass');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState('');
  const [discount, setDiscount] = useState(0);
  const [couponMessage, setCouponMessage] = useState('');
  const [couponStatus, setCouponStatus] = useState<'none' | 'success' | 'error'>('none');
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [creationProgress, setCreationProgress] = useState(0);
  const [currentBundleIndex, setCurrentBundleIndex] = useState(0);
  const [createdBundles, setCreatedBundles] = useState<Array<{id: string, name: string, price: number, quantity: number}>>([]);
  const { language } = useLanguageContext();
  const router = useRouter();
  const searchParams = useSearchParams();
  const consumerId = searchParams.get('consumerId');

  // GraphQL mutation for creating bundles
  const [createBundle, { loading: creatingBundle }] = useMutation(CREATE_BUNDLE);

  const { refetch: refetchConsumer } = useQuery(GET_CONSUMER, {
    variables: { id: consumerId },
    skip: !consumerId,
  });

  // Effect to update UI when bundle creation status changes
  useEffect(() => {
    if (isProcessing && creatingBundle) {
      // This will help ensure the UI reflects the loading state
      console.log('Bundle creation in progress...');
    }
  }, [creatingBundle, isProcessing]);

  // Load cart from localStorage on initial load
  useEffect(() => {
    const savedCart = localStorage.getItem('matpassCart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error('Failed to parse cart from localStorage:', e);
      }
    }
  }, []);

  // Listen for add-to-cart events
  useEffect(() => {
    const handleAddToCart = (e: Event) => {
      const customEvent = e as CustomEvent<{ id: number, name: string, price: number, quantity: number, isPass?: boolean, productType?: string, bundleTypeId?: string }>;
      const newItem = customEvent.detail;
      
      // Enhanced debug logging
      console.log('=== ADD TO CART EVENT RECEIVED ===');
      console.log('Item:', newItem);
      console.log('Item ID:', newItem.id);
      console.log('Item Name:', newItem.name);
      console.log('Is Pass:', newItem.isPass ? 'Yes' : 'No');
      console.log('Product Type:', newItem.productType || 'Not specified');
      console.log('Bundle Type ID:', newItem.bundleTypeId || 'undefined');
      console.log('================================');
      
      setCart(prevCart => {
        const existingItem = prevCart.find(item => 
          item.id === newItem.id && item.productType === newItem.productType
        );
        
        let updatedCart;
        if (existingItem) {
          updatedCart = prevCart.map(item => 
            (item.id === newItem.id && item.productType === newItem.productType) 
              ? { ...item, quantity: item.quantity + 1 } 
              : item
          );
        } else {
          updatedCart = [...prevCart, { ...newItem, quantity: 1 }];
        }
        
        // Save updated cart to localStorage
        localStorage.setItem('matpassCart', JSON.stringify(updatedCart));
        return updatedCart;
      });
    };
    
    document.addEventListener('add-to-cart', handleAddToCart);
    
    return () => {
      document.removeEventListener('add-to-cart', handleAddToCart);
    };
  }, []);

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  // Treating prices as tax-inclusive - disaggregating the IGV
  const preTax = subtotal / 1.18; // Pre-tax amount
  const tax = subtotal - preTax; // 18% tax amount
  const total = subtotal - discount; // Total is now subtotal minus any discount applied

  const decreaseQuantity = (id: number, productType?: string) => {
    setCart(prevCart => {
      const updatedCart = prevCart.map(item =>
        item.id === id && item.productType === productType && item.quantity > 1
          ? { ...item, quantity: item.quantity - 1 }
          : item
      );
      localStorage.setItem('matpassCart', JSON.stringify(updatedCart));
      return updatedCart;
    });
  };

  const increaseQuantity = (id: number, productType?: string) => {
    setCart(prevCart => {
      const updatedCart = prevCart.map(item =>
        item.id === id && item.productType === productType
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
      localStorage.setItem('matpassCart', JSON.stringify(updatedCart));
      return updatedCart;
    });
  };

  const removeItem = (id: number, productType?: string) => {
    setCart(prevCart => {
      const updatedCart = prevCart.filter(item => 
        !(item.id === id && item.productType === productType)
      );
      localStorage.setItem('matpassCart', JSON.stringify(updatedCart));
      return updatedCart;
    });
  };

  const handleCouponApply = () => {
    // Simple coupon validation
    if (couponCode.trim() === '') {
      setCouponMessage('Por favor ingrese un código de cupón');
      setCouponStatus('error');
      return;
    }
    
    // Check valid coupons
    if (couponCode.toUpperCase() === 'YOGA10') {
      // 10% discount
      const discountAmount = subtotal * 0.1;
      setDiscount(discountAmount);
      setAppliedCoupon('YOGA10');
      setCouponMessage('¡10% de descuento aplicado!');
      setCouponStatus('success');
      setShowCouponModal(false); // Close modal on successful application
    } else if (couponCode.toUpperCase() === 'WELCOME20') {
      // 20% discount
      const discountAmount = subtotal * 0.2;
      setDiscount(discountAmount);
      setAppliedCoupon('WELCOME20');
      setCouponMessage('¡20% de descuento aplicado!');
      setCouponStatus('success');
      setShowCouponModal(false); // Close modal on successful application
    } else {
      setCouponMessage('Código de cupón inválido');
      setCouponStatus('error');
      setDiscount(0);
      setAppliedCoupon('');
    }
  };

  const removeCoupon = () => {
    setCouponCode('');
    setAppliedCoupon('');
    setDiscount(0);
    setCouponMessage('');
    setCouponStatus('none');
  };

  const openCouponModal = () => {
    setShowCouponModal(true);
  };

  const closeCouponModal = () => {
    setShowCouponModal(false);
    setCouponStatus('none');
    setCouponMessage('');
  };

  const openPaymentModal = () => {
    setShowPaymentModal(true);
  };

  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setSelectedPayment(null);
  };

  const selectPaymentMethod = (method: string) => {
    setSelectedPayment(method);
  };

  const proceedToCheckout = () => {
    // Open payment modal instead of redirecting
    openPaymentModal();
  };

  const getPaymentMethodText = () => {
    switch (selectedPayment) {
      case 'card':
        return language === 'en' ? 'Credit/Debit Card' : 'Tarjeta de Crédito/Débito';
      case 'cash':
        return language === 'en' ? 'Cash' : 'Efectivo';
      case 'qr':
        return language === 'en' ? 'QR Plin/Yape' : 'QR Plin/Yape';
      case 'crypto':
        return language === 'en' ? 'Cryptocurrency' : 'Criptomoneda';
      default:
        return '';
    }
  };

  const processPayment = async () => {
    if (!consumerId) {
      setProcessingError(language === 'en' ? 'Consumer ID is required' : 'Se requiere ID del consumidor');
      return;
    }

    if (!selectedPayment) {
      setProcessingError(language === 'en' ? 'Please select a payment method' : 'Por favor seleccione un método de pago');
      return;
    }

    try {
      setIsProcessing(true);
      setProcessingError(null);
      setCreationProgress(0);
      setCurrentBundleIndex(0);
      setCreatedBundles([]);
      
      // Create bundles for each item in the cart
      const bundlesToCreate = [...cart];
      const totalBundles = bundlesToCreate.length;
      
      console.log('=== PROCESSING PAYMENT ===');
      console.log('Total bundles to create:', totalBundles);
      console.log('Cart items:', bundlesToCreate);
      console.log('========================');
      
      for (let i = 0; i < bundlesToCreate.length; i++) {
        const item = bundlesToCreate[i];
        setCurrentBundleIndex(i);
        
        // Use the bundleTypeId from the item
        const bundleTypeId = item.bundleTypeId;
        
        console.log(`=== CREATING BUNDLE ${i+1}/${totalBundles} ===`);
        console.log('Item:', item);
        console.log('Item Name:', item.name);
        console.log('Item ID:', item.id);
        console.log('Product Type:', item.productType || 'Not specified');
        console.log('Bundle Type ID:', bundleTypeId || 'undefined');
        
        const validFrom = new Date();
        const validTo = new Date();
        validTo.setDate(validFrom.getDate() + 30); // 30 days validity
        
        const note = `${language === 'en' ? 'Payment Method' : 'Método de pago'}: ${getPaymentMethodText()}`;
        
        // Ensure we have a valid bundleTypeId
        if (!bundleTypeId) {
          console.error('No valid bundleTypeId found for item:', item);
          throw new Error(language === 'en' 
            ? 'Could not determine bundle type ID. Please try again.' 
            : 'No se pudo determinar el ID del tipo de paquete. Por favor intente de nuevo.');
        }
        
        console.log('Creating bundle with parameters:');
        console.log('- consumerId:', consumerId);
        console.log('- bundleTypeId:', bundleTypeId);
        console.log('- validFrom:', validFrom.toISOString());
        console.log('- validTo:', validTo.toISOString());
        console.log('- note:', note);
        console.log('==============================');
        
        const { data: newBundleData } = await createBundle({
          variables: {
            input: {
              consumerId,
              status: BundleStatus.ACTIVE,
              bundleTypeId,
              validFrom: validFrom.toISOString(),
              validTo: validTo.toISOString(),
              note,
            },
          },
        });
        
        if (!newBundleData?.createBundle?.id) {
          throw new Error(
            language === 'en'
              ? 'Failed to create bundle. Please try again.'
              : 'Error al crear el paquete. Por favor intente de nuevo.'
          );
        }
        
        setCreatedBundles(prev => [
          ...prev, 
          {
            id: newBundleData.createBundle.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity
          }
        ]);
        
        // Update progress
        setCreationProgress(Math.round(((i + 1) / totalBundles) * 100));
      }
      
      // Clear the cart after successful purchase
      setCart([]);
      localStorage.removeItem('matpassCart');
      
      // Check if checkin or reservation is true
      const checkin = searchParams.get('checkin');
      const reservation = searchParams.get('reservation');

      if (checkin === 'true' || reservation === 'true') {
        // Refetch consumer data to get updated bundles
        await refetchConsumer();
        
        // Navigate to schedule with required params
        const scheduleParams = new URLSearchParams({
          consumerId: consumerId.toString(),
          bundleId: createdBundles[0].id // Use first bundle ID
        });
        if (checkin === 'true') scheduleParams.append('checkin', 'true');
        if (reservation === 'true') scheduleParams.append('reservation', 'true');
        router.push(`/schedule?${scheduleParams.toString()}`);
      } else {
        // Prepare URL parameters for confirmation page
        const params = new URLSearchParams({
          consumerId: consumerId.toString(),
          paymentMethod: selectedPayment,
          total: total.toString(),
          bundleCount: createdBundles.length.toString(),
        });
        
        // Add bundle IDs to params
        createdBundles.forEach((bundle, index) => {
          params.append(`bundleId${index}`, bundle.id);
          params.append(`bundleName${index}`, bundle.name);
          params.append(`bundlePrice${index}`, bundle.price.toString());
          params.append(`bundleQuantity${index}`, bundle.quantity.toString());
        });
        
        // Add coupon info if applied
        if (appliedCoupon) {
          params.append('coupon', appliedCoupon);
          params.append('discount', discount.toString());
        }
        
        // Navigate to confirmation page
        router.push(`/confirmation?${params.toString()}`);
      }
      
    } catch (error) {
      console.error('Payment processing error:', error);
      setProcessingError(
        language === 'en'
          ? 'Failed to process payment. Please try again.'
          : 'Error al procesar el pago. Por favor intente de nuevo.'
      );
      setIsProcessing(false);
      setCreationProgress(0);
    }
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <Header title={{ en: "Buy Packages", es: "Comprar Paquetes" }} />

      {/* Tab Navigation with Three Tabs */}
      <div className={`${styles.tabsContainer} mt-16`}>
        <div className={styles.tabs}>
          <div 
            className={`${styles.tab} ${activeTab === 'matpass' ? styles.active : styles.inactive}`} 
            onClick={() => setActiveTab('matpass')}
          >
            MatPass
          </div>
          <div 
            className={`${styles.tab} ${activeTab === 'acromatpass' ? styles.active : styles.inactive}`} 
            onClick={() => setActiveTab('acromatpass')}
          >
            Acro MatPass
          </div>
          {/* Commented out products and kombucha tabs
          <div 
            className={`${styles.tab} ${activeTab === 'products' ? styles.active : styles.inactive}`} 
            onClick={() => setActiveTab('products')}
          >
            Products
          </div>
          <div 
            className={`${styles.tab} ${activeTab === 'kombucha' ? styles.active : styles.inactive}`} 
            onClick={() => setActiveTab('kombucha')}
          >
            Kombucha
          </div>
          */}
        </div>
      </div>

      {/* Main Content Area */}
      <div className={styles.mainContent}>
        {/* Left Panel - Content based on active tab */}
        <div className={styles.leftPanel}>
          {/* Pass the activeTab to the children component */}
          {React.isValidElement(children) ? 
            React.cloneElement(children as React.ReactElement<ChildProps>, { parentTab: activeTab }) : 
            children
          }
        </div>

        {/* Right Panel - Cart */}
        <div className={styles.rightPanel}>
          <div className={styles.cartHeader}>
            <div className={styles.cartTitle}>Carrito de Compra</div>
            <div className={styles.cartItemCount}>{totalItems} items</div>
            <div className={styles.closeCartMobile} onClick={() => document.querySelector(`.${styles.rightPanel}`)?.classList.remove(styles.showMobileCart)}>
              ×
            </div>
          </div>

          <div className={styles.cartList}>
            {
              cart.map(item => {
                // Asegurarse de que el ID sea un número válido
                const validId = isNaN(item.id) ? 
                  (item.productType === 'acro' ? 9999 : 
                   item.productType === 'regular' ? 7999 : 5999) 
                  : item.id;
                
                return (
                  <div 
                    key={`${validId}_${item.productType || 'default'}`} 
                    className={styles.cartItem}
                  >
                    <div className={styles.cartItemInfo}>
                      <div className={styles.cartItemName}>
                        {item.name}
                        {item.isPass && <span className={styles.passLabel}>Pase</span>}
                      </div>
                      <div className={styles.cartItemPrice}>
                        S/ {(item.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                    <div className={styles.cartItemControls}>
                      <div className={styles.quantityControls}>
                        <button 
                          className={styles.quantityButton}
                          onClick={() => decreaseQuantity(validId, item.productType)}
                        >
                          <Minus size={12} />
                        </button>
                        <span className={styles.quantityDisplay}>{item.quantity}</span>
                        <button 
                          className={styles.quantityButton}
                          onClick={() => increaseQuantity(validId, item.productType)}
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                      <button
                        className={styles.removeButton}
                        onClick={() => removeItem(validId, item.productType)}
                      >
                        <Trash2 size={18} color="#e53935" />
                      </button>
                    </div>
                  </div>
                );
              })
            }
          </div>

          {cart.length > 0 && (
            <>
              <div className={styles.couponSection}>
                {!appliedCoupon ? (
                  <button 
                    className={styles.couponButton}
                    onClick={openCouponModal}
                  >
                    <Tag size={18} className={styles.couponIcon} />
                    <span>Aplicar código de cupón</span>
                  </button>
                ) : (
                  <div className={styles.appliedCoupon}>
                    <div className={styles.appliedCouponInfo}>
                      <span className={styles.couponCode}>{appliedCoupon}</span>
                      <span className={styles.discountAmount}>
                        <CheckCircle size={14} style={{ marginRight: '6px' }} />
                        Descuento: S/ {discount.toFixed(2)}
                      </span>
                    </div>
                    <button
                      className={styles.removeCouponButton}
                      onClick={removeCoupon}
                      aria-label="Quitar cupón"
                    >
                      <X size={18} />
                    </button>
                  </div>
                )}
                {couponMessage && !showCouponModal && (
                  <div className={`${styles.couponMessage} ${styles[couponStatus]}`}>
                    {couponStatus === 'success' ? (
                      <CheckCircle size={16} style={{ marginRight: '8px' }} />
                    ) : couponStatus === 'error' ? (
                      <AlertCircle size={16} style={{ marginRight: '8px' }} />
                    ) : null}
                    {couponMessage}
                  </div>
                )}
              </div>
              
              <div className={styles.cartSummary}>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>Subtotal (sin IGV)</span>
                  <span className={styles.summaryValue}>S/ {preTax.toFixed(2)}</span>
                </div>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>IGV (18%)</span>
                  <span className={styles.summaryValue}>S/ {tax.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className={`${styles.summaryRow} ${styles.discountRow}`}>
                    <span className={styles.summaryLabel}>Descuento</span>
                    <span className={styles.summaryValue}>- S/ {discount.toFixed(2)}</span>
                  </div>
                )}
                <div className={styles.totalRow}>
                  <span>Total</span>
                  <span className={styles.totalAmount}>S/ {total.toFixed(2)}</span>
                </div>
              </div>
            </>
          )}
          
          <div className={styles.checkoutButtonContainer}>
            <Button 
              className={`${styles.checkoutButton} w-full py-3 text-lg font-semibold rounded-xl shadow-sm ${cart.length > 0 ? 'bg-gradient-to-r from-green-600 to-teal-600 text-white hover:from-green-700 hover:to-teal-700 transition-all duration-300' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
              onClick={proceedToCheckout}
              disabled={cart.length === 0}
            >
              {language === "en" ? "Proceed to Payment" : "Proceder al Pago"}
            </Button>
          </div>
        </div>
      </div>

      {/* Coupon Modal */}
      {showCouponModal && (
        <div className={styles.modalOverlay} onClick={closeCouponModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Ingrese código de cupón</h3>
              <button className={styles.closeModalBtn} onClick={closeCouponModal}>
                <X size={22} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.couponField}>
                <div className={styles.couponInput}>
                  <Tag size={18} className={styles.couponIcon} />
                  <input 
                    type="text" 
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Ingrese código de cupón"
                    className={styles.couponCodeInput}
                    autoFocus
                  />
                </div>
              </div>
              {couponMessage && (
                <div className={`${styles.couponMessage} ${styles[couponStatus]}`}>
                  {couponStatus === 'success' ? (
                    <CheckCircle size={16} style={{ marginRight: '8px' }} />
                  ) : couponStatus === 'error' ? (
                    <AlertCircle size={16} style={{ marginRight: '8px' }} />
                  ) : null}
                  {couponMessage}
                </div>
              )}
              <div className={styles.modalFooter}>
                <button 
                  className={styles.cancelButton}
                  onClick={closeCouponModal}
                >
                  Cancelar
                </button>
                <button 
                  className={styles.applyButton}
                  onClick={handleCouponApply}
                  disabled={!couponCode.trim()}
                >
                  Aplicar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Method Modal */}
      {showPaymentModal && (
        <div className={styles.modalOverlay} onClick={closePaymentModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Seleccione método de pago</h3>
              <button className={styles.closeModalBtn} onClick={closePaymentModal}>
                <X size={22} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.paymentOptions}>
                <div 
                  className={`${styles.paymentOption} ${selectedPayment === 'card' ? styles.selected : ''}`}
                  onClick={() => selectPaymentMethod('card')}
                >
                  <CreditCard size={28} />
                  <span>Tarjeta de Crédito/Débito</span>
                </div>
                <div 
                  className={`${styles.paymentOption} ${selectedPayment === 'cash' ? styles.selected : ''}`}
                  onClick={() => selectPaymentMethod('cash')}
                >
                  <DollarSign size={28} />
                  <span>Efectivo</span>
                </div>
                <div 
                  className={`${styles.paymentOption} ${selectedPayment === 'qr' ? styles.selected : ''}`}
                  onClick={() => selectPaymentMethod('qr')}
                >
                  <QrCode size={28} />
                  <span>QR Plin/Yape</span>
                </div>
                <div 
                  className={`${styles.paymentOption} ${selectedPayment === 'crypto' ? styles.selected : ''}`}
                  onClick={() => selectPaymentMethod('crypto')}
                >
                  <Bitcoin size={28} />
                  <span>Crypto</span>
                </div>
              </div>
              
              {isProcessing && (
                <div className="mt-6 space-y-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      {language === 'en' 
                        ? `Creating bundle ${currentBundleIndex + 1} of ${cart.length}` 
                        : `Creando paquete ${currentBundleIndex + 1} de ${cart.length}`}
                    </span>
                    <span className="text-sm font-medium text-gray-700">{creationProgress}%</span>
                  </div>
                  <Progress value={creationProgress} className="h-2" />
                  
                  <div className="mt-4 space-y-2">
                    {cart.map((item, idx) => (
                      <div 
                        key={`${item.id}_${item.productType || 'default'}`}
                        className={`flex items-center p-2 rounded-lg ${
                          idx < currentBundleIndex 
                            ? 'bg-green-50 border border-green-100' 
                            : idx === currentBundleIndex 
                              ? 'bg-blue-50 border border-blue-100' 
                              : 'bg-gray-50 border border-gray-100'
                        }`}
                      >
                        <div className="mr-3">
                          {idx < currentBundleIndex ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : idx === currentBundleIndex ? (
                            <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                          ) : (
                            <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${
                            idx < currentBundleIndex 
                              ? 'text-green-800' 
                              : idx === currentBundleIndex 
                                ? 'text-blue-800' 
                                : 'text-gray-800'
                          }`}>
                            {item.name}
                          </p>
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          S/ {item.price.toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <p className="text-sm text-center text-gray-500 mt-4">
                    {language === 'en' 
                      ? 'Please wait while we process your purchase...' 
                      : 'Por favor espere mientras procesamos su compra...'}
                  </p>
                </div>
              )}
              
              {processingError && (
                <div className={`${styles.couponMessage} ${styles.error} mt-4`}>
                  <AlertCircle size={16} style={{ marginRight: '8px' }} />
                  {processingError}
                </div>
              )}
              
              <div className={styles.modalFooter}>
                <button 
                  className={styles.payNowButton}
                  onClick={processPayment}
                  disabled={!selectedPayment || isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 size={16} className="mr-2 animate-spin" />
                      {language === 'en' ? 'Processing...' : 'Procesando...'}
                    </>
                  ) : !selectedPayment ? (
                    language === 'en' ? 'Select a method' : 'Seleccione un método'
                  ) : (
                    language === 'en' ? 'Pay Now' : 'Pagar Ahora'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
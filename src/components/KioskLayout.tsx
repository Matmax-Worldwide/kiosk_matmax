'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Trash2, Tag, X, CheckCircle, AlertCircle, CreditCard, DollarSign, Plus, Minus, Bitcoin, QrCode, Loader2 } from 'lucide-react'
// import styles from './KioskLayout.module.css'
import { Header } from './header';
import { Button } from './ui/button';
import { useLanguageContext } from '@/contexts/LanguageContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation } from '@apollo/client';
import { CREATE_BUNDLE, BundleStatus } from '@/lib/graphql/queries';
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
  const [createdBundles, setCreatedBundles] = useState<Array<{id: string, name: string, price: number, quantity: number}>>([]);
  const { language } = useLanguageContext();
  const router = useRouter();
  const searchParams = useSearchParams();
  const consumerId = searchParams.get('consumerId');

  // Referencia para el panel del carrito en móvil
  const rightPanelRef = useRef<HTMLDivElement>(null);

  // GraphQL mutation for creating bundles
  const [createBundle] = useMutation(CREATE_BUNDLE);

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
      setCreatedBundles([]);
      
      // Create bundles for each item in the cart
      const bundlesToCreate = [...cart];
      const totalBundles = bundlesToCreate.length;
      
      console.log('=== PROCESSING PAYMENT ===');
      console.log('Total bundles to create:', totalBundles);
      console.log('Cart items:', bundlesToCreate);
      console.log('========================');
      
      const createdBundleResults = [];
      
      for (let i = 0; i < bundlesToCreate.length; i++) {
        const item = bundlesToCreate[i];
        
        console.log(`=== CREATING BUNDLE ${i+1}/${totalBundles} ===`);
        console.log('Item:', item);
        console.log('Item Name:', item.name);
        console.log('Item ID:', item.id);
        console.log('Product Type:', item.productType || 'Not specified');
        console.log('Bundle Type ID:', item.bundleTypeId || 'undefined');
        
        const validFrom = new Date();
        const validTo = new Date();
        validTo.setDate(validFrom.getDate() + 30); // 30 days validity
        
        const note = `${language === 'en' ? 'Payment Method' : 'Método de pago'}: ${getPaymentMethodText()}`;
        
        // Ensure we have a valid bundleTypeId
        if (!item.bundleTypeId) {
          console.error('No valid bundleTypeId found for item:', item);
          throw new Error(language === 'en' 
            ? 'Could not determine bundle type ID. Please try again.' 
            : 'No se pudo determinar el ID del tipo de paquete. Por favor intente de nuevo.');
        }
        
        console.log('Creating bundle with parameters:');
        console.log('- consumerId:', consumerId);
        console.log('- bundleTypeId:', item.bundleTypeId);
        console.log('- validFrom:', validFrom.toISOString());
        console.log('- validTo:', validTo.toISOString());
        console.log('- note:', note);
        console.log('==============================');
        
        const { data: newBundleData } = await createBundle({
          variables: {
            input: {
              consumerId,
              status: BundleStatus.ACTIVE,
              bundleTypeId: item.bundleTypeId,
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
        
        createdBundleResults.push({
          id: newBundleData.createBundle.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        });
        
        // Update progress
        setCreationProgress(Math.round(((i + 1) / totalBundles) * 100));
      }
      
      // Only update state after all bundles are created successfully
      setCreatedBundles(createdBundleResults);
      
      // Clear the cart after successful purchase
      setCart([]);
      localStorage.removeItem('matpassCart');
      
      // Check if we need to handle a reservation
      const classId = searchParams.get('classId');
      const checkin = searchParams.get('checkin');
      const reservation = searchParams.get('reservation');

      // Verify we have at least one bundle created before proceeding
      if (createdBundleResults.length === 0) {
        throw new Error(
          language === 'en'
            ? 'No bundles were created. Please try again.'
            : 'No se crearon paquetes. Por favor intente de nuevo.'
        );
      }

      if (classId) {
        // If we have a classId, we need to navigate to payment to confirm the reservation
        console.log('➡️ [Payment] Navigating to payment for reservation confirmation...');
        const paymentParams = new URLSearchParams({
          consumerId: consumerId.toString(),
          classId: classId,
          bundleId: createdBundleResults[0].id // Use first bundle ID for the reservation
        });
        
        // Add checkin/reservation parameters if they exist
        if (checkin === 'true') paymentParams.append('checkin', 'true');
        if (reservation === 'true') paymentParams.append('reservation', 'true');
        
        // Navigate to payment page for reservation confirmation
        router.push(`/payment?${paymentParams.toString()}`);
      } else if (checkin === 'true' || reservation === 'true') {
        // If no classId but checkin/reservation is true, navigate to schedule to select a class
        console.log('➡️ [Payment] Navigating to schedule for class selection...');
        const scheduleParams = new URLSearchParams({
          consumerId: consumerId.toString(),
          bundleId: createdBundleResults[0].id
        });
        if (checkin === 'true') scheduleParams.append('checkin', 'true');
        if (reservation === 'true') scheduleParams.append('reservation', 'true');
        router.push(`/schedule?${scheduleParams.toString()}`);
      } else {
        // Regular purchase flow - navigate to confirmation page
        const params = new URLSearchParams({
          consumerId: consumerId.toString(),
          paymentMethod: selectedPayment,
          total: total.toString(),
          bundleCount: createdBundleResults.length.toString(),
        });
        
        // Add bundle IDs to params
        createdBundleResults.forEach((bundle, index) => {
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

  // Effect to update UI when bundle creation status changes
  useEffect(() => {
    if (isProcessing) {
      // This will help ensure the UI reflects the loading state
      console.log('Bundle creation in progress...');
    }
  }, [isProcessing]);

  // Add this useEffect to monitor createdBundles changes
  useEffect(() => {
    if (createdBundles.length > 0) {
      console.log('Created bundles:', createdBundles);
    }
  }, [createdBundles]);

  return (
    <div className="bg-white min-h-screen max-h-screen overflow-hidden flex flex-col shadow-md rounded-lg">
      {/* Header */}
      <Header title={{ en: "Buy Packages", es: "Comprar Paquetes" }} />

      {/* Tab Navigation with Three Tabs */}
      <div className="flex justify-center mt-16">
        <div className="flex border-b border-gray-200 w-full max-w-3xl mx-auto">
          <button 
            className={`py-3 px-6 font-medium text-base transition-colors relative ${activeTab === 'matpass' 
              ? 'text-sky-500 border-b-3 border-sky-500 after:content-[""] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-sky-500' 
              : 'text-sky-500 border border-sky-500 bg-transparent hover:bg-sky-50'}`}
            onClick={() => setActiveTab('matpass')}
          >
            MatPass
          </button>
          <button 
            className={`py-3 px-6 font-medium text-base transition-colors relative ${activeTab === 'acromatpass' 
              ? 'text-sky-500 border-b-3 border-sky-500 after:content-[""] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-sky-500' 
              : 'text-sky-500 border border-sky-500 bg-transparent hover:bg-sky-50'}`}
            onClick={() => setActiveTab('acromatpass')}
          >
            Acro MatPass
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Content based on active tab */}
        <div className="flex-1 overflow-y-auto">
          {/* Pass the activeTab to the children component */}
          {React.isValidElement(children) ? 
            React.cloneElement(children as React.ReactElement<ChildProps>, { parentTab: activeTab }) : 
            children
          }
        </div>

        {/* Right Panel - Cart */}
        <div 
          ref={rightPanelRef}
          className="w-full md:w-96 h-full bg-white border-l border-gray-200 flex flex-col transform transition-transform duration-300 md:translate-x-0 translate-x-full fixed md:relative right-0 top-0 bottom-0 z-50"
        >
          <div className="py-4 px-5 bg-white border-b border-gray-100 flex justify-between items-center">
            <div className="text-lg font-semibold">Carrito de Compra</div>
            <div className="text-sm text-gray-500">{totalItems} items</div>
            <button 
              className="md:hidden text-2xl text-gray-500 hover:text-gray-700" 
              onClick={() => {
                rightPanelRef.current?.classList.remove('translate-x-0');
                rightPanelRef.current?.classList.add('translate-x-full');
              }}
            >
              ×
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-5 py-8">
                <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                  <circle cx="8" cy="21" r="1"></circle>
                  <circle cx="19" cy="21" r="1"></circle>
                  <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"></path>
                </svg>
                <p className="text-lg font-medium">
                  {language === "en" ? "Your cart is empty" : "Tu carrito está vacío"}
                </p>
                <p className="text-sm text-center px-8">
                  {language === "en" 
                    ? "Browse our products and add items to your cart" 
                    : "Explora nuestros productos y agrega artículos a tu carrito"}
                </p>
              </div>
            ) : (
              cart.map(item => {
                // Asegurarse de que el ID sea un número válido
                const validId = isNaN(item.id) ? 
                  (item.productType === 'acro' ? 9999 : 
                   item.productType === 'regular' ? 7999 : 5999) 
                  : item.id;
                
                return (
                  <div 
                    key={`${validId}_${item.productType || 'default'}`} 
                    className="flex items-center justify-between p-3 mb-2 border-b border-gray-100"
                  >
                    <div className="flex flex-col flex-grow">
                      <div className="font-medium text-gray-900">
                        {item.name}
                        {item.isPass && <span className="ml-2 text-xs px-2 py-0.5 bg-sky-100 text-sky-700 rounded-full uppercase">Pase</span>}
                      </div>
                      <div className="text-sm text-gray-500">
                        S/ {(item.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center bg-gray-100 rounded-full px-1">
                        <button 
                          className="w-6 h-6 flex items-center justify-center rounded-full text-gray-600 hover:bg-gray-200 transition-colors"
                          onClick={() => decreaseQuantity(validId, item.productType)}
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-6 text-center font-medium text-gray-800">{item.quantity}</span>
                        <button 
                          className="w-6 h-6 flex items-center justify-center rounded-full text-gray-600 hover:bg-gray-200 transition-colors"
                          onClick={() => increaseQuantity(validId, item.productType)}
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                      <button
                        className="w-7 h-7 flex items-center justify-center rounded-full text-red-500 hover:bg-red-50 transition-colors"
                        onClick={() => removeItem(validId, item.productType)}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {cart.length > 0 && (
            <>
              <div className="px-4 py-3 border-t border-gray-100">
                {!appliedCoupon ? (
                  <button 
                    className="flex items-center gap-2 text-sm text-sky-600 hover:text-sky-700 px-3 py-2 rounded-lg border border-sky-200 w-full justify-center transition-colors hover:bg-sky-50"
                    onClick={openCouponModal}
                  >
                    <Tag size={18} className="text-sky-500" />
                    <span>Aplicar código de cupón</span>
                  </button>
                ) : (
                  <div className="flex items-center justify-between bg-green-50 p-2 rounded-lg border border-green-100">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium text-green-700">{appliedCoupon}</span>
                      <span className="text-xs text-green-600 flex items-center">
                        <CheckCircle size={14} className="mr-1.5" />
                        Descuento: S/ {discount.toFixed(2)}
                      </span>
                    </div>
                    <button
                      className="w-6 h-6 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 transition-colors"
                      onClick={removeCoupon}
                      aria-label="Quitar cupón"
                    >
                      <X size={18} />
                    </button>
                  </div>
                )}
                {couponMessage && !showCouponModal && (
                  <div className={`mt-2 text-sm flex items-center p-2 rounded ${couponStatus === 'success' ? 'text-green-600 bg-green-50' : couponStatus === 'error' ? 'text-red-600 bg-red-50' : ''}`}>
                    {couponStatus === 'success' ? (
                      <CheckCircle size={16} className="mr-2" />
                    ) : couponStatus === 'error' ? (
                      <AlertCircle size={16} className="mr-2" />
                    ) : null}
                    {couponMessage}
                  </div>
                )}
              </div>
              
              <div className="p-4 bg-gray-50">
                <div className="flex justify-between py-1.5 text-sm">
                  <span className="text-gray-600">Subtotal (sin IGV)</span>
                  <span className="text-gray-800">S/ {preTax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-1.5 text-sm">
                  <span className="text-gray-600">IGV (18%)</span>
                  <span className="text-gray-800">S/ {tax.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between py-1.5 text-sm text-green-600">
                    <span>Descuento</span>
                    <span>- S/ {discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between py-3 text-base font-semibold border-t border-gray-200 mt-2">
                  <span>Total</span>
                  <span className="text-lg">S/ {total.toFixed(2)}</span>
                </div>
              </div>
            </>
          )}
          
          <div className="p-4 bg-white border-t border-gray-100">
            <Button 
              className={`w-full py-3 text-lg font-semibold rounded-xl shadow-sm ${cart.length > 0 ? 'bg-gradient-to-r from-green-600 to-teal-600 text-white hover:from-green-700 hover:to-teal-700 transition-all duration-300' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={closeCouponModal}>
          <div className="bg-white rounded-lg w-full max-w-md mx-4 shadow-xl transform transition-all animate-fadeIn" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-medium">Ingrese código de cupón</h3>
              <button className="w-8 h-8 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 transition-colors" onClick={closeCouponModal}>
                <X size={22} />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <div className="flex items-center border rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-sky-500 focus-within:border-sky-500">
                  <Tag size={18} className="text-sky-500 mr-2" />
                  <input 
                    type="text" 
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Ingrese código de cupón"
                    className="flex-1 outline-none text-gray-700"
                    autoFocus
                  />
                </div>
              </div>
              {couponMessage && (
                <div className={`mb-4 text-sm flex items-center p-2 rounded ${couponStatus === 'success' ? 'text-green-600 bg-green-50' : couponStatus === 'error' ? 'text-red-600 bg-red-50' : ''}`}>
                  {couponStatus === 'success' ? (
                    <CheckCircle size={16} className="mr-2" />
                  ) : couponStatus === 'error' ? (
                    <AlertCircle size={16} className="mr-2" />
                  ) : null}
                  {couponMessage}
                </div>
              )}
              <div className="flex justify-end gap-3 mt-4">
                <button 
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  onClick={closeCouponModal}
                >
                  Cancelar
                </button>
                <button 
                  className={`px-4 py-2 bg-sky-500 text-white rounded-lg ${!couponCode.trim() ? 'opacity-50 cursor-not-allowed' : 'hover:bg-sky-600'} transition-colors`}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={closePaymentModal}>
          <div className="bg-white rounded-lg w-full max-w-md mx-4 shadow-xl transform transition-all animate-fadeIn" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-medium">Seleccione método de pago</h3>
              <button className="w-8 h-8 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 transition-colors" onClick={closePaymentModal}>
                <X size={22} />
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div 
                  className={`flex flex-col items-center p-4 border rounded-lg gap-2 cursor-pointer relative transition-all ${selectedPayment === 'card' ? 'border-sky-500 bg-sky-50' : 'hover:border-gray-300 hover:bg-gray-50'}`}
                  onClick={() => selectPaymentMethod('card')}
                >
                  <CreditCard size={28} className={selectedPayment === 'card' ? 'text-sky-500' : 'text-gray-600'} />
                  <span className={selectedPayment === 'card' ? 'font-medium text-sky-700' : 'text-gray-700'}>Tarjeta</span>
                </div>
                <div 
                  className={`flex flex-col items-center p-4 border rounded-lg gap-2 cursor-pointer relative transition-all ${selectedPayment === 'cash' ? 'border-sky-500 bg-sky-50' : 'hover:border-gray-300 hover:bg-gray-50'}`}
                  onClick={() => selectPaymentMethod('cash')}
                >
                  <DollarSign size={28} className={selectedPayment === 'cash' ? 'text-sky-500' : 'text-gray-600'} />
                  <span className={selectedPayment === 'cash' ? 'font-medium text-sky-700' : 'text-gray-700'}>Efectivo</span>
                </div>
                <div 
                  className={`flex flex-col items-center p-4 border rounded-lg gap-2 cursor-pointer relative transition-all ${selectedPayment === 'qr' ? 'border-sky-500 bg-sky-50' : 'hover:border-gray-300 hover:bg-gray-50'}`}
                  onClick={() => selectPaymentMethod('qr')}
                >
                  <QrCode size={28} className={selectedPayment === 'qr' ? 'text-sky-500' : 'text-gray-600'} />
                  <span className={selectedPayment === 'qr' ? 'font-medium text-sky-700' : 'text-gray-700'}>Yape/Plin</span>
                </div>
                <div 
                  className={`flex flex-col items-center p-4 border rounded-lg gap-2 cursor-pointer relative transition-all ${selectedPayment === 'crypto' ? 'border-sky-500 bg-sky-50' : 'hover:border-gray-300 hover:bg-gray-50'}`}
                  onClick={() => selectPaymentMethod('crypto')}
                >
                  <Bitcoin size={28} className={selectedPayment === 'crypto' ? 'text-sky-500' : 'text-gray-600'} />
                  <span className={selectedPayment === 'crypto' ? 'font-medium text-sky-700' : 'text-gray-700'}>Crypto</span>
                </div>
              </div>
              
              {isProcessing && (
                <div className="mb-6">
                  <p className="text-sm text-gray-600 mb-2">Procesando pago {Math.round(creationProgress)}%</p>
                  <Progress value={creationProgress} className="h-2" />
                  {createdBundles.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Paquetes creados:</p>
                      <div className="space-y-2 max-h-40 overflow-y-auto p-2 bg-gray-50 rounded">
                        {createdBundles.map((bundle, idx) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span>{bundle.name} x{bundle.quantity}</span>
                            <span>S/ {(bundle.price * bundle.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {processingError && (
                <div className="mb-4 p-3 text-sm flex items-center rounded bg-red-50 text-red-600">
                  <AlertCircle size={16} className="mr-2" />
                  {processingError}
                </div>
              )}
              
              <div className="flex justify-end mt-4">
                <button 
                  className={`px-6 py-3 rounded-lg font-medium ${!selectedPayment || isProcessing 
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                    : 'bg-sky-500 text-white hover:bg-sky-600 active:bg-sky-700'} transition-colors`}
                  onClick={processPayment}
                  disabled={!selectedPayment || isProcessing}
                >
                  {isProcessing ? (
                    <span className="flex items-center">
                      <Loader2 className="animate-spin mr-2" size={18} />
                      Procesando...
                    </span>
                  ) : (
                    `Pagar S/ ${total.toFixed(2)}`
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
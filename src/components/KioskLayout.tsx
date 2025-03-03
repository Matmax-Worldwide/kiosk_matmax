'use client'

import React, { useState, useEffect } from 'react'
import { Trash2, Tag, X, CheckCircle, AlertCircle, CreditCard, DollarSign, Plus, Minus, Bitcoin, QrCode } from 'lucide-react'
import styles from './KioskLayout.module.css'
import { Header } from './header';
import { Button } from './ui/button';
import { useLanguageContext } from '@/contexts/LanguageContext';
import { useRouter } from 'next/navigation';
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
  const { language } = useLanguageContext();
  const router = useRouter();

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
      const customEvent = e as CustomEvent<{ id: number, name: string, price: number, quantity: number, isPass?: boolean, productType?: string }>;
      const newItem = customEvent.detail;
      
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

  // This function is currently unused as we're navigating directly to user-selection,
  // but keeping it for potential future use
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
    // Save cart and coupon info to localStorage before proceeding to checkout
    localStorage.setItem('matpassCart', JSON.stringify(cart));
    localStorage.setItem('matpassCoupon', appliedCoupon);
    localStorage.setItem('matpassDiscount', discount.toString());
    
    // Navigate to user-selection page
    router.push('/user-selection');
  };

  const processPayment = () => {
    // Save cart and coupon info to localStorage before proceeding to checkout
    localStorage.setItem('matpassCart', JSON.stringify(cart));
    localStorage.setItem('matpassCoupon', appliedCoupon);
    localStorage.setItem('matpassDiscount', discount.toString());
    localStorage.setItem('matpassPaymentMethod', selectedPayment || '');
    
    // Create URL params
    const params = new URLSearchParams();
    if (selectedPayment) {
      params.append('method', selectedPayment);
    }
    if (appliedCoupon) {
      params.append('coupon', appliedCoupon);
    }
    if (discount > 0) {
      params.append('discount', discount.toString());
    }
    params.append('total', total.toString());
    
    // Navigate to payment page with params
    router.push(`/payment?${params.toString()}`);
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
              
              <div className={styles.modalFooter}>
                <button 
                  className={styles.payNowButton}
                  onClick={processPayment}
                  disabled={!selectedPayment}
                >
                  {!selectedPayment ? 'Seleccione un método' : 'Pagar Ahora'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
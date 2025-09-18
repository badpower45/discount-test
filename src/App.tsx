import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LandingPage } from './components/LandingPage';
import { CustomerDiscountPage } from './components/CustomerDiscountPage';
import { OrderPage } from './components/OrderPage';
import { OrderTrackingPage } from './components/OrderTrackingPage';
import { DeliveryDriverDashboard } from './components/DeliveryDriverDashboard';
import { MerchantDashboard } from './components/MerchantDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { LoginPage } from './components/LoginPage';
import { ProtectedRoute } from './components/ProtectedRoute';
// Test components removed for production
import { Toaster } from './components/ui/toaster';
import { AuthProvider } from './contexts/AuthContext';
import { fetchRestaurants, fetchCustomers, fetchAllCoupons } from './lib/database-functions';
import { supabase } from './lib/supabase';
import type { Restaurant } from './lib/database-functions';

// App state type (now using database Restaurant type)
export interface Offer {
  id: string;
  name: string;
  image: string;
  discount: number;
  description: string;
  category: 'restaurant' | 'cafe' | 'bakery' | 'other';
}

// Legacy interface for backward compatibility
export type { Restaurant };

export interface DiscountCode {
  id: string;
  code: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  offerId: string;
  isUsed: boolean;
  createdAt: Date;
  usedAt?: Date;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
}

// Context for app state (using compatible format)
export const AppContext = React.createContext<{
  offers: (Restaurant & { image: string; discount: number })[];
  loading: boolean;
  refreshOffers: () => void;
  refreshData: () => void;
  discountCodes: DiscountCode[];
  customers: Customer[];
  addDiscountCode: (code: DiscountCode) => void;
  markCodeAsUsed: (codeId: string) => void;
  addCustomer: (customer: Customer) => void;
}>({
  offers: [],
  loading: false,
  refreshOffers: () => {},
  refreshData: () => {},
  discountCodes: [],
  customers: [],
  addDiscountCode: () => {},
  markCodeAsUsed: () => {},
  addCustomer: () => {},
});

// Convert Restaurant to Offer format for backward compatibility
const convertRestaurantToOffer = (restaurant: Restaurant): Restaurant & { image: string; discount: number } => ({
  ...restaurant,
  image: restaurant.image_url,
  discount: restaurant.discount_percentage
});

function AppProvider({ children }: { children: React.ReactNode }) {
  const [offers, setOffers] = useState<(Restaurant & { image: string; discount: number })[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [restaurantsData, customersData, couponsData] = await Promise.all([
        fetchRestaurants(),
        fetchCustomers(),
        fetchAllCoupons()
      ]);

      const compatibleOffers = restaurantsData.map(convertRestaurantToOffer);
      setOffers(compatibleOffers);
      setCustomers(customersData || []);

      if (couponsData && customersData) {
        const formattedCoupons = couponsData.map((c: any) => {
          const customer = customersData.find((cust: any) => cust.id === c.customer_id);
          return {
            id: c.id,
            code: c.code,
            customerId: c.customer_id,
            offerId: c.restaurant_id,
            isUsed: c.status === 'used',
            createdAt: new Date(c.created_at),
            usedAt: c.used_at ? new Date(c.used_at) : undefined,
            customerName: customer?.name || 'N/A',
            customerEmail: customer?.email || 'N/A',
            customerPhone: customer?.phone || 'N/A',
          };
        });
        setDiscountCodes(formattedCoupons);
      }

    } catch (error) {
      console.error('Failed to load initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();

    const channel = supabase.channel('db-changes');
    const subscription = channel
      .on('postgres_changes', { event: '*', schema: 'public' }, (payload: any) => {
        console.log('Database change detected:', payload);
        loadAllData();
      })
      .subscribe();

    return () => {
      if (subscription && typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe();
      }
    };
  }, []);

  const addDiscountCode = (code: DiscountCode) => {
    setDiscountCodes(prev => [...prev, code]);
  };

  const markCodeAsUsed = (codeId: string) => {
    setDiscountCodes(prev => prev.map(code => 
      code.id === codeId 
        ? { ...code, isUsed: true, usedAt: new Date() }
        : code
    ));
  };

  const addCustomer = (customer: Customer) => {
    // تجنب إضافة عملاء مكررين في الحالة المحلية
    setCustomers(prev => {
      if (prev.find(c => c.email === customer.email)) {
        return prev;
      }
      return [...prev, customer];
    });
  };

  return (
    <AppContext.Provider value={{
      offers,
      loading,
      refreshOffers: loadAllData,
      refreshData: loadAllData,
      discountCodes,
      customers,
      addDiscountCode,
      markCodeAsUsed,
      addCustomer
    }}>
      {children}
    </AppContext.Provider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <Router>
          <div className="min-h-screen bg-white">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/get-discount/:offerId" element={<CustomerDiscountPage />} />
              <Route path="/order/:restaurantId" element={<OrderPage />} />
              <Route path="/track-order/:orderNumber" element={<OrderTrackingPage />} />
              <Route path="/driver-dashboard" element={<DeliveryDriverDashboard />} />
              <Route path="/merchant-login" element={<LoginPage />} />
              <Route path="/merchant" element={
                <ProtectedRoute requireMerchant={true}>
                  <MerchantDashboard />
                </ProtectedRoute>
              } />
              <Route path="/admin" element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminDashboard />
                </ProtectedRoute>
              } />
{/* Test routes removed for production */}
              <Route path="*" element={<LandingPage />} />
            </Routes>
            <Toaster />
          </div>
        </Router>
      </AppProvider>
    </AuthProvider>
  );
}
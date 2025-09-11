import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { LandingPage } from './components/LandingPage';
import { CustomerDiscountPage } from './components/CustomerDiscountPage';
import { MerchantDashboard } from './components/MerchantDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { SupabaseTest } from './components/SupabaseTest';
import { SimpleTest } from './components/SimpleTest';
import { Toaster } from './components/ui/toaster';
import { fetchRestaurants, subscribeToTables } from './lib/database-functions';
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

// Context for app state
export const AppContext = React.createContext<{
  offers: Restaurant[];
  loading: boolean;
  refreshOffers: () => void;
  discountCodes: DiscountCode[];
  customers: Customer[];
  addDiscountCode: (code: DiscountCode) => void;
  markCodeAsUsed: (codeId: string) => void;
  addCustomer: (customer: Customer) => void;
}>({
  offers: [],
  loading: false,
  refreshOffers: () => {},
  discountCodes: [],
  customers: [],
  addDiscountCode: () => {},
  markCodeAsUsed: () => {},
  addCustomer: () => {},
});

// Note: Now using Restaurant type directly from database

function AppProvider({ children }: { children: React.ReactNode }) {
  const [offers, setOffers] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  // Load restaurants from database on mount
  useEffect(() => {
    loadRestaurants();
    
    // Subscribe to database changes for real-time updates
    const subscription = subscribeToTables(() => {
      console.log('Database change detected, refreshing data...');
      loadRestaurants();
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadRestaurants = async () => {
    setLoading(true);
    try {
      const restaurants = await fetchRestaurants();
      setOffers(restaurants);
    } catch (error) {
      console.error('Failed to load restaurants:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshOffers = () => {
    loadRestaurants();
  };

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
    setCustomers(prev => [...prev, customer]);
  };

  return (
    <AppContext.Provider value={{
      offers,
      loading,
      refreshOffers,
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
    <AppProvider>
      <Router>
        <div className="min-h-screen bg-white">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/get-discount/:offerId" element={<CustomerDiscountPage />} />
            <Route path="/merchant" element={<MerchantDashboard />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/test" element={<SupabaseTest />} />
            <Route path="/react-test" element={<SimpleTest />} />
            <Route path="*" element={<LandingPage />} />
          </Routes>
          <Toaster />
        </div>
      </Router>
    </AppProvider>
  );
}
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { LandingPage } from './components/LandingPage';
import { CustomerDiscountPage } from './components/CustomerDiscountPage';
import { MerchantDashboard } from './components/MerchantDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { Toaster } from './components/ui/toaster';

// App state type
export interface Offer {
  id: string;
  name: string;
  image: string;
  discount: number;
  description: string;
  category: 'restaurant' | 'cafe' | 'bakery' | 'other';
}

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
  offers: Offer[];
  discountCodes: DiscountCode[];
  customers: Customer[];
  addDiscountCode: (code: DiscountCode) => void;
  markCodeAsUsed: (codeId: string) => void;
  addCustomer: (customer: Customer) => void;
}>({
  offers: [],
  discountCodes: [],
  customers: [],
  addDiscountCode: () => {},
  markCodeAsUsed: () => {},
  addCustomer: () => {},
});

// Mock data
const initialOffers: Offer[] = [
  {
    id: '1',
    name: 'Gourmet Bistro',
    image: 'https://images.unsplash.com/photo-1667388968964-4aa652df0a9b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZXN0YXVyYW50JTIwZm9vZCUyMGRpbmluZ3xlbnwxfHx8fDE3NTc1ODE5MTN8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    discount: 30,
    description: 'Valid for dine-in or delivery',
    category: 'restaurant'
  },
  {
    id: '2',
    name: 'Cozy Corner Cafe',
    image: 'https://images.unsplash.com/photo-1682979358243-816a75830f77?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYWZlJTIwY29mZmVlJTIwaW50ZXJpb3J8ZW58MXx8fHwxNzU3NTk2ODQ5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    discount: 25,
    description: 'All beverages and pastries',
    category: 'cafe'
  },
  {
    id: '3',
    name: 'Mario\'s Pizza Palace',
    image: 'https://images.unsplash.com/photo-1563245738-9169ff58eccf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwaXp6YSUyMHJlc3RhdXJhbnR8ZW58MXx8fHwxNzU3NTI3NTA0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    discount: 40,
    description: 'Pizza and Italian dishes',
    category: 'restaurant'
  },
  {
    id: '4',
    name: 'The Burger Joint',
    image: 'https://images.unsplash.com/photo-1644447381290-85358ae625cb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXJnZXIlMjByZXN0YXVyYW50fGVufDF8fHx8MTc1NzU4Mjg0OXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    discount: 20,
    description: 'Gourmet burgers and fries',
    category: 'restaurant'
  },
  {
    id: '5',
    name: 'Sweet Dreams Bakery',
    image: 'https://images.unsplash.com/photo-1670819916757-e8d5935a6c65?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZXNzZXJ0JTIwYmFrZXJ5fGVufDF8fHx8MTc1NzU5Njg1Nnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    discount: 15,
    description: 'Fresh baked goods daily',
    category: 'bakery'
  },
  {
    id: '6',
    name: 'Sakura Sushi',
    image: 'https://images.unsplash.com/photo-1717988732486-285ea23a6f88?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdXNoaSUyMGphcGFuZXNlJTIwcmVzdGF1cmFudHxlbnwxfHx8fDE3NTc1MjY3NTJ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    discount: 35,
    description: 'Authentic Japanese cuisine',
    category: 'restaurant'
  }
];

function AppProvider({ children }: { children: React.ReactNode }) {
  const [offers] = useState<Offer[]>(initialOffers);
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

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
            <Route path="*" element={<LandingPage />} />
          </Routes>
          <Toaster />
        </div>
      </Router>
    </AppProvider>
  );
}
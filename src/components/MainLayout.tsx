import React from 'react';
import { Header } from './Header';
import { Footer } from './Footer';

interface MainLayoutProps {
  children: React.ReactNode;
  showFooter?: boolean;
  showHeader?: boolean;
}

export function MainLayout({ children, showFooter = true, showHeader = true }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {showHeader && <Header />}
      <main className={`flex-1`}>
        {children}
      </main>
      {showFooter && <Footer />}
    </div>
  );
}
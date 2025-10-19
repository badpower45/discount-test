import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import { Menu, ShoppingCart, User, LogOut, Home, UtensilsCrossed } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { NotificationManager } from './NotificationManager';

export function Header() {
  const navigate = useNavigate();
  const { user, merchant, isAdmin, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const NavLinks = () => (
    <>
      <Link
        to="/"
        className="flex items-center gap-2 text-foreground/70 hover:text-primary hover:bg-primary/5 px-3 py-2 rounded-lg transition-all font-medium"
      >
        <Home className="w-4 h-4" />
        الرئيسية
      </Link>
      <Link
        to="/restaurants"
        className="flex items-center gap-2 text-foreground/70 hover:text-primary hover:bg-primary/5 px-3 py-2 rounded-lg transition-all font-medium"
      >
        <UtensilsCrossed className="w-4 h-4" />
        كل المطاعم
      </Link>
    </>
  );

  const AuthSection = () => {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" className="flex items-center gap-2 hover:bg-primary/5">
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-primary" />
            </div>
            <span className="hidden sm:inline font-medium">
              {user ? (merchant?.name || user.email?.split('@')[0]) : 'الحساب'}
            </span>
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[280px] sm:w-[360px]">
          <div className="flex flex-col gap-3 mt-6">
            <div className="px-4 py-3 bg-primary/5 rounded-xl border border-primary/10">
              <p className="text-xs text-muted-foreground mb-1">مرحباً</p>
              <p className="text-sm font-semibold text-foreground">
                {user ? (merchant?.name || user.email?.split('@')[0]) : 'ضيف'}
              </p>
            </div>
            {user ? (
              <>
                <Button variant="ghost" onClick={() => navigate('/profile')} className="justify-start">
                  الملف الشخصي
                </Button>
                {merchant && (
                  <Button variant="ghost" onClick={() => navigate('/merchant')} className="justify-start">
                    لوحة التاجر
                  </Button>
                )}
                {isAdmin && (
                  <Button variant="ghost" onClick={() => navigate('/admin')} className="justify-start">
                    لوحة الإدمن
                  </Button>
                )}
                <div className="border-t border-border my-2" />
                <Button variant="ghost" onClick={handleSignOut} className="text-destructive hover:text-destructive hover:bg-destructive/10 justify-start">
                  <LogOut className="w-4 h-4 mr-2" /> تسجيل الخروج
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={() => navigate('/customer-login')} className="justify-start">
                  تسجيل الدخول
                </Button>
                <Button className="bg-primary hover:bg-primary/90" onClick={() => navigate('/customer-signup')}>
                  إنشاء حساب
                </Button>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    );
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo - Modern Design */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-primary via-primary to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              <ShoppingCart className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-l from-primary to-purple-600 bg-clip-text text-transparent hidden sm:inline">
              DeliveryDeal
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <NavLinks />
          </nav>

          {/* Desktop Auth */}
          <div className="hidden md:flex items-center gap-3">
            <NotificationManager />
            <AuthSection />
          </div>

          {/* Mobile Menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="w-5 h-5" />
                <span className="sr-only">\u062a\u0628\u062f\u064a\u0644 \u0627\u0644\u0642\u0627\u0626\u0645\u0629</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] sm:w-[400px]">
              <div className="flex flex-col gap-6 mt-6">
                {/* Mobile Logo */}
                <Link to="/" className="flex items-center gap-2" onClick={() => setIsOpen(false)}>
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <ShoppingCart className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xl font-bold text-gray-900">
                    DeliveryDeal
                  </span>
                </Link>

                {/* Mobile Navigation */}
                <nav className="flex flex-col gap-4">
                  <div onClick={() => setIsOpen(false)}>
                    <NavLinks />
                  </div>
                </nav>

                {/* Mobile Auth */}
                <div className="flex flex-col gap-3 pt-6 border-t">
                  {user ? (
                    <>
                      <div className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700">
                        <User className="w-4 h-4" />
                        {merchant?.name || user.email?.split('@')[0] || '\u0627\u0644\u062d\u0633\u0627\u0628'}
                      </div>
                      <Button variant="ghost" onClick={() => { navigate('/profile'); setIsOpen(false); }}>
                        الملف الشخصي
                      </Button>
                      {merchant && (
                        <Button variant="ghost" onClick={() => { navigate('/merchant'); setIsOpen(false); }}>
                          لوحة التاجر
                        </Button>
                      )}
                      {isAdmin && (
                        <Button variant="ghost" onClick={() => { navigate('/admin'); setIsOpen(false); }}>
                          لوحة الإدمن
                        </Button>
                      )}
                      <Button variant="ghost" onClick={handleSignOut}>
                        <LogOut className="w-4 h-4 mr-2" />
                        تسجيل الخروج
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="ghost"
                        onClick={() => { navigate('/customer-login'); setIsOpen(false); }}
                      >
                        تسجيل الدخول
                      </Button>
                      <Button
                        onClick={() => { navigate('/customer-signup'); setIsOpen(false); }}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        إنشاء حساب
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
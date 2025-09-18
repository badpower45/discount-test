import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import { Menu, ShoppingCart, User, LogOut, Home, UtensilsCrossed } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

export function Header() {
  const navigate = useNavigate();
  const { user, merchant, signOut } = useAuth();
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
        className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors"
      >
        <Home className="w-4 h-4" />
        الرئيسية
      </Link>
      <Link
        to="/"
        className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors"
      >
        <UtensilsCrossed className="w-4 h-4" />
        كل المطاعم
      </Link>
    </>
  );

  const AuthSection = () => {
    if (user) {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">
                {merchant?.name || user.email?.split('@')[0] || '\u0627\u0644\u062d\u0633\u0627\u0628'}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => navigate('/profile')}>
              <User className="w-4 h-4 mr-2" />
              الملف الشخصي
            </DropdownMenuItem>
            {merchant && (
              <DropdownMenuItem onClick={() => navigate('/merchant')}>
                <UtensilsCrossed className="w-4 h-4 mr-2" />
                لوحة التاجر
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              تسجيل الخروج
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }

    return (
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          onClick={() => navigate('/customer-login')}
          className="hidden sm:inline-flex"
        >
          تسجيل الدخول
        </Button>
        <Button
          onClick={() => navigate('/customer-signup')}
          className="bg-blue-600 hover:bg-blue-700"
        >
          إنشاء حساب
        </Button>
      </div>
    );
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 hidden sm:inline">
              DeliveryDeal
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <NavLinks />
          </nav>

          {/* Desktop Auth */}
          <div className="hidden md:flex items-center">
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
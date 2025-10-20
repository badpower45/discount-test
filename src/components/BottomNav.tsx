import { Home, ShoppingBag, MapPin, User } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    {
      icon: Home,
      label: 'الرئيسية',
      path: '/',
      activePaths: ['/', '/all-restaurants']
    },
    {
      icon: ShoppingBag,
      label: 'طلباتي',
      path: '/customer-discounts',
      activePaths: ['/customer-discounts']
    },
    {
      icon: MapPin,
      label: 'التتبع',
      path: '/order-tracking',
      activePaths: ['/order-tracking']
    },
    {
      icon: User,
      label: 'الحساب',
      path: '/profile',
      activePaths: ['/profile', '/customer-login', '/customer-signup']
    }
  ];

  const isActive = (paths: string[]) => {
    return paths.some(path => location.pathname === path || location.pathname.startsWith(path + '/'));
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 pb-safe">
      <div className="bg-white/80 backdrop-blur-xl border-t border-border shadow-modern-lg">
        <div className="max-w-screen-xl mx-auto px-4">
          <div className="flex items-center justify-around h-16">
            {navItems.map((item) => {
              const active = isActive(item.activePaths);
              const Icon = item.icon;
              
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={cn(
                    'flex flex-col items-center justify-center flex-1 gap-1 transition-all duration-300',
                    'relative group'
                  )}
                >
                  <div className={cn(
                    'p-2 rounded-2xl transition-all duration-300',
                    active 
                      ? 'bg-primary text-primary-foreground shadow-neon scale-110' 
                      : 'text-muted-foreground group-hover:text-primary group-hover:bg-primary/10'
                  )}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={cn(
                    'text-xs font-medium transition-all duration-300',
                    active ? 'text-primary font-bold' : 'text-muted-foreground'
                  )}>
                    {item.label}
                  </span>
                  {active && (
                    <div className="absolute top-0 w-12 h-1 bg-primary rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

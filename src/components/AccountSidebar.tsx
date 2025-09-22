import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { User, UtensilsCrossed, BarChart3, Bike, LogOut } from 'lucide-react';

export function AccountSidebar({ offsetTop = 'top-16' }: { offsetTop?: 'top-0' | 'top-16' }) {
  const navigate = useNavigate();
  const { user, merchant, driver, isAdmin, signOut } = useAuth();

  const displayName = useMemo(() => {
    return merchant?.name || user?.email?.split('@')[0] || 'الحساب';
  }, [merchant?.name, user?.email]);

  if (!user) return null;

  return (
    <aside
      className={`hidden md:flex fixed right-0 ${offsetTop} h-[calc(100vh-4rem)] w-72 border-l bg-white z-40 flex-col`}
    >
      <div className="p-4 border-b">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center">
            <User className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm text-gray-900">{displayName}</div>
            <div className="text-xs text-gray-500">الحساب</div>
          </div>
        </div>
      </div>

      <div className="p-3 flex-1 space-y-2">
        <Button variant="ghost" className="w-full justify-start" onClick={() => navigate('/profile')}>
          <User className="w-4 h-4 mr-2" /> الملف الشخصي
        </Button>
        {merchant && (
          <Button variant="ghost" className="w-full justify-start" onClick={() => navigate('/merchant')}>
            <UtensilsCrossed className="w-4 h-4 mr-2" /> لوحة التاجر
          </Button>
        )}
        {isAdmin && (
          <Button variant="ghost" className="w-full justify-start" onClick={() => navigate('/admin')}>
            <BarChart3 className="w-4 h-4 mr-2" /> لوحة الإدمن
          </Button>
        )}
        {driver && (
          <Button variant="ghost" className="w-full justify-start" onClick={() => navigate('/driver-dashboard')}>
            <Bike className="w-4 h-4 mr-2" /> لوحة السائق
          </Button>
        )}
      </div>

      <div className="p-3 border-t">
        <Button
          variant="ghost"
          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={async () => {
            await signOut();
            navigate('/');
          }}
        >
          <LogOut className="w-4 h-4 mr-2" /> تسجيل الخروج
        </Button>
      </div>
    </aside>
  );
}

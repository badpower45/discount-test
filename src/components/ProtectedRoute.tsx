import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ArrowLeft, Shield, User } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireMerchant?: boolean;
  requireDriver?: boolean;
  fallbackPath?: string;
}

export function ProtectedRoute({ 
  children, 
  requireAdmin = false, 
  requireMerchant = false, 
  requireDriver = false,
  fallbackPath = '/merchant-login' 
}: ProtectedRouteProps) {
  const { user, merchant, driver, isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">جاري التحقق من الصلاحيات...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-bold text-center text-red-700">
                غير مصرح بالدخول
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/')}
                className="p-2"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="text-center">
            <User className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <p className="text-gray-700 mb-6">
              يجب تسجيل الدخول أولاً للوصول إلى هذه الصفحة
            </p>
            <Button 
              onClick={() => navigate(fallbackPath)}
              className="w-full bg-red-600 hover:bg-red-700"
            >
              تسجيل الدخول
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (requireAdmin && !isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-bold text-center text-orange-700">
                صلاحيات إدارية مطلوبة
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/')}
                className="p-2"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="text-center">
            <Shield className="w-16 h-16 text-orange-400 mx-auto mb-4" />
            <p className="text-gray-700 mb-4">
              هذه الصفحة مخصصة للمديرين فقط
            </p>
            <p className="text-sm text-gray-600 mb-6">
              المستخدم الحالي: {merchant?.name || user.email}
            </p>
            <div className="space-y-2">
              <Button 
                onClick={() => navigate('/merchant')}
                className="w-full bg-orange-600 hover:bg-orange-700"
              >
                الذهاب إلى لوحة التاجر
              </Button>
              <Button 
                variant="outline"
                onClick={() => navigate('/')}
                className="w-full"
              >
                العودة للصفحة الرئيسية
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (requireMerchant && !merchant) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-yellow-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-bold text-center text-yellow-700">
                بيانات التاجر غير متوفرة
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/')}
                className="p-2"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="text-center">
            <User className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
            <p className="text-gray-700 mb-6">
              لم يتم العثور على بيانات التاجر لهذا الحساب
            </p>
            <Button 
              onClick={() => navigate('/merchant-login')}
              className="w-full bg-yellow-600 hover:bg-yellow-700"
            >
              إعادة تسجيل الدخول
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (requireDriver && !driver) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-bold text-center text-green-700">
                صلاحيات سائق مطلوبة
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/')}
                className="p-2"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="text-center">
            <Shield className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <p className="text-gray-700 mb-4">
              هذه الصفحة مخصصة لسائقي التوصيل فقط
            </p>
            <p className="text-sm text-gray-600 mb-6">
              المستخدم الحالي: {user?.email}
            </p>
            <div className="space-y-2">
              <Button 
                onClick={() => navigate('/customer-login')}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                تسجيل الدخول كسائق
              </Button>
              <Button 
                variant="outline"
                onClick={() => navigate('/')}
                className="w-full"
              >
                العودة للصفحة الرئيسية
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
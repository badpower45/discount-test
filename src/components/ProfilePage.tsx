import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getCustomerOrders } from '../lib/database-functions';
import type { Order } from '../lib/database-functions';
import { MainLayout } from './MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Separator } from './ui/separator';
import { 
  User, 
  Mail, 
  Phone, 
  Package, 
  Clock, 
  MapPin, 
  Eye,
  ShoppingCart,
  Truck,
  CheckCircle,
  AlertCircle,
  Timer
} from 'lucide-react';
import { toast } from 'sonner';

// Status labels in Arabic
const statusLabels = {
  'pending_restaurant_acceptance': { label: 'انتظار موافقة المطعم', color: 'bg-yellow-100 text-yellow-800' },
  'confirmed': { label: 'مؤكد', color: 'bg-blue-100 text-blue-800' },
  'preparing': { label: 'قيد التحضير', color: 'bg-orange-100 text-orange-800' },
  'ready_for_pickup': { label: 'جاهز للاستلام', color: 'bg-purple-100 text-purple-800' },
  'assigned_to_driver': { label: 'تم التعيين', color: 'bg-indigo-100 text-indigo-800' },
  'picked_up': { label: 'تم الاستلام', color: 'bg-cyan-100 text-cyan-800' },
  'in_transit': { label: 'في الطريق', color: 'bg-blue-100 text-blue-800' },
  'delivered': { label: 'تم التوصيل', color: 'bg-green-100 text-green-800' },
  'cancelled': { label: 'ملغي', color: 'bg-red-100 text-red-800' }
};

export function ProfilePage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalSpent: 0
  });

  useEffect(() => {
    if (!user) {
      navigate('/customer-login');
      return;
    }
    
    loadUserData();
  }, [user, navigate]);

  const loadUserData = async () => {
    if (!user?.email) return;
    
    try {
      setLoading(true);
      const customerOrders = await getCustomerOrders(user.email);
      setOrders(customerOrders);

      // Calculate stats
      const totalOrders = customerOrders.length;
      const pendingOrders = customerOrders.filter(order => 
        !['delivered', 'cancelled'].includes(order.status)
      ).length;
      const completedOrders = customerOrders.filter(order => 
        order.status === 'delivered'
      ).length;
      const totalSpent = customerOrders
        .filter(order => order.status === 'delivered')
        .reduce((total, order) => total + order.total_price, 0);

      setStats({ totalOrders, pendingOrders, completedOrders, totalSpent });
      
    } catch (error) {
      console.error('Error loading user data:', error);
      toast.error('فشل في تحميل البيانات. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
      toast.success('تم تسجيل الخروج بنجاح');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('فشل في تسجيل الخروج');
    }
  };

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'pending_restaurant_acceptance':
        return <Timer className="w-4 h-4" />;
      case 'confirmed':
      case 'preparing':
        return <Clock className="w-4 h-4" />;
      case 'ready_for_pickup':
      case 'assigned_to_driver':
        return <Package className="w-4 h-4" />;
      case 'picked_up':
      case 'in_transit':
        return <Truck className="w-4 h-4" />;
      case 'delivered':
        return <CheckCircle className="w-4 h-4" />;
      case 'cancelled':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">جاري تحميل الملف الشخصي...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                  <User className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">
                    {user.user_metadata?.full_name || user.email?.split('@')[0] || 'المستخدم'}
                  </h1>
                  <div className="flex items-center mt-2 space-x-4">
                    <div className="flex items-center">
                      <Mail className="w-4 h-4 mr-2" />
                      <span className="text-blue-100">{user.email}</span>
                    </div>
                    {user.user_metadata?.phone && (
                      <div className="flex items-center">
                        <Phone className="w-4 h-4 mr-2" />
                        <span className="text-blue-100">{user.user_metadata.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <Button
                onClick={handleSignOut}
                variant="outline"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                تسجيل الخروج
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <ShoppingCart className="w-8 h-8 text-blue-600" />
                  <div className="mr-4">
                    <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
                    <p className="text-sm text-gray-600">إجمالي الطلبات</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Clock className="w-8 h-8 text-orange-600" />
                  <div className="mr-4">
                    <p className="text-2xl font-bold text-gray-900">{stats.pendingOrders}</p>
                    <p className="text-sm text-gray-600">طلبات معلقة</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                  <div className="mr-4">
                    <p className="text-2xl font-bold text-gray-900">{stats.completedOrders}</p>
                    <p className="text-sm text-gray-600">طلبات مكتملة</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Package className="w-8 h-8 text-purple-600" />
                  <div className="mr-4">
                    <p className="text-2xl font-bold text-gray-900">{stats.totalSpent.toFixed(2)} ج.م</p>
                    <p className="text-sm text-gray-600">إجمالي الإنفاق</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Orders Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  سجل الطلبات
                </CardTitle>
                <Button
                  onClick={() => navigate('/')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  طلب جديد
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {orders.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-gray-900 mb-2">لا توجد طلبات حتى الآن</h3>
                  <p className="text-gray-500 mb-6">
                    ابدأ رحلتك واطلب أول وجبة لك من المطاعم المميزة
                  </p>
                  <Button
                    onClick={() => navigate('/')}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    استكشف المطاعم
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            {getStatusIcon(order.status)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-gray-900">
                                طلب رقم: {order.order_number}
                              </h4>
                              <Badge className={statusLabels[order.status as keyof typeof statusLabels]?.color || 'bg-gray-100 text-gray-800'}>
                                {statusLabels[order.status as keyof typeof statusLabels]?.label || order.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600">
                              {(order as any).restaurants?.name || 'مطعم غير معروف'}
                            </p>
                          </div>
                        </div>
                        <div className="text-left">
                          <p className="text-lg font-bold text-gray-900">
                            {order.total_price.toFixed(2)} ج.م
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(order.created_at).toLocaleDateString('ar-EG')}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-1" />
                            <span className="truncate max-w-48">{order.customer_address}</span>
                          </div>
                          <div className="flex items-center">
                            <Package className="w-4 h-4 mr-1" />
                            <span>{order.order_items.length} صنف</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/track-order/${order.order_number}`)}
                          className="flex items-center gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          تتبع الطلب
                        </Button>
                        {order.status === 'delivered' && (
                          <Badge variant="outline" className="text-green-600 border-green-200">
                            ✓ مكتمل
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
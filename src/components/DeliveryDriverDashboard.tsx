import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Truck, MapPin, Clock, Star, Package, CheckCircle } from 'lucide-react';
import { 
  getOrdersByStatus,
  getDriverById,
  assignDriverToOrder,
  updateOrderStatus,
  fetchDeliveryStats
} from '../lib/database-functions';
import type { Order, DeliveryDriver } from '../lib/database-functions';
import { MainLayout } from './MainLayout';
import { useAuth } from '../contexts/AuthContext';

const statusLabels = {
  'pending_restaurant_acceptance': 'انتظار موافقة المطعم',
  'confirmed': 'مؤكد',
  'preparing': 'قيد التحضير',
  'ready_for_pickup': 'جاهز للاستلام',
  'assigned_to_driver': 'تم التعيين',
  'picked_up': 'تم الاستلام',
  'in_transit': 'في الطريق',
  'delivered': 'تم التوصيل',
  'cancelled': 'ملغي'
};

export function DeliveryDriverDashboard() {
  const navigate = useNavigate();
  const { driver: currentDriver } = useAuth();
  
  // Get driver ID from authentication
  const driverId = currentDriver?.id;
  
  const [driver, setDriver] = useState<DeliveryDriver | null>(null);
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [completedOrders, setCompletedOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState({ totalDeliveries: 0, todayDeliveries: 0, rating: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (driverId) {
      loadDashboardData();
      // تحديث البيانات كل 30 ثانية
      const interval = setInterval(loadDashboardData, 30000);
      return () => clearInterval(interval);
    }
  }, [driverId]);

  const loadDashboardData = async () => {
    if (!driverId) {
      console.error('لا يوجد معرف سائق');
      setLoading(false);
      return;
    }

    try {
      const [driverData, statsData] = await Promise.all([
        getDriverById(driverId),
        fetchDeliveryStats()
      ]);

      if (driverData.success && driverData.driver) {
        setDriver(driverData.driver);
      }

      // Extract driver-specific stats or use defaults
      const driverStats = {
        totalDeliveries: statsData?.totalOrders || driver?.total_deliveries || 0,
        todayDeliveries: statsData?.completedOrders || 0,
        rating: driver?.rating || 0
      };
      setStats(driverStats);

      // تحميل الطلبات المختلفة - functions return arrays directly
      const [available, assignedOrders, pickedUpOrders, inTransitOrders, completed] = await Promise.all([
        getOrdersByStatus('ready_for_pickup'),
        getOrdersByStatus('assigned_to_driver', undefined, driverId),
        getOrdersByStatus('picked_up', undefined, driverId),
        getOrdersByStatus('in_transit', undefined, driverId),
        getOrdersByStatus('delivered')
      ]);

      setAvailableOrders(Array.isArray(available) ? available : []);
      
      // Combine all active order statuses for this driver
      const allActiveOrders = [
        ...(Array.isArray(assignedOrders) ? assignedOrders : []),
        ...(Array.isArray(pickedUpOrders) ? pickedUpOrders : []),
        ...(Array.isArray(inTransitOrders) ? inTransitOrders : [])
      ];
      setActiveOrders(allActiveOrders);
      
      setCompletedOrders(Array.isArray(completed) ? completed.filter(order => order.delivery_driver_id === driverId).slice(0, 10) : []);
      
    } catch (error) {
      console.error('خطأ في تحميل بيانات لوحة التحكم:', error);
    } finally {
      setLoading(false);
    }
  };

  // السائق لا يمكنه تغيير حالته من هنا بناءً على طلبك، لذلك أزلنا زر التبديل

  const handleAcceptOrder = async (orderId: string) => {
    if (!driverId) return;
    
    const result = await assignDriverToOrder(orderId, driverId);
    
    if (result.success) {
      await loadDashboardData();
    } else {
      alert('فشل في قبول الطلب: ' + (result.error || 'خطأ غير معروف'));
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    const result = await updateOrderStatus(orderId, newStatus);
    
    if (result.success) {
      await loadDashboardData();
    } else {
      alert('فشل في تحديث حالة الطلب: ' + (result.error || 'خطأ غير معروف'));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل لوحة التحكم...</p>
        </div>
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Truck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              خطأ في تحميل بيانات السائق
            </h2>
            <p className="text-gray-600 mb-6">
              تعذر العثور على بيانات السائق
            </p>
            <Button onClick={() => navigate('/')} className="w-full">
              العودة للصفحة الرئيسية
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <MainLayout showFooter={false} showHeader={false}>
      <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">لوحة تحكم السائق</h1>
              <p className="text-gray-600">مرحباً {driver.full_name}</p>
            </div>
            <div className="flex items-center gap-4">
              <Badge 
                variant={driver.status === 'available' ? 'default' : 'secondary'}
                className="text-sm px-3 py-1"
              >
                {driver.status === 'available' ? '🟢 متاح' : 
                 driver.status === 'busy' ? '🟡 مشغول' : '🔴 غير متاح'}
              </Badge>
              <span className="text-xs text-gray-500 hidden sm:inline">
                ملاحظة: لا يمكن تغيير الحالة من لوحة السائق. يتم ضبطها بواسطة الإدارة أو تلقائيًا.
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* إحصائيات سريعة */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Package className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">إجمالي التوصيلات</p>
                  <p className="text-2xl font-bold">{stats.totalDeliveries}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Clock className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">توصيلات اليوم</p>
                  <p className="text-2xl font-bold">{stats.todayDeliveries}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Star className="w-8 h-8 text-yellow-600" />
                <div>
                  <p className="text-sm text-gray-600">التقييم</p>
                  <p className="text-2xl font-bold">{stats.rating}/5</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Truck className="w-8 h-8 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">نوع المركبة</p>
                  <p className="text-lg font-medium">
                    {driver.vehicle_type === 'motorcycle' ? 'دراجة نارية' :
                     driver.vehicle_type === 'bicycle' ? 'دراجة هوائية' :
                     driver.vehicle_type === 'car' ? 'سيارة' : 'دراجة بخارية'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* الطلبات المتاحة */}
          <Card className="border border-gray-100 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                الطلبات المتاحة ({availableOrders.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {availableOrders.length === 0 ? (
                <p className="text-gray-500 text-center py-8">لا توجد طلبات متاحة حالياً</p>
              ) : (
                <div className="space-y-4">
                  {availableOrders.slice(0, 5).map((order) => (
                    <div key={order.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-medium">طلب {order.order_number}</h4>
                          <p className="text-sm text-gray-600">{order.customer_name}</p>
                        </div>
                        <Badge variant="secondary">
                          {order.total_price.toFixed(2)} ج.م
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                        <MapPin className="w-4 h-4" />
                        <span className="truncate">{order.customer_address}</span>
                      </div>

                      <div className="text-xs text-gray-500 mb-3">
                        {order.order_items.slice(0, 3).map((i) => i.name).join('، ')}
                        {order.order_items.length > 3 ? ` +${order.order_items.length - 3} أخرى` : ''}
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">
                          {order.order_items.length} صنف
                        </span>
                        <Button 
                          size="sm" 
                          onClick={() => handleAcceptOrder(order.id)}
                          disabled={driver.status !== 'available'}
                        >
                          قبول الطلب
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* الطلبات النشطة */}
          <Card className="border border-gray-100 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="w-5 h-5" />
                طلباتي النشطة ({activeOrders.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activeOrders.length === 0 ? (
                <p className="text-gray-500 text-center py-8">لا توجد طلبات نشطة</p>
              ) : (
                <div className="space-y-4">
                  {activeOrders.map((order) => (
                    <div key={order.id} className="border rounded-lg p-4 bg-blue-50">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-medium">طلب {order.order_number}</h4>
                          <p className="text-sm text-gray-600">{order.customer_name}</p>
                          <p className="text-sm text-gray-600">{order.customer_phone}</p>
                        </div>
                        <Badge>
                          {statusLabels[order.status as keyof typeof statusLabels]}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                        <MapPin className="w-4 h-4" />
                        <span className="truncate">{order.customer_address}</span>
                      </div>

                      {/* شريط تقدّم واضح للحالة */}
                      <div className="mb-3">
                        {(() => {
                          const steps = ['assigned_to_driver','picked_up','in_transit','delivered'] as const;
                          const currentIndex = Math.max(0, steps.indexOf(order.status as any));
                          return (
                            <div className="flex items-center justify-between">
                              {steps.map((s, idx) => (
                                <div key={s} className="flex-1 flex items-center">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${idx <= currentIndex ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                                    {idx+1}
                                  </div>
                                  {idx < steps.length - 1 && (
                                    <div className={`h-1 flex-1 mx-2 ${idx < currentIndex ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
                                  )}
                                </div>
                              ))}
                            </div>
                          );
                        })()}
                        <div className="flex justify-between text-xs text-gray-600 mt-2">
                          <span>تم التعيين</span>
                          <span>تم الاستلام</span>
                          <span>في الطريق</span>
                          <span>تم التوصيل</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        {order.status === 'assigned_to_driver' && (
                          <Button 
                            size="sm" 
                            onClick={() => handleUpdateOrderStatus(order.id, 'picked_up')}
                          >
                            تأكيد الاستلام
                          </Button>
                        )}
                        {order.status === 'picked_up' && (
                          <Button 
                            size="sm" 
                            onClick={() => handleUpdateOrderStatus(order.id, 'in_transit')}
                          >
                            في الطريق
                          </Button>
                        )}
                        {order.status === 'in_transit' && (
                          <Button 
                            size="sm" 
                            onClick={() => handleUpdateOrderStatus(order.id, 'delivered')}
                          >
                            تم التوصيل
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* آخر التوصيلات */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              آخر التوصيلات
            </CardTitle>
          </CardHeader>
          <CardContent>
            {completedOrders.length === 0 ? (
              <p className="text-gray-500 text-center py-8">لا توجد توصيلات مكتملة</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>رقم الطلب</TableHead>
                    <TableHead>العميل</TableHead>
                    <TableHead>العنوان</TableHead>
                    <TableHead>المبلغ</TableHead>
                    <TableHead>وقت التوصيل</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {completedOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono">{order.order_number}</TableCell>
                      <TableCell>{order.customer_name}</TableCell>
                      <TableCell className="max-w-48 truncate">{order.customer_address}</TableCell>
                      <TableCell>{order.total_price.toFixed(2)} ج.م</TableCell>
                      <TableCell>
                        {order.delivered_at ? new Date(order.delivered_at).toLocaleDateString('ar-EG') : 'غير محدد'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
      </div>
    </MainLayout>
  );
}
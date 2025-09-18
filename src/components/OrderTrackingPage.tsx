import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { CheckCircle, Clock, Truck, MapPin, Phone, User, RefreshCw } from 'lucide-react';
import { trackOrder } from '../lib/database-functions';
import type { Order, DeliveryDriver } from '../lib/database-functions';
import { MainLayout } from './MainLayout';
import { supabase } from '../lib/supabase';

const statusLabels = {
  'pending_restaurant_acceptance': 'في انتظار موافقة المطعم',
  'confirmed': 'تم تأكيد الطلب',
  'preparing': 'جاري التحضير',
  'ready_for_pickup': 'جاهز للاستلام',
  'assigned_to_driver': 'تم تعيين سائق التوصيل',
  'picked_up': 'تم استلام الطلب',
  'in_transit': 'في الطريق إليك',
  'delivered': 'تم التوصيل',
  'cancelled': 'تم إلغاء الطلب'
};

const statusSteps = [
  'pending_restaurant_acceptance',
  'confirmed', 
  'preparing',
  'ready_for_pickup',
  'assigned_to_driver',
  'picked_up',
  'in_transit',
  'delivered'
];

export function OrderTrackingPage() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const navigate = useNavigate();
  
  const [orderData, setOrderData] = useState<{
    order: Order | null;
    driver: DeliveryDriver | null;
  }>({ order: null, driver: null });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    const loadOrderData = async () => {
      if (!orderNumber) {
        setError('رقم الطلب غير صحيح');
        setLoading(false);
        return;
      }

      try {
        const result = await trackOrder(orderNumber);
        
        if (result.success && result.order) {
          // جلب بيانات السائق إذا كان معين للطلب
          let driverData: DeliveryDriver | null = null;
          if (result.order.delivery_driver_id) {
            const { getDriverById } = await import('../lib/database-functions');
            const driverResult = await getDriverById(result.order.delivery_driver_id);
            if (driverResult.success && driverResult.driver) {
              driverData = driverResult.driver;
            }
          }
          
          setOrderData({
            order: result.order,
            driver: driverData
          });
        } else {
          setError(result.error || 'لم يتم العثور على الطلب');
        }
      } catch (err) {
        console.error('خطأ في تحميل بيانات الطلب:', err);
        setError('خطأ في تحميل بيانات الطلب');
      } finally {
        setLoading(false);
      }
    };

    loadOrderData();

    // اشتراك في التحديثات الفورية من Supabase
    const channel = supabase
      .channel(`order_${orderNumber}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `order_number=eq.${orderNumber}`
        },
        () => {
          console.log('🔄 Order status updated, refreshing data...');
          loadOrderData();
          setLastUpdated(new Date());
        }
      )
      .subscribe();

    // تحديث احتياطي كل دقيقتين فقط
    const interval = setInterval(loadOrderData, 120000);
    
    return () => {
      clearInterval(interval);
      channel.unsubscribe();
    };
  }, [orderNumber]);

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">جاري تحميل بيانات الطلب...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error || !orderData.order) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                خطأ في تحميل الطلب
              </h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <Button onClick={() => navigate('/')} className="w-full">
                العودة للصفحة الرئيسية
              </Button>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  const { order, driver } = orderData;
  const currentStepIndex = statusSteps.indexOf(order.status);

  return (
    <MainLayout>
      <div className="bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto p-6">
          <div className="mb-6">
          <Button variant="outline" onClick={() => navigate('/')} className="mb-4">
            ← العودة للصفحة الرئيسية
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">تتبع الطلب {order.order_number}</h1>
              <p className="text-gray-600">الحالة الحالية: {statusLabels[order.status as keyof typeof statusLabels]}</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <RefreshCw className="w-4 h-4" />
                <span>آخر تحديث: {lastUpdated.toLocaleTimeString('ar-EG')}</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                🔄 التحديثات الفورية مفعلة
              </p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* تقدم الطلب */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  تقدم الطلب
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {statusSteps.map((step, index) => {
                    const isCompleted = index <= currentStepIndex;
                    const isCurrent = index === currentStepIndex;
                    
                    return (
                      <div key={step} className="flex items-center gap-4">
                        <div className={`
                          flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
                          ${isCompleted 
                            ? 'bg-green-500 text-white' 
                            : isCurrent 
                              ? 'bg-blue-500 text-white animate-pulse'
                              : 'bg-gray-200 text-gray-400'
                          }
                        `}>
                          {isCompleted ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <span className="text-sm font-bold">{index + 1}</span>
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <h3 className={`font-medium ${isCurrent ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'}`}>
                            {statusLabels[step as keyof typeof statusLabels]}
                          </h3>
                          {isCurrent && (
                            <p className="text-sm text-gray-600">جاري العمل على هذه المرحلة...</p>
                          )}
                        </div>
                        
                        {isCurrent && (
                          <div className="flex-shrink-0">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {order.status === 'delivered' && order.delivered_at && (
                  <div className="mt-6 p-4 bg-green-50 rounded-lg">
                    <p className="text-green-800 font-medium">
                      🎉 تم توصيل الطلب بنجاح!
                    </p>
                    <p className="text-green-600 text-sm">
                      وقت التوصيل: {new Date(order.delivered_at).toLocaleString('ar-EG')}
                    </p>
                  </div>
                )}

                {order.status === 'cancelled' && (
                  <div className="mt-6 p-4 bg-red-50 rounded-lg">
                    <p className="text-red-800 font-medium">
                      ❌ تم إلغاء الطلب
                    </p>
                    <p className="text-red-600 text-sm">
                      يمكنك طلب مرة أخرى في أي وقت
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* معلومات السائق */}
            {driver && order.status !== 'delivered' && order.status !== 'cancelled' && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="w-5 h-5" />
                    معلومات السائق
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">{driver.full_name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <span>{driver.phone_number}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Truck className="w-4 h-4 text-gray-500" />
                      <span>
                        {driver.vehicle_type === 'motorcycle' ? 'دراجة نارية' :
                         driver.vehicle_type === 'bicycle' ? 'دراجة هوائية' :
                         driver.vehicle_type === 'car' ? 'سيارة' : 'دراجة بخارية'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-yellow-500">⭐</span>
                      <span>تقييم: {driver.rating}/5</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* ملخص الطلب */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  تفاصيل الطلب
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">معلومات العميل:</h4>
                  <p className="text-sm text-gray-600">{order.customer_name}</p>
                  <p className="text-sm text-gray-600">{order.customer_phone}</p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">عنوان التوصيل:</h4>
                  <p className="text-sm text-gray-600">{order.customer_address}</p>
                  {order.delivery_address_snapshot.city && (
                    <p className="text-sm text-gray-600">
                      {order.delivery_address_snapshot.city} - {order.delivery_address_snapshot.area}
                    </p>
                  )}
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">الأصناف المطلوبة:</h4>
                  <div className="space-y-2">
                    {order.order_items.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{item.name} x{item.quantity}</span>
                        <span>{(item.price * item.quantity).toFixed(2)} ج.م</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>المجموع الفرعي:</span>
                    <span>{order.subtotal.toFixed(2)} ج.م</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>رسوم التوصيل:</span>
                    <span>{order.delivery_fee.toFixed(2)} ج.م</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>الضرائب:</span>
                    <span>{order.tax_amount.toFixed(2)} ج.م</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>المجموع النهائي:</span>
                    <span>{order.total_price.toFixed(2)} ج.م</span>
                  </div>
                </div>

                {order.special_instructions && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">تعليمات خاصة:</h4>
                    <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                      {order.special_instructions}
                    </p>
                  </div>
                )}

                {order.estimated_delivery_time && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">الوقت المتوقع للوصول:</h4>
                    <p className="text-sm text-gray-600">
                      {new Date(order.estimated_delivery_time).toLocaleString('ar-EG')}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
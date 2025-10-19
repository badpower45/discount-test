import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { CheckCircle, Clock, Truck, MapPin, Phone, User, RefreshCw, UtensilsCrossed, PackageCheck, ArrowRight, ChefHat } from 'lucide-react';
import { trackOrder } from '../lib/database-functions';
import type { Order, DeliveryDriver } from '../lib/database-functions';
import { MainLayout } from './MainLayout';
import { supabase } from '../lib/supabase';

const statusConfig = {
  'pending_restaurant_acceptance': {
    label: 'في انتظار الموافقة',
    icon: Clock,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    borderColor: 'border-yellow-600'
  },
  'confirmed': {
    label: 'تم التأكيد',
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-600'
  },
  'preparing': {
    label: 'جاري التحضير',
    icon: ChefHat,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    borderColor: 'border-orange-600'
  },
  'ready_for_pickup': {
    label: 'جاهز للاستلام',
    icon: PackageCheck,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-600'
  },
  'assigned_to_driver': {
    label: 'تم تعيين سائق',
    icon: Truck,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    borderColor: 'border-purple-600'
  },
  'picked_up': {
    label: 'تم الاستلام',
    icon: PackageCheck,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
    borderColor: 'border-indigo-600'
  },
  'in_transit': {
    label: 'في الطريق إليك',
    icon: Truck,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-600'
  },
  'delivered': {
    label: 'تم التوصيل',
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-600'
  },
  'cancelled': {
    label: 'تم الإلغاء',
    icon: Clock,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-600'
  }
};

const mainStatusSteps = [
  'confirmed',
  'preparing',
  'in_transit',
  'delivered'
];

const mainStatusLabels = {
  'confirmed': 'تم الطلب',
  'preparing': 'جاري التحضير',
  'in_transit': 'في الطريق',
  'delivered': 'تم التوصيل'
};

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

    const interval = setInterval(loadOrderData, 120000);
    
    return () => {
      clearInterval(interval);
      channel.unsubscribe();
    };
  }, [orderNumber]);

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
            <p className="text-lg text-muted-foreground font-medium">جاري تحميل بيانات الطلب...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error || !orderData.order) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="w-full max-w-md border-2 border-destructive/20 shadow-2xl">
            <CardContent className="p-10 text-center">
              <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Clock className="w-10 h-10 text-destructive" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-3">
                خطأ في تحميل الطلب
              </h2>
              <p className="text-muted-foreground mb-8">{error}</p>
              <Button onClick={() => navigate('/')} size="lg" className="w-full">
                <ArrowRight className="w-4 h-4 ml-2" />
                العودة للصفحة الرئيسية
              </Button>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  const { order, driver } = orderData;
  
  // Map current status to main step
  const getMainStepFromStatus = (status: string): number => {
    if (status === 'pending_restaurant_acceptance') return -1;
    if (status === 'confirmed') return 0;
    if (['preparing', 'ready_for_pickup', 'assigned_to_driver', 'picked_up'].includes(status)) return 1;
    if (status === 'in_transit') return 2;
    if (status === 'delivered') return 3;
    if (status === 'cancelled') return -2;
    return -1;
  };
  
  const currentMainStep = getMainStepFromStatus(order.status);
  const currentConfig = statusConfig[order.status as keyof typeof statusConfig];

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-b from-background via-accent/5 to-background">
        {/* Header Section */}
        <section className="bg-gradient-to-br from-primary to-purple-600 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/')} 
              className="mb-4 text-white hover:bg-white/20"
            >
              <ArrowRight className="w-4 h-4 ml-2" />
              العودة للصفحة الرئيسية
            </Button>
            
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold mb-2">
                  تتبع الطلب
                </h1>
                <p className="text-white/90 text-lg font-mono">
                  رقم الطلب: <span className="font-black">{order.order_number}</span>
                </p>
              </div>
              <div className="flex flex-col items-start md:items-end gap-2">
                <div className={`inline-flex items-center gap-2 ${currentConfig.bgColor} px-4 py-2 rounded-xl border-2 ${currentConfig.borderColor}`}>
                  <currentConfig.icon className={`w-5 h-5 ${currentConfig.color}`} />
                  <span className={`font-bold ${currentConfig.color}`}>
                    {currentConfig.label}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-white/80">
                  <RefreshCw className="w-4 h-4" />
                  <span>آخر تحديث: {lastUpdated.toLocaleTimeString('ar-EG')}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Visual Stepper - Modern Horizontal Progress */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-10">
          <Card className="shadow-2xl border-2 border-border/50 bg-card/95 backdrop-blur-sm">
            <CardContent className="p-8 md:p-12">
              {order.status === 'cancelled' ? (
                <div className="text-center py-8">
                  <div className="w-24 h-24 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Clock className="w-12 h-12 text-destructive" />
                  </div>
                  <h3 className="text-2xl font-bold text-destructive mb-3">
                    تم إلغاء الطلب
                  </h3>
                  <p className="text-muted-foreground">
                    يمكنك طلب مرة أخرى في أي وقت
                  </p>
                </div>
              ) : (
                <div className="relative">
                  {/* Progress Line */}
                  <div className="absolute top-12 right-0 left-0 h-1 bg-border">
                    <div 
                      className="h-full bg-gradient-to-r from-primary to-purple-600 transition-all duration-1000 ease-out"
                      style={{ width: `${(currentMainStep / (mainStatusSteps.length - 1)) * 100}%` }}
                    />
                  </div>

                  {/* Steps */}
                  <div className="relative grid grid-cols-4 gap-4">
                    {mainStatusSteps.map((step, index) => {
                      const isCompleted = index < currentMainStep;
                      const isCurrent = index === currentMainStep;
                      const StepIcon = statusConfig[step as keyof typeof statusConfig].icon;
                      
                      return (
                        <div key={step} className="flex flex-col items-center text-center">
                          {/* Circle */}
                          <div className={`
                            relative z-10 w-24 h-24 rounded-full flex items-center justify-center border-4 transition-all duration-500
                            ${isCompleted 
                              ? 'bg-gradient-to-br from-primary to-purple-600 border-primary shadow-xl scale-110' 
                              : isCurrent 
                                ? 'bg-gradient-to-br from-primary to-purple-600 border-primary shadow-2xl scale-125 animate-pulse'
                                : 'bg-muted border-border'
                            }
                          `}>
                            <StepIcon className={`w-10 h-10 ${isCompleted || isCurrent ? 'text-white' : 'text-muted-foreground'}`} />
                          </div>
                          
                          {/* Label */}
                          <div className="mt-6">
                            <h3 className={`font-bold text-base md:text-lg ${
                              isCurrent 
                                ? 'text-primary' 
                                : isCompleted 
                                  ? 'text-foreground' 
                                  : 'text-muted-foreground'
                            }`}>
                              {mainStatusLabels[step as keyof typeof mainStatusLabels]}
                            </h3>
                            {isCurrent && (
                              <p className="text-sm text-muted-foreground mt-1">
                                جاري العمل...
                              </p>
                            )}
                            {isCompleted && index < mainStatusSteps.length - 1 && (
                              <div className="inline-flex items-center gap-1 mt-2 text-xs text-primary font-medium">
                                <CheckCircle className="w-3 h-3" />
                                <span>مكتمل</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {order.status === 'delivered' && order.delivered_at && (
                <div className="mt-8 p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl text-center">
                  <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-green-800 mb-2">
                    🎉 تم توصيل الطلب بنجاح!
                  </h3>
                  <p className="text-green-700">
                    وقت التوصيل: {new Date(order.delivered_at).toLocaleString('ar-EG')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Main Content */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Driver Information */}
            {driver && order.status !== 'delivered' && order.status !== 'cancelled' && (
              <div className="lg:col-span-3">
                <Card className="border-2 border-primary/20 shadow-modern-lg bg-gradient-to-br from-card to-primary/5">
                  <CardHeader className="bg-gradient-to-r from-primary/10 to-purple-600/10 border-b">
                    <CardTitle className="flex items-center gap-3 text-2xl">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Truck className="w-6 h-6 text-primary" />
                      </div>
                      معلومات السائق
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid md:grid-cols-4 gap-6">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="w-7 h-7 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">الاسم</p>
                          <p className="font-bold text-lg">{driver.full_name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                          <Phone className="w-7 h-7 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">الهاتف</p>
                          <p className="font-bold text-lg">{driver.phone_number}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                          <Truck className="w-7 h-7 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">نوع المركبة</p>
                          <p className="font-bold text-lg">
                            {driver.vehicle_type === 'motorcycle' ? 'دراجة نارية' :
                             driver.vehicle_type === 'bicycle' ? 'دراجة هوائية' :
                             driver.vehicle_type === 'car' ? 'سيارة' : 'دراجة بخارية'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-yellow-100 flex items-center justify-center">
                          <span className="text-3xl">⭐</span>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">التقييم</p>
                          <p className="font-bold text-lg">{driver.rating}/5</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Order Details - Left Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Customer Info */}
              <Card className="shadow-modern-lg border-2 border-border/50">
                <CardHeader className="bg-gradient-to-r from-primary/5 to-purple-600/5 border-b">
                  <CardTitle className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    معلومات العميل
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">الاسم</p>
                    <p className="font-bold text-lg">{order.customer_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">رقم الهاتف</p>
                    <p className="font-bold text-lg">{order.customer_phone}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Delivery Address */}
              <Card className="shadow-modern-lg border-2 border-border/50">
                <CardHeader className="bg-gradient-to-r from-primary/5 to-purple-600/5 border-b">
                  <CardTitle className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-primary" />
                    </div>
                    عنوان التوصيل
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-2">
                  <p className="font-bold text-lg">{order.customer_address}</p>
                  {order.delivery_address_snapshot.city && (
                    <p className="text-muted-foreground">
                      {order.delivery_address_snapshot.city} - {order.delivery_address_snapshot.area}
                    </p>
                  )}
                  {order.delivery_address_snapshot.landmark && (
                    <p className="text-sm text-muted-foreground">
                      علامة مميزة: {order.delivery_address_snapshot.landmark}
                    </p>
                  )}
                  {order.special_instructions && (
                    <div className="mt-4 p-4 bg-accent/10 rounded-xl border border-border">
                      <p className="text-sm font-semibold text-foreground mb-1">تعليمات خاصة:</p>
                      <p className="text-sm text-muted-foreground">{order.special_instructions}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Order Summary - Right Column */}
            <div>
              <Card className="shadow-2xl border-2 border-primary/20 bg-gradient-to-br from-card to-primary/5 sticky top-24">
                <CardHeader className="bg-gradient-to-r from-primary to-purple-600 text-white rounded-t-xl">
                  <CardTitle className="text-xl">ملخص الطلب</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div>
                    <h4 className="font-bold text-base mb-3 flex items-center gap-2">
                      <UtensilsCrossed className="w-4 h-4 text-primary" />
                      الأصناف المطلوبة
                    </h4>
                    <div className="space-y-3">
                      {order.order_items.map((item, index) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-accent/5 rounded-xl border border-border/50">
                          <div>
                            <p className="font-semibold">{item.name}</p>
                            <p className="text-sm text-muted-foreground">الكمية: {item.quantity}</p>
                          </div>
                          <p className="font-bold text-primary">{(item.price * item.quantity).toFixed(2)} ج.م</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t-2 border-border pt-4 space-y-3">
                    <div className="flex justify-between text-base">
                      <span className="text-muted-foreground">المجموع الفرعي:</span>
                      <span className="font-semibold">{order.subtotal.toFixed(2)} ج.م</span>
                    </div>
                    <div className="flex justify-between text-base">
                      <span className="text-muted-foreground">رسوم التوصيل:</span>
                      <span className="font-semibold">{order.delivery_fee.toFixed(2)} ج.م</span>
                    </div>
                    <div className="flex justify-between text-base">
                      <span className="text-muted-foreground">الضرائب:</span>
                      <span className="font-semibold">{order.tax_amount.toFixed(2)} ج.م</span>
                    </div>
                  </div>
                  
                  <div className="border-t-2 border-border pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xl font-bold">المجموع النهائي:</span>
                      <span className="text-3xl font-black text-primary">{order.total_price.toFixed(2)} ج.م</span>
                    </div>
                  </div>

                  {order.estimated_delivery_time && (
                    <div className="bg-primary/10 border-2 border-primary/20 rounded-xl p-4 text-center">
                      <p className="text-sm text-muted-foreground mb-1">الوقت المتوقع للوصول</p>
                      <p className="font-bold text-primary">
                        {new Date(order.estimated_delivery_time).toLocaleTimeString('ar-EG')}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </div>
    </MainLayout>
  );
}

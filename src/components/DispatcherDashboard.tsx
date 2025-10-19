import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  Truck, 
  Package, 
  MapPin, 
  Phone, 
  Star, 
  Clock,
  CheckCircle,
  TrendingUp
} from 'lucide-react';
import { 
  fetchReadyOrdersForDispatcher,
  fetchAvailableDrivers,
  assignOrderToDriverByDispatcher,
  rateDriverByDispatcher,
  fetchDeliveryStats
} from '../lib/database-functions';
import { MainLayout } from './MainLayout';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './ui/dialog';
import { Label } from './ui/label';
import { Input } from './ui/input';

interface ReadyOrder {
  order_id: string;
  order_number: string;
  restaurant_id: string;
  restaurant_name: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  total_price: number;
  created_at: string;
}

interface AvailableDriver {
  driver_id: string;
  full_name: string;
  phone_number: string;
  vehicle_type: string;
  rating: number;
  total_deliveries: number;
  city: string;
}

export function DispatcherDashboard() {
  const navigate = useNavigate();
  const { user, merchant } = useAuth();
  
  const [readyOrders, setReadyOrders] = useState<ReadyOrder[]>([]);
  const [availableDrivers, setAvailableDrivers] = useState<AvailableDriver[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<ReadyOrder | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<AvailableDriver | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [ratingDriver, setRatingDriver] = useState<AvailableDriver | null>(null);
  const [ratingValue, setRatingValue] = useState<number>(5);

  useEffect(() => {
    if (merchant?.role !== 'dispatcher' && merchant?.role !== 'admin') {
      toast.error('غير مصرح لك بالدخول إلى هذه الصفحة');
      navigate('/');
      return;
    }
    
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, [merchant]);

  const loadDashboardData = async () => {
    try {
      const [orders, drivers, statsData] = await Promise.all([
        fetchReadyOrdersForDispatcher(),
        fetchAvailableDrivers(),
        fetchDeliveryStats()
      ]);

      setReadyOrders(orders);
      setAvailableDrivers(drivers);
      setStats(statsData);
    } catch (error) {
      console.error('خطأ في تحميل بيانات لوحة التحكم:', error);
      toast.error('فشل تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignDriver = async () => {
    if (!selectedOrder || !selectedDriver) {
      toast.error('يرجى اختيار طلب وسائق');
      return;
    }

    setIsAssigning(true);
    try {
      const result = await assignOrderToDriverByDispatcher(
        selectedOrder.order_id,
        selectedDriver.driver_id
      );

      if (result.success) {
        toast.success(result.message || 'تم تعيين السائق بنجاح');
        setSelectedOrder(null);
        setSelectedDriver(null);
        await loadDashboardData();
      } else {
        toast.error(result.error || 'فشل في تعيين السائق');
      }
    } catch (error) {
      console.error('خطأ في تعيين السائق:', error);
      toast.error('حدث خطأ غير متوقع');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRateDriver = async () => {
    if (!ratingDriver || ratingValue < 1 || ratingValue > 5) {
      toast.error('يرجى إدخال تقييم صحيح بين 1 و 5');
      return;
    }

    try {
      const result = await rateDriverByDispatcher(ratingDriver.driver_id, ratingValue);

      if (result.success) {
        toast.success(`تم تحديث التقييم إلى ${result.newRating?.toFixed(1)}`);
        setShowRatingDialog(false);
        setRatingDriver(null);
        setRatingValue(5);
        await loadDashboardData();
      } else {
        toast.error(result.error || 'فشل في تقييم السائق');
      }
    } catch (error) {
      console.error('خطأ في تقييم السائق:', error);
      toast.error('حدث خطأ غير متوقع');
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

  return (
    <MainLayout showFooter={false} showHeader={false}>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">لوحة تحكم الموزع</h1>
                <p className="text-gray-600">مرحباً {user?.email}</p>
              </div>
              <Button variant="outline" onClick={() => navigate('/')}>
                العودة للرئيسية
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    طلبات جاهزة
                  </CardTitle>
                  <Package className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{readyOrders.length}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    سائقون متاحون
                  </CardTitle>
                  <Truck className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{availableDrivers.length}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    طلبات نشطة
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.activeOrders || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    طلبات مكتملة
                  </CardTitle>
                  <CheckCircle className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.completedOrders || 0}</div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Assignment Section */}
          {selectedOrder && selectedDriver && (
            <Card className="mb-8 border-blue-500 border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                  تعيين السائق
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-2">الطلب المحدد:</h3>
                    <p className="text-sm">رقم الطلب: {selectedOrder.order_number}</p>
                    <p className="text-sm">المطعم: {selectedOrder.restaurant_name}</p>
                    <p className="text-sm">العميل: {selectedOrder.customer_name}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">السائق المحدد:</h3>
                    <p className="text-sm">الاسم: {selectedDriver.full_name}</p>
                    <p className="text-sm">المركبة: {selectedDriver.vehicle_type}</p>
                    <p className="text-sm flex items-center gap-1">
                      التقييم: <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      {selectedDriver.rating.toFixed(1)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 mt-4">
                  <Button 
                    onClick={handleAssignDriver} 
                    disabled={isAssigning}
                    className="flex-1"
                  >
                    {isAssigning ? 'جاري التعيين...' : 'تأكيد التعيين'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSelectedOrder(null);
                      setSelectedDriver(null);
                    }}
                    className="flex-1"
                  >
                    إلغاء
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Ready Orders */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  الطلبات الجاهزة للتوصيل
                </CardTitle>
              </CardHeader>
              <CardContent>
                {readyOrders.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    لا توجد طلبات جاهزة حالياً
                  </p>
                ) : (
                  <div className="space-y-4">
                    {readyOrders.map((order) => (
                      <div
                        key={order.order_id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedOrder?.order_id === order.order_id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-blue-300'
                        }`}
                        onClick={() => setSelectedOrder(order)}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-semibold">#{order.order_number}</p>
                            <p className="text-sm text-gray-600">{order.restaurant_name}</p>
                          </div>
                          <Badge variant="secondary">
                            {order.total_price} ر.س
                          </Badge>
                        </div>
                        <div className="space-y-1 text-sm">
                          <p className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            {order.customer_address}
                          </p>
                          <p className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-gray-400" />
                            {order.customer_phone}
                          </p>
                          <p className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-400" />
                            {new Date(order.created_at).toLocaleTimeString('ar-SA')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Available Drivers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  السائقون المتاحون
                </CardTitle>
              </CardHeader>
              <CardContent>
                {availableDrivers.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    لا يوجد سائقون متاحون حالياً
                  </p>
                ) : (
                  <div className="space-y-4">
                    {availableDrivers.map((driver) => (
                      <div
                        key={driver.driver_id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedDriver?.driver_id === driver.driver_id
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 hover:border-green-300'
                        }`}
                        onClick={() => setSelectedDriver(driver)}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-semibold">{driver.full_name}</p>
                            <p className="text-sm text-gray-600">{driver.vehicle_type}</p>
                          </div>
                          <div className="text-left">
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span className="font-semibold">{driver.rating.toFixed(1)}</span>
                            </div>
                            <p className="text-xs text-gray-500">
                              {driver.total_deliveries} توصيلة
                            </p>
                          </div>
                        </div>
                        <div className="space-y-1 text-sm">
                          <p className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-gray-400" />
                            {driver.phone_number}
                          </p>
                          <p className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            {driver.city}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full mt-3"
                          onClick={(e) => {
                            e.stopPropagation();
                            setRatingDriver(driver);
                            setShowRatingDialog(true);
                          }}
                        >
                          <Star className="h-4 w-4 ml-2" />
                          تقييم السائق
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Rating Dialog */}
      <Dialog open={showRatingDialog} onOpenChange={setShowRatingDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تقييم السائق</DialogTitle>
            <DialogDescription>
              قم بتقييم أداء السائق {ratingDriver?.full_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rating">التقييم (من 1 إلى 5)</Label>
              <Input
                id="rating"
                type="number"
                min="1"
                max="5"
                step="0.5"
                value={ratingValue}
                onChange={(e) => setRatingValue(parseFloat(e.target.value))}
              />
            </div>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-8 w-8 cursor-pointer ${
                    star <= ratingValue
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                  onClick={() => setRatingValue(star)}
                />
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRatingDialog(false)}>
              إلغاء
            </Button>
            <Button onClick={handleRateDriver}>
              حفظ التقييم
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}

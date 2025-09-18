import React, { useState, useContext, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { ShoppingCart, Plus, Minus, User } from 'lucide-react';
import { AppContext } from '../App';
import { createOrder, fetchRestaurantById } from '../lib/database-functions';
import type { Restaurant } from '../lib/database-functions';

interface OrderItem {
  name: string;
  price: number;
  quantity: number;
}

export function OrderPage() {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const navigate = useNavigate();
  const { offers } = useContext(AppContext);
  
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([
    { name: 'وجبة مميزة', price: 45.00, quantity: 1 },
    { name: 'مشروب طازج', price: 15.00, quantity: 1 }
  ]);
  
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    address: '',
    city: 'القاهرة',
    area: '',
    buildingNumber: '',
    floor: '',
    apartment: '',
    landmark: '',
    specialInstructions: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [placedOrderNumber, setPlacedOrderNumber] = useState<string>('');

  useEffect(() => {
    const loadRestaurant = async () => {
      if (restaurantId) {
        const restaurantData = await fetchRestaurantById(restaurantId);
        setRestaurant(restaurantData);
      } else {
        // استخدام أول مطعم متاح إذا لم يتم تحديد معرف
        if (offers.length > 0) {
          setRestaurant(offers[0]);
        }
      }
    };
    
    loadRestaurant();
  }, [restaurantId, offers]);

  const updateQuantity = (index: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    const updated = [...orderItems];
    updated[index].quantity = newQuantity;
    setOrderItems(updated);
  };

  const removeItem = (index: number) => {
    const updated = orderItems.filter((_, i) => i !== index);
    setOrderItems(updated);
  };

  const subtotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const deliveryFee = 10.00;
  const taxAmount = subtotal * 0.1; // 10% ضريبة
  const total = subtotal + deliveryFee + taxAmount;

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!restaurant) {
        throw new Error('المطعم غير محدد');
      }

      const orderData = {
        customer_id: '', // سيتم إنشاؤه في الـ RPC
        restaurant_id: restaurant.id,
        customer_name: customerInfo.name,
        customer_phone: customerInfo.phone,
        customer_address: customerInfo.address,
        order_items: orderItems,
        subtotal: subtotal,
        tax_amount: taxAmount,
        total_price: total,
        delivery_fee: deliveryFee,
        currency: 'EGP',
        delivery_address: {
          address: customerInfo.address,
          city: customerInfo.city,
          area: customerInfo.area,
          building_number: customerInfo.buildingNumber,
          floor: customerInfo.floor,
          apartment: customerInfo.apartment,
          landmark: customerInfo.landmark
        },
        special_instructions: customerInfo.specialInstructions
      };

      const result = await createOrder(orderData);
      
      if (result && result.success && result.order) {
        setOrderPlaced(true);
        setPlacedOrderNumber(result.order.order_number);
      } else {
        throw new Error('فشل في إنشاء الطلب');
      }
    } catch (error) {
      console.error('خطأ في تقديم الطلب:', error);
      alert('فشل في تقديم الطلب. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-md mx-auto p-6">
          <Card className="text-center">
            <CardContent className="p-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingCart className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                تم تقديم طلبك بنجاح!
              </h2>
              <p className="text-gray-600 mb-4">
                رقم الطلب: <span className="font-mono font-bold">{placedOrderNumber}</span>
              </p>
              <p className="text-sm text-gray-500 mb-6">
                سيتم التواصل معك قريباً لتأكيد الطلب
              </p>
              <div className="space-y-3">
                <Button 
                  onClick={() => navigate(`/track-order/${placedOrderNumber}`)}
                  className="w-full"
                >
                  تتبع الطلب
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
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل بيانات المطعم...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <Button variant="outline" onClick={() => navigate('/')} className="mb-4">
            ← العودة للصفحة الرئيسية
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">طلب توصيل من {restaurant.restaurant_name}</h1>
          <p className="text-gray-600">{restaurant.description}</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* قائمة الطلب */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  طلبك
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {orderItems.map((item, index) => (
                  <div key={index} className="flex items-center justify-between border-b pb-4">
                    <div>
                      <h3 className="font-medium">{item.name}</h3>
                      <p className="text-sm text-gray-600">{item.price.toFixed(2)} ج.م</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={() => updateQuantity(index, item.quantity - 1)}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="font-medium">{item.quantity}</span>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={() => updateQuantity(index, item.quantity + 1)}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={() => removeItem(index)}
                      >
                        حذف
                      </Button>
                    </div>
                  </div>
                ))}

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span>المجموع الفرعي:</span>
                    <span>{subtotal.toFixed(2)} ج.م</span>
                  </div>
                  <div className="flex justify-between">
                    <span>رسوم التوصيل:</span>
                    <span>{deliveryFee.toFixed(2)} ج.م</span>
                  </div>
                  <div className="flex justify-between">
                    <span>الضرائب:</span>
                    <span>{taxAmount.toFixed(2)} ج.م</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>المجموع النهائي:</span>
                    <span>{total.toFixed(2)} ج.م</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* معلومات العميل والعنوان */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  معلومات التوصيل
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitOrder} className="space-y-4">
                  <div>
                    <Label htmlFor="name">الاسم *</Label>
                    <Input
                      id="name"
                      value={customerInfo.name}
                      onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                      required
                      placeholder="أدخل اسمك الكامل"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">رقم الهاتف *</Label>
                    <Input
                      id="phone"
                      value={customerInfo.phone}
                      onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                      required
                      placeholder="مثال: 01234567890"
                    />
                  </div>

                  <div>
                    <Label htmlFor="address">عنوان التوصيل *</Label>
                    <Input
                      id="address"
                      value={customerInfo.address}
                      onChange={(e) => setCustomerInfo({...customerInfo, address: e.target.value})}
                      required
                      placeholder="الشارع والمنطقة"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">المدينة *</Label>
                      <Input
                        id="city"
                        value={customerInfo.city}
                        onChange={(e) => setCustomerInfo({...customerInfo, city: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="area">المنطقة</Label>
                      <Input
                        id="area"
                        value={customerInfo.area}
                        onChange={(e) => setCustomerInfo({...customerInfo, area: e.target.value})}
                        placeholder="اختياري"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="building">رقم المبنى</Label>
                      <Input
                        id="building"
                        value={customerInfo.buildingNumber}
                        onChange={(e) => setCustomerInfo({...customerInfo, buildingNumber: e.target.value})}
                        placeholder="اختياري"
                      />
                    </div>
                    <div>
                      <Label htmlFor="floor">الطابق</Label>
                      <Input
                        id="floor"
                        value={customerInfo.floor}
                        onChange={(e) => setCustomerInfo({...customerInfo, floor: e.target.value})}
                        placeholder="اختياري"
                      />
                    </div>
                    <div>
                      <Label htmlFor="apartment">الشقة</Label>
                      <Input
                        id="apartment"
                        value={customerInfo.apartment}
                        onChange={(e) => setCustomerInfo({...customerInfo, apartment: e.target.value})}
                        placeholder="اختياري"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="landmark">علامة مميزة</Label>
                    <Input
                      id="landmark"
                      value={customerInfo.landmark}
                      onChange={(e) => setCustomerInfo({...customerInfo, landmark: e.target.value})}
                      placeholder="مثال: بجوار مسجد النور"
                    />
                  </div>

                  <div>
                    <Label htmlFor="instructions">تعليمات خاصة</Label>
                    <Input
                      id="instructions"
                      value={customerInfo.specialInstructions}
                      onChange={(e) => setCustomerInfo({...customerInfo, specialInstructions: e.target.value})}
                      placeholder="مثال: اتصل عند الوصول"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        جاري تقديم الطلب...
                      </>
                    ) : (
                      `تأكيد الطلب - ${total.toFixed(2)} ج.م`
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
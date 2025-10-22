import React, { useState, useContext, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { ShoppingCart, Plus, Minus, User, MapPin, Phone, CheckCircle2, ArrowRight } from 'lucide-react';
import { AppContext } from '../App';
import { createOrder, fetchRestaurantById } from '../lib/database-functions';
import type { Restaurant } from '../lib/database-functions';
import { MainLayout } from './MainLayout';
import { useAuth } from '../contexts/AuthContext';
import { Textarea } from './ui/textarea';
import { OrderPageSkeleton } from './skeletons/OrderPageSkeleton';

interface OrderItem {
  name: string;
  price: number;
  quantity: number;
}

export function OrderPage() {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const navigate = useNavigate();
  const { offers } = useContext(AppContext);
  const { user } = useAuth();
  
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  
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
    if (user) {
      setCustomerInfo(prev => ({
        ...prev,
        name: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
        phone: user.user_metadata?.phone || ''
      }));
    }
  }, [user]);

  useEffect(() => {
    const loadRestaurant = async () => {
      if (restaurantId) {
        const offerData = offers.find(offer => offer.id === restaurantId);
        if (offerData) {
          setRestaurant(offerData);
          setOrderItems([
            { name: offerData.offer_name || offerData.name, price: 50.00, quantity: 1 },
            { name: 'مشروب غازي', price: 15.00, quantity: 1 }
          ]);
        } else {
          const restaurantData = await fetchRestaurantById(restaurantId);
          setRestaurant(restaurantData);
          if (restaurantData) {
            setOrderItems([
              { name: restaurantData.name + ' Special', price: 50.00, quantity: 1 },
              { name: 'مشروب غازي', price: 15.00, quantity: 1 }
            ]);
          }
        }
      } else {
        if (offers.length > 0) {
          setRestaurant(offers[0]);
          setOrderItems([
            { name: offers[0].offer_name || offers[0].name, price: 50.00, quantity: 1 },
            { name: 'مشروب غازي', price: 15.00, quantity: 1 }
          ]);
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
  const discountPercentage = restaurant?.discount_percentage || 0;
  const discountAmount = subtotal * (discountPercentage / 100);
  const afterDiscount = subtotal - discountAmount;
  const deliveryFee = 10.00;
  const taxAmount = afterDiscount * 0.1;
  const total = afterDiscount + deliveryFee + taxAmount;

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (orderItems.length === 0) {
      alert('يرجى إضافة عناصر إلى طلبك قبل التقديم.');
      return;
    }

    if (!restaurant) {
      alert('معلومات المطعم مفقودة. يرجى المحاولة مرة أخرى.');
      return;
    }

    if (!customerInfo.name.trim()) {
      alert('يرجى إدخال الاسم');
      return;
    }

    if (!customerInfo.phone.trim()) {
      alert('يرجى إدخال رقم الهاتف');
      return;
    }

    if (!customerInfo.address.trim()) {
      alert('يرجى إدخال عنوان التوصيل');
      return;
    }

    if (!customerInfo.city.trim()) {
      alert('يرجى إدخال المدينة');
      return;
    }

    setIsSubmitting(true);

    try {
      const orderData = {
        restaurant_id: restaurant.id,
        customer_name: customerInfo.name,
        customer_phone: customerInfo.phone,
        customer_address: `${customerInfo.address}, ${customerInfo.city}`,
        order_items: orderItems,
        subtotal: afterDiscount,
        tax_amount: taxAmount,
        total_price: total,
        delivery_fee: deliveryFee,
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
      
      let errorMessage = 'فشل في تقديم الطلب. يرجى المحاولة مرة أخرى.';
      
      if (error instanceof Error) {
        if (error.message.includes('customer')) {
          errorMessage = 'خطأ في إنشاء بيانات العميل. يرجى التحقق من المعلومات المدخلة.';
        } else if (error.message.includes('restaurant')) {
          errorMessage = 'خطأ في بيانات المطعم. يرجى المحاولة مرة أخرى.';
        } else if (error.message.includes('network') || error.message.includes('connection')) {
          errorMessage = 'مشكلة في الاتصال. يرجى التحقق من الإنترنت والمحاولة مرة أخرى.';
        }
      }
      
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (orderPlaced) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gradient-to-b from-background to-accent/5 py-12 flex items-center justify-center">
          <div className="max-w-xl mx-auto px-4 w-full">
            <Card className="border-2 border-primary/20 shadow-2xl">
              <CardContent className="p-10 text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-primary to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                  <CheckCircle2 className="w-14 h-14 text-white" />
                </div>
                <h2 className="text-3xl font-extrabold text-foreground mb-3">
                  تم تقديم طلبك بنجاح!
                </h2>
                <p className="text-lg text-muted-foreground mb-2">
                  رقم الطلب
                </p>
                <p className="text-2xl font-mono font-black text-primary mb-6 bg-primary/10 py-3 px-6 rounded-xl inline-block">
                  {placedOrderNumber}
                </p>
                <p className="text-muted-foreground mb-8 leading-relaxed">
                  سيتم التواصل معك قريباً لتأكيد الطلب وبدء التحضير
                </p>
                <div className="space-y-3">
                  <Button 
                    onClick={() => navigate(`/track-order/${placedOrderNumber}`)}
                    size="lg"
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold shadow-lg"
                    style={{ color: 'white' }}
                  >
                    <MapPin className="w-5 h-5 ml-2" />
                    تتبع الطلب الآن
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/')}
                    size="lg"
                    className="w-full border-2"
                  >
                    العودة للصفحة الرئيسية
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!restaurant) {
    return (
      <MainLayout>
        <OrderPageSkeleton />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-b from-background via-accent/5 to-background">
        {/* Restaurant Header */}
        <section className="bg-gradient-to-br from-primary to-purple-600 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/')} 
              className="mb-4 text-white hover:bg-white/20"
            >
              <ArrowRight className="w-4 h-4 ml-2" />
              العودة للعروض
            </Button>
            
            <div className="flex items-center gap-6">
              <div className="relative">
                <img 
                  src={restaurant.image_url} 
                  alt={restaurant.restaurant_name || restaurant.name}
                  className="w-24 h-24 rounded-2xl object-cover shadow-2xl border-4 border-white/30"
                />
                {restaurant.logo_url && (
                  <div className="absolute -bottom-2 -left-2 w-12 h-12 bg-white rounded-xl shadow-lg flex items-center justify-center border-2 border-primary">
                    <img
                      src={restaurant.logo_url}
                      alt={`${restaurant.restaurant_name || restaurant.name} logo`}
                      className="w-10 h-10 object-contain rounded-lg"
                    />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm text-white/80 uppercase tracking-wider mb-1">
                  {restaurant.restaurant_name || restaurant.name}
                </p>
                <h1 className="text-3xl font-extrabold mb-2">
                  {restaurant.offer_name || 'طلب توصيل'}
                </h1>
                <p className="text-white/90 leading-relaxed">
                  {restaurant.description}
                </p>
              </div>
              {discountPercentage > 0 && (
                <div className="text-center bg-white/20 backdrop-blur-sm px-6 py-4 rounded-2xl border-2 border-white/30">
                  <div className="text-4xl font-black leading-none mb-1">
                    {discountPercentage}%
                  </div>
                  <div className="text-xs font-medium">خصم حصري</div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Main Content - Two Columns */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid lg:grid-cols-[1fr_450px] gap-8">
            {/* Right Column - Menu Items & Customer Form */}
            <div className="space-y-8">
              {/* Order Items */}
              <Card className="shadow-modern-lg border-2 border-border/50">
                <CardHeader className="bg-gradient-to-r from-primary/5 to-purple-600/5 border-b">
                  <CardTitle className="flex items-center gap-3 text-2xl">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <ShoppingCart className="w-5 h-5 text-primary" />
                    </div>
                    طلبك
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  {orderItems.map((item, index) => (
                    <div key={index} className="flex items-center gap-4 p-4 bg-accent/5 rounded-xl border border-border/50 hover:border-primary/30 transition-colors">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-foreground">{item.name}</h3>
                        <p className="text-sm text-primary font-semibold">{item.price.toFixed(2)} ج.م</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="icon" 
                          onClick={() => updateQuantity(index, item.quantity - 1)}
                          className="h-9 w-9 rounded-xl border-2"
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="font-bold text-lg w-8 text-center">{item.quantity}</span>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          onClick={() => updateQuantity(index, item.quantity + 1)}
                          className="h-9 w-9 rounded-xl border-2"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={() => removeItem(index)}
                          className="rounded-xl"
                        >
                          حذف
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Customer Information Form */}
              <Card className="shadow-modern-lg border-2 border-border/50">
                <CardHeader className="bg-gradient-to-r from-primary/5 to-purple-600/5 border-b">
                  <CardTitle className="flex items-center gap-3 text-2xl">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    معلومات التوصيل
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <form onSubmit={handleSubmitOrder} className="space-y-5">
                    {/* Personal Info */}
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="name" className="text-base font-semibold flex items-center gap-2 mb-2">
                          <User className="w-4 h-4 text-primary" />
                          الاسم الكامل *
                        </Label>
                        <Input
                          id="name"
                          value={customerInfo.name}
                          onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                          required
                          placeholder="أدخل اسمك الكامل"
                          className="h-12 text-base border-2 rounded-xl"
                        />
                      </div>

                      <div>
                        <Label htmlFor="phone" className="text-base font-semibold flex items-center gap-2 mb-2">
                          <Phone className="w-4 h-4 text-primary" />
                          رقم الهاتف *
                        </Label>
                        <Input
                          id="phone"
                          value={customerInfo.phone}
                          onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                          required
                          placeholder="مثال: 01234567890"
                          className="h-12 text-base border-2 rounded-xl"
                        />
                      </div>
                    </div>

                    {/* Address Section */}
                    <div className="space-y-4 pt-4 border-t">
                      <h3 className="font-bold text-lg flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-primary" />
                        عنوان التوصيل
                      </h3>
                      
                      <div>
                        <Label htmlFor="address" className="text-base font-semibold mb-2 block">
                          الشارع والمنطقة *
                        </Label>
                        <Input
                          id="address"
                          value={customerInfo.address}
                          onChange={(e) => setCustomerInfo({...customerInfo, address: e.target.value})}
                          required
                          placeholder="أدخل اسم الشارع والمنطقة"
                          className="h-12 text-base border-2 rounded-xl"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="city" className="text-base font-semibold mb-2 block">
                            المدينة *
                          </Label>
                          <Input
                            id="city"
                            value={customerInfo.city}
                            onChange={(e) => setCustomerInfo({...customerInfo, city: e.target.value})}
                            required
                            className="h-12 text-base border-2 rounded-xl"
                          />
                        </div>
                        <div>
                          <Label htmlFor="area" className="text-base font-semibold mb-2 block">
                            المنطقة
                          </Label>
                          <Input
                            id="area"
                            value={customerInfo.area}
                            onChange={(e) => setCustomerInfo({...customerInfo, area: e.target.value})}
                            placeholder="اختياري"
                            className="h-12 text-base border-2 rounded-xl"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="building" className="text-sm font-semibold mb-2 block">
                            رقم المبنى
                          </Label>
                          <Input
                            id="building"
                            value={customerInfo.buildingNumber}
                            onChange={(e) => setCustomerInfo({...customerInfo, buildingNumber: e.target.value})}
                            placeholder="اختياري"
                            className="h-11 border-2 rounded-xl"
                          />
                        </div>
                        <div>
                          <Label htmlFor="floor" className="text-sm font-semibold mb-2 block">
                            الطابق
                          </Label>
                          <Input
                            id="floor"
                            value={customerInfo.floor}
                            onChange={(e) => setCustomerInfo({...customerInfo, floor: e.target.value})}
                            placeholder="اختياري"
                            className="h-11 border-2 rounded-xl"
                          />
                        </div>
                        <div>
                          <Label htmlFor="apartment" className="text-sm font-semibold mb-2 block">
                            الشقة
                          </Label>
                          <Input
                            id="apartment"
                            value={customerInfo.apartment}
                            onChange={(e) => setCustomerInfo({...customerInfo, apartment: e.target.value})}
                            placeholder="اختياري"
                            className="h-11 border-2 rounded-xl"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="landmark" className="text-base font-semibold mb-2 block">
                          علامة مميزة
                        </Label>
                        <Input
                          id="landmark"
                          value={customerInfo.landmark}
                          onChange={(e) => setCustomerInfo({...customerInfo, landmark: e.target.value})}
                          placeholder="مثال: بجوار مسجد النور"
                          className="h-12 text-base border-2 rounded-xl"
                        />
                      </div>

                      <div>
                        <Label htmlFor="instructions" className="text-base font-semibold mb-2 block">
                          تعليمات خاصة
                        </Label>
                        <Textarea
                          id="instructions"
                          value={customerInfo.specialInstructions}
                          onChange={(e) => setCustomerInfo({...customerInfo, specialInstructions: e.target.value})}
                          placeholder="مثال: اتصل عند الوصول، لا تدق الجرس"
                          className="min-h-[80px] text-base border-2 rounded-xl resize-none"
                        />
                      </div>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Left Column - Order Summary (Sticky) */}
            <div className="lg:sticky lg:top-24 h-fit">
              <Card className="shadow-2xl border-2 border-primary/20 bg-gradient-to-br from-card to-primary/5">
                <CardHeader className="bg-gradient-to-r from-primary to-purple-600 text-white rounded-t-xl">
                  <CardTitle className="text-xl">ملخص الطلب</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between text-base">
                      <span className="text-muted-foreground">المجموع الفرعي:</span>
                      <span className="font-semibold">{subtotal.toFixed(2)} ج.م</span>
                    </div>
                    {discountPercentage > 0 && (
                      <div className="flex justify-between text-base text-primary font-semibold">
                        <span>خصم ({discountPercentage}%):</span>
                        <span>-{discountAmount.toFixed(2)} ج.م</span>
                      </div>
                    )}
                    <div className="flex justify-between text-base">
                      <span className="text-muted-foreground">رسوم التوصيل:</span>
                      <span className="font-semibold">{deliveryFee.toFixed(2)} ج.م</span>
                    </div>
                    <div className="flex justify-between text-base">
                      <span className="text-muted-foreground">الضريبة (10%):</span>
                      <span className="font-semibold">{taxAmount.toFixed(2)} ج.م</span>
                    </div>
                  </div>
                  
                  <div className="border-t-2 border-border pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xl font-bold">الإجمالي:</span>
                      <span className="text-3xl font-black text-primary">{total.toFixed(2)} ج.م</span>
                    </div>
                  </div>

                  {discountPercentage > 0 && (
                    <div className="bg-primary/10 border-2 border-primary/20 rounded-xl p-4 text-center">
                      <p className="text-primary font-bold text-lg">
                        🎉 وفرت {discountAmount.toFixed(2)} ج.م
                      </p>
                    </div>
                  )}

                  <Button 
                    type="submit" 
                    onClick={handleSubmitOrder}
                    size="lg"
                    className="w-full h-14 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold shadow-xl rounded-xl"
                    disabled={isSubmitting}
                    style={{ color: 'white' }}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent ml-2"></div>
                        جاري تقديم الطلب...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5 ml-2" />
                        تأكيد الطلب - {total.toFixed(2)} ج.م
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground leading-relaxed">
                    بالنقر على "تأكيد الطلب"، أنت توافق على شروط الخدمة
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </div>
    </MainLayout>
  );
}

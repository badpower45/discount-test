import { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { AppContext } from '../App';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger } from './ui/sidebar';
import { 
  Home, 
  Ticket, 
  Users, 
  Settings, 
  Search,
  CheckCircle,
  XCircle,
  TrendingUp,
  ArrowLeft,
  LogOut,
  ShoppingCart,
  Clock,
  Package,
  Truck
} from 'lucide-react';
import { toast } from 'sonner';
import { validateCoupon, useCoupon, fetchRestaurantCoupons, fetchRestaurantById, getOrdersByStatus, updateOrderStatus, type Restaurant, type Order } from '../lib/database-functions';
import { useAuth } from '../contexts/AuthContext';
import { MainLayout } from './MainLayout';
import { supabase } from '../lib/supabase';

export function MerchantDashboard() {
  const navigate = useNavigate();
  const { discountCodes, markCodeAsUsed } = useContext(AppContext);
  const { user, merchant, signOut, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [validateCode, setValidateCode] = useState('');
  const [realCoupons, setRealCoupons] = useState<any[]>([]);
  const [restaurantInfo, setRestaurantInfo] = useState<Restaurant | null>(null);
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    code?: any;
    message: string;
  } | null>(null);
  const [isUsingCode, setIsUsingCode] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [processingOrder, setProcessingOrder] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Simple beep sound
  const playBeep = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(880, ctx.currentTime);
      g.gain.setValueAtTime(0.0001, ctx.currentTime);
      o.connect(g);
      g.connect(ctx.destination);
      g.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.01);
      o.start();
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
      o.stop(ctx.currentTime + 0.3);
    } catch {}
  };

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      navigate('/merchant-login');
    }
  }, [user, loading, navigate]);

  // Fetch restaurant info and coupons
  useEffect(() => {
    if (merchant?.restaurant_id) {
      fetchRestaurantInfo();
      fetchMerchantCoupons();
      fetchOrders();
    }
  }, [merchant]);

  // Auto-refresh orders every 30 seconds when on orders tab
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (activeTab === 'orders' && merchant?.restaurant_id) {
      interval = setInterval(fetchOrders, 30000);
    }
    return () => clearInterval(interval);
  }, [activeTab, merchant]);

  // Realtime: listen for new orders for this merchant and alert with sound
  useEffect(() => {
    if (!merchant?.restaurant_id) return;
    // subscribe to new inserts on orders for this restaurant
    const channel = supabase
      ?.channel?.(`orders-merchant-${merchant.restaurant_id}`)
      ?.on?.('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'orders',
        filter: `restaurant_id=eq.${merchant.restaurant_id}`
  }, () => {
        toast.success('🚨 طلب جديد وصل!');
        if (soundEnabled) playBeep();
        // refresh orders if on orders tab
        fetchOrders();
      })
      ?.subscribe?.();

    return () => {
      try { channel?.unsubscribe?.(); } catch {}
    };
  }, [merchant?.restaurant_id, soundEnabled]);

  const fetchRestaurantInfo = async () => {
    if (!merchant?.restaurant_id) return;
    
    try {
      const restaurant = await fetchRestaurantById(merchant.restaurant_id);
      setRestaurantInfo(restaurant);
    } catch (error) {
      console.error('Error fetching restaurant info:', error);
    }
  };

  const fetchOrders = async () => {
    if (!merchant?.restaurant_id) return;
    
    setLoadingOrders(true);
    try {
      const fetchedOrders = await getOrdersByStatus(undefined, merchant.restaurant_id);
      setOrders(fetchedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoadingOrders(false);
    }
  };

  const fetchMerchantCoupons = async () => {
    if (!merchant?.restaurant_id) return;
    
    try {
      // Fetch real coupons from database
      const coupons = await fetchRestaurantCoupons(merchant.restaurant_id);
      
      // Convert to format expected by UI
      const formattedCoupons = coupons.map((coupon: any) => ({
        id: coupon.coupon_id,
        code: coupon.code,
        customerId: coupon.customer_name,
        customerName: coupon.customer_name,
        customerEmail: coupon.customer_email,
        customerPhone: coupon.customer_phone,
        offerId: merchant.restaurant_id,
        isUsed: coupon.status === 'used',
        createdAt: new Date(coupon.created_at),
        usedAt: coupon.used_at ? new Date(coupon.used_at) : undefined
      }));
      
      setRealCoupons(formattedCoupons);
      console.log('✅ Loaded', formattedCoupons.length, 'coupons for restaurant');
    } catch (error) {
      console.error('Error fetching merchant coupons:', error);
      toast.error('خطأ في تحميل الكوبونات');
      
      // Fallback to existing mock data
      const merchantCodes = discountCodes.filter(code => 
        code.offerId === merchant.restaurant_id
      );
      setRealCoupons(merchantCodes);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success('تم تسجيل الخروج بنجاح');
      navigate('/merchant-login');
    } catch (error) {
      toast.error('خطأ في تسجيل الخروج');
    }
  };

  // Show loading if still authenticating
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>جاري التحميل...</p>
        </div>
      </div>
    );
  }

  // Show login prompt if not authenticated
  if (!user || !merchant) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-4">يجب تسجيل الدخول</h2>
            <p className="text-gray-600 mb-4">يجب عليك تسجيل الدخول للوصول إلى لوحة التحكم</p>
            <Button onClick={() => navigate('/merchant-login')}>تسجيل الدخول</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // استخدام اسم المطعم من قاعدة البيانات أولاً، ثم البدائل
  const merchantName = restaurantInfo?.name || 
                       (restaurantInfo?.restaurant_name && restaurantInfo.restaurant_name !== restaurantInfo.name ? restaurantInfo.restaurant_name : null) ||
                       merchant?.restaurant_name || 
                       merchant?.name || 
                       'اسم المطعم غير محدد';
  const merchantCodes = realCoupons;

  const handleValidateCode = async () => {
    if (!validateCode.trim()) {
      toast.error('Please enter a code');
      return;
    }

    try {
      // First check if it's this merchant's coupon
      const ownResult = await validateCoupon(validateCode.trim(), merchant.restaurant_id);
      
      if (ownResult.success && ownResult.coupon) {
        // It's this merchant's coupon - check if already used
        const isAlreadyUsed = ownResult.coupon.status === 'used' || ownResult.coupon.is_used;
        
        if (isAlreadyUsed) {
          setValidationResult({
            isValid: false,
            code: {
              ...ownResult.coupon,
              customerName: ownResult.coupon.customer_name || 'Unknown',
              customerEmail: ownResult.coupon.customer_email || 'unknown@email.com',
              isUsed: true
            },
            message: 'هذا الكود مستخدم مسبقاً'
          });
          toast.error('⛔ هذا الكود مستخدم مسبقاً');
        } else {
          // Valid and unused - show full details
          setValidationResult({
            isValid: true,
            code: {
              ...ownResult.coupon,
              customerName: ownResult.coupon.customer_name || 'Unknown',
              customerEmail: ownResult.coupon.customer_email || 'unknown@email.com',
              isUsed: false
            },
            message: 'كود صحيح وجاهز للاستخدام - خاص بمطعمك'
          });
          toast.success('✅ كود صحيح وخاص بمطعمك!');
        }
      } else {
        // Not this merchant's coupon - check if it exists elsewhere (minimal info)
  const globalResult = await validateCoupon(validateCode.trim(), null);
        
        if (globalResult.success && globalResult.coupon) {
          // Valid code but for another restaurant - no customer details
          setValidationResult({
            isValid: false, // Set to false so "Mark as Used" won't show
            code: null, // No code details for other restaurants
            message: 'كود صحيح ولكن خاص بمطعم آخر'
          });
          toast.info('⚠️ كود صحيح ولكن خاص بمطعم آخر');
        } else {
          setValidationResult({
            isValid: false,
            message: 'كود غير موجود أو مستخدم مسبقاً'
          });
          toast.error('كود غير صحيح');
        }
      }
    } catch (error) {
      console.error('Error validating coupon:', error);
      
      // Secure fallback - only check own restaurant codes without exposing PII
      const ownCodes = discountCodes.filter(c => c.offerId === merchant.restaurant_id);
      const code = ownCodes.find(c => c.code === validateCode.trim());
      
      if (!code) {
        setValidationResult({
          isValid: false,
          message: 'خطأ في الاتصال بقاعدة البيانات - يرجى المحاولة مرة أخرى'
        });
        toast.error('خطأ في الاتصال بقاعدة البيانات');
        return;
      }

      if (code.isUsed) {
        setValidationResult({
          isValid: false,
          code,
          message: 'هذا الكود مستخدم مسبقاً'
        });
        toast.error('⛔ هذا الكود مستخدم مسبقاً');
        return;
      }

      setValidationResult({
        isValid: true,
        code,
        message: 'كود صحيح (وضع اوفلاين)'
      });
      toast.success('✅ كود صحيح (وضع اوفلاين)');
    }
  };

  const handleUseCode = async () => {
    if (!validationResult?.code || isUsingCode) {
      return;
    }

    setIsUsingCode(true);

    try {
      // Use real database RPC function to mark coupon as used
      const result = await useCoupon(validationResult.code.code, merchant.restaurant_id);
      
      if (result.success) {
        toast.success('تم استخدام الكود بنجاح!');
        
        // Update local state for UI consistency (optimistic update)
        const updatedCoupons = realCoupons.map(coupon => 
          coupon.code === validationResult.code.code 
            ? { ...coupon, isUsed: true, usedAt: new Date() }
            : coupon
        );
        setRealCoupons(updatedCoupons);
        
        // Update AppContext for global state consistency
        // Use code as identifier to avoid ID mismatch issues
        const globalCode = discountCodes.find(c => c.code === validationResult.code.code);
        if (globalCode) {
          markCodeAsUsed(globalCode.id);
        }
        
        // Clear validation result and input field immediately
        setValidationResult(null);
        setValidateCode('');
        
        // Refresh data from database (separate error handling)
        try {
          await fetchMerchantCoupons();
        } catch (refetchError) {
          console.error('Error refreshing coupons after successful use:', refetchError);
          // Don't show error to user - the main action succeeded
        }
      } else {
        toast.error(result.error || 'فشل في استخدام الكود');
      }
    } catch (error) {
      console.error('Error using coupon:', error);
      
      // Fallback for development/testing - update local state optimistically
      const updatedCoupons = realCoupons.map(coupon => 
        coupon.code === validationResult.code.code 
          ? { ...coupon, isUsed: true, usedAt: new Date() }
          : coupon
      );
      setRealCoupons(updatedCoupons);
      
      // Update AppContext for global state consistency
      const globalCode = discountCodes.find(c => c.code === validationResult.code.code);
      if (globalCode) {
        markCodeAsUsed(globalCode.id);
      }
      
      setValidationResult(null);
      setValidateCode('');
      toast.success('تم استخدام الكود (وضع اوفلاين)');
    } finally {
      setIsUsingCode(false);
    }
  };

  const handleOrderStatusUpdate = async (orderId: string, newStatus: Order['status']) => {
    setProcessingOrder(orderId);
    try {
      const result = await updateOrderStatus(orderId, newStatus);
      if (result.success) {
        toast.success(`Order ${newStatus} successfully`);
        // Note: Removed auto-assign driver - dispatcher will manually assign drivers
        // This allows for better control and workflow in the dispatch system
        await fetchOrders(); // Refresh orders
      } else {
        toast.error(result.error || 'Failed to update order status');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    } finally {
      setProcessingOrder(null);
    }
  };

  const getStatusBadgeColor = (status: Order['status']) => {
    switch (status) {
      case 'pending_restaurant_acceptance': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'preparing': return 'bg-orange-100 text-orange-800';
      case 'ready_for_pickup': return 'bg-green-100 text-green-800';
      case 'assigned_to_driver': return 'bg-purple-100 text-purple-800';
      case 'picked_up': return 'bg-purple-200 text-purple-900';
      case 'in_transit': return 'bg-indigo-100 text-indigo-800';
      case 'delivered': return 'bg-green-500 text-white';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'pending_restaurant_acceptance': return <Clock className="w-4 h-4" />;
      case 'confirmed': return <CheckCircle className="w-4 h-4" />;
      case 'preparing': return <Package className="w-4 h-4" />;
      case 'ready_for_pickup': return <CheckCircle className="w-4 h-4" />;
      case 'assigned_to_driver': return <Truck className="w-4 h-4" />;
      case 'picked_up': return <Truck className="w-4 h-4" />;
      case 'in_transit': return <Truck className="w-4 h-4" />;
      case 'delivered': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const totalCodes = merchantCodes.length;
  const usedCodes = merchantCodes.filter(code => code.isUsed).length;
  const unusedCodes = totalCodes - usedCodes;

  const MerchantSidebarMenu = () => (
    <Sidebar className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200">
      <SidebarContent>
        <div className="p-4">
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center ml-3">
              <Home className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-sm font-medium text-gray-900">لوحة تحكم التاجر</h2>
              <p className="text-xs text-blue-600 font-semibold mt-1">{restaurantInfo?.restaurant_name || merchantName}</p>
              {restaurantInfo?.offer_name && (
                <p className="text-xs text-gray-500">العرض: {restaurantInfo.offer_name}</p>
              )}
            </div>
          </div>
        </div>
        
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="">
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={() => setActiveTab('dashboard')}
                  isActive={activeTab === 'dashboard'}
                >
                  <Home className="w-4 h-4" />
                  الرئيسية
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={() => setActiveTab('validate')}
                  isActive={activeTab === 'validate'}
                >
                  <Search className="w-4 h-4" />
                  التحقق من الكوبونات
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={() => setActiveTab('orders')}
                  isActive={activeTab === 'orders'}
                >
                  <ShoppingCart className="w-4 h-4" />
                  الطلبات الحالية
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={() => setActiveTab('customers')}
                  isActive={activeTab === 'customers'}
                >
                  <Users className="w-4 h-4" />
                  العملاء
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={() => setActiveTab('settings')}
                  isActive={activeTab === 'settings'}
                >
                  <Settings className="w-4 h-4" />
                  الإعدادات
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={handleLogout}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <LogOut className="w-4 h-4" />
                  تسجيل الخروج
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );

  const DashboardContent = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">نظرة عامة على لوحة التحكم</h1>
        <p className="text-gray-600">مرحباً بك في لوحة تحكم مطعم <span className="font-semibold text-blue-600">{merchantName}</span></p>
        {restaurantInfo?.offer_name && (
          <p className="text-sm text-gray-500 mt-1">العرض الحالي: {restaurantInfo.offer_name}</p>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Codes</p>
                <p className="text-2xl text-gray-900">{totalCodes}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center">
                <Ticket className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Used Codes</p>
                <p className="text-2xl text-gray-900">{usedCodes}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Available Codes</p>
                <p className="text-2xl text-gray-900">{unusedCodes}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Codes Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Discount Codes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {merchantCodes.slice(0, 5).map((code) => (
                <TableRow key={code.id}>
                  <TableCell className="font-mono">{code.code}</TableCell>
                  <TableCell>{code.customerName}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={code.isUsed ? "secondary" : "default"}
                      className={code.isUsed ? "bg-gray-100 text-gray-700" : "bg-green-100 text-green-700"}
                    >
                      {code.isUsed ? 'Used' : 'Available'}
                    </Badge>
                  </TableCell>
                  <TableCell>{code.createdAt.toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  const ValidateContent = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl text-gray-900 mb-2">Validate Discount Codes</h1>
        <p className="text-gray-600">Enter a customer's discount code to validate and mark as used</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Code Validation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="code">Discount Code</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="code"
                autoFocus
                value={validateCode}
                onChange={(e) => setValidateCode(e.target.value)}
                placeholder="Enter discount code (e.g., EGY-12345)"
                className="font-mono"
              />
              <Button onClick={handleValidateCode}>
                <Search className="w-4 h-4 mr-2" />
                Validate
              </Button>
            </div>
          </div>

          {validationResult && (
            <Card className={`border-2 ${validationResult.isValid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {validationResult.isValid ? (
                      <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600 mr-2" />
                    )}
                    <div>
                      <p className={`${validationResult.isValid ? 'text-green-800' : 'text-red-800'}`}>
                        {validationResult.message}
                      </p>
                      {validationResult.code && (
                        <div className="text-sm text-gray-600 mt-1">
                          <p>Customer: {validationResult.code.customerName}</p>
                          <p>Email: {validationResult.code.customerEmail}</p>
                          <p>Phone: {validationResult.code.customerPhone}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  {validationResult.isValid && !validationResult.code?.isUsed && (
                    <Button 
                      onClick={handleUseCode} 
                      variant="outline" 
                      size="sm"
                      disabled={isUsingCode}
                    >
                      {isUsingCode ? 'جاري التحديث...' : 'استخدام الكود'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const CustomersContent = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl text-gray-900 mb-2">Customer Codes</h1>
        <p className="text-gray-600">View all discount codes generated for your restaurant</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {merchantCodes.map((code) => (
                <TableRow key={code.id}>
                  <TableCell>{code.customerName}</TableCell>
                  <TableCell className="font-mono">{code.code}</TableCell>
                  <TableCell>{code.customerEmail}</TableCell>
                  <TableCell>{code.customerPhone}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={code.isUsed ? "secondary" : "default"}
                      className={code.isUsed ? "bg-gray-100 text-gray-700" : "bg-green-100 text-green-700"}
                    >
                      {code.isUsed ? 'Used' : 'Available'}
                    </Badge>
                  </TableCell>
                  <TableCell>{code.createdAt.toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  const OrdersContent = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-gray-900 mb-2">Current Orders</h1>
          <p className="text-gray-600">Manage incoming orders for your restaurant</p>
        </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setSoundEnabled((v) => !v)}
              variant={soundEnabled ? 'default' : 'outline'}
              className="flex items-center gap-2"
            >
              {soundEnabled ? '🔔 Alerts On' : '🔕 Alerts Off'}
            </Button>
        <Button
          onClick={fetchOrders}
          disabled={loadingOrders}
          variant="outline"
          className="flex items-center gap-2"
        >
          {loadingOrders ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          ) : (
            <Clock className="w-4 h-4" />
          )}
          Refresh
        </Button>
          </div>
      </div>

      {loadingOrders ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : orders.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg text-gray-600 mb-2">No orders yet</h3>
            <p className="text-gray-500">New orders will appear here when customers place them.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(order.status)}
                        <span className="text-sm font-medium">Order #{order.id.slice(0, 8)}</span>
                      </div>
                      <Badge className={getStatusBadgeColor(order.status)}>
                        {order.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">{new Date(order.created_at).toLocaleDateString()}</p>
                      <p className="text-sm text-gray-600">{new Date(order.created_at).toLocaleTimeString()}</p>
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Customer Information</h4>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p><strong>Name:</strong> {order.customer_name}</p>
                        <p><strong>Phone:</strong> {order.customer_phone}</p>
                        <p><strong>Address:</strong> {order.customer_address}</p>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Order Details</h4>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p><strong>Total:</strong> EGP {order.total_price?.toFixed(2)}</p>
                        <p><strong>Items:</strong> {order.order_items?.length || 0} items</p>
                        {order.special_instructions && (
                          <p><strong>Instructions:</strong> {order.special_instructions}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {order.status === 'pending_restaurant_acceptance' && (
                    <div className="flex gap-3 mt-6 pt-4 border-t">
                      <Button
                        onClick={() => handleOrderStatusUpdate(order.id, 'confirmed')}
                        disabled={processingOrder === order.id}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Accept Order
                      </Button>
                      <Button
                        onClick={() => handleOrderStatusUpdate(order.id, 'cancelled')}
                        disabled={processingOrder === order.id}
                        variant="destructive"
                      >
                        Reject Order
                      </Button>
                    </div>
                  )}

                  {order.status === 'confirmed' && (
                    <div className="flex gap-3 mt-6 pt-4 border-t">
                      <Button
                        onClick={() => handleOrderStatusUpdate(order.id, 'preparing')}
                        disabled={processingOrder === order.id}
                        className="bg-orange-600 hover:bg-orange-700"
                      >
                        Start Preparing
                      </Button>
                    </div>
                  )}

                  {order.status === 'preparing' && (
                    <div className="flex gap-3 mt-6 pt-4 border-t">
                      <Button
                        onClick={() => handleOrderStatusUpdate(order.id, 'ready_for_pickup')}
                        disabled={processingOrder === order.id}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Mark as Ready
                      </Button>
                    </div>
                  )}

                  {order.status === 'ready_for_pickup' && (
                    <div className="bg-green-50 p-4 rounded-lg mt-6">
                      <p className="text-green-800 text-sm">
                        Order is ready for pickup or delivery driver assignment
                      </p>
                    </div>
                  )}

                  {(order.status === 'assigned_to_driver' || order.status === 'picked_up' || order.status === 'in_transit') && (
                    <div className="bg-blue-50 p-4 rounded-lg mt-6">
                      <p className="text-blue-800 text-sm">
                        Order is with delivery driver - Status: {order.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </p>
                    </div>
                  )}

                  {order.status === 'delivered' && (
                    <div className="bg-green-100 p-4 rounded-lg mt-6">
                      <p className="text-green-800 text-sm font-medium">
                        ✅ Order delivered successfully
                      </p>
                    </div>
                  )}

                  {order.status === 'cancelled' && (
                    <div className="bg-red-50 p-4 rounded-lg mt-6">
                      <p className="text-red-800 text-sm">
                        ❌ Order was cancelled
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const SettingsContent = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">Manage your restaurant settings</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Restaurant Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="restaurant-name">Restaurant Name</Label>
            <Input id="restaurant-name" value={merchantName} readOnly />
          </div>
          <div>
            <Label htmlFor="discount-rate">Current Discount Rate</Label>
            <Input id="discount-rate" value="30%" readOnly />
          </div>
          <Button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white">
            Update Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <MainLayout showBottomNav={false} showHeader={false}>
      <SidebarProvider>
      <div className="min-h-screen bg-gray-50 flex">
        <MerchantSidebarMenu />
        
        <div className="flex-1 ml-64">
          <header className="bg-white border-b border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <SidebarTrigger className="md:hidden mr-2" />
                <Button 
                  variant="ghost" 
                  onClick={() => navigate('/')}
                  className="mr-4"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Button>
              </div>
              <div className="text-sm text-gray-600">
                Last updated: {new Date().toLocaleString()}
              </div>
            </div>
          </header>

          <main className="p-6">
            {activeTab === 'dashboard' && <DashboardContent />}
            {activeTab === 'validate' && <ValidateContent />}
            {activeTab === 'orders' && <OrdersContent />}
            {activeTab === 'customers' && <CustomersContent />}
            {activeTab === 'settings' && <SettingsContent />}
          </main>
        </div>
      </div>
      </SidebarProvider>
    </MainLayout>
  );
}
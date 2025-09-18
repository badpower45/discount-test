import { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { AppContext } from '../App';
import { fetchDashboardStats, deleteRestaurant, updateRestaurant, type Restaurant } from '../lib/database-functions';
import { useAuth } from '../contexts/AuthContext';
import { AddRestaurantDialog } from './AddRestaurantDialog';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger } from './ui/sidebar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';
import { 
  Home, 
  Store, 
  Users, 
  Ticket, 
  BarChart3,
  ArrowLeft,
  TrendingUp,
  CheckCircle,
  LogOut,
  Edit,
  Trash2
} from 'lucide-react';
import { MainLayout } from './MainLayout';

export function AdminDashboard() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { offers, discountCodes, customers, refreshData } = useContext(AppContext);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAddRestaurantDialogOpen, setIsAddRestaurantDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(null);
  const [realStats, setRealStats] = useState({
    totalRestaurants: 0,
    totalCustomers: 0,
    totalCoupons: 0,
    usedCoupons: 0,
    unusedCoupons: 0
  });

  // Fetch real statistics from database
  useEffect(() => {
    loadDashboardStats();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success('تم تسجيل الخروج بنجاح');
      navigate('/');
    } catch (error) {
      toast.error('خطأ في تسجيل الخروج');
    }
  };

  const loadDashboardStats = async () => {
    try {
      const stats = await fetchDashboardStats();
      setRealStats(stats);
      console.log('✅ Loaded admin dashboard stats:', stats);
    } catch (error) {
      console.error('Error loading admin stats:', error);
      // Fallback to local data
      setRealStats({
        totalRestaurants: offers.length,
        totalCustomers: customers.length,
        totalCoupons: discountCodes.length,
        usedCoupons: discountCodes.filter(code => code.isUsed).length,
        unusedCoupons: discountCodes.filter(code => !code.isUsed).length
      });
    }
  };

  // Handle restaurant deletion
  const handleDeleteRestaurant = async (restaurantId: string, restaurantName: string) => {
    try {
      const result = await deleteRestaurant(restaurantId);
      if (result.success) {
        toast.success(`تم حذف مطعم "${restaurantName}" بنجاح`);
        refreshData(); // Refresh the data to update UI
        loadDashboardStats(); // Refresh stats
      } else {
        toast.error('فشل في حذف المطعم');
      }
    } catch (error) {
      console.error('Error deleting restaurant:', error);
      toast.error('حدث خطأ أثناء حذف المطعم');
    }
  };

  // Handle restaurant editing
  const handleEditRestaurant = (restaurant: Restaurant) => {
    setEditingRestaurant(restaurant);
    setIsEditDialogOpen(true);
  };

  // Handle restaurant update
  const handleUpdateRestaurant = async (restaurantData: Partial<Restaurant>) => {
    if (!editingRestaurant) return;
    
    try {
      const result = await updateRestaurant(editingRestaurant.id, restaurantData);
      if (result.success) {
        toast.success('تم تحديث بيانات المطعم بنجاح');
        setIsEditDialogOpen(false);
        setEditingRestaurant(null);
        refreshData(); // Refresh the data to update UI
        loadDashboardStats(); // Refresh stats
      } else {
        toast.error('فشل في تحديث بيانات المطعم');
      }
    } catch (error) {
      console.error('Error updating restaurant:', error);
      toast.error('حدث خطأ أثناء تحديث المطعم');
    }
  };

  const totalRestaurants = realStats.totalRestaurants;
  const totalCustomers = realStats.totalCustomers;
  const totalCouponsGenerated = realStats.totalCoupons;
  const totalCouponsUsed = realStats.usedCoupons;

  const AdminSidebarMenu = () => (
    <Sidebar className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200">
      <SidebarContent>
        <div className="p-4">
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center mr-3">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm text-gray-900">Admin Dashboard</h2>
              <p className="text-xs text-gray-600">Platform Management</p>
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
                  Dashboard
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={() => setActiveTab('restaurants')}
                  isActive={activeTab === 'restaurants'}
                >
                  <Store className="w-4 h-4" />
                  Restaurants
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={() => setActiveTab('customers')}
                  isActive={activeTab === 'customers'}
                >
                  <Users className="w-4 h-4" />
                  Customers
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={() => setActiveTab('coupons')}
                  isActive={activeTab === 'coupons'}
                >
                  <Ticket className="w-4 h-4" />
                  Coupons
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={() => setActiveTab('reports')}
                  isActive={activeTab === 'reports'}
                >
                  <BarChart3 className="w-4 h-4" />
                  Reports
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
        <h1 className="text-2xl text-gray-900 mb-2">Platform Overview</h1>
        <p className="text-gray-600">Monitor your discount platform's performance</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Restaurants</p>
                <p className="text-2xl text-gray-900">{totalRestaurants}</p>
                <p className="text-xs text-green-600 mt-1">+2 this month</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center">
                <Store className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Customers</p>
                <p className="text-2xl text-gray-900">{totalCustomers}</p>
                <p className="text-xs text-green-600 mt-1">+{totalCustomers} this month</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Coupons Generated</p>
                <p className="text-2xl text-gray-900">{totalCouponsGenerated}</p>
                <p className="text-xs text-green-600 mt-1">+{totalCouponsGenerated} this month</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center">
                <Ticket className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Coupons Used</p>
                <p className="text-2xl text-gray-900">{totalCouponsUsed}</p>
                <p className="text-xs text-orange-600 mt-1">
                  {totalCouponsGenerated > 0 ? Math.round((totalCouponsUsed / totalCouponsGenerated) * 100) : 0}% usage rate
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Coupons</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {discountCodes.slice(0, 5).map((code) => (
                <div key={code.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-mono text-sm">{code.code}</p>
                    <p className="text-xs text-gray-600">{code.customerName}</p>
                  </div>
                  <Badge 
                    variant={code.isUsed ? "secondary" : "default"}
                    className={code.isUsed ? "bg-gray-100 text-gray-700" : "bg-green-100 text-green-700"}
                  >
                    {code.isUsed ? 'Used' : 'Active'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Performing Restaurants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {offers.slice(0, 5).map((offer) => {
                const offerCodes = discountCodes.filter(code => code.offerId === offer.id);
                const usedCodes = offerCodes.filter(code => code.isUsed).length;
                return (
                  <div key={offer.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <img 
                        src={offer.image} 
                        alt={offer.name}
                        className="w-10 h-10 rounded-lg object-cover mr-3"
                      />
                      <div>
                        <p className="text-sm">{offer.name}</p>
                        <p className="text-xs text-gray-600">{offer.discount}% discount</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">{usedCodes} used</p>
                      <p className="text-xs text-gray-600">{offerCodes.length} total</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const RestaurantsContent = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-gray-900 mb-2">Restaurant Management</h1>
          <p className="text-gray-600">Manage all restaurants on the platform</p>
        </div>
        <Button 
          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
          onClick={() => setIsAddRestaurantDialogOpen(true)}
        >
          Add Restaurant
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Restaurant</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Coupons Generated</TableHead>
                <TableHead>Coupons Used</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {offers.map((offer) => {
                const offerCodes = discountCodes.filter(code => code.offerId === offer.id);
                const usedCodes = offerCodes.filter(code => code.isUsed).length;
                return (
                  <TableRow key={offer.id}>
                    <TableCell>
                      <div className="flex items-center">
                        <img 
                          src={offer.image} 
                          alt={offer.name}
                          className="w-10 h-10 rounded-lg object-cover mr-3"
                        />
                        <div>
                          <p className="text-sm">{offer.name}</p>
                          <p className="text-xs text-gray-600">{offer.description}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {offer.category}
                      </Badge>
                    </TableCell>
                    <TableCell>{offer.discount}%</TableCell>
                    <TableCell>{offerCodes.length}</TableCell>
                    <TableCell>{usedCodes}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEditRestaurant(offer)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          تعديل
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                              <Trash2 className="w-4 h-4 mr-1" />
                              حذف
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                              <AlertDialogDescription>
                                هل أنت متأكد من رغبتك في حذف مطعم "{offer.name}"؟ هذا الإجراء لا يمكن التراجع عنه.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>إلغاء</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDeleteRestaurant(offer.id, offer.name)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                حذف
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  const CustomersContent = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl text-gray-900 mb-2">Customer Management</h1>
        <p className="text-gray-600">View and manage platform customers</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Coupons Generated</TableHead>
                <TableHead>Coupons Used</TableHead>
                <TableHead>Join Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer) => {
                const customerCodes = discountCodes.filter(code => code.customerId === customer.id);
                const usedCodes = customerCodes.filter(code => code.isUsed).length;
                return (
                  <TableRow key={customer.id}>
                    <TableCell>{customer.name}</TableCell>
                    <TableCell>{customer.email}</TableCell>
                    <TableCell>{customer.phone}</TableCell>
                    <TableCell>{customerCodes.length}</TableCell>
                    <TableCell>{usedCodes}</TableCell>
                    <TableCell>
                      {customerCodes.length > 0 
                        ? customerCodes[0].createdAt.toLocaleDateString()
                        : 'N/A'
                      }
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  const CouponsContent = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl text-gray-900 mb-2">Coupon Management</h1>
        <p className="text-gray-600">Monitor all discount coupons on the platform</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Restaurant</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Used</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {discountCodes.map((code) => {
                const offer = offers.find(o => o.id === code.offerId);
                return (
                  <TableRow key={code.id}>
                    <TableCell className="font-mono">{code.code}</TableCell>
                    <TableCell>{offer?.name || 'Unknown'}</TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{code.customerName}</p>
                        <p className="text-xs text-gray-600">{code.customerEmail}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={code.isUsed ? "secondary" : "default"}
                        className={code.isUsed ? "bg-gray-100 text-gray-700" : "bg-green-100 text-green-700"}
                      >
                        {code.isUsed ? 'Used' : 'Active'}
                      </Badge>
                    </TableCell>
                    <TableCell>{code.createdAt.toLocaleDateString()}</TableCell>
                    <TableCell>
                      {code.usedAt ? code.usedAt.toLocaleDateString() : '-'}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  const ReportsContent = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl text-gray-900 mb-2">Analytics & Reports</h1>
        <p className="text-gray-600">Platform performance insights</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Usage Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Conversion Rate</span>
                <span className="text-lg">
                  {totalCouponsGenerated > 0 ? Math.round((totalCouponsUsed / totalCouponsGenerated) * 100) : 0}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Average Discount</span>
                <span className="text-lg">
                  {offers.length > 0 ? Math.round(offers.reduce((sum, offer) => sum + offer.discount, 0) / offers.length) : 0}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Active Coupons</span>
                <span className="text-lg">{totalCouponsGenerated - totalCouponsUsed}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Growth Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">New Customers</span>
                <div className="flex items-center">
                  <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                  <span className="text-lg text-green-600">+{totalCustomers}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">New Restaurants</span>
                <div className="flex items-center">
                  <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                  <span className="text-lg text-green-600">+{totalRestaurants}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Monthly Revenue</span>
                <span className="text-lg">$12,450</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <MainLayout showFooter={false} showHeader={false}>
      <SidebarProvider>
      <div className="min-h-screen bg-gray-50 flex">
        <AdminSidebarMenu />
        
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
            {activeTab === 'restaurants' && <RestaurantsContent />}
            {activeTab === 'customers' && <CustomersContent />}
            {activeTab === 'coupons' && <CouponsContent />}
            {activeTab === 'reports' && <ReportsContent />}
          </main>
        </div>
      </div>
      
      {/* Add Restaurant Dialog */}
      <AddRestaurantDialog 
        isOpen={isAddRestaurantDialogOpen} 
        onClose={() => setIsAddRestaurantDialogOpen(false)}
      />

      {/* Edit Restaurant Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>تعديل بيانات المطعم</DialogTitle>
            <DialogDescription>
              قم بتعديل بيانات المطعم أدناه
            </DialogDescription>
          </DialogHeader>
          {editingRestaurant && (
            <EditRestaurantForm 
              restaurant={editingRestaurant}
              onSubmit={handleUpdateRestaurant}
              onCancel={() => setIsEditDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
      </SidebarProvider>
    </MainLayout>
  );
}

// Edit Restaurant Form Component
function EditRestaurantForm({ 
  restaurant, 
  onSubmit, 
  onCancel 
}: { 
  restaurant: Restaurant; 
  onSubmit: (data: Partial<Restaurant>) => void; 
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    name: restaurant.name || '',
    restaurant_name: restaurant.restaurant_name || '',
    offer_name: restaurant.offer_name || '',
    image_url: restaurant.image_url || '',
    logo_url: restaurant.logo_url || '',
    discount_percentage: restaurant.discount_percentage || 0,
    description: restaurant.description || '',
    category: restaurant.category || 'restaurant' as const
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">اسم المطعم</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="restaurant_name">اسم المطعم المحدد</Label>
          <Input
            id="restaurant_name"
            value={formData.restaurant_name}
            onChange={(e) => setFormData(prev => ({ ...prev, restaurant_name: e.target.value }))}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="offer_name">اسم العرض</Label>
        <Input
          id="offer_name"
          value={formData.offer_name}
          onChange={(e) => setFormData(prev => ({ ...prev, offer_name: e.target.value }))}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="image_url">رابط الصورة</Label>
          <Input
            id="image_url"
            value={formData.image_url}
            onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="logo_url">رابط الشعار</Label>
          <Input
            id="logo_url"
            value={formData.logo_url}
            onChange={(e) => setFormData(prev => ({ ...prev, logo_url: e.target.value }))}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="discount_percentage">نسبة الخصم (%)</Label>
          <Input
            id="discount_percentage"
            type="number"
            min="0"
            max="100"
            value={formData.discount_percentage}
            onChange={(e) => setFormData(prev => ({ ...prev, discount_percentage: parseInt(e.target.value) || 0 }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="category">الفئة</Label>
          <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value as Restaurant['category'] }))}>
            <SelectTrigger>
              <SelectValue placeholder="اختر الفئة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="restaurant">مطعم</SelectItem>
              <SelectItem value="cafe">مقهى</SelectItem>
              <SelectItem value="bakery">مخبز</SelectItem>
              <SelectItem value="clothing">ملابس</SelectItem>
              <SelectItem value="other">أخرى</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="description">الوصف</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          required
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          إلغاء
        </Button>
        <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
          حفظ التغييرات
        </Button>
      </DialogFooter>
    </form>
  );
}
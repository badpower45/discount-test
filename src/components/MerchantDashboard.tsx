import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router';
import { AppContext } from '../App';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger } from './ui/sidebar';
import { 
  Home, 
  Ticket, 
  Users, 
  Settings, 
  Search,
  CheckCircle,
  XCircle,
  Calendar,
  TrendingUp,
  ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';
import { validateCoupon, useCoupon } from '../lib/database-functions';

export function MerchantDashboard() {
  const navigate = useNavigate();
  const { discountCodes, markCodeAsUsed } = useContext(AppContext);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [validateCode, setValidateCode] = useState('');
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    code?: any;
    message: string;
  } | null>(null);

  // Mock merchant data - in real app this would come from auth
  const merchantName = "Gourmet Bistro";
  const merchantCodes = discountCodes.filter(code => 
    code.offerId === '1' // Assuming this merchant owns offer with ID 1
  );

  const handleValidateCode = async () => {
    if (!validateCode.trim()) {
      toast.error('Please enter a code');
      return;
    }

    try {
      // Use real database RPC function to validate coupon
      const result = await validateCoupon(validateCode.trim(), '1'); // Using restaurant ID '1' for this merchant
      
      if (result.success && result.coupon) {
        setValidationResult({
          isValid: true,
          code: {
            ...result.coupon,
            customerName: result.coupon.customer_name || 'Unknown',
            customerEmail: result.coupon.customer_email || 'unknown@email.com',
          },
          message: 'Valid code ready to use'
        });
        toast.success('Valid code found!');
      } else {
        setValidationResult({
          isValid: false,
          message: result.error || 'Code not found or already used'
        });
        toast.error(result.error || 'Invalid code');
      }
    } catch (error) {
      console.error('Error validating coupon:', error);
      
      // Fallback to local data for development/testing
      const code = discountCodes.find(c => c.code === validateCode.trim());
      
      if (!code) {
        setValidationResult({
          isValid: false,
          message: 'Code not found'
        });
        toast.error('Invalid code');
        return;
      }

      if (code.isUsed) {
        setValidationResult({
          isValid: false,
          code,
          message: 'Code already used'
        });
        toast.error('Code already used');
        return;
      }

      setValidationResult({
        isValid: true,
        code,
        message: 'Valid code'
      });
      toast.success('Valid code!');
    }
  };

  const handleUseCode = async () => {
    if (!validationResult?.code) {
      toast.error('No code to use');
      return;
    }

    try {
      // Use real database RPC function to mark coupon as used
      const result = await useCoupon(validationResult.code.code, '1'); // Using restaurant ID '1' for this merchant
      
      if (result.success) {
        toast.success('Code successfully used!');
        // Update local state for UI consistency
        markCodeAsUsed(validationResult.code.id);
        setValidationResult({
          isValid: false,
          code: { ...validationResult.code, isUsed: true },
          message: 'Code marked as used'
        });
        setValidateCode('');
      } else {
        toast.error(result.error || 'Failed to use code');
      }
    } catch (error) {
      console.error('Error using coupon:', error);
      // Fallback for development/testing
      markCodeAsUsed(validationResult.code.id);
      setValidationResult({
        isValid: false,
        code: { ...validationResult.code, isUsed: true },
        message: 'Code marked as used'
      });
      setValidateCode('');
      toast.success('Code marked as used (offline mode)');
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
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center mr-3">
              <Home className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm text-gray-900">Merchant Dashboard</h2>
              <p className="text-xs text-gray-600">{merchantName}</p>
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
                  onClick={() => setActiveTab('validate')}
                  isActive={activeTab === 'validate'}
                >
                  <Search className="w-4 h-4" />
                  Validate Codes
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
                  onClick={() => setActiveTab('settings')}
                  isActive={activeTab === 'settings'}
                >
                  <Settings className="w-4 h-4" />
                  Settings
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
        <h1 className="text-2xl text-gray-900 mb-2">Dashboard Overview</h1>
        <p className="text-gray-600">Welcome back to your merchant dashboard</p>
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
                    <Button onClick={handleUseCode} variant="outline" size="sm">
                      Mark as Used
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
            {activeTab === 'customers' && <CustomersContent />}
            {activeTab === 'settings' && <SettingsContent />}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
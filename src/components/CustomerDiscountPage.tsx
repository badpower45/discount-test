import React, { useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router';
import { AppContext, type Customer, type DiscountCode } from '../App';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { ArrowLeft, Copy, CheckCircle, Tag, User, Mail, Phone } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

export function CustomerDiscountPage() {
  const { offerId } = useParams<{ offerId: string }>();
  const navigate = useNavigate();
  const { offers, addDiscountCode, addCustomer } = useContext(AppContext);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const offer = offers.find(o => o.id === offerId);

  if (!offer) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl text-gray-900 mb-4">Offer not found</h1>
          <Button onClick={() => navigate('/')}>
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const generateDiscountCode = () => {
    const prefix = 'EGY';
    const number = Math.floor(10000 + Math.random() * 90000);
    return `${prefix}-${number}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      const customerId = Date.now().toString();
      const codeId = Date.now().toString();
      const code = generateDiscountCode();

      // Add customer
      const customer: Customer = {
        id: customerId,
        name: formData.name,
        email: formData.email,
        phone: formData.phone
      };
      addCustomer(customer);

      // Add discount code
      const discountCode: DiscountCode = {
        id: codeId,
        code,
        customerId,
        customerName: formData.name,
        customerEmail: formData.email,
        customerPhone: formData.phone,
        offerId: offer.id,
        isUsed: false,
        createdAt: new Date()
      };
      addDiscountCode(discountCode);

      setGeneratedCode(code);
      setIsSubmitting(false);
      toast.success('Discount code generated successfully!');
    }, 1000);
  };

  const copyToClipboard = () => {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode);
      toast.success('Code copied to clipboard!');
    }
  };

  if (generatedCode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>

          <Card className="border-2 border-blue-200 shadow-lg">
            <CardHeader className="text-center bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-lg">
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl">Success!</CardTitle>
              <p className="text-blue-100">Your discount code is ready</p>
            </CardHeader>
            
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <h3 className="text-lg text-gray-900 mb-2">{offer.name}</h3>
                <p className="text-gray-600">{offer.discount}% Discount</p>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Your Discount Code</p>
                    <p className="text-2xl font-mono text-gray-900">{generatedCode}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyToClipboard}
                    className="ml-4"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </Button>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <h4 className="text-sm text-yellow-800 mb-2">How to use:</h4>
                <ol className="text-sm text-yellow-700 space-y-1">
                  <li>1. Visit {offer.name}</li>
                  <li>2. Show this code to the cashier</li>
                  <li>3. Enjoy your {offer.discount}% discount!</li>
                </ol>
              </div>

              <div className="text-center">
                <Button 
                  onClick={() => navigate('/')}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                >
                  Find More Deals
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Offers
        </Button>

        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center mx-auto mb-4">
              <Tag className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl text-gray-900">Get Your Discount</CardTitle>
            <p className="text-gray-600">Fill in your details to receive your discount code</p>
          </CardHeader>

          <CardContent className="p-8">
            {/* Offer Details */}
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6 mb-8">
              <div className="flex items-center">
                <img 
                  src={offer.image} 
                  alt={offer.name}
                  className="w-16 h-16 rounded-lg object-cover mr-4"
                />
                <div>
                  <h3 className="text-lg text-gray-900">{offer.name}</h3>
                  <p className="text-blue-600">Save {offer.discount}%</p>
                  <p className="text-sm text-gray-600">{offer.description}</p>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="name" className="flex items-center mb-2">
                  <User className="w-4 h-4 mr-2 text-gray-500" />
                  Full Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter your full name"
                  required
                  className="border-gray-200"
                />
              </div>

              <div>
                <Label htmlFor="phone" className="flex items-center mb-2">
                  <Phone className="w-4 h-4 mr-2 text-gray-500" />
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Enter your phone number"
                  required
                  className="border-gray-200"
                />
              </div>

              <div>
                <Label htmlFor="email" className="flex items-center mb-2">
                  <Mail className="w-4 h-4 mr-2 text-gray-500" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email address"
                  required
                  className="border-gray-200"
                />
              </div>

              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-3"
              >
                {isSubmitting ? 'Generating Code...' : 'Get Discount Code'}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-500">
              <p>By submitting, you agree to receive promotional offers and updates.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
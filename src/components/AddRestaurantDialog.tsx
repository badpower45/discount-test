import React, { useState, useContext } from 'react';
import { AppContext } from '../App';
import { addRestaurant } from '../lib/database-functions';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { toast } from 'sonner';
import { Plus, X } from 'lucide-react';

interface AddRestaurantDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddRestaurantDialog({ isOpen, onClose }: AddRestaurantDialogProps) {
  const { refreshData } = useContext(AppContext);
  
  const [formData, setFormData] = useState({
    name: '',
    restaurant_name: '',
    offer_name: '',
    image_url: '',
    logo_url: '',
    discount_percentage: '',
    description: '',
    category: 'restaurant' as 'restaurant' | 'cafe' | 'bakery' | 'other'
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSelectChange = (value: string) => {
    setFormData({
      ...formData,
      category: value as 'restaurant' | 'cafe' | 'bakery' | 'other'
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Convert discount percentage to number
      const discountPercentage = parseInt(formData.discount_percentage);
      
      if (isNaN(discountPercentage) || discountPercentage < 1 || discountPercentage > 100) {
        toast.error('نسبة الخصم يجب أن تكون رقماً بين 1 و 100');
        return;
      }

      const restaurantData = {
        name: formData.name.trim(),
        restaurant_name: formData.restaurant_name.trim(),
        offer_name: formData.offer_name.trim(),
        image_url: formData.image_url.trim(),
        logo_url: formData.logo_url.trim() || undefined,
        discount_percentage: discountPercentage,
        description: formData.description.trim(),
        category: formData.category
      };

      // Validate required fields
      if (!restaurantData.name || !restaurantData.image_url || !restaurantData.description) {
        toast.error('يرجى ملء جميع الحقول المطلوبة');
        return;
      }

      const result = await addRestaurant(restaurantData);

      if (result.success) {
        toast.success('تم إضافة المطعم بنجاح!');
        
        // Clear form
        setFormData({
          name: '',
          restaurant_name: '',
          offer_name: '',
          image_url: '',
          logo_url: '',
          discount_percentage: '',
          description: '',
          category: 'restaurant'
        });
        
        // Refresh data to show new restaurant
        refreshData();
        onClose();
      } else {
        console.error('Error adding restaurant:', result.error);
        toast.error('فشل في إضافة المطعم: ' + (result.error?.message || 'خطأ غير معروف'));
      }
    } catch (error) {
      console.error('Exception in handleSubmit:', error);
      toast.error('حدث خطأ أثناء إضافة المطعم');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            إضافة مطعم جديد
          </DialogTitle>
          <DialogDescription>
            املأ المعلومات أدناه لإضافة مطعم جديد إلى المنصة
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">الاسم العام للعرض *</Label>
            <Input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="مثال: خصم 20% على الوجبات"
              required
            />
          </div>

          <div>
            <Label htmlFor="restaurant_name">اسم المطعم</Label>
            <Input
              id="restaurant_name"
              name="restaurant_name"
              type="text"
              value={formData.restaurant_name}
              onChange={handleInputChange}
              placeholder="مثال: مطعم الأصالة"
            />
          </div>

          <div>
            <Label htmlFor="offer_name">اسم العرض المحدد</Label>
            <Input
              id="offer_name"
              name="offer_name"
              type="text"
              value={formData.offer_name}
              onChange={handleInputChange}
              placeholder="مثال: خصم على الوجبات الأساسية"
            />
          </div>

          <div>
            <Label htmlFor="discount_percentage">نسبة الخصم (%) *</Label>
            <Input
              id="discount_percentage"
              name="discount_percentage"
              type="number"
              min="1"
              max="100"
              value={formData.discount_percentage}
              onChange={handleInputChange}
              placeholder="مثال: 20"
              required
            />
          </div>

          <div>
            <Label htmlFor="category">الفئة *</Label>
            <Select value={formData.category} onValueChange={handleSelectChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="restaurant">مطعم</SelectItem>
                <SelectItem value="cafe">كافيه</SelectItem>
                <SelectItem value="bakery">مخبز</SelectItem>
                <SelectItem value="other">أخرى</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="description">الوصف *</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="اكتب وصفاً مفصلاً عن العرض والمطعم"
              required
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="image_url">رابط صورة العرض *</Label>
            <Input
              id="image_url"
              name="image_url"
              type="url"
              value={formData.image_url}
              onChange={handleInputChange}
              placeholder="https://example.com/image.jpg"
              required
            />
          </div>

          <div>
            <Label htmlFor="logo_url">رابط شعار المطعم (اختياري)</Label>
            <Input
              id="logo_url"
              name="logo_url"
              type="url"
              value={formData.logo_url}
              onChange={handleInputChange}
              placeholder="https://example.com/logo.png"
            />
          </div>

          <DialogFooter className="gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={isSubmitting}
            >
              <X className="w-4 h-4 mr-2" />
              إلغاء
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              <Plus className="w-4 h-4 mr-2" />
              {isSubmitting ? 'جاري الإضافة...' : 'إضافة المطعم'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
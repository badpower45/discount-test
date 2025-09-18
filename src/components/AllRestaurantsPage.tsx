import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../App';
import { MainLayout } from './MainLayout';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { MapPin, Clock, Search, Filter } from 'lucide-react';
import { Input } from './ui/input';

export function AllRestaurantsPage() {
  const { offers, loading } = useContext(AppContext);
  const navigate = useNavigate();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'discount' | 'date'>('name');

  // Filter and sort restaurants
  const filteredOffers = offers
    .filter(offer => {
      const matchesSearch = (offer.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (offer.restaurant_name && offer.restaurant_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (offer.offer_name && offer.offer_name.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = selectedCategory === 'all' || (offer.category && offer.category === selectedCategory);
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'discount':
          return b.discount - a.discount;
        case 'date':
          // Null-safe date comparison with fallback to epoch for invalid dates
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateB - dateA;
        default:
          return (a.restaurant_name || a.name).localeCompare(b.restaurant_name || b.name, 'ar');
      }
    });

  const categories = Array.from(new Set(offers.map(offer => offer.category).filter(Boolean)));

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">جاري تحميل المطاعم...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center">
              <h1 className="text-4xl font-bold mb-4">جميع المطاعم والمقاهي</h1>
              <p className="text-xl text-blue-100 mb-8">
                اكتشف أفضل العروض والخصومات من مطاعمك المفضلة
              </p>
              <div className="flex items-center justify-center text-blue-100">
                <Badge variant="secondary" className="text-lg px-4 py-2 bg-white/20 text-white border-0">
                  {offers.length} مطعم متاح
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <div className="flex flex-col lg:flex-row gap-4 items-center">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="ابحث عن المطاعم..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Category Filter */}
              <div className="w-full lg:w-48">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="فئة المطعم" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الفئات</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category === 'restaurant' ? 'مطعم' :
                         category === 'cafe' ? 'مقهى' :
                         category === 'bakery' ? 'مخبز' :
                         category === 'clothing' ? 'ملابس' : 'أخرى'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sort By */}
              <div className="w-full lg:w-48">
                <Select value={sortBy} onValueChange={(value) => setSortBy(value as 'name' | 'discount' | 'date')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">ترتيب أبجدي</SelectItem>
                    <SelectItem value="discount">أعلى خصم</SelectItem>
                    <SelectItem value="date">الأحدث</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Results Count */}
          <div className="mb-6">
            <p className="text-gray-600">
              عرض {filteredOffers.length} من {offers.length} مطعم
            </p>
          </div>

          {/* Restaurants Grid */}
          {filteredOffers.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">لم يتم العثور على مطاعم</h3>
              <p className="text-gray-500 mb-6">
                جرب البحث بكلمات مختلفة أو قم بتغيير الفلاتر
              </p>
              <Button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                variant="outline"
              >
                إعادة تعيين البحث
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredOffers.map((offer) => (
                <Card key={offer.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300 border border-gray-100">
                  <div className="relative">
                    <img 
                      src={offer.image} 
                      alt={offer.restaurant_name || offer.name}
                      className="w-full h-48 object-cover"
                    />
                    <Badge 
                      className="absolute top-3 right-3 bg-gradient-to-r from-red-500 to-red-600 text-white border-0"
                    >
                      -{offer.discount}%
                    </Badge>
                    {/* Restaurant Logo */}
                    {offer.logo_url && (
                      <div className="absolute top-3 left-3 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center border-2 border-white">
                        <img
                          src={offer.logo_url}
                          alt={`${offer.restaurant_name || offer.name} logo`}
                          className="w-8 h-8 object-contain rounded-full"
                        />
                      </div>
                    )}
                  </div>
                  
                  <CardContent className="p-6">
                    {/* Restaurant name and offer name */}
                    {offer.restaurant_name ? (
                      <div className="mb-2">
                        <h4 className="text-sm text-gray-500 uppercase tracking-wide">{offer.restaurant_name}</h4>
                        <h3 className="text-lg text-gray-900 font-semibold">{offer.offer_name || offer.name}</h3>
                      </div>
                    ) : (
                      <h3 className="text-lg text-gray-900 mb-2 font-semibold">{offer.name}</h3>
                    )}
                    
                    <p className="text-gray-600 mb-4 text-sm line-clamp-2">{offer.description}</p>
                    
                    <div className="flex items-center justify-between mb-4 text-xs text-gray-500">
                      <div className="flex items-center">
                        <MapPin className="w-3 h-3 mr-1" />
                        متاح للتوصيل
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        30-45 دقيقة
                      </div>
                    </div>

                    {/* Category Badge */}
                    <div className="flex items-center justify-between mb-4">
                      <Badge variant="outline" className="text-xs">
                        {(offer.category === 'restaurant') ? 'مطعم' :
                         (offer.category === 'cafe') ? 'مقهى' :
                         (offer.category === 'bakery') ? 'مخبز' :
                         (offer.category === 'clothing') ? 'ملابس' : 'أخرى'}
                      </Badge>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => navigate(`/get-discount/${offer.id}`)}
                        className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                        size="sm"
                      >
                        احصل على الخصم
                      </Button>
                      <Button 
                        onClick={() => navigate(`/order/${offer.id}`)}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        اطلب الآن
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../App';
import { MainLayout } from './MainLayout';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { MapPin, Clock, Search, Filter, UtensilsCrossed, Tag, ShoppingCart, TrendingDown } from 'lucide-react';
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
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
            <p className="text-lg text-muted-foreground font-medium">جاري تحميل المطاعم...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-b from-background via-accent/5 to-background">
        {/* Modern Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-purple-600 text-primary-foreground">
          {/* Decorative Background Elements */}
          <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
            <div className="text-center">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6 border border-white/30">
                <UtensilsCrossed className="w-4 h-4" />
                <span className="text-sm font-medium">أكثر من {offers.length} مطعم متاح</span>
              </div>
              
              <h1 className="text-4xl md:text-6xl font-extrabold mb-4 leading-tight">
                جميع المطاعم والمقاهي
              </h1>
              <p className="text-lg md:text-xl text-primary-foreground/90 max-w-2xl mx-auto leading-relaxed">
                اكتشف أفضل العروض والخصومات من مطاعمك المفضلة
              </p>
            </div>
          </div>
        </section>

        {/* Modern Search & Filters */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
          <Card className="shadow-2xl border border-border/50 bg-card/95 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4 items-center">
                {/* Search Bar - Modern Design */}
                <div className="flex-1 w-full relative">
                  <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                  <Input
                    placeholder="ابحث عن المطاعم، الأطباق، المأكولات..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pr-12 h-12 text-lg border-2 focus:border-primary rounded-xl"
                  />
                </div>

                {/* Category Filter */}
                <div className="w-full lg:w-56">
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="h-12 border-2 rounded-xl">
                      <Filter className="w-4 h-4 ml-2" />
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
                <div className="w-full lg:w-56">
                  <Select value={sortBy} onValueChange={(value) => setSortBy(value as 'name' | 'discount' | 'date')}>
                    <SelectTrigger className="h-12 border-2 rounded-xl">
                      <TrendingDown className="w-4 h-4 ml-2" />
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
            </CardContent>
          </Card>
        </section>

        {/* Results Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Results Count */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              النتائج المتاحة
            </h2>
            <p className="text-muted-foreground">
              عرض <span className="font-semibold text-primary">{filteredOffers.length}</span> من {offers.length} مطعم
            </p>
          </div>

          {/* Restaurants Grid */}
          {filteredOffers.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-28 h-28 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="w-14 h-14 text-muted-foreground" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-3">لم يتم العثور على مطاعم</h3>
              <p className="text-muted-foreground mb-8 text-lg">
                جرب البحث بكلمات مختلفة أو قم بتغيير الفلاتر
              </p>
              <Button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
              >
                إعادة تعيين البحث
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredOffers.map((offer) => (
                <Card 
                  key={offer.id} 
                  className="group overflow-hidden hover:shadow-2xl transition-all duration-500 border border-border/50 bg-card hover:-translate-y-1"
                >
                  {/* Image Section with Overlay */}
                  <div className="relative overflow-hidden h-56">
                    <img 
                      src={offer.image} 
                      alt={offer.restaurant_name || offer.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                    
                    {/* Discount Badge - Large & Modern */}
                    <div className="absolute top-4 right-4">
                      <div className="bg-gradient-to-br from-destructive to-chart-3 text-white px-4 py-2 rounded-2xl shadow-2xl backdrop-blur-sm border-2 border-white/20">
                        <div className="text-2xl font-black leading-none">{offer.discount}%</div>
                        <div className="text-[10px] font-medium">خصم</div>
                      </div>
                    </div>
                    
                    {/* Restaurant Logo */}
                    {offer.logo_url && (
                      <div className="absolute bottom-4 left-4 w-14 h-14 bg-card rounded-2xl shadow-2xl flex items-center justify-center border-2 border-white/50">
                        <img
                          src={offer.logo_url}
                          alt={`${offer.restaurant_name || offer.name} logo`}
                          className="w-11 h-11 object-contain rounded-xl"
                        />
                      </div>
                    )}
                  </div>
                  
                  <CardContent className="p-6 space-y-4">
                    {/* Restaurant Name & Offer */}
                    {offer.restaurant_name ? (
                      <div>
                        <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">
                          {offer.restaurant_name}
                        </p>
                        <h3 className="text-xl font-bold text-foreground line-clamp-1">
                          {offer.offer_name || offer.name}
                        </h3>
                      </div>
                    ) : (
                      <h3 className="text-xl font-bold text-foreground">{offer.name}</h3>
                    )}
                    
                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                      {offer.description}
                    </p>
                    
                    {/* Info Tags & Category */}
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="text-xs font-semibold">
                        {(offer.category === 'restaurant') ? 'مطعم' :
                         (offer.category === 'cafe') ? 'مقهى' :
                         (offer.category === 'bakery') ? 'مخبز' :
                         (offer.category === 'clothing') ? 'ملابس' : 'أخرى'}
                      </Badge>
                      <div className="flex items-center gap-1 text-xs bg-accent/10 text-accent px-3 py-1.5 rounded-lg">
                        <MapPin className="w-3 h-3" />
                        <span>توصيل متاح</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-lg">
                        <Clock className="w-3 h-3" />
                        <span>30-45 دقيقة</span>
                      </div>
                    </div>
                    
                    {/* CTA Buttons - Modern */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <Button 
                        onClick={() => navigate(`/get-discount/${offer.id}`)}
                        variant="outline"
                        className="border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all"
                      >
                        <Tag className="w-4 h-4 ml-2" />
                        احصل على خصم
                      </Button>
                      <Button 
                        onClick={() => navigate(`/order/${offer.id}`)}
                        className="bg-gradient-to-r from-primary via-primary to-purple-600 hover:from-primary/90 hover:to-purple-700 text-primary-foreground border-0 shadow-lg shadow-primary/30"
                      >
                        <ShoppingCart className="w-4 h-4 ml-2" />
                        اطلب الآن
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </MainLayout>
  );
}

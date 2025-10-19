import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../App';
import { MainLayout } from './MainLayout';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Grid3X3, Coffee, UtensilsCrossed, Tag, MapPin, TrendingDown, Clock, ShoppingCart } from 'lucide-react';

export function LandingPage() {
  const { offers } = useContext(AppContext);
  const navigate = useNavigate();
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('highest');

  const filteredOffers = offers
    .filter(offer => categoryFilter === 'all' || offer.category === categoryFilter)
    .sort((a, b) => {
      if (sortBy === 'highest') return b.discount - a.discount;
      if (sortBy === 'newest') return 0; // Mock: all are same date
      return 0;
    });

  const handleGetDiscount = (offerId: string) => {
    navigate(`/get-discount/${offerId}`);
  };

  const handleOrderNow = (offerId: string) => {
    navigate(`/order/${offerId}`);
  };

  return (
    <MainLayout>
      {/* Modern Hero Section with Gradient Background */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/10 min-h-[70vh] flex items-center">
        {/* Decorative Elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6 backdrop-blur-sm border border-primary/20">
              <Tag className="w-4 h-4" />
              <span className="text-sm font-medium">وفّر حتى 70% على طلباتك</span>
            </div>
            
            {/* Heading */}
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
              <span className="text-primary">خصومات حصرية على</span>
              <br />
              <span className="text-foreground">أفضل المطاعم</span>
            </h1>
            
            {/* Description */}
            <p className="max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground mb-10 leading-relaxed">
              استمتع بأشهى الأطباق مع خصومات حقيقية وتوصيل سريع.<br className="hidden sm:block" />
              اطلب الآن واكتشف عروضنا الحصرية.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Button 
                onClick={() => navigate('/restaurants')}
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl shadow-primary/25 text-lg px-8 py-6 h-auto"
              >
                <UtensilsCrossed className="w-5 h-5 ml-2" />
                استكشف المطاعم
              </Button>
              <Button 
                variant="outline"
                size="lg"
                onClick={() => navigate('/merchant-login')}
                className="border-2 text-lg px-8 py-6 h-auto hover:bg-accent"
              >
                لأصحاب المطاعم
              </Button>
            </div>

            {/* Stats Cards - Modern Design */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="group bg-card/60 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-border/50 hover:shadow-2xl hover:scale-105 transition-all duration-300">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <UtensilsCrossed className="w-7 h-7 text-primary-foreground" />
                </div>
                <p className="text-3xl font-bold text-foreground mb-1">+500</p>
                <p className="text-sm text-muted-foreground">مطعم ومطبخ متنوع</p>
              </div>
              
              <div className="group bg-card/60 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-border/50 hover:shadow-2xl hover:scale-105 transition-all duration-300">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-chart-2 to-chart-3 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Coffee className="w-7 h-7 text-white" />
                </div>
                <p className="text-3xl font-bold text-foreground mb-1">+200</p>
                <p className="text-sm text-muted-foreground">مقهى ومشروبات مميزة</p>
              </div>
              
              <div className="group bg-card/60 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-border/50 hover:shadow-2xl hover:scale-105 transition-all duration-300">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-chart-4 to-destructive flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Tag className="w-7 h-7 text-white" />
                </div>
                <p className="text-3xl font-bold text-foreground mb-1">يومياً</p>
                <p className="text-sm text-muted-foreground">عروض محدثة وحصرية</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modern Filters Section */}
      <section className="py-8 bg-card/30 backdrop-blur-sm sticky top-0 z-40 border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-1">
                العروض المتاحة
              </h2>
              <p className="text-sm text-muted-foreground">
                {filteredOffers.length} عرض مميز متاح الآن
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-background rounded-lg p-1 border border-border">
                <Grid3X3 className="w-4 h-4 text-muted-foreground mr-2" />
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-44 border-0 focus:ring-0">
                    <SelectValue placeholder="كل الفئات" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل الفئات</SelectItem>
                    <SelectItem value="restaurant">مطاعم</SelectItem>
                    <SelectItem value="cafe">مقاهي</SelectItem>
                    <SelectItem value="bakery">مخابز</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2 bg-background rounded-lg p-1 border border-border">
                <TrendingDown className="w-4 h-4 text-muted-foreground mr-2" />
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-44 border-0 focus:ring-0">
                    <SelectValue placeholder="ترتيب حسب" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="highest">أعلى خصم</SelectItem>
                    <SelectItem value="newest">الأحدث</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modern Offers Grid */}
      <section className="py-16 bg-gradient-to-b from-background to-accent/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
                  
                  {/* Restaurant Logo - Bottom Left */}
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
                  
                  {/* Info Tags */}
                  <div className="flex flex-wrap gap-2">
                    <div className="flex items-center gap-1 text-xs bg-accent/50 text-accent-foreground px-3 py-1.5 rounded-lg">
                      <MapPin className="w-3 h-3" />
                      <span>توصيل متاح</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-lg">
                      <Clock className="w-3 h-3" />
                      <span>صالح حتى 31/12</span>
                    </div>
                  </div>
                  
                  {/* CTA Buttons - Modern */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <Button 
                      onClick={() => handleGetDiscount(offer.id)}
                      variant="outline"
                      className="border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all"
                    >
                      <Tag className="w-4 h-4 ml-2" />
                      احصل على خصم
                    </Button>
                    <Button 
                      onClick={() => handleOrderNow(offer.id)}
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
        </div>
      </section>
    </MainLayout>
  );
}
import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router';
import { AppContext } from '../App';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Grid3X3, Coffee, UtensilsCrossed, Tag, MapPin, TrendingDown, Clock } from 'lucide-react';

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

  return (
    <div className="min-h-screen bg-white">

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-50 to-blue-100 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl text-gray-900 mb-6">
            Exclusive Discounts
          </h1>
          <p className="text-xl md:text-2xl text-blue-600 mb-8">
            Save up to 70% at your favorite restaurants and cafes
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <div className="flex items-center bg-white rounded-full px-6 py-3 shadow-sm">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center mr-3">
                <UtensilsCrossed className="w-4 h-4 text-white" />
              </div>
              <span className="text-gray-700">500+ Restaurants</span>
            </div>
            <div className="flex items-center bg-white rounded-full px-6 py-3 shadow-sm">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center mr-3">
                <Coffee className="w-4 h-4 text-white" />
              </div>
              <span className="text-gray-700">200+ Cafes</span>
            </div>
            <div className="flex items-center bg-white rounded-full px-6 py-3 shadow-sm">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center mr-3">
                <Tag className="w-4 h-4 text-white" />
              </div>
              <span className="text-gray-700">Daily Deals</span>
            </div>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="py-6 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-xl text-gray-900">
              Available Offers ({filteredOffers.length})
            </h2>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Grid3X3 className="w-4 h-4 text-gray-500" />
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="restaurant">Restaurants</SelectItem>
                    <SelectItem value="cafe">Cafes</SelectItem>
                    <SelectItem value="bakery">Bakeries</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-gray-500" />
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="highest">Highest Discount</SelectItem>
                    <SelectItem value="newest">Newest</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Offers Grid */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredOffers.map((offer) => (
              <Card key={offer.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300 border border-gray-100">
                <div className="relative">
                  <img 
                    src={offer.image} 
                    alt={offer.name}
                    className="w-full h-48 object-cover"
                  />
                  <Badge 
                    className="absolute top-3 right-3 bg-gradient-to-r from-red-500 to-red-600 text-white border-0"
                  >
                    -{offer.discount}%
                  </Badge>
                </div>
                
                <CardContent className="p-6">
                  <h3 className="text-lg text-gray-900 mb-2">{offer.name}</h3>
                  <p className="text-gray-600 mb-4">{offer.description}</p>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center text-sm text-gray-500">
                      <MapPin className="w-4 h-4 mr-1" />
                      Available for pickup & delivery
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="w-4 h-4 mr-1" />
                      Valid until Dec 31
                    </div>
                  </div>
                  
                  <Button 
                    onClick={() => handleGetDiscount(offer.id)}
                    className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0"
                  >
                    Get Discount
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
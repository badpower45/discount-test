import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import type { Order } from '../lib/database-functions';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const restaurantIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const customerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface DeliveryMapProps {
  order: Order;
  restaurantLocation?: { lat: number; lng: number };
  className?: string;
}

export function DeliveryMap({ order, restaurantLocation, className }: DeliveryMapProps) {
  const defaultCenter: [number, number] = [24.7136, 46.6753];
  
  const restaurantPos: [number, number] = restaurantLocation 
    ? [restaurantLocation.lat, restaurantLocation.lng]
    : defaultCenter;

  const customerPos: [number, number] = order.customer_location
    ? [order.customer_location.lat, order.customer_location.lng]
    : [defaultCenter[0] + 0.02, defaultCenter[1] + 0.02];

  const centerPos: [number, number] = [
    (restaurantPos[0] + customerPos[0]) / 2,
    (restaurantPos[1] + customerPos[1]) / 2
  ];

  return (
    <div className={className || 'w-full h-96 rounded-lg overflow-hidden border-2 border-gray-200'}>
      <MapContainer
        center={centerPos}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <Marker position={restaurantPos} icon={restaurantIcon}>
          <Popup>
            <div className="text-sm">
              <strong>المطعم</strong>
              <p>نقطة الاستلام</p>
            </div>
          </Popup>
        </Marker>
        
        <Marker position={customerPos} icon={customerIcon}>
          <Popup>
            <div className="text-sm">
              <strong>العميل</strong>
              <p>{order.customer_name}</p>
              <p>{order.customer_address}</p>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}

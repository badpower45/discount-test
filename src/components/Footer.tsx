import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Mail, Phone, MapPin, ShoppingCart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-gray-50 border-t">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Logo and Description */}
            <div className="col-span-1 md:col-span-2">
              <Link to="/" className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900">
                  DeliveryDeal
                </span>
              </Link>
              <p className="text-gray-600 mb-4 max-w-md">
                اكتشف خصومات حصرية واستمتع بالتوصيل السريع من مطاعمك ومقاهيك المفضلة. 
                وفر حتى 70% على كل طلب.
              </p>
              <div className="flex items-center gap-4">
                <a
                  href="#"
                  className="text-gray-400 hover:text-blue-600 transition-colors"
                  aria-label="Facebook"
                >
                  <Facebook className="w-5 h-5" />
                </a>
                <a
                  href="#"
                  className="text-gray-400 hover:text-blue-600 transition-colors"
                  aria-label="Twitter"
                >
                  <Twitter className="w-5 h-5" />
                </a>
                <a
                  href="#"
                  className="text-gray-400 hover:text-blue-600 transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
                روابط سريعة
              </h3>
              <ul className="space-y-3">
                <li>
                  <Link to="/" className="text-gray-600 hover:text-blue-600 transition-colors">
                    الرئيسية
                  </Link>
                </li>
                <li>
                  <Link to="/" className="text-gray-600 hover:text-blue-600 transition-colors">
                    كل المطاعم
                  </Link>
                </li>
                <li>
                  <Link to="/about" className="text-gray-600 hover:text-blue-600 transition-colors">
                    من نحن
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="text-gray-600 hover:text-blue-600 transition-colors">
                    اتصل بنا
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
                التواصل
              </h3>
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-gray-600">
                  <Mail className="w-4 h-4" />
                  <span>support@deliverydeal.com</span>
                </li>
                <li className="flex items-center gap-2 text-gray-600">
                  <Phone className="w-4 h-4" />
                  <span>+20 123 456 789</span>
                </li>
                <li className="flex items-start gap-2 text-gray-600">
                  <MapPin className="w-4 h-4 mt-0.5" />
                  <span>القاهرة، مصر</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="py-6 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-sm">
              © {new Date().getFullYear()} DeliveryDeal. جميع الحقوق محفوظة.
            </p>
            <div className="flex items-center gap-6">
              <Link
                to="/privacy"
                className="text-gray-500 hover:text-blue-600 text-sm transition-colors"
              >
                سياسة الخصوصية
              </Link>
              <Link
                to="/terms"
                className="text-gray-500 hover:text-blue-600 text-sm transition-colors"
              >
                شروط الخدمة
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
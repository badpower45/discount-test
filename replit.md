# Overview

This project is a Progressive Web App (PWA) discount and delivery platform designed to connect users with discounts from restaurants and cafes. Users can browse offers, place orders with delivery, and merchants can manage orders and validate discount codes. The application features separate dashboards for customers, merchants, delivery drivers, and administrators, offering full CRUD capabilities for managing restaurants, customers, orders, and discount codes. It aims to provide an app-like experience with PWA features like offline functionality, push notifications, and installability on mobile devices.

## Recent Changes (October 2025)

### Dispatcher System Implementation (October 19, 2025)
- ✅ **Database Updates**: Added 'dispatcher' role to merchants table
- ✅ **New RPC Functions**: 
  - `assign_order_to_driver_by_dispatcher()` - Allows dispatchers to assign orders to drivers
  - `rate_driver_by_dispatcher()` - Enables driver performance rating system
  - `fetch_ready_orders_for_dispatcher()` - Returns orders ready for pickup
  - `fetch_available_drivers()` - Lists available drivers for assignment
- ✅ **New Order Status**: Added 'en_route_to_restaurant' status for detailed delivery tracking
- ✅ **Dispatcher Dashboard**: Complete interface for managing order assignments
  - View ready-for-pickup orders
  - View available drivers with ratings
  - Assign orders to drivers with one click
  - Rate driver performance after deliveries
- ✅ **Enhanced Driver Dashboard**:
  - Integrated map showing restaurant and customer locations
  - New detailed status workflow buttons:
    - "في طريقي للمطعم" (En route to restaurant)
    - "استلمت الطلب" (Picked up from restaurant)
    - "في طريقي للعميل" (In transit to customer)
    - "تم التسليم" (Delivered)
  - Visual progress tracker for delivery status
- ✅ **Map Integration**: Added react-leaflet for delivery route visualization
- ✅ **Customer Location**: Added customer_location field to orders table for map display

### End-to-End Testing Infrastructure (October 19, 2025)
- ✅ **Test Data Tools**:
  - `test-data-setup.html` - Interactive HTML tool to seed test data (restaurants, drivers, customers)
  - `test-data.sql` - SQL script for batch data insertion
- ✅ **Comprehensive Documentation**:
  - `CREATE_TEST_ACCOUNTS.md` - Step-by-step guide for creating merchant/dispatcher/driver accounts
  - `END_TO_END_TESTING_GUIDE.md` - Complete 5-stage testing scenario with verification steps
  - `QUICK_START_TESTING.md` - Quick reference for rapid testing setup
- ✅ **Test Accounts Setup**:
  - Clear instructions for linking Supabase Auth users to merchants/delivery_drivers tables
  - SQL snippets for role assignment and verification
  - Troubleshooting guides for common issues

### Supabase Integration Completed
- ✅ Configured environment variables (`.env` file with Supabase URL and anon key)
- ✅ Fixed Vite configuration for Replit environment (HMR settings)
- ✅ Verified all database connections and RPC functions working correctly

### Order System Improvements  
- ✅ **Fixed critical bug**: Removed authentication gate blocking guest orders in `OrderPage.tsx`
- ✅ Both authenticated and guest users can now place orders successfully
- ✅ Guest orders create temporary customer records in database
- ✅ **Full order lifecycle** (October 19, 2025):
  1. Customer → places order (pending_restaurant_acceptance)
  2. Merchant → accepts (confirmed) → prepares (preparing) → marks ready (ready_for_pickup)
  3. Dispatcher → assigns driver manually (en_route_to_restaurant)
  4. Driver → updates status through workflow (picked_up → in_transit → delivered)

### Dashboard Functionality Verified
- ✅ **Merchant Dashboard**: Orders tab with accept/reject, preparing, and ready-for-pickup buttons
  - **Updated workflow**: Removed automatic driver assignment - now dispatchers manually assign drivers after merchant marks order as ready
- ✅ **Dispatcher Dashboard**: Order assignment, driver management, and rating system
  - Fully functional with fetchReadyOrdersForDispatcher(), fetchAvailableDrivers(), assignOrderToDriverByDispatcher(), and rateDriverByDispatcher()
- ✅ **Delivery Driver Dashboard**: Shows assigned orders with map integration and detailed status updates
  - Integrated DeliveryMap component showing restaurant and customer locations
  - Status update buttons for complete delivery workflow
- ✅ **Admin Dashboard**: Full restaurant management (add, edit, delete)
- ✅ **Coupon Management**: Mark as Used button updates database and UI instantly

### Real-time Features
- ✅ Merchant dashboard receives real-time notifications for new orders with sound alerts
- ✅ Auto-refresh every 30 seconds for orders
- ✅ Optimistic UI updates for instant user feedback

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The frontend is a React-based Progressive Web App (PWA) built with Vite. It utilizes React Router for client-side navigation and a context-based `AppContext` for global state management. The UI is constructed using modular components, Radix UI primitives styled with shadcn/ui and TailwindCSS for a mobile-first, responsive design. PWA features like a Service Worker for offline support and push notifications are integrated.

## Backend Architecture
The backend leverages Supabase as a Backend-as-a-Service (BaaS), providing a PostgreSQL database, authentication, and real-time APIs. It follows a serverless approach, with Supabase handling server operations. Custom Hono-based server functions extend business logic.

## Data Storage Solutions
The application employs a hybrid data storage strategy, combining Supabase's structured PostgreSQL database with a custom key-value store (`kv_store_9d4ae86c`) for flexible data needs. The database schema includes tables for users, offers, customers, and discount codes, with JSONB fields for complex data.

## Authentication and Authorization
Supabase Auth manages user authentication, including secure session handling and role-based access control for customers, merchants, and administrators. Security features include Supabase Row Level Security (RLS) and secure handling of environment variables and API keys.

## UI/UX Design
The application emphasizes a consistent and functional user experience. UI components from Radix UI are used with custom styling via shadcn/ui and TailwindCSS. The design supports dark/light mode theming and is optimized for mobile devices. Features like carousel components (Embla Carousel), resizable panels, and charting (Recharts) are integrated for enhanced usability.

## PWA and Native App Configuration
The application is configured as a PWA with a manifest file and service worker for offline capabilities and push notifications. Additionally, Capacitor is integrated to build native Android and iOS applications, including native push notifications, splash screens, and status bar controls. Build scripts are provided for generating native builds.

# External Dependencies

-   **Frontend Frameworks**: React, React Router DOM, Vite
-   **UI & Styling**: Radix UI Components, TailwindCSS, Lucide React, Class Variance Authority, Clsx, Tailwind Merge, Next Themes
-   **Backend & Database**: Supabase JS Client, Hono
-   **Form & Data Management**: React Hook Form, React Day Picker, Input OTP
-   **UI Enhancement**: Sonner, Embla Carousel React, React Resizable Panels, Recharts, CMDK
-   **Development Utilities**: PostCSS, Autoprefixer, Serve
-   **Environment Configuration**: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
-   **PWA Specifics**: Web App Manifest (`public/manifest.json`), Service Worker (`public/service-worker.js`), Notification Manager component
-   **Capacitor Integration**: `@capacitor/push-notifications`, `@capacitor/splash-screen`, `@capacitor/status-bar`
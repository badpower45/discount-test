# Overview

This is a discount platform web application similar to "Waffarha" that allows users to browse offers from restaurants and cafes, register to receive unique discount codes, and enables merchants to validate those codes. The application provides separate dashboards for customers, merchants, and administrators with full CRUD operations for managing offers, customers, and discount codes.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The application uses a React-based single-page application (SPA) architecture built with Vite as the build tool. The frontend leverages React Router for client-side routing and implements a context-based state management system through `AppContext` to share application state across components.

**Key Design Decisions:**
- **Component Structure**: Modular components for different user roles (LandingPage, CustomerDiscountPage, MerchantDashboard, AdminDashboard)
- **State Management**: React Context API for global state management of offers, discount codes, and customers
- **UI Framework**: Comprehensive use of Radix UI components with custom styling through shadcn/ui component library
- **Styling**: TailwindCSS for utility-first styling with custom CSS variables for theming support

## Backend Architecture
The application uses Supabase as a Backend-as-a-Service (BaaS) solution, providing PostgreSQL database, authentication, and real-time APIs. The backend architecture follows a serverless approach with Supabase handling all server-side operations.

**Key Design Decisions:**
- **Database**: PostgreSQL through Supabase for storing users, offers, discount codes, and customer information
- **API Layer**: Supabase auto-generated REST APIs for all database operations
- **Server Functions**: Custom Hono-based server functions for additional business logic and API endpoints
- **Data Storage**: Key-value store implementation using Supabase tables for flexible data storage

## Data Storage Solutions
The application implements a hybrid data storage approach combining Supabase's structured database with a custom key-value store for flexible data storage needs.

**Database Schema Design:**
- User authentication handled by Supabase Auth
- Structured tables for offers, customers, and discount codes
- Key-value store table (`kv_store_9d4ae86c`) for flexible data storage
- JSONB fields for storing complex data structures

## Authentication and Authorization
Authentication is managed through Supabase Auth, providing secure user management and session handling. The application supports role-based access control for different user types (customers, merchants, administrators).

**Security Features:**
- Supabase Row Level Security (RLS) for data protection
- Environment variable management for sensitive configuration
- Secure API key handling through Vite environment variables

## External Dependencies

### Core Framework Dependencies
- **React 18.3.1**: Main frontend framework with modern hooks and concurrent features
- **React Router DOM 6.26.0**: Client-side routing for single-page application navigation
- **Vite**: Modern build tool and development server with hot module replacement

### UI and Styling Libraries
- **Radix UI Components**: Comprehensive set of unstyled, accessible UI primitives including accordion, alert-dialog, avatar, checkbox, dialog, dropdown-menu, popover, select, tabs, tooltip, and more
- **TailwindCSS**: Utility-first CSS framework for rapid UI development
- **Lucide React 0.487.0**: Modern icon library with React components
- **Class Variance Authority 0.7.1**: Utility for creating component variants
- **Clsx 2.1.0**: Utility for constructing className strings conditionally
- **Tailwind Merge 2.2.0**: Utility to merge Tailwind CSS classes

### Backend and Database
- **Supabase JS Client 2.39.3**: JavaScript client library for Supabase backend services
- **Hono 4.0.0**: Fast web framework for server functions and API endpoints

### Form and Data Management
- **React Hook Form 7.55.0**: Performant forms library with easy validation
- **React Day Picker 8.10.1**: Flexible date picker component
- **Input OTP 1.4.2**: One-time password input component

### UI Enhancement Libraries
- **Next Themes 0.4.6**: Theme management for dark/light mode support
- **Sonner 2.0.3**: Toast notification system
- **Embla Carousel React 8.6.0**: Carousel component for image galleries
- **React Resizable Panels 2.1.7**: Resizable panel layout components
- **Recharts 2.15.2**: Data visualization and charting library

### Development and Utility
- **CMDK 1.1.1**: Command palette interface component
- **Serve 14.2.5**: Static file serving for production builds
- **PostCSS**: CSS post-processor for TailwindCSS integration
- **Autoprefixer**: CSS vendor prefixing

### Environment Configuration
The application requires environment variables for Supabase integration:
- `VITE_SUPABASE_URL`: Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Supabase anonymous key for client-side operations

# Recent Updates (September 18, 2025)

## Final Project Import and Merchant Orders Implementation Completion
- **GitHub Import**: Successfully imported and configured the project from GitHub into Replit environment
- **Dependencies Installation**: All npm packages and dependencies installed correctly 
- **Environment Configuration**: Supabase environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) properly configured
- **Database Setup**: Created complete PostgreSQL database with all necessary tables (restaurants, customers, merchants, coupons, orders, delivery_drivers)
- **Orders Management System**: Merchant dashboard fully functional with complete order workflow:
  - Orders tab displaying pending orders requiring restaurant acceptance
  - Accept/Reject buttons for incoming orders
  - Status progression: pending_restaurant_acceptance → preparing → ready_for_pickup
  - Real-time order updates and auto-refresh functionality
- **Development Server**: Frontend server configured on port 5000 with proper host settings (0.0.0.0) for Replit proxy
- **Deployment Ready**: Configured autoscale deployment with proper build and run commands for production

## Technical Configuration Verified
- **Complete Database Schema**: All tables created with proper relationships and indexes
- **RPC Functions**: Order management functions implemented (update_order_status, generate_order_number)
- **Sample Data**: Test customers, orders, and delivery drivers created for immediate testing
- **Vite HMR**: Hot module replacement working correctly with allowedHosts configuration
- **React App**: Successfully rendering with all components functional
- **Authentication System**: Supabase Auth integration working for role-based access
- **Real-time Updates**: Database change subscriptions properly configured

## Complete Merchant Workflow Implemented
According to the provided plan, the merchant order management system is now fully operational:
1. ✅ Customers can create orders (status: pending_restaurant_acceptance)
2. ✅ Merchants see new orders in their dashboard and can accept/reject them
3. ✅ After acceptance, merchants can mark orders as "ready for delivery" (status: ready_for_pickup)  
4. ✅ Orders then appear in driver dashboard for pickup and delivery
5. ✅ All status transitions are properly handled with database updates

# Previous Updates (September 13, 2025)

## Latest Feature Enhancements
- **Customer Database Registration**: Fixed customer registration flow to ensure customers are properly saved to database during coupon generation
- **Real-time Data Flow**: Implemented comprehensive data refresh mechanism so customers appear in admin dashboards immediately after registration
- **Admin Restaurant Management**: Added "Add Restaurant" functionality to admin dashboard with complete form validation and database integration
- **Improved Error Handling**: Enhanced CustomerDiscountPage to show proper error messages when database operations fail instead of showing false success messages

## Code Quality Improvements
- **Database Consistency**: Fixed coupon generation to only show success when database operations actually succeed
- **Real-time Updates**: Integrated refreshData calls throughout the app to ensure dashboard data stays synchronized with database
- **Clean Architecture**: Removed unused variables and imports to maintain clean, error-free codebase
- **Security**: All operations use secure RPC functions with proper error handling and authentication checks

# Previous Updates (September 2025)

## Critical Issue Resolution
- **App Stability**: Fixed critical Vite HMR configuration issue that caused constant app restarts and data loss during user input
- **Database Persistence**: Resolved coupon generation failures by fixing ambiguous column references in PostgreSQL functions

## Enhanced Security Implementation  
- **Authentication System**: Complete Supabase Auth integration with merchant login/logout functionality
- **Role-Based Access**: Admin dashboard protected with role-based authentication (admin@platform.com)
- **Production Security**: Demo credentials hidden in production builds, test accounts available in development
- **Row Level Security**: Comprehensive RLS policies documented for production deployment

## Database Schema Enhancements
- **Extended Fields**: Added logo_url, restaurant_name, and offer_name fields as requested
- **Real Data Integration**: All components now use Supabase database instead of mock data
- **Merchant Data**: Real-time coupon fetching per restaurant using fetchRestaurantCoupons RPC function
- **Admin Statistics**: Dashboard shows live statistics from database via fetchDashboardStats

## UI/UX Improvements
- **Restaurant Logos**: Logo display integrated across LandingPage and CustomerDiscountPage
- **Merchant Dashboard**: Real-time coupon validation and usage tracking with proper authentication
- **Admin Dashboard**: Live platform statistics with real database aggregations
- **Consistent Branding**: Separate display of restaurant names and offer names throughout interface

## Production Readiness
- **No LSP Errors**: Clean codebase with no compilation or type errors  
- **Security Verified**: All critical vulnerabilities resolved through authentication and authorization controls
- **End-to-End Tested**: Complete flow verified from coupon generation to dashboard display
- **Database Integrity**: All operations properly save to and retrieve from Supabase PostgreSQL
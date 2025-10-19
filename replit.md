# Overview

This project is a Progressive Web App (PWA) discount platform, similar to "Waffarha," designed to connect users with discounts from restaurants and cafes. Users can browse offers, register for unique discount codes, and merchants can validate these codes. The application features separate dashboards for customers, merchants, and administrators, offering full CRUD capabilities for managing offers, customers, and discount codes. It aims to provide an app-like experience with PWA features like offline functionality, push notifications, and installability on mobile devices.

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
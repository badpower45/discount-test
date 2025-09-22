
  # Discount Platform Interface Design

  This is a code bundle for Discount Platform Interface Design. The original project is available at https://www.figma.com/design/4BdhCodO3wMleG2XtngpLD/Discount-Platform-Interface-Design.

  ## Running the code

  1) Install dependencies
  - Run `npm i`

  2) Configure environment
  - Copy `.env.example` to `.env` and set:
    - `VITE_SUPABASE_URL`
    - `VITE_SUPABASE_ANON_KEY`

  3) Initialize database (Supabase SQL editor)
  - Run `database-setup.sql` (creates tables, RLS, and RPCs)
  - Then run `secure-admin-fix.sql` (policies/admin hardening)

  4) Start the dev server
  - Run `npm run dev`
  
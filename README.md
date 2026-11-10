# TenantSpark

Property management software for small landlords (1 to 50 units). One Next.js app serves the public site at `/` and the landlord app under `/dashboard`.

## Stack

- Next.js 16 (App Router) on Vercel
- Supabase for Postgres, auth and row level security
- Stripe for rent collection (step 3, not wired yet)

## Local setup

1. `npm install`
2. Copy `.env.example` to `.env.local` (values are the public URL and publishable key; both are safe in the browser).
3. Run the SQL in `supabase/migrations/` against the Supabase project, in order, from the SQL editor.
4. `npm run dev` and open http://localhost:3000

## Build steps

1. Logins, properties, units, tenants, leases (this version)
2. Tenant portal and lease e-signing
3. Rent collection through Stripe Connect
4. Maintenance requests
5. Accounting and owner reports
6. Subscription billing and launch

## Data rules

Every table has `account_id`. Row level security uses `public.is_member(account_id)` so a landlord only sees their own account. New sign-ups get a profile, an account and an owner membership from the `on_auth_user_created` trigger.

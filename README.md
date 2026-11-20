# Ganesh Utsav 2027

A mobile-first Next.js 15 festival site for the Suryodaya Colony Ganesh Utsav in Bandlaguda Jagir, Hyderabad. The public website uses Next.js App Router, React, Tailwind CSS, Framer Motion and a small Three.js devotional sculpture. Supabase Auth and Postgres power volunteer registration and the committee dashboard.

## Run locally

1. Use Node.js 20.9 or newer.
2. Copy `.env.example` to `.env.local` and fill in the Supabase project URL and anon key.
3. Run `npm install`, then `npm run dev`.
4. Open `http://localhost:3000`.

The public pages work without Supabase. Volunteer submissions and the admin dashboard require the database setup below. Never put a Supabase `service_role` key in a `NEXT_PUBLIC_*` variable or browser code.

## Supabase setup

1. Create a Supabase project and run `database/schema.sql` in the SQL editor.
   For an existing project, apply each required script in `database/migrations` after the base schema. The donation payment-status migration preserves existing donations as received and updates public financial totals.
2. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to `.env.local`. This project reads the `ANON_KEY` variable; a Supabase publishable key may be supplied as its value. To initialize the public page with the figures shown in the supplied reference, run `database/seed-reference.sql` once. The seed includes public donor names; confirm the data and donors’ display consent before running it in production. Without Supabase, the site uses the same reference figures locally until live data is configured.
   The Committee Portal uses Supabase email/password authentication. Supabase SSR cookies persist and refresh the session, and use `Secure` in production; “Remember Me” stores only the email address, never the password.
3. Create the first committee user in Supabase Authentication. Enter the account email and password directly in the Supabase dashboard; do not put credentials in source control or environment variables. The schema creates a matching `public.users` row with the `editor` role. Promote the first trusted account to Super Admin in the Supabase SQL editor:

   ```sql
   update public.users
   set role = 'super_admin'
   where id = (select id from auth.users where email = 'your-admin@example.com');
   ```

4. Create additional committee accounts through Supabase Auth. Promote authorized administrators to `admin`; `editor` accounts cannot access the Committee Portal. Both `admin` and `super_admin` roles are required for portal access.
5. In Supabase Authentication URL Configuration, allow the local and production callback URLs ending in `/admin/reset-password`. This is required for the Forgot Password flow.

The schema enables row-level security, permits only pending public volunteer applications, restricts donor/expense/volunteer details to committee admins, and records data mutations and admin login/logout/failed-login events in `audit_logs`. Failed-login audit records do not store passwords or attempted email addresses. Supabase Auth rate limits sign-in attempts; session refresh and token expiry follow the project's Auth settings.

## Production settings

Set `NEXT_PUBLIC_SITE_URL` to the canonical HTTPS deployment URL and configure the Supabase public URL/anon key in Vercel Project Settings. Deploy from the project root; `vercel.json` pins the Next.js framework. Use Supabase storage (with suitable bucket policies) for uploaded media and set public sponsor, event and gallery records in Postgres.

The provided PhonePe QR image is carried over from the previous project. Verify that the receiving account is current before publishing. Configure the donation UPI ID and `NEXT_PUBLIC_COMMITTEE_PHONE` only after the committee confirms the correct values; replace any demo links in `app/page.tsx` before production. Browser push events can be displayed by the included service worker; a production push sender still needs VAPID credentials and a trusted server-side delivery job.

## Checks

- `npm run typecheck`
- `npm run build`

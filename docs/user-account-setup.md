# User accounts setup

## Local environment

1. Copy `.env.example` to `.env.local`.
2. Set the project URL and publishable key from the Supabase project:
   - `VITE_SUPABASE_URL=https://vqdihhzbimmotbmhqknc.supabase.co`
   - `VITE_SUPABASE_PUBLISHABLE_KEY=<your publishable key>`
3. Install dependencies with `npm install` (this also updates `package-lock.json`).
4. Start the app with `npm run dev`.

Never put a Supabase secret/service-role key in frontend environment variables or commit a real `.env.local` file.

## Supabase Auth configuration

In Supabase Dashboard → Authentication → URL Configuration:

- Set the Site URL to the deployed app origin.
- Add the local origin (for example `http://localhost:5173/**`) to Redirect URLs.
- Add the deployed app origin and its `/reset-password` route to Redirect URLs.

Keep email confirmation enabled in Authentication settings. The app sends users to the site root after confirmation and to `/reset-password` after a password recovery request.

The built-in email sender is suitable for initial testing but has strict sending limits. Configure custom SMTP before public production use.

## Database

The SQL migrations in `supabase/migrations` create the `profiles` table, ownership-based RLS policies, a profile-on-signup trigger, and the public `avatars` Storage bucket with per-user upload/update/delete policies.

The migrations have already been applied to the linked Supabase project. If setting up another project, apply them in filename order using the Supabase CLI or SQL editor.

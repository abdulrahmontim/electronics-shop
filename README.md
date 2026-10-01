# Electronics Shop (Bench Supply)

An electronics parts shop built with Next.js 15, Supabase, and Mailgun.

## 1. Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com).
2. Go to SQL Editor and run `supabase/schema.sql` first.
3. Run `supabase/seed.sql` to populate products.
4. Copy your Project URL and anon public key from Settings > API.

## 2. Google sign-in

1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Create OAuth consent screen (External) and add test users if needed.
3. Create OAuth client ID as Web application.
4. Add authorized JavaScript origins: `http://localhost:3000` and your Vercel URL.
5. Add authorized redirect URI: `https://<your-project-ref>.supabase.co/auth/v1/callback`
6. In Supabase, go to Authentication > Providers and enable Google, enter Client ID and Client Secret.
7. Under Authentication > URL Configuration, set Site URL to your Vercel URL or `http://localhost:3000` and add Redirect URLs `http://localhost:3000/**` and your Vercel URL.

## 3. Mailgun

1. Create a Mailgun account and use a sandbox domain or verified domain.
2. If using sandbox, verify recipient email addresses (sandbox only delivers to approved recipients).
3. Get your private API key, domain name, and API base URL (EU accounts use `https://api.eu.mailgun.net`).
4. Optionally set `MAILGUN_FROM` - defaults to `Bench Supply <postmaster@DOMAIN>`.

## 4. Local development

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env.local` and fill values
3. Run: `npm run dev`
4. Open [http://localhost:3000](http://localhost:3000)

## 5. Vercel

1. Push to GitHub repository named `electronics-shop`
2. Import project in Vercel
3. Add all environment variables from `.env.example`
4. Deploy
5. Add the live URL to Google OAuth origins and Supabase redirect URLs

## 6. Test checklist

- View catalogue and filter by category
- View product page
- Add to cart (quantities 1-10)
- Cart persists on refresh, quantities 1-20, duplicates merge
- Sign in with Google
- Checkout with valid details
- Order saved via `place_order`, email sent (or failed notice shown)
- View orders list and order detail
- Other account cannot see your orders

## 7. Troubleshooting

- `redirect_uri_mismatch`: check Supabase and Google redirect URIs match exactly
- Products not loading: check Supabase URL/key and RLS policies
- Order saved but no email: check Mailgun sandbox recipient verification or API key/domain
- Wrong redirect after login: ensure `next` parameter is valid
- Missing environment variables: verify all vars are set in Vercel/local
# Electronics Shop (Bench Supply)

An electronics parts shop built with Next.js 15, Supabase, and Mailgun.

## 1. Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com).
2. Go to SQL Editor and run `supabase/schema.sql` first.
3. Run `supabase/seed.sql` to populate products.
4. Run `supabase/cart.sql`. This creates the `cart_items` table that lets one signed-in customer keep the same cart on the web shop and on the mobile app. Without it the shop still works, but the cart is only kept in the browser or on the phone and does not follow the customer between them. Both files are safe to run on an existing project.
5. Product photos already live in `public/products/`. Run `supabase/set_images.sql` in the SQL Editor to point each product at its photo. Skip this and products fall back to the generated resistor art.
6. To fetch or replace photos later: `python fetch_product_images.py` (see `IMAGE_CREDITS.md` for the authors and licences it records).
7. Copy your Project URL and anon public key from Settings > API.

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

## Contact address

Set `NEXT_PUBLIC_SHOP_CONTACT_EMAIL` to the shop owner email address. It is shown on the `/privacy` page as the contact for questions and deletion requests. If it is left empty the page falls back to the placeholder `YOUR-EMAIL@gmail.com`, so set it locally and in Vercel before deploying.

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
- With the mobile app installed and both apps signed in as the same account, an item added on the web appears on the phone, and an item added on the phone appears on the web

## 7. Mobile app (Android)

The `mobile/` folder holds an Expo app that is a native client for this same shop. It uses this project's Supabase, the same Google accounts, the same products and the same cart. It does not have its own backend, and it does not take payment.

Two things must be in place first:

- `supabase/cart.sql` has been run (step 1.4 above), otherwise the cart is not shared.
- These redirect URLs have been added to Supabase Authentication > URL Configuration > Redirect URLs:

  ```
  benchsupply://auth/callback
  exp://**/--/auth/callback
  ```

  The first is what a development build or APK uses. The second only matters for testing in Expo Go. If the URI the app is using is not in the allowlist, Supabase does not show an error: it redirects to the Site URL instead, which signs the customer in on the web shop and leaves the phone showing a failed sign-in.

  Google Cloud Console needs no change for mobile. The OAuth handshake starts at Supabase, so Google only ever sees the Supabase callback URI.

Then:

1. `cd mobile && npm install`
2. `cp .env.example .env` and fill in `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` from Settings > API. Keep `EXPO_PUBLIC_API_URL` pointed at the deployed shop; a phone cannot reach `localhost`.
3. `npx expo start --clear`, then open it on the phone.
4. Google sign-in needs a development build or an APK, because Expo Go cannot handle the app's `benchsupply://` scheme:

   ```bash
   npx expo install expo-dev-client
   npx expo run:android
   ```

Full instructions, including how to build an APK, are in `mobile/README.md`.

The app never receives the Mailgun key or a Supabase service role key. Orders are placed by calling this project's own `/api/checkout`, which is the only place `place_order` and the confirmation email run.

## 8. Troubleshooting

- `redirect_uri_mismatch`: check Supabase and Google redirect URIs match exactly
- Products not loading: check Supabase URL/key and RLS policies
- Order saved but no email: check Mailgun sandbox recipient verification or API key/domain
- Wrong redirect after login: ensure `next` parameter is valid
- Missing environment variables: verify all vars are set in Vercel/local
- App says "Bench Supply needs configuring": `mobile/.env` is missing or the dev server needs `--clear`, because `EXPO_PUBLIC_` values are baked in when the bundle is built
- Cart does not follow you between web and phone: `supabase/cart.sql` has not been run
- Google sign-in on the phone closes without signing in: `benchsupply://auth/callback` is not an allowed Supabase redirect URL, or you are in Expo Go instead of a development build. The app prints the exact URI it is using as `[auth] redirect URI:` in the Metro terminal.
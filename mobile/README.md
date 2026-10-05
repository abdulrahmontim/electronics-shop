# Bench Supply mobile

The Bench Supply shop on Android, built with Expo and React Native. It is a native
client for the existing web shop: the same Supabase project, the same Google
accounts, the same products and the same cart.

Nothing about ordering happens on the phone. The app reads products and orders
through the public Supabase API, and places orders by calling the web app's
`/api/checkout` endpoint, which is the only place `place_order` and the Mailgun
confirmation email run.

## What you need first

Two things must be done outside this folder before the app can show data:

1. Run `supabase/cart.sql` from the repository root in the Supabase SQL editor.
   It creates the `cart_items` table that makes the cart shared between web and
   mobile.
2. Add the redirect URLs listed below to Supabase Auth (Authentication > URL
   Configuration > Redirect URLs).

## Redirect URLs to add in Supabase

Add these exact strings to **Authentication > URL Configuration > Redirect URLs**:

| URL | When it is used |
| --- | --- |
| `benchsupply://auth/callback` | Development build and APK. This is the one that matters. |
| `exp://**/--/auth/callback` | Only for testing in Expo Go. |

Why both: the app builds its redirect URI with `Linking.createURL`, so the value
depends on how the app is running. A real install produces `benchsupply://auth/callback`.
Expo Go produces `exp://<your-lan-ip>:8081/--/auth/callback` instead, and Expo Go
does not register the `benchsupply` scheme.

If the redirect URI is missing from the allowlist, Supabase does not report an
error. It quietly redirects to the Site URL instead, which signs the customer in
on the **web** shop and leaves the phone showing a failed sign-in. If that
happens, check this list first.

**Google Cloud Console needs no change for mobile.** The OAuth handshake starts
at `https://<project-ref>.supabase.co/auth/v1/authorize`, so Google only ever
sees the Supabase callback URI that is already registered there.

## Run it

```bash
npm install
cp .env.example .env
```

Fill in `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` from the
Supabase dashboard (Project Settings > Data API). `EXPO_PUBLIC_API_URL` should
stay pointed at the deployed shop, `https://raycoder-electronics-shop.vercel.app`.

```bash
npm start          # then press a for Android
npm run android    # build and launch on a connected device or emulator
```

`EXPO_PUBLIC_API_URL` must never be a `localhost` address. A physical phone
cannot reach your laptop, so the checkout endpoint and the product images have to
come from the deployed site.

## Layout

```text
mobile/
├── app.json            app name, slug, scheme, splash and icon colours
├── src/
│   ├── app/            Expo Router routes
│   │   ├── _layout.tsx fonts, splash, providers, root stack
│   │   ├── (tabs)/     Shop, Cart, Orders, Account
│   │   ├── product/    Product detail
│   │   ├── order/      Order detail
│   │   ├── checkout.tsx
│   │   └── login.tsx
│   ├── components/     Button, Field, Chip, Message, product art, hero resistor
│   ├── constants/      Colours, spacing, type scale
│   └── lib/            Supabase, auth, cart, products, orders, checkout, money
└── assets/             Icons and splash images
```

## How the cart is shared

The database is the source of truth, not the phone.

- Signed in: cart lines are read from and written to `cart_items`, which is
  protected by row level security so a customer only ever sees their own cart.
  Row level security on the web app enforces the same rule.
- Signed out: lines are kept in AsyncStorage so a guest can browse and build a
  cart. They are pushed to the database on sign-in and then cleared locally, so
  nothing picked as a guest is lost.
- Every mutation is followed by a re-read, and the cart is refreshed when the
  cart screen is opened and when the app comes back to the foreground. That is
  what makes web to mobile and mobile to web work in both directions.

## How signing in works

The app uses **PKCE**, the same flow as the web shop, so both resolve to the same
Supabase user and therefore the same orders and shared cart.

`expo-web-browser` opens Google's consent screen in a system tab.
`signInWithOAuth` with `skipBrowserRedirect` returns the authorisation URL rather
than opening it, and Supabase stores a single-use PKCE code verifier in
AsyncStorage. `openAuthSessionAsync` watches for the redirect to come back to the
app, and the returned `?code=` is exchanged with `exchangeCodeForSession`. The
session is established inside the app, and the tab closes itself.

No access or refresh token ever passes through a URL. The browser is only Google's
consent screen; nothing about the mobile session depends on a cookie belonging to
the web app.

The session is stored in AsyncStorage, so customers stay signed in across normal
app restarts.

This requires the redirect URL for the current run to be in the Supabase allowlist,
and a development build or APK. Expo Go cannot complete the flow, because it does
not register the `benchsupply://` scheme; the app detects this and says so instead
of failing silently.

## Build an APK

The app is a normal Expo project, so either EAS or a local build works.

```bash
npm install -g eas-cli
eas login
eas build --profile preview --platform android
```

Add an `eas.json` first if you want a specific profile. The build needs the three
`EXPO_PUBLIC_` values configured on the EAS project, either in `eas.json` or in
the EAS dashboard's environment variables. Expo Go cannot load a custom scheme
callback, so use a development build or a full APK to test signing in.

## Checks

```bash
npx tsc --noEmit
```

## Assets still to replace

`assets/images/icon.png`, `assets/images/splash-icon.png` and the
`android-icon-*` set are still the Expo starter artwork. Replace them with Bench
Supply artwork before the demo. The splash and adaptive icon background colours
have already been changed to the shop's paper colour, `#F4F5F1`.
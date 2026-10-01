# AGENTS.md

## Task

Build a website for a shop called **Bench Supply**, an electronics parts shop (boards, sensors, tools, components), with all of the following:

1. A shop website: product catalogue, product pages, category filter, cart.
2. A **checkout page**.
3. **Everything persisted in a database using Supabase** (Postgres): products, orders and order items.
4. **Confirmation emails sent with Mailgun** after every order.
5. **Google authentication** set up through Google Cloud Console (using Supabase Auth's Google provider).
6. Order history and order detail pages for signed-in customers.
7. Ready to deploy on Vercel.

Out of scope: online payments, an admin dashboard, and any feature not listed above.

The project folder, npm package name and GitHub repository are all named `electronics-shop`. The shop's public brand name stays **Bench Supply**.

## Working rules

Work autonomously from start to finish. Make normal decisions yourself (code edits, structure, refactors, dependencies the build needs) and report afterward. Ask the owner only when something is genuinely blocked, such as a real credential you cannot create from this environment.

Safety rules that always apply:

1. If the folder is empty, scaffold from scratch. If files exist, inspect them first, keep what works, and delete nothing unrelated.
2. Run `git init` if needed and commit after each major step so any step can be undone.
3. Never run SQL against a live database. Write SQL only to the files in `supabase/`. The owner runs it.
4. Never push, deploy, or force-reset git. Never delete data.
5. Never fabricate credentials. Use placeholders. Never commit secrets or a real `.env` file.
6. Add no dependency beyond the stack below unless the build truly requires it, and name any you add in your final report.
7. Verify as you go (typecheck and build after each major step), not only at the end.

## Stack (fixed)

- Next.js 15, App Router, React 19, TypeScript strict
- `@supabase/ssr` and `@supabase/supabase-js`
- Supabase Postgres, Supabase Auth (Google provider)
- Mailgun REST API through plain `fetch`. No Mailgun SDK.
- Plain CSS in `app/globals.css`. No Tailwind, no component library.
- npm, with `"name": "electronics-shop"` in `package.json` and scripts `dev`, `build`, `start`, `typecheck` (`tsc --noEmit`)
- Import alias `@/*`
- Do not use `next/font/google`. Load fonts with `<link>` tags in `app/layout.tsx`.

## Project structure

Inside the `electronics-shop` folder:

```text
app/
  layout.tsx  page.tsx  globals.css  not-found.tsx  error.tsx  loading.tsx
  api/checkout/route.ts
  auth/callback/route.ts
  auth/signout/route.ts
  cart/page.tsx
  checkout/page.tsx  CheckoutForm.tsx
  login/page.tsx
  orders/page.tsx  orders/[id]/page.tsx
  products/[slug]/page.tsx
components/        Header, CartProvider, CartLink, AddToCart, ProductCard, BandArt, Resistor, GoogleButton
lib/
  config.ts        shop name, category list
  format.ts        formatNaira, formatDate, safeNext
  resistor.ts      colour code table, value formatter, slug-to-bands hash
  mailgun.ts       sendEmail, sendOrderConfirmation
  supabase/client.ts  server.ts  middleware.ts
supabase/schema.sql  seed.sql
middleware.ts
.env.example  .gitignore  README.md  package.json  tsconfig.json  next.config.mjs
```

Component file names are flexible. The route paths are not.

## Environment

`.env.example`:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
MAILGUN_API_KEY=
MAILGUN_DOMAIN=
MAILGUN_API_BASE=
MAILGUN_FROM=
```

- Only `NEXT_PUBLIC_*` values may reach the browser. `MAILGUN_API_KEY` is server-only.
- The app must build without real credentials. Never query Supabase, Google or Mailgun at module load or build time.

## Supabase clients

- `client.ts`: `createBrowserClient`, used only in client components.
- `server.ts`: `createServerClient` with async `cookies()`, used in Server Components and route handlers.
- `middleware.ts` (in `lib/supabase/`): `updateSession` refreshes the session on every request. Root `middleware.ts` calls it, with a matcher that skips static assets.
- Next 15: `cookies()`, `params` and `searchParams` are Promises. Always `await` them.
- Type `setAll` explicitly or the strict build fails:
  `setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[])`, with `CookieOptions` imported from `@supabase/ssr`.

## Database

### `supabase/schema.sql`

Idempotent: safe to paste into the Supabase SQL editor on an existing project (`if not exists`, `create or replace`, `drop policy if exists` before every `create policy`). Minor SQL fixes for valid Postgres are fine. Do not change the data model or security behaviour.

**products**: `id uuid pk default gen_random_uuid()`, `slug text unique not null`, `name text not null`, `description text not null default ''`, `category text not null`, `price_ngn integer not null check (price_ngn > 0)`, `image_url text`, `in_stock boolean not null default true`, `created_at timestamptz not null default now()`

**orders**: `id uuid pk default gen_random_uuid()`, `user_id uuid not null references auth.users(id) on delete cascade`, `email text not null`, `full_name text not null`, `phone text not null`, `address text not null`, `city text not null`, `state text not null`, `total_ngn integer not null check (total_ngn >= 0)`, `status text not null default 'placed'`, `created_at timestamptz not null default now()`

**order_items**: `id uuid pk default gen_random_uuid()`, `order_id uuid not null references orders(id) on delete cascade`, `product_id uuid references products(id) on delete set null`, `product_name text not null`, `unit_price_ngn integer not null`, `quantity integer not null check (quantity > 0)`

Indexes: `orders (user_id, created_at desc)` and `order_items (order_id)`.

### Row level security

Enable RLS on all three tables. Never disable it to fix an app problem.

- `products`: select for `anon` and `authenticated`, `using (true)`.
- `orders`: select and insert for `authenticated` where `auth.uid() = user_id`.
- `order_items`: select and insert for `authenticated` where an `exists` query on `orders` confirms the parent order has `user_id = auth.uid()`.
- No update or delete policies for customers.

### Function `place_order`

The only way orders are created. Route code must never insert into `orders` or `order_items`.

```text
place_order(p_full_name text, p_phone text, p_address text, p_city text, p_state text, p_items jsonb) returns uuid
language plpgsql, security invoker, set search_path = public
```

`p_items` is `[{ "product_id": "<uuid>", "quantity": 2 }]`. Steps, in order:

1. If `auth.uid()` is null: `raise exception 'Sign in to place an order'`.
2. If any delivery field is empty after trimming: `raise exception 'Fill in every delivery field'`.
3. If `p_items` is not a non-empty array: `raise exception 'Your cart is empty'`.
4. Merge duplicate `product_id` values by summing quantities, then clamp each merged quantity to 1..20.
5. Join the merged lines to `products` where `in_stock = true`. Sum `price_ngn * quantity` as `bigint`.
6. If the number of matched products differs from the number of merged lines: `raise exception 'Some items in your cart are no longer available'`.
7. Insert the order with `auth.jwt() ->> 'email'` as the email and the computed total. Compute the total first so the order never needs updating.
8. Insert the order items, copying `product_name` and `price_ngn` from `products`.
9. Return the order id.

`revoke execute ... from public`, then `grant execute ... to authenticated`. All deliberate failures use `raise exception` so the SQLSTATE is `P0001`.

### `supabase/seed.sql`

12 products, `on conflict (slug) do nothing`, slugs are the lowercase hyphenated name, each with a one-sentence plain description:

| Product | Price (₦) | Category |
|---|---|---|
| Arduino Uno R3 compatible board | 14500 | Boards |
| ESP32 DevKit V1 | 11000 | Boards |
| Breadboard 830 points | 3800 | Parts |
| Jumper wire set 120 pieces | 3200 | Parts |
| Resistor kit 600 pieces | 8500 | Kits |
| Capacitor kit 300 pieces | 7500 | Kits |
| LED kit 300 pieces | 4500 | Kits |
| NE555 timer IC pack of 10 | 3500 | Parts |
| Soldering iron 60 W adjustable | 12000 | Tools |
| Digital multimeter | 9500 | Tools |
| HC-SR04 ultrasonic sensor | 2500 | Sensors |
| SG90 micro servo | 2800 | Sensors |

Categories are exactly: Boards, Parts, Kits, Tools, Sensors.

## Money

Prices are integer naira. Never use floats for money. One helper formats everything: `"₦" + new Intl.NumberFormat("en-NG").format(n)`. The browser never determines the authoritative price, subtotal or total. Supabase does.

## Authentication

- `/login`: a "Continue with Google" button calling `supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/auth/callback?next=...` } })`. Show a clear message when `?error=auth` is present.
- `/auth/callback`: calls `exchangeCodeForSession(code)`, then redirects to the validated `next` path. On failure, redirect to `/login?error=auth`.
- `/auth/signout`: POST route that signs out and redirects with status 303.
- `next` is valid only if it starts with `/` and not `//`. Otherwise use `/`. Implement as `safeNext` in `lib/format.ts` and use it everywhere.
- Middleware: signed-out users requesting `/checkout`, `/orders` or `/orders/*` are redirected to `/login?next=<path>`.

## Pages and behaviour

**Home `/`** (Server Component): hero with the interactive resistor, category chips driven by `?category=` (validated against the five categories, anything else shows all), product grid. Handle loading (`loading.tsx`), error (clear message that products could not load) and empty states.

**Product `/products/[slug]`**: load by slug from Supabase, call `notFound()` if missing. Show art, name, category, price, description, stock status, quantity selector (1 to 10) and "Add to cart". Out-of-stock products show "Out of stock" instead of the button. Set the page title to the product name.

**Cart `/cart`**: client-side React context persisted in `localStorage`. Add, change quantity, remove, clear. Quantity stays between 1 and 20. Duplicate products merge into one line. The header count badge renders only after hydration. On the cart and checkout pages, refresh each line's name, price and availability from Supabase (products are publicly readable) so the numbers shown match what will be charged. Flag or drop lines that are no longer available and tell the customer.

**Checkout `/checkout`**: signed-in only. Read-only email, full name (prefilled from Google metadata when present), phone, address, city, state, plus an order summary. Disable the submit button while submitting so an order cannot be placed twice. Button text: "Place order, ₦X". Submit JSON to `POST /api/checkout`:

```json
{ "full_name": "", "phone": "", "address": "", "city": "", "state": "", "items": [{ "product_id": "", "quantity": 2 }] }
```

On success: clear the cart and go to `/orders/<id>?email=sent` or `?email=failed`.

**`POST /api/checkout`**:

1. `supabase.auth.getUser()`. Return 401 if there is no user.
2. Trim and require every delivery field, with sensible max lengths.
3. Validate each `product_id` as a UUID, merge duplicate lines, cap at 50 unique lines. Reject an empty cart.
4. Call `supabase.rpc("place_order", ...)`. Never insert into `orders` directly.
5. If the error code is `P0001`, return its message with 400. For any other error, log it (never secrets) and return a generic 500.
6. Fetch the new order with `order_items(*)`.
7. Send the confirmation email inside `try/catch`.
8. Return `{ "orderId": "...", "emailSent": true | false }`. A failed email never undoes or hides a saved order.

**Orders `/orders`**: the signed-in user's orders, newest first, with reference, date, status and total. Empty state links to the shop.

**Order `/orders/[id]`**: validate the id as a UUID, then query by id (RLS limits it to the owner). `notFound()` if missing. Show reference (first 8 characters of the id, uppercase), date, status, line items with quantities and prices, total and delivery details. `?email=sent` shows a success notice with the email address. `?email=failed` shows a neutral notice that the order is saved but the email could not be sent.

## Mailgun (`lib/mailgun.ts`)

- `POST {MAILGUN_API_BASE or https://api.mailgun.net}/v3/{MAILGUN_DOMAIN}/messages`
- Header `Authorization: Basic base64("api:" + MAILGUN_API_KEY)`, form-encoded body with `from`, `to`, `subject`, `text`, `html`.
- Default `from`: `Bench Supply <postmaster@DOMAIN>`, unless `MAILGUN_FROM` is set.
- Throw a clear error when the key or domain is missing, or when Mailgun returns a non-2xx response.
- Content: order reference, each product name with quantity and unit price, total, delivery address. Send both a plain-text and an HTML version.
- Escape every user-supplied value in the HTML (`& < > "`).
- Subject: `Your Bench Supply order <REFERENCE>`.

## Design

Do not produce a generic template. The visual identity is the resistor colour code.

**Hero resistor** (HTML and CSS, a client component): a large resistor with a blue body, three band buttons and a fixed gold tolerance band. Pressing a band cycles its value: first digit 1 to 9, second digit 0 to 9, multiplier 0 to 6. Show the live value in large display type (for example "4.7 kΩ") and a one-line hint. Each band button has an `aria-label` naming its role and colour. This is the one memorable element. Keep everything else quiet.

**Product art**: when `image_url` is empty, render a small resistor in HTML and CSS whose three bands come deterministically from a hash of the product slug, so every product has stable art. When `image_url` exists, show the image.

**Palette** (define as CSS variables):

```text
Paper #F4F5F1   Panel #E7EAE3   Ink #1B2440   Muted #5A6378
Hairline #D3D8D0   Resistor blue #3E6FA3   Band yellow #F2B705
```

**Type**: Bricolage Grotesque for headings (weights 600 and 800), IBM Plex Sans for body. Left aligned. Body lines under 80 characters.

**Layout**: sticky header with "Bench Supply", Shop, Orders (signed in), Cart with count badge, Sign in or Sign out. Product grid: `repeat(auto-fill, minmax(240px, 1fr))`, each product showing art, name, category and price. Cart and order lines are ruled rows, not cards.

**Avoid**: gradients, cream and terracotta, black with neon accent, identical shadowed cards, monospace for ordinary labels, ALL-CAPS eyebrow labels, accenting a single word in a headline, `→` on buttons, numbered markers on non-sequences, generic marketing filler.

**Copy**: plain sentence case. Buttons say what happens ("Add to cart", "Place order, ₦X", "Continue shopping", "Sign in", "Sign out") and the same action keeps the same name everywhere. Errors say what went wrong and what to do next. Empty states give a next action.

**Accessibility**: skip link, visible keyboard focus, a label on every input, semantic HTML, `aria-live` for status messages, everything usable by keyboard, `prefers-reduced-motion` respected, layout works down to 360 px wide.

## Security

- Never trust the browser for prices, totals, product names, order ownership or auth state. Verify on the server.
- Never expose `MAILGUN_API_KEY` (or any service-role key) to client code.
- Never log API keys, access tokens, OAuth codes or passwords.
- Escape user content in email HTML. Validate redirect targets with `safeNext`.
- Never disable RLS and never bypass `place_order`.

## Verification

Run `npm install`, then:

```bash
npx tsc --noEmit
NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=dummy npx next build
```

Both must pass without Supabase, Google or Mailgun network access. Then check by reading the code and, where possible, running it:

- every required route exists
- category filter ignores invalid categories
- cart survives a refresh, quantities stay within 1 to 20, duplicates merge
- checkout rejects missing fields, bad UUIDs, an empty cart and unavailable products
- orders are created only through `place_order`, with totals from database prices
- unsafe `next` values are rejected
- no secret appears in client code or in git (`git grep` for key names and values)

If real credentials are available, also test the full flow: Google sign-in, shop, product, add to cart, cart, checkout, place order, rows in `orders` and `order_items`, confirmation email received, `/orders`, `/orders/[id]`, and a second account cannot see the first account's order.

Do not claim the real-service flow was tested unless it was. Without credentials, say plainly that it remains a manual test.

## README.md

Title it "Electronics Shop (Bench Supply)". Write it for someone doing the setup, in this order:

1. **Supabase**: create a project, run `supabase/schema.sql`, then `supabase/seed.sql`, copy the project URL and anon key.
2. **Google sign-in**: Google Cloud Console OAuth consent screen (add test users), Web application OAuth client, authorized JavaScript origins for `http://localhost:3000` and the Vercel URL, authorized redirect URI `https://<project-ref>.supabase.co/auth/v1/callback`. Then enable the Google provider in Supabase with the client ID and secret, and set Site URL and Redirect URLs (`http://localhost:3000/**` and the Vercel URL) under Authentication > URL Configuration.
3. **Mailgun**: sandbox domain, add and verify recipient addresses (sandbox only delivers to approved recipients), private API key, domain name, API base URL (EU accounts use `https://api.eu.mailgun.net`).
4. **Local development**: `npm install`, copy `.env.example` to `.env.local`, `npm run dev`.
5. **Vercel**: push to GitHub, import, add every environment variable, deploy, then add the live URL to the Google OAuth origins and the Supabase redirect URLs.
6. **Test checklist**: the end-to-end flow above.
7. **Troubleshooting**: `redirect_uri_mismatch`, products not loading, order saved but no email, wrong redirect after login, missing environment variables.

## Definition of done

1. `npx tsc --noEmit` and the placeholder-credential `next build` both pass.
2. All routes in this document exist and handle loading, empty and error states.
3. Catalogue, category filter, product pages and the persistent cart work.
4. Google authentication is implemented and checkout and orders are protected.
5. Orders and order items are saved through `place_order`, with totals from database prices.
6. RLS protects user data. A customer can read only their own orders.
7. The Mailgun confirmation email is implemented, and an email failure never invalidates a saved order.
8. No secret is exposed to the browser or committed to git.
9. The README is complete and the project is ready to deploy on Vercel.

## Final report

Keep it short:

- **Built**: what was implemented.
- **Changes from this document**: only deviations, with the reason. Include any dependency you added.
- **Manual setup still required**: Supabase, Google Cloud, Mailgun, Vercel environment variables.
- **Not finished**: anything you could not complete.
- **Testing**: what was tested against real services and what was not.

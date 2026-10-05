# Bench Supply Mobile App — AGENTS.md

## 1. Mission

Build the mobile version of the existing Bench Supply electronics e-commerce website in this `mobile/` directory.

This is an HNG Lesson 3 task.

The mobile app must be a real Expo/React Native application that uses the **same backend, same users, same products, and same cart** as the existing web application.

The goal is NOT to build a separate mobile shop.

The goal is to create a **native, responsive mobile client for the existing Bench Supply shop**.

---

# 2. NON-NEGOTIABLE REQUIREMENTS

These requirements have priority over everything else.

### Same backend

The mobile app MUST use the existing web application's backend.

Do NOT create:

* another database
* another Supabase project
* another authentication system
* another cart database
* another product database
* fake production data
* a separate mobile backend

Inspect the existing web application first and use its existing API/backend.

### Same account

A user must be able to use the SAME account on:

* web
* mobile

Do not create mobile-only accounts.

### Same cart

The web and mobile applications MUST share the same backend cart.

Both directions must work:

**Web → Mobile**

1. Sign into web.
2. Add Product A to web cart.
3. Open mobile.
4. Sign into the same account.
5. Product A must appear in mobile cart.

**Mobile → Web**

1. Sign into mobile with the same account.
2. Add Product B to mobile cart.
3. Return to web.
4. Product B must appear in web cart.

This bidirectional cart synchronization is the most important Lesson 3 requirement.

The backend is the source of truth.

Do NOT use AsyncStorage, local state, or localStorage as the authoritative cart.

---

# 3. FIRST STEP: INSPECT BEFORE CODING

Before making significant changes:

1. Read the root `AGENTS.md`.
2. Inspect the existing web application.
3. Inspect the actual web UI.
4. Inspect authentication.
5. Inspect session handling.
6. Inspect product fetching.
7. Inspect cart implementation.
8. Inspect cart API routes/endpoints.
9. Inspect Supabase schema/migrations.
10. Inspect checkout/order implementation.
11. Identify reusable framework-independent types/utilities.
12. Determine how the mobile app should communicate with the existing backend.

Do NOT guess:

* API endpoints
* database tables
* request formats
* response formats
* authentication behavior
* product fields
* cart behavior
* checkout behavior

Confirm them from the repository.

Do not spend excessive time producing a report. Inspect efficiently, make a short plan, then implement.

---

# 4. DO NOT BREAK THE WEB APP

The existing web application must continue working.

Do not rewrite the web application simply to make mobile development easier.

Do not unnecessarily refactor existing web components.

If a backend change is required for mobile, make the smallest safe change and verify the web application still works.

---

# 5. UI SOURCE OF TRUTH

The existing web application is the **primary visual and functional reference** for the mobile app.

Inspect the actual web UI before designing mobile screens.

Use it to understand:

* Bench Supply branding
* colors
* typography
* spacing
* buttons
* cards
* product presentation
* images
* navigation
* information hierarchy
* empty states
* loading states
* error states
* checkout
* account pages

The mobile application should clearly look and feel like the same Bench Supply product.

However, DO NOT simply shrink the desktop website.

The web UI is the starting point; improve and adapt it for mobile.

Examples:

* desktop navbar → mobile navigation/bottom tabs
* desktop product grid → responsive mobile grid
* hover interactions → touch interactions
* wide layouts → vertical mobile layouts
* tiny desktop controls → comfortable touch controls
* dense desktop content → simplified mobile presentation where appropriate

Do not invent an unrelated visual identity.

---

# 6. RESPONSIVE MOBILE DESIGN

Responsive behavior is mandatory.

The app must NOT be designed specifically for only the current phone.

It must adapt to different Android phone screen sizes and dimensions.

Use flexible React Native layouts rather than hardcoded screen dimensions.

Prefer:

* Flexbox
* available width
* responsive spacing
* `useWindowDimensions` where useful
* `FlatList`
* `ScrollView`
* flexible image sizing
* text wrapping
* safe-area handling

Avoid:

* fixed desktop-style widths
* hardcoded screen sizes
* horizontal overflow
* layouts that only work on one phone

The following must remain usable across small and large phones:

* navigation
* product cards
* product grids
* product details
* search
* forms
* buttons
* cart
* checkout
* account screens

Test the UI on the physical Android phone and, where practical, at another screen size.

---

# 7. TECHNOLOGY

Use:

* Expo
* React Native
* TypeScript
* Expo Router
* existing backend/API
* Supabase JS where appropriate

Do NOT switch to Flutter.

Do NOT use a WebView as the main application.

Do NOT build the mobile app as a website inside the phone.

This must be a real React Native application.

---

# 8. NATIVE COMPONENTS

Use React Native components such as:

* `View`
* `Text`
* `Image`
* `Pressable`
* `TextInput`
* `ScrollView`
* `FlatList`
* `ActivityIndicator`

Do NOT directly import web UI components.

Do NOT use:

* `<div>`
* `<button>`
* `<img>`
* web CSS
* CSS modules
* Tailwind web classes
* Next.js components
* browser-only APIs

Inspect web components for design/behavior, then recreate them appropriately in React Native.

---

# 9. BRANDING

Preserve the existing Bench Supply visual identity.

Known design references include:

* Paper: `#F4F5F1`
* Panel: `#E7EAE3`
* Ink: `#1B2440`
* Muted: `#5A6378`
* Hairline: `#D3D8D0`
* Resistor Blue: `#3E6FA3`
* Band Yellow: `#F2B705`

These are references.

If the current web application uses different or updated values, inspect and follow the current web implementation.

Do not randomly introduce a new color palette.

---

# 10. NAVIGATION

Use Expo Router.

Adapt the existing web information architecture for mobile.

A bottom navigation such as:

* Home
* Shop
* Cart
* Account

is appropriate if it fits the existing application.

Do not force a structure that conflicts with the existing web app.

Navigation must be obvious and touch-friendly.

---

# 11. HOME

Build the mobile Home screen from the existing web application's actual Home UI.

Adapt it for a phone.

Use the existing backend/content.

Prioritize useful shopping content such as:

* Bench Supply branding
* search
* categories
* featured products
* product browsing
* cart access

Do not blindly copy every desktop section.

---

# 12. PRODUCTS

Products MUST come from the real backend.

Do not hardcode production products.

Inspect the existing product implementation first.

Known categories include:

* Boards
* Parts
* Kits
* Tools
* Sensors

Confirm the actual current categories from the repository.

Display useful product information such as:

* image
* name
* price
* stock status
* cart action

Use the existing product image URLs where appropriate.

---

# 13. PRODUCT CARDS

Base the mobile product card on the existing web product card.

Adapt it for touch and small screens.

It should generally show:

* product image
* name
* price
* stock information where appropriate
* add-to-cart action

Cards must be readable and easy to tap.

---

# 14. PRODUCT DETAILS

Create a mobile product detail screen based on the existing web product detail page.

Adapt the layout for mobile.

Show the actual available information, such as:

* product image
* name
* price
* availability
* description
* add-to-cart action

Keep the primary action easy to find.

---

# 15. SEARCH

If the web application already provides product search, use the same backend functionality.

Do not create a separate search backend.

The mobile search must handle:

* loading
* no results
* errors
* clearing search
* keyboard interaction

---

# 16. AUTHENTICATION

Use the existing authentication system.

The mobile user must be able to log into the SAME account used on the web.

Inspect the existing web authentication implementation first.

If the web app uses Supabase Auth, use the same Supabase project and authentication system.

If Google OAuth exists, inspect how it currently works and implement the correct Expo/mobile OAuth flow.

Do not blindly copy browser OAuth URLs into mobile.

Never create a second user system.

---

# 17. SESSION

Persist authentication sessions appropriately for mobile.

Do not use browser `localStorage`.

Do not store passwords.

The user should remain signed in across normal app restarts unless they log out or the session genuinely expires.

---

# 18. CART

The cart MUST use the existing backend.

The mobile app must support:

* loading the user's cart
* adding products
* changing quantity
* removing products
* displaying cart items
* displaying prices
* displaying total
* checkout action

Inspect the existing web cart implementation and use its existing endpoints/API.

Do not invent endpoint names.

Do not create a second cart implementation in the database.

---

# 19. CART SOURCE OF TRUTH

The backend is the authoritative cart.

Local state may only be used for:

* UI rendering
* temporary state
* optimistic updates
* caching

After mutations, reconcile with the backend.

Refresh/revalidate the cart:

* after login
* when opening the cart
* after adding
* after removing
* after changing quantity
* when returning to the app where appropriate

Never allow stale local state to overwrite the backend cart.

---

# 20. CART SYNCHRONIZATION

Before calling the project complete, perform these exact tests.

### Web → Mobile

1. Log into Account A on web.
2. Add Product A on web.
3. Confirm it appears in web cart.
4. Open mobile.
5. Log into Account A.
6. Open mobile cart.
7. Confirm Product A appears.

### Mobile → Web

1. Keep using Account A.
2. Add Product B on mobile.
3. Confirm it appears in mobile cart.
4. Return to web.
5. Refresh/open the web cart.
6. Confirm Product B appears.

If either direction fails, the mobile cart implementation is NOT complete.

---

# 21. CHECKOUT

Use the existing checkout/backend architecture.

Do not move server-side logic into the mobile client.

If the web checkout currently:

1. validates checkout data
2. calls the database/order function
3. retrieves the order
4. sends confirmation email

the mobile app should call the appropriate existing backend endpoint.

Do not expose server credentials.

---

# 22. ORDERS

Use the existing order system.

If the web app provides order history/details, provide an appropriate mobile version where required.

Do not create a separate mobile order database.

---

# 23. EMAIL AND SECRETS

Mailgun and other server-side services MUST remain server-side.

Never put these into the mobile app:

* Supabase service-role key
* Mailgun private key
* database password
* private API secrets
* server credentials

Public Expo configuration may use values such as:

```text
EXPO_PUBLIC_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_ANON_KEY
```

Never commit real secrets.

---

# 24. ERROR STATES

Handle:

* network failure
* API errors
* authentication errors
* expired session
* empty products
* empty search
* unavailable products
* failed cart operations
* failed checkout

Show clear human-readable messages.

Do not show raw stack traces.

Provide retry actions where useful.

---

# 25. LOADING STATES

Provide appropriate loading indicators for:

* authentication
* products
* product details
* search
* cart
* cart mutations
* checkout
* orders

The app must not look frozen while waiting for a request.

---

# 26. EMPTY STATES

Provide useful empty states.

For example:

```text
Your cart is empty.

Browse products
```

Do not leave blank screens.

Follow the visual language of the web application.

---

# 27. MOBILE UX

The app should feel good on a real phone.

Pay attention to:

* touch target size
* safe areas
* keyboard
* scrolling
* long text
* long product names
* image proportions
* button placement
* thumb reach
* readable prices
* clear hierarchy

Do not make desktop controls tiny.

---

# 28. ACCESSIBILITY

Use:

* readable text
* sufficient contrast
* meaningful labels
* appropriate touch targets
* accessibility labels where useful

Do not rely solely on icons for important actions.

---

# 29. PERFORMANCE

Avoid unnecessary network requests.

Do not repeatedly fetch the entire catalogue without reason.

Use reasonable caching where appropriate.

However, cart correctness is more important than aggressive caching.

Never allow caching to cause incorrect cart synchronization.

---

# 30. CODE STRUCTURE

Use a clean Expo structure.

For example:

```text
mobile/
├── app/
├── components/
├── lib/
├── hooks/
├── constants/
├── assets/
├── package.json
├── tsconfig.json
└── AGENTS.md
```

Do not create unnecessary abstractions.

Use the existing Expo starter structure where appropriate.

---

# 31. SHARED CODE

Framework-independent types/utilities may be shared with the web application where practical.

Examples:

* product types
* cart types
* order types
* API types
* validation utilities

Do NOT import web-specific code into React Native.

Do not import:

* Next.js components
* DOM-dependent code
* browser APIs
* CSS
* web-specific hooks

The web UI and mobile UI are separate component implementations.

---

# 32. DEVELOPMENT WORKFLOW

Work in these phases.

### Phase 1 — Inspect

Inspect the existing application, backend, cart, auth, and UI.

Make a concise plan.

### Phase 2 — Foundation

Build mobile navigation, theme, configuration, and base screens.

### Phase 3 — Authentication

Implement login/signup/session using the existing backend.

### Phase 4 — Products

Implement real product browsing and details.

### Phase 5 — Cart

Implement backend-backed cart.

Immediately test:

* Web → Mobile
* Mobile → Web

Do not postpone cart synchronization testing until the end.

### Phase 6 — Checkout/Orders

Implement existing checkout/order functionality.

### Phase 7 — Mobile UX

Compare against the web UI and improve:

* spacing
* responsive layouts
* navigation
* touch interaction
* loading
* empty states
* errors

### Phase 8 — Build

Build and test the Android APK.

### Phase 9 — Final Test

Perform the exact HNG demonstration on a physical Android device.

---

# 33. PHYSICAL DEVICE

The final application MUST work on a physical Android phone.

The current development phone is a Tecno Pop 7.

Do not rely only on:

* browser
* emulator
* simulator

Test the actual mobile application on the physical phone.

---

# 34. HNG DEMO

The final video must clearly show:

1. Open web app.
2. Sign in.
3. Show logged-in account.
4. Add Product A on web.
5. Open mobile app on physical phone.
6. Log into the SAME account.
7. Open mobile cart.
8. Show Product A.
9. Add Product B on mobile.
10. Return to web.
11. Show Product B in web cart.

The video must demonstrate:

* web
* mobile
* same account
* same backend
* Web → Mobile synchronization
* Mobile → Web synchronization
* physical device

Do not fake synchronization.

---

# 35. APK

The final application must produce an Android APK.

Use Expo/EAS tooling as appropriate.

Verify the APK:

* installs
* launches
* authenticates
* loads real products
* loads the real cart
* changes the cart
* communicates with the required backend
* works on the physical Android device

Expo Go working does NOT automatically guarantee the APK works.

---

# 36. GIT

The mobile app is part of the existing repository.

Do NOT initialize Git inside `mobile/`.

Do not create another `.git` directory.

Do not delete existing web files.

Check:

```bash
git status
```

before major changes.

---

# 37. TESTING

At minimum verify:

* app launches
* navigation works
* products load
* product details work
* login works
* signup works if supported
* existing account works
* session persists
* logout works
* cart loads
* add-to-cart works
* quantity changes work
* removal works
* total is correct
* Web → Mobile synchronization works
* Mobile → Web synchronization works
* checkout works where required
* orders work where required
* physical Android device works
* APK builds successfully

Run TypeScript/type checks where available.

Do not suppress errors with `any` just to make the build pass.

---

# 38. PRIORITY ORDER

When time is limited, prioritize:

1. Same backend
2. Authentication
3. Products
4. Shared cart
5. Web → Mobile cart sync
6. Mobile → Web cart sync
7. Mobile responsiveness
8. Checkout
9. APK
10. UI polish

A working shared cart is more important than animations or decorative features.

---

# 39. DO NOT OVER-ENGINEER

This is a deadline-driven HNG task.

Do not spend time building unnecessary:

* architecture layers
* state-management frameworks
* animations
* design systems
* abstractions
* features not required by the existing shop

Prefer the simplest clean implementation that satisfies the requirements.

---

# 40. FINAL DEFINITION OF DONE

The mobile application is complete only when:

* it is a real Expo/React Native application
* it uses the existing backend
* it uses the existing users/authentication
* it loads real products
* it uses the existing cart
* Web → Mobile cart synchronization works
* Mobile → Web cart synchronization works
* UI is based on the existing Bench Supply web UI
* UI is properly adapted/improved for mobile
* UI is responsive across phone sizes
* checkout works where required
* no server secrets are exposed
* existing web application still works
* physical Android device works
* Android APK can be built
* the HNG Lesson 3 demo can be recorded successfully

---

# 41. FINAL PRINCIPLE

Build:

> **The existing Bench Supply web shop, adapted into a responsive native mobile experience, using the exact same backend and cart.**

Do not build a separate shop.

Do not invent a new backend.

Do not invent a new visual identity.

Use the web application as the source of truth, then make the experience better for mobile.

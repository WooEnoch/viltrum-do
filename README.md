# NikkiBee Store

NikkiBee is a Next.js storefront backed by Neon PostgreSQL. It preserves the original Figma interface while moving identity, catalogue, inventory, carts, favourites, and orders to a server-owned data layer.

## Architecture

- **Next.js App Router** hosts the storefront and server route handlers in one deployable project.
- **Auth.js** handles Google OAuth and stores persistent database sessions through its Drizzle adapter.
- **Neon PostgreSQL + Drizzle** provide the schema, migration, catalogue seed, customer records, carts, favourites, inventory, and orders.
- **Mailgun** sends welcome and order acknowledgement emails from a verified sending domain.
- **Mailchimp Marketing API** uses double opt-in for newsletter subscriptions and records the exact consent text in Neon.

Guest carts use a random, HTTP-only, SameSite cookie. Only a SHA-256 hash is saved in the database. After Google sign-in, `/auth/complete` atomically merges available guest items into the customer's active cart and removes the guest cookie.

Order creation locks current inventory, reloads prices from the database, validates availability, writes the order and snapshots its items, decrements stock, and closes the cart in a single transaction. The database permits only `pending` as a payment state. Submitted orders show **Payment pending** and remain unconfirmed for fulfilment.

## External setup

Copy `.env.example` to `.env.local` and configure:

- `DATABASE_URL`: a pooled Neon connection string.
- `AUTH_SECRET`: generate with `npx auth secret`.
- `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET`: Google OAuth web application credentials. Add `http://localhost:3000/api/auth/callback/google` locally and the matching production callback URL.
- `MAILGUN_API_KEY`: a Mailgun private API key.
- `MAILGUN_DOMAIN`: the verified Mailgun sending domain, preferably a dedicated subdomain such as `mg.example.com`.
- `MAILGUN_API_BASE_URL`: `https://api.mailgun.net` for US accounts or `https://api.eu.mailgun.net` for EU accounts.
- `EMAIL_FROM`: a friendly sender using the Mailgun domain, for example `NikkiBee <orders@mg.example.com>`.
- `MAILCHIMP_API_KEY`, `MAILCHIMP_SERVER_PREFIX`, and `MAILCHIMP_AUDIENCE_ID`: Mailchimp Marketing API credentials.

The landing page uses its checked-in catalogue data only as a development preview when `DATABASE_URL` is absent. Shopping mutations, customer data, sign-in, email, and newsletter delivery require their real services.

## Database setup

```bash
npm run db:migrate
npm run db:seed
```

Both commands load the root `.env.local` file automatically. They do not print or expose the configured connection string.

The seed is repeatable and maintains the initial seven-product catalogue. Inventory starts at 12 units per size. Use another reviewed migration or the seed script for controlled catalogue changes; there is no admin dashboard.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000/#/home`.

## Verification

```bash
npm test
npm run build
```

Before release, verify with real provider credentials:

1. Add products to a guest bag, sign in with Google, and confirm the bag merges.
2. Open another browser/device, sign in, and confirm the cart, favourites, and order history persist.
3. Confirm unauthenticated order/favourite requests return `401`, and one customer cannot retrieve another customer's records.
4. Change inventory after adding an item, then confirm checkout rejects the stale quantity.
5. Submit an order and confirm database price snapshots, stock decrement, **Payment pending**, welcome email, and order acknowledgement.
6. Subscribe only after checking the consent box and complete Mailchimp's confirmation email.

To send a delivery test to the most recently updated customer without printing the recipient or credentials:

```bash
npm run email:test
```

The command reports whether Mailgun accepted the message and whether a delivered event appeared. Mailchimp remains the newsletter provider.

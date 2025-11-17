# Website Builder – Next.js Monorepo

This project now runs entirely on **Next.js** (App Router). The application serves the marketing site, customer dashboard, admin dashboard, and all API routes from a single codebase.

## Getting Started

```bash
npm install
npm run dev
```

The development server exposes the UI and API routes at `http://localhost:3000`.

## Environment Variables

Create a `.env.local` file in the project root with the following variables:

| Variable | Required | Description |
| --- | --- | --- |
| `MONGO_URL` | ✅ | MongoDB connection string |
| `DB_NAME` | ✅ | MongoDB database name |
| `JWT_SECRET_KEY` | ✅ | Secret used to sign access tokens |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | ❌ (default 43200) | Lifetime of issued JWTs in minutes |
| `ADMIN_USERNAME` | ❌ (default `Admin1234`) | Username required for `/auth/admin/login` |
| `ADMIN_PASSWORD` | ❌ (default `22211161`) | Password required for `/auth/admin/login` |
| `RAZORPAY_KEY_ID` | ✅ | Razorpay REST key (server-side) |
| `RAZORPAY_KEY_SECRET` | ✅ | Razorpay REST secret (server-side) |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | ✅ | Public Razorpay key for the checkout widget |
| `NEXT_PUBLIC_BACKEND_URL` | ❌ | Set when hosting the API on a different origin |

## Project Structure

- `src/app` – App Router pages and API route handlers
- `src/components` – UI components migrated from the previous React app
- `src/lib` – Server/client shared utilities (database, auth, HTTP client, Razorpay helpers)
- `public` – Static assets

## Scripts

- `npm run dev` – start Next.js in development mode
- `npm run build` – compile the production bundle
- `npm run start` – run the production build
- `npm run lint` – run Next.js lint rules

## Notes

- API routes mirror the previous FastAPI contract (`/api/auth/*`, `/api/customer/*`, `/api/admin/*`, `/api/razorpay/*`).
- Authentication remains JWT-based; tokens are stored client-side and attached automatically to API calls.
- The admin account is seeded automatically on first login using `ADMIN_USERNAME`/`ADMIN_PASSWORD`.

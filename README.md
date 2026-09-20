# Corruption Tracking BDP — Client

React web frontend for a civic complaint tracking platform. Citizens file and track complaints with evidence, investigators work assigned cases, and admins manage the whole pipeline — all backed by a C++ REST API and Firebase Authentication.

## Tech Stack

- **React 19** + **TypeScript**
- **Vite** (dev server & bundler)
- **Tailwind CSS 4** (via `@tailwindcss/vite`)
- **TanStack Query** (server state)
- **React Router 7** (routing + role-based protected routes)
- **Axios** (API client)
- **Firebase JS SDK** (client-side auth)
- **Recharts** (dashboard charts)
- **Oxlint** (linting)

## Getting Started

### Prerequisites

- Node.js 18+
- The [API server](../Corruption%20tracking%20BDP%20Server/) running (defaults to `http://localhost:8080`)

### Setup

```bash
npm install
cp .env .env.local   # or edit .env directly — see below
npm run dev
```

The dev server runs on **http://localhost:5173** with `strictPort: true` — it will fail instead of drifting to another port, because the server's CORS allow-list expects exactly `5173`.

## Environment Variables

Vite only exposes variables prefixed with `VITE_`:

| Variable | Description | Default |
|---|---|---|
| `VITE_API_BASE_URL` | Base URL of the C++ backend | `http://localhost:8080` |
| `VITE_FIREBASE_API_KEY` | Firebase web API key | — |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain | — |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID | — |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket | — |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase sender ID | — |
| `VITE_FIREBASE_APP_ID` | Firebase app ID | — |
| `VITE_DEV_AUTH` | `true` = send `X-Dev-UID` header instead of a Firebase ID token (dev/emulator mode) | `false` |

Firebase client config is public by design; all server secrets live in the server's `.env`.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server on port 5173 |
| `npm run build` | Type-check (`tsc -b`) and build for production into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Run Oxlint |

## Project Structure

```
src/
├── components/        # Shared UI (timeline, evidence gallery, primitives)
├── config.ts          # Runtime config from VITE_* env vars
├── contexts/          # AuthContext (Firebase auth + user profile state)
├── layouts/           # PublicLayout, DashboardLayout
├── pages/
│   ├── HomePage / CategoriesPage / TrackPage / LoginPage / RegisterPage
│   ├── citizen/       # Dashboard, complaints CRUD, evidence, NID verification, notifications, profile
│   ├── investigator/  # Dashboard, assigned cases, case workspace
│   └── admin/         # Dashboard, complaints, users, investigators, categories, audit logs
├── routes/            # ProtectedRoute (role-based access)
├── services/
│   ├── api.ts         # Axios instance, auth header injection, error envelope handling
│   ├── endpoints.ts   # Typed wrappers for every API endpoint
│   ├── firebase.ts    # Firebase initialization
│   └── tokenProvider.ts
└── types/             # Shared TypeScript types (Complaint, User, Evidence, …)
```

## Roles & Routes

| Role | Routes |
|---|---|
| Public | `/`, `/categories`, `/track` (track a complaint by public ID), `/login`, `/register` |
| Citizen | `/dashboard`, `/dashboard/complaints`, `/dashboard/complaints/new`, `/dashboard/complaints/:publicId`, `/dashboard/notifications`, `/dashboard/verification`, `/dashboard/profile` |
| Investigator | `/investigator/dashboard`, `/investigator/complaints`, `/investigator/complaints/:publicId`, `/investigator/profile` |
| Admin | `/admin/dashboard`, `/admin/complaints`, `/admin/complaints/:publicId`, `/admin/users`, `/admin/investigators`, `/admin/categories`, `/admin/audit-logs` |

## API Contract

All requests go through `src/services/endpoints.ts`. The server responds with an envelope:

```json
{ "success": true, "message": "...", "data": ..., "pagination": { ... } }
```

Authentication: a Firebase ID token is attached as `Authorization: Bearer <token>` (or `X-Dev-UID` in dev-auth mode — see `VITE_DEV_AUTH`).

## Deployment

Configured for **Vercel** (`vercel.json`). `.env.production` holds the production build-time variables. The Vite SPA build outputs to `dist/`.

# Homebox Client

A web client application for [Homebox](https://github.com/sysadminsmedia/homebox) (home inventory management).

## Tech Stack

- React 19 + TypeScript 6
- Viite 8
- Talwind CSS 4 + Shadcn UI (Base UI primitives)
- React Router 7
- TanStack React Query (data fetching & caching)
- Axios
- jwt-decode
- Sonner (toast notifications)
- Lucide React (icons)
- i18next + react-i18next + i18next-browser-languagedetector
- ESLint 10 + Prettier 3
- Husky + lint-staged (pre-commit hooks)

## Getting Started

```bash
# Install dependencies
yarn

# Start dev server
yarn dev

# Build for production
yarn build

# Preview production build
yarn preview
```

> The backend API URL is configured via Vite's `env` mechanism. Create a `.env.local` file with `VITE_API_URL=<your-backend-url>` if needed.

## Features

### Authentication

- **Login** — username/password form at `/login`
- **Force change password** — redirects to `/change-password` when the backend requires it
- **Session expiry** — global dialog shown on 401 responses, redirecting the user to re-authenticate
- **Global error toast** — non-401 API errors display a toast notification with the server error message
- **Logout** — clears token and redirects to login
- **Protected routes** — unauthenticated users are redirected to `/login`
- **Role-based access** — root-only routes (files, members, roles) are guarded by `RoleGuard`

### Dashboard

- **Overview** — landing page at `/dashboard` after login with aggregated data
- **Stats cards** — total items, total assets, total asset value, total invoices
- **Items panel** — tabbed view of expiring-soon items (sorted by expiration date) and in-use items (sorted by creation date), max 10 per tab with "View More" link to expiration page
- **Assets panel** — tabbed view of warranty-expiring assets (sorted by expiration date) and in-use assets (sorted by purchase date), max 10 per tab with "View More" link to assets page
- **Single API call** — all dashboard data fetched via `GET /api/dashboard`

### Goods Expiration Management

- **Goods** — CRUD for products with barcode, category, brand, configurable expiring-soon threshold, and picture uploads
- **Items** — track individual item instances per good with production date, expiration date, and shelf life (auto-calculated from any 2 of 3 fields), toggle in-use status
- **Categories & Brands** — standalone CRUD managed via modal dialogs from the goods page
- **Status tracking** — automatic status computation: Expired > Expiring Soon > In Use > Exhausted
- **Server-side pagination** — search by name/barcode, filter by category/brand/status
- **Barcode duplicate detection** — popup to add item to existing good when barcode already exists
- **Expandable rows** — inline item management and picture management within the goods table

### Asset Management

- **Assets** — CRUD for assets with name, barcode, serial number, category, place, price, shop date, store, warranty, note, and picture uploads
- **Sub-assets** — self-referencing parent-child relationship (1 level deep), displayed as expanded rows
- **Categories** — reuse goods categories, managed via inline dialog
- **Places** — standalone CRUD for locations (e.g., rooms), managed via inline dialog
- **Stores** — CRUD with name and channel (e.g., Online, Offline), channel supports custom text input
- **Warranty tracking** — optional warranty with "fill 2 of 3" date logic (active date, period in days, expiration date)
- **Warranty status** — automatic computation: In Warranty, Out of Warranty, No Warranty
- **Server-side pagination** — search by name/barcode/serial number, filter by category, place, in-use status, warranty status
- **Expandable rows** — inline sub-asset management and picture management

### Invoice Management

- **Invoices** — CRUD for invoices with invoice code, number, date, type, status, buyer/seller info, amounts, and file attachments
- **Invoice types** — Digital Invoice, Railway E-Ticket, VAT Invoice, Airline E-Ticket, Machine-Printed, Quota Invoice, Other
- **Invoice status** — Normal, Voided, Reversed (已红冲)
- **File upload & parsing** — upload PDF/XML/OFD files to auto-extract invoice data (best-effort, user reviews before saving)
- **Attachments** — attach additional files to invoices (not parsed)
- **Server-side pagination** — search by buyer/seller/invoice number, filter by type/status
- **Detail drawer** — right-side drawer for viewing full invoice details with file preview/download

### Member Management (Root Only)

- **Members** — list, create, edit, and delete members via `/members` (root role required)

### Role Management (Root Only)

- **Roles** — list, create, edit, and delete roles via `/roles` (root role required)

### Profile

- **Profile** — view and manage user profile at `/profile`
- **Change password** — update password via dialog

### File Management (Root Only)

- **Files** — list, upload, download, rename, and delete files via `/files` (root role required)
- **Preview** — inline image preview for image files using authenticated image loading
- **Pagination** — server-side pagination for the file list

### Internationalization

All user-facing text is externalized via i18next. Translation files are in `src/i18n/locales/`.

## Project Structure

```
src/
├── api/                  # Axios instance and API call functions
│   ├── auth.ts           # Authentication API
│   ├── axios.ts          # Axios instance with interceptors
│   ├── dashboard.ts      # Dashboard API
│   ├── files.ts          # File management API
│   ├── goodBrands.ts     # Good brands API
│   ├── goodCategories.ts # Good categories API
│   ├── goodItems.ts      # Good items API
│   ├── goodPictures.ts   # Good pictures API
│   ├── goods.ts          # Goods API
│   ├── assets.ts         # Assets API
│   ├── assetPictures.ts  # Asset pictures API
│   ├── assetCategories.ts # Asset categories API
│   ├── assetPlaces.ts    # Asset places API
│   ├── assetStores.ts    # Asset stores API
│   ├── invoices.ts       # Invoices API
│   ├── members.ts        # Members API
│   ├── profile.ts        # Profile API
│   └── roles.ts          # Roles API
├── components/
│   ├── AppShell.tsx      # App layout shell (sidebar + topbar + outlet)
│   ├── AuthFormLayout.tsx # Auth page layout wrapper
│   ├── AuthImg.tsx       # Authenticated image component
│   ├── ProtectedRoute.tsx # Auth guard for routes
│   ├── RoleGuard.tsx     # Role-based route guard
│   ├── SessionExpiredDialog.tsx # Session expiry dialog
│   ├── Sidebar.tsx       # Navigation sidebar
│   ├── Topbar.tsx        # Top navigation bar
│   ├── assets/           # Asset management feature components
│   ├── invoices/         # Invoice management feature components
│   ├── expiration/       # Goods expiration feature components
│   ├── members/          # Member management dialogs
│   ├── profile/          # Profile components
│   ├── roles/            # Role management dialogs
│   └── ui/               # Shadcn UI components
├── providers/            # React providers (QueryProvider)
├── contexts/             # React context providers (AuthContext)
├── hooks/                # Custom hooks
│   └── queries/          # React Query hooks (dashboardKeys, useDashboard, assetKeys, useAssets, etc.)
├── i18n/                 # i18next config and locale files
│   └── locales/          # Translation JSON files
├── lib/                  # Utility functions (error, jwt, password, utils)
├── pages/                # Page components
├── App.tsx               # Router and provider wiring
└── main.tsx              # Entry point
```

## Code Quality

```bash
# Lint
yarn lint

# Format
yarn format

# Check formatting
yarn format:check
```

Pre-commit hooks automatically run ESLint and Prettier on staged files.

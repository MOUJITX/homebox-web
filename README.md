# Homebox Client

A web client application for [Homebox](https://github.com/sysadminsmedia/homebox) (home inventory management).

## Tech Stack

- React 19 + TypeScript 6
- Vite 8
- Tailwind CSS 4 + Shadcn UI
- React Router 7
- Axios
- Sonner (toast notifications)
- i18next + react-i18next (internationalization)
- ESLint + Prettier
- Husky + lint-staged (pre-commit hooks)

## Getting Started

```bash
# Install dependencies
yarn

# Copy env config and set the backend API URL
cp .env.local.example .env.local

# Start dev server
yarn dev

# Build for production
yarn build

# Preview production build
yarn preview
```

## Features

### Authentication

- **Login** — username/password form at `/login`
- **Force change password** — redirects to `/change-password` when the backend requires it
- **Session expiry** — global dialog shown on 401 responses, redirecting the user to re-authenticate
- **Global error toast** — non-401 API errors display a toast notification with the server error message
- **Logout** — clears token and redirects to login
- **Protected routes** — unauthenticated users are redirected to `/login`

### Goods Expiration Management

- **Goods** — CRUD for products with barcode, category, brand, configurable expiring-soon threshold, and picture uploads
- **Items** — track individual item instances per good with production date, expiration date, and shelf life (auto-calculated from any 2 of 3 fields), toggle in-use status
- **Categories & Brands** — standalone CRUD managed via modal dialogs from the goods page
- **Status tracking** — automatic status computation: Expired > Expiring Soon > In Use > Exhausted
- **Server-side pagination** — search by name/barcode, filter by category/brand/status
- **Barcode duplicate detection** — popup to add item to existing good when barcode already exists
- **Expandable rows** — inline item management and picture management within the goods table

### File Management (Root Only)

- **Files** — list, upload, download, rename, and delete files via `/files` (root role required)
- **Preview** — inline image preview for image files in a modal dialog
- **Pagination** — server-side pagination for the file list

### Internationalization

All user-facing text is externalized via i18next. Translation files are in `src/i18n/locales/`.

## Project Structure

```
src/
├── api/           # Axios instance and API call functions
├── components/    # Shared components (AuthFormLayout, ProtectedRoute, SessionExpiredDialog)
│   ├── goods/     # Goods feature components (dialogs, expanded row, picture manager)
│   └── ui/        # Shadcn UI components
├── contexts/      # React context providers (AuthContext)
├── hooks/         # Custom hooks (useAuth)
├── i18n/          # i18next config and locale files
│   └── locales/   # Translation JSON files
├── lib/           # Utility functions
├── pages/         # Page components (LoginPage, ChangePasswordPage, DashboardPage)
├── App.tsx        # Router and provider wiring
└── main.tsx       # Entry point
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

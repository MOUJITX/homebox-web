# Homebox Client

A web client application for [Homebox](https://github.com/sysadminsmedia/homebox) (home inventory management).

## Tech Stack

- React 19 + TypeScript 6
- Vite 8
- Tailwind CSS 4 + Shadcn UI
- React Router 7
- Axios
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
- **Logout** — clears token and redirects to login
- **Protected routes** — unauthenticated users are redirected to `/login`

### Internationalization

All user-facing text is externalized via i18next. Translation files are in `src/i18n/locales/`.

## Project Structure

```
src/
├── api/           # Axios instance and API call functions
├── components/    # Shared components (AuthFormLayout, ProtectedRoute, SessionExpiredDialog)
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

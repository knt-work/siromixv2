# SiroMix V2 Frontend

Next.js 14-based frontend for SiroMix V2 MVP Foundation.

## Tech Stack

- **Next.js 14+** - React framework with App Router
- **React 18+** - UI library
- **TypeScript 5.x** - Type safety
- **Tailwind CSS 3.x** - Styling
- **NextAuth.js 4.x** - Authentication (Google OAuth)
- **Vitest** - Unit testing
- **Playwright** - E2E testing

## Project Structure

```
frontend/
├── src/
│   ├── app/                # Next.js 14 App Router pages
│   │   ├── api/
│   │   │   └── auth/       # NextAuth configuration
│   │   ├── dashboard/      # Dashboard page
│   │   ├── tasks/          # Task pages
│   │   └── layout.tsx      # Root layout
│   ├── components/         # React components
│   ├── lib/                # Utilities
│   │   ├── api/            # API client
│   │   └── auth/           # Auth utilities
│   └── hooks/              # Custom React hooks
├── tests/
│   ├── e2e/                # Playwright E2E tests
│   └── setup.ts            # Test setup
├── public/                 # Static assets
└── package.json
```

## Setup

### Prerequisites

- Node.js 18+
- npm 9+

### Installation

```bash
# Install dependencies
npm install
```

### Environment Variables

Create `.env.local` file in the frontend directory:

```bash
# API
API_BASE_URL=http://localhost:8000

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

Generate `NEXTAUTH_SECRET`:

```bash
# PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))

# Linux/Mac
openssl rand -base64 32
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

### Run Tests

```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e
```

### Linting & Formatting

```bash
# Lint
npm run lint

# Format
npm run format

# Type check
npm run type-check
```

## Features

### Authentication

- Google OAuth 2.0 sign-in using NextAuth.js
- Automatic token refresh
- Secure session management via httpOnly cookies
- ID token passed to backend in Authorization header

### Task Management

- Create tasks via API
- Real-time progress monitoring (polling)
- Task status visualization (queued → running → completed/failed)
- Retry failed tasks
- View structured logs

### UI Components

- **ProgressBar**: Animated progress bar (0-100%)
- **StageIndicator**: Pipeline stage visualization
- **StatusBadge**: Color-coded status indicators
- **LogViewer**: Scrollable log display

## Architecture

### NextAuth Flow

1. User clicks "Sign in with Google"
2. Redirects to Google OAuth consent screen
3. Google redirects back with authorization code
4. NextAuth exchanges code for tokens (ID token, access token, refresh token)
5. Stores ID token in session
6. Frontend includes ID token in API requests

### API Communication

All API calls include the Google ID token:

```typescript
const response = await fetch(`${API_BASE_URL}/api/v1/endpoint`, {
  headers: {
    'Authorization': `Bearer ${session.idToken}`,
    'Content-Type': 'application/json',
  },
});
```

### State Management

- **Session state**: NextAuth `useSession()` hook
- **Task polling**: Custom `useTaskPolling()` hook with cleanup
- **Local UI state**: React `useState()` and `useEffect()`

## Development

### Adding New Page

1. Create file in `src/app/[page-name]/page.tsx`
2. Use Next.js App Router conventions
3. Access session via `useSession()` hook
4. Protect routes by checking session status

### Adding New Component

1. Create component in `src/components/[ComponentName].tsx`
2. Export as default or named export
3. Add unit tests in same directory or `tests/`
4. Use TypeScript for props interface

### Adding API Call

1. Create function in `src/lib/api/[resource].ts`
2. Use API client from `src/lib/api/client.ts`
3. Handle errors and add proper TypeScript types
4. Test with mock server or E2E tests

## License

Copyright © 2026 SiroMix Team

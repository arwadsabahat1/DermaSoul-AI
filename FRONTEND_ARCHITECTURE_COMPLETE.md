# DermaSoul Frontend - Complete Architecture & Design Documentation

## Table of Contents
1. [Executive Overview](#executive-overview)
2. [Frontend Architecture](#frontend-architecture)
3. [Technology Stack](#technology-stack)
4. [Project Structure](#project-structure)
5. [Design Philosophy & Approach](#design-philosophy--approach)
6. [Authentication System (Login & Auth)](#authentication-system-login--auth)
7. [Admin Module - Detailed Explanation](#admin-module---detailed-explanation)
8. [API Integration Layer](#api-integration-layer)
9. [Component Design System](#component-design-system)
10. [Routing & Layout Strategy](#routing--layout-strategy)
11. [State Management & Context API](#state-management--context-api)
12. [Error Handling & User Feedback](#error-handling--user-feedback)
13. [Design Tokens & Styling](#design-tokens--styling)

---

## Executive Overview

The DermaSoul frontend is a **modern React 19 + TypeScript application** built with **Vite** as the build tool and **Tailwind CSS** for styling. It's a **dermatology-focused diagnostic platform** featuring:

- **Public-facing pages**: Home, educational content, product information, doctor directory
- **User dashboard**: Skin analysis tools, consultation history, product recommendations
- **Admin console**: Full-featured operations dashboard for platform governance
- **Real-time notifications**: Toast-based feedback system
- **Responsive design**: Desktop-first with mobile support
- **Authentication**: JWT-based token authentication with persistent session management

### Key Design Principles
- **Accessibility-first**: WCAG compliant components
- **Performance-optimized**: Code splitting, lazy loading, efficient rendering
- **Type-safe**: Full TypeScript coverage across the codebase
- **Modular architecture**: Clear separation of concerns, reusable components
- **Mobile-responsive**: Fluid layouts that adapt to all screen sizes

---

## Frontend Architecture

### High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser (Client)                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              React 19 Application                      │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────┐   │ │
│  │  │   Router     │  │  Auth Context │  │  Pages    │   │ │
│  │  │ (React-Router│  │   Provider    │  │           │   │ │
│  │  │  v7)         │  │               │  │           │   │ │
│  │  └──────────────┘  └──────────────┘  └────────────┘   │ │
│  │                                                         │ │
│  │  ┌────────────────────────────────────────────────────┐│ │
│  │  │          Component Layer                           ││ │
│  │  │ ┌──────────────┐  ┌──────────────┐  ┌──────────┐  ││ │
│  │  │ │ UI Components│  │Layout        │  │ Layouts  │  ││ │
│  │  │ │ (GlassCard,  │  │Components    │  │(AppShell,││ │
│  │  │ │  Button,     │  │(Header,      │  │ AdminLay ││ │
│  │  │ │  Skeleton)   │  │ Footer, Nav) │  │ out)     │  ││ │
│  │  │ └──────────────┘  └──────────────┘  └──────────┘  ││ │
│  │  └────────────────────────────────────────────────────┘│ │
│  │                                                         │ │
│  │  ┌────────────────────────────────────────────────────┐│ │
│  │  │           API Integration Layer                    ││ │
│  │  │ ┌──────────────────────────────────────────────────┐││ │
│  │  │ │  Axios Instance with Interceptors               │││ │
│  │  │ │  - Auto JWT injection                           │││ │
│  │  │ │  - Error handling & formatting                  │││ │
│  │  │ │  - Request/Response transformation              │││ │
│  │  │ └──────────────────────────────────────────────────┘││ │
│  │  │ ┌──────────────┐ ┌────────────┐ ┌──────────────┐   ││ │
│  │  │ │admin.ts      │ │products.ts │ │consultations│   ││ │
│  │  │ │(Admin APIs)  │ │(Products)  │ │.ts          │   ││ │
│  │  │ │              │ │            │ │(Consults)   │   ││ │
│  │  │ └──────────────┘ └────────────┘ └──────────────┘   ││ │
│  │  └────────────────────────────────────────────────────┘│ │
│  │                                                         │ │
│  │  ┌────────────────────────────────────────────────────┐│ │
│  │  │         Client-Side State                          ││ │
│  │  │  - User profile (AuthContext)                      ││ │
│  │  │  - UI state (component state)                      ││ │
│  │  │  - Session tokens (localStorage)                   ││ │
│  │  └────────────────────────────────────────────────────┘│ │
│  └────────────────────────────────────────────────────────┘ │
│                           │                                 │
│                   ┌───────▼────────┐                        │
│                   │  Vite Dev Server│                       │
│                   │  (Port 5173)    │                       │
│                   │  with Proxy     │                       │
│                   └───────┬────────┘                        │
│                           │                                 │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP/HTTPS
                            │
                ┌───────────▼──────────────┐
                │  Backend (FastAPI)       │
                │  (Port 8010 / Prod)      │
                ├──────────────────────────┤
                │ /api/auth/*              │
                │ /api/admin/*             │
                │ /api/consultations/*     │
                │ /api/products/*          │
                │ /api/education/*         │
                └──────────────────────────┘
```

### Application Flow

```
Browser Load
    ↓
Vite HMR Connection Established
    ↓
React Root Mounted
    ↓
ErrorBoundary Wraps App
    ↓
BrowserRouter Initialized
    ↓
AuthProvider Mounts → refreshUser() Called
    ↓
Check Token in localStorage
    ↓
GET /auth/me (Validate Session)
    ↓
Set User State (or null if invalid)
    ↓
Render Route Tree
    ↓
Routes Evaluate Protected Status
    ├─ Public Routes (/, /login, /register, /conditions)
    │  ↓ Always Accessible
    │
    ├─ Protected Routes (/app/*)
    │  ├─ RequireAuth Check
    │  ├─ If No User → Redirect to /login
    │  ├─ If User → Render AppShell
    │  └─ Conditional Admin Links in Nav
    │
    └─ Admin Routes (/app/admin/*)
       ├─ RequireAuth Check
       ├─ RequireAdmin Check
       ├─ If Not Admin → Redirect to /app/analyze
       └─ If Admin → Render AdminLayout + Page
```

---

## Technology Stack

### Frontend Dependencies

```json
{
  "React": "^19.2.5",                    // UI Library - Latest React 19
  "React DOM": "^19.2.5",                // DOM Rendering
  "React Router DOM": "^7.15.0",         // Client-side routing with loaders
  "TypeScript": "~6.0.2",                // Type safety
  "Vite": "^8.0.10",                     // Build tool & dev server
  "Tailwind CSS": "^4.2.4",              // Utility-first CSS framework
  "Axios": "^1.16.0",                    // HTTP client
  "Framer Motion": "^12.38.0",           // Animation library
  "Lucide React": "^1.14.0",             // Icon library
  "React Hot Toast": "^2.6.0",           // Toast notifications
  "@tailwindcss/vite": "^4.2.4"          // Vite plugin for Tailwind
}
```

### Development Dependencies

```json
{
  "@vitejs/plugin-react": "^6.0.1",      // Vite React plugin
  "@types/react": "^19.2.14",            // React type definitions
  "@types/react-dom": "^19.2.3"          // React DOM type definitions
}
```

### Why These Tools?

| Tool | Reason | Benefits |
|------|--------|----------|
| **React 19** | Latest UI library | Modern features, better performance, improved hooks |
| **TypeScript** | Type safety | Catch errors at compile time, better IDE support, self-documenting code |
| **Vite** | Modern build tool | Fast HMR, quick builds, better dev experience than Webpack |
| **Tailwind CSS** | Utility-first styling | Consistent design system, small bundle size, rapid prototyping |
| **React Router v7** | Client routing | Dynamic route handlers, better nested routes, code splitting |
| **Axios** | HTTP client | Interceptors for auth, error handling, request/response transformation |
| **Framer Motion** | Animations | Smooth, performant animations, spring physics, gesture support |
| **React Hot Toast** | Notifications | Non-blocking toast UI, customizable appearance |

### Build & Development Pipeline

```
Development Mode:
  npm run dev
  ├─ Vite Dev Server (Port 5173)
  ├─ API Proxy to Backend (Port 8010)
  ├─ Hot Module Replacement (HMR)
  ├─ TypeScript Type Checking
  └─ Live Reloads

Production Build:
  npm run build
  ├─ TypeScript Compilation
  ├─ Vite Code Splitting
  ├─ Minification
  ├─ Tree Shaking
  └─ Output: dist/ folder
```

---

## Project Structure

### Directory Organization

```
frontend/
├── src/
│   ├── api/                    # Backend API integration layer
│   │   ├── client.ts          # Axios instance configuration & interceptors
│   │   ├── admin.ts           # Admin API endpoints
│   │   ├── consultations.ts   # Consultation endpoints
│   │   ├── dermatologists.ts  # Dermatologist endpoints
│   │   ├── diagnosis.ts       # Diagnosis/analysis endpoints
│   │   ├── education.ts       # Education/conditions endpoints
│   │   ├── products.ts        # OTC products endpoints
│   │   └── profile.ts         # User profile endpoints
│   │
│   ├── components/            # Reusable React components
│   │   ├── ErrorBoundary.tsx  # Error boundary for crash protection
│   │   ├── Logo.tsx           # Logo component
│   │   ├── RequireAuth.tsx    # Auth protection wrapper
│   │   ├── RequireAdmin.tsx   # Admin protection wrapper
│   │   ├── AnimatedBackground.tsx  # Animated SVG background
│   │   ├── layout/            # Layout components
│   │   │   ├── AppShell.tsx        # Main app layout with sidebar
│   │   │   ├── AdminLayout.tsx     # Admin dashboard layout
│   │   │   ├── PublicLayout.tsx    # Public pages layout
│   │   │   ├── SiteHeader.tsx      # Navigation header
│   │   │   ├── SiteFooter.tsx      # Footer component0
│   │   │   └── ...
│   │   │
│   │   └── ui/                # Reusable UI components
│   │       ├── Button.tsx           # Multi-variant button component
│   │       ├── GlassCard.tsx        # Glassmorphism card container
│   │       ├── PageLoader.tsx       # Full-page loading spinner
│   │       ├── Skeleton.tsx         # Skeleton/placeholder UI
│   │       ├── EmptyState.tsx       # Empty state display
│   │       ├── StateBanner.tsx      # Error/success banners
│   │       ├── PageHeader.tsx       # Page title header
│   │       ├── FormHint.tsx         # Form input hints
│   │       ├── ConditionCoverImage.tsx  # Disease condition image display
│   │       └── ConsultationPhoto.tsx    # Consultation image viewer
│   │
│   ├── contexts/              # React Context providers
│   │   └── AuthContext.tsx    # Authentication context & hooks
│   │
│   ├── pages/                 # Page components (one per route)
│   │   ├── HomePage.tsx       # Landing page
│   │   ├── LoginPage.tsx      # Login form
│   │   ├── RegisterPage.tsx   # Registration form
│   │   ├── AnalyzePage.tsx    # Skin analysis tool
│   │   ├── ConsultationsPage.tsx      # Consultation history
│   │   ├── ConsultationDetailPage.tsx # Consultation detail view
│   │   ├── ConsultationFaqPage.tsx    # FAQ for consultation
│   │   ├── EducationPage.tsx  # Disease library
│   │   ├── EducationDetailPage.tsx # Disease detail
│   │   ├── ProfilePage.tsx    # User profile
│   │   ├── ProductsPage.tsx   # OTC products
│   │   ├── DoctorsPage.tsx    # Dermatologist directory
│   │   │
│   │   ├── AdminDashboardPage.tsx      # Admin overview/stats
│   │   ├── AdminUsersPage.tsx         # User management
│   │   ├── AdminProductsPage.tsx      # OTC product management
│   │   ├── AdminEducationPage.tsx     # Disease library management
│   │   ├── AdminDermatologistsPage.tsx # Doctor management
│   │   └── ...
│   │
│   ├── types/                 # TypeScript type definitions
│   │   ├── models.ts         # Data models (User, Consultation, etc.)
│   │   └── ...
│   │
│   ├── lib/                   # Utility functions
│   │   ├── errors.ts         # Error message formatting
│   │   ├── risk.ts           # Risk level styling
│   │   └── ...
│   │
│   ├── constants/             # Application constants
│   │   ├── conditionsCatalog.ts # Disease slugs & labels
│   │   └── ...
│   │
│   ├── App.tsx               # Root component with routing
│   ├── main.tsx              # Application entry point
│   ├── index.css             # Global styles
│   └── vite-env.d.ts         # Vite type definitions
│
├── public/                   # Static assets
│   └── covers/              # Condition/disease cover images
│
├── vite.config.ts           # Vite configuration
├── tsconfig.json            # TypeScript configuration
├── package.json             # Dependencies
├── index.html               # HTML entry point
└── README.md
```

### Core Files Explained

#### **src/App.tsx** - Root Component & Routing
- Defines all routes for the application
- Wraps app with `ErrorBoundary` and `AuthProvider`
- Uses `React Router v7` with nested route structure
- Conditionally renders different layouts based on route
- Implements route protection with `RequireAuth` and `RequireAdmin`

#### **src/main.tsx** - Entry Point
- Mounts React app to DOM
- Wraps with StrictMode for development warnings

#### **src/contexts/AuthContext.tsx** - Authentication State
- Central auth state management using Context API
- Provides `useAuth` hook for auth operations
- Handles login, register, logout, token persistence

#### **src/api/client.ts** - API Configuration
- Configures Axios instance with base URL
- Sets up request interceptors to inject JWT tokens
- Handles token storage/retrieval from localStorage
- Configures timeout handling for slow requests

---

## Design Philosophy & Approach

### Core Design Principles

#### 1. **Glassmorphism Design Language**
The frontend uses a sophisticated glassmorphism aesthetic:

```tsx
// Glass card with frosted glass effect
<motion.div
  className="rounded-2xl border border-card-border bg-card p-6 shadow-card"
  whileHover={{ y: -5, scale: 1.01 }}
>
  {children}
</motion.div>
```

**Why?**
- Modern, premium appearance
- Medical/dermatology professional aesthetic
- Supports light/dark contrast for accessibility
- Layered visual hierarchy

#### 2. **Component-Based Architecture**
Everything is a composable component:

```
Button (UI Component)
  └─ Variants: primary, secondary, ghost, danger
  └─ States: loading, disabled, active
  └─ Animation: hover effects, scale transforms

GlassCard (Container Component)
  └─ Consistent styling
  └─ Hover animations
  └─ Shadow depth

Page Components (Business Logic)
  └─ Fetch data via API
  └─ Manage local state
  └─ Compose UI components
```

#### 3. **Mobile-First Responsive Design**
Built with mobile experience first, enhanced for desktop:

```tsx
// Mobile (single column) → Desktop (multi-column)
<div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
  {/* Stacks on mobile, 2 columns on desktop */}
</div>
```

#### 4. **Accessibility & Inclusivity**
- Semantic HTML (labels, buttons, forms)
- Keyboard navigation support
- WCAG color contrast compliance
- Form validation and error messaging

#### 5. **Performance Optimizations**
- **Code Splitting**: Each page route is lazy-loaded
- **Image Optimization**: Condition cover images are responsive
- **Memoization**: Components use React.memo where appropriate
- **Debouncing**: Search inputs debounced to reduce API calls

#### 6. **Error Handling & User Feedback**
Consistent error handling:

```tsx
try {
  const data = await fetchUsers();
} catch (e) {
  const msg = getApiErrorMessage(e, "Could not load users.");
  toast.error(msg);
}
```

### Design Tokens & Color System

#### Tailwind Configuration

```
Colors Palette:
├─ teal (#2a7f7f - Primary)
├─ teal-strong (#1a5f5f - Darker teal)
├─ sage-700 (#4a6b5e - Secondary)
├─ forest-900 (#1a3533 - Dark text)
├─ emerald-400 (#34d399 - Success)
├─ red-900 (#7f1d1d - Danger)
├─ white/60 - Glassmorphism (with opacity)
└─ Semantic colors (success, error, warning)

Spacing (Tailwind 4):
├─ 2px, 4px, 6px, 8px, 12px, 16px, 20px, 24px, 28px, 32px...
└─ Used consistently across all components

Border Radius:
├─ Rounded-2xl (16px) - Cards, buttons, inputs
├─ Rounded-xl (12px) - Smaller components
└─ Rounded-full - Pills, avatars

Shadows:
├─ shadow-card - Elevation for glass cards
├─ shadow-soft - Subtle shadows
└─ No drop shadows for minimalist aesthetic
```

#### Font System

```
Typography:
├─ Heading Font: "Cormorant Garamond" (Georgia, serif fallback)
│  ├─ Elegant, premium, medical-appropriate
│  └─ Used for page titles, section headers
│
├─ Body Font: System sans-serif (Arial, -apple-system)
│  ├─ Highly legible
│  ├─ Default for all body text
│  └─ Font sizes: 12px (xs), 14px (sm), 16px (base), 18px (lg), 20px (xl)
│
└─ Font Weights: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)
```

### Animation & Motion

Uses **Framer Motion** for smooth animations:

```tsx
// Page transition
<motion.div
  key={location.pathname}
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
>

// Card hover effect
<motion.div
  whileHover={{ y: -5, scale: 1.01 }}
  whileTap={{ scale: 0.98 }}
>

// Animated background gradients
<motion.div
  animate={{ x: [0, 26, 0], y: [0, -20, 0] }}
  transition={{ duration: 16, repeat: Infinity }}
/>
```

---

## Authentication System (Login & Auth)

### Architecture Overview

The authentication system is a **JWT-based stateless authentication** with client-side session management:

```
User Flow:
┌─────────────┐
│  Browser    │
└──────┬──────┘
       │
       ├─────────────── POST /auth/login ──────────────┐
       │               (email, password)                │
       │                                                 │
       │                                    ┌──────────▼──────────┐
       │                                    │  Backend (FastAPI)   │
       │                                    │  ├─ Validate email   │
       │                                    │  ├─ Hash & check pwd │
       │                                    │  ├─ Generate JWT     │
       │                                    │  └─ Return token+user│
       │                                    └──────────┬──────────┘
       │                                              │
       │ ◄─────── 200 OK {access_token, user} ────────┤
       │
       ├─ Store in localStorage ─────────────────────────────────┐
       │  Key: "dermasoul_token"                                 │
       │  Value: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."       │
       │                                                          │
       ├─ Update AuthContext.user state ─────────────────────────┤
       │                                                          │
       ├─ Redirect to /app/analyze ──────────────────────────────┤
       │                                                          │
       └─ All subsequent requests automatically include token────┘

Subsequent Requests:
┌─────────────┐
│  Browser    │
└──────┬──────┘
       │
       ├─ getStoredToken() from localStorage
       ├─ Add to request header: Authorization: Bearer {token}
       │
       ├─────────────── GET /api/admin/stats ───────────────────┐
       │               (with Authorization header)               │
       │                                                          │
       │                                    ┌──────────▼──────────┐
       │                                    │  Backend            │
       │                                    │  ├─ Verify JWT      │
       │                                    │  ├─ Decode user_id  │
       │                                    │  └─ Return data     │
       │                                    └──────────┬──────────┘
       │                                              │
       │ ◄─────────── 200 OK {data} ─────────────────┤
       │
       └─ Response handled by page component ─────────────────────
```

### Authentication Context (AuthContext.tsx)

The heart of authentication management:

```tsx
type AuthContextValue = {
  user: User | null;              // Current user or null
  loading: boolean;               // Loading state during initial check
  refreshUser: () => Promise<void>;   // Refetch current user
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);  // Initial load

  // On mount: Check if token exists and is valid
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get<User>("/auth/me");
        setUser(data);  // Token is valid
      } catch {
        setUser(null);  // Token is invalid or expired
      } finally {
        setLoading(false);  // Stop showing loader
      }
    })();
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    const { data } = await api.post<{ access_token: string }>(
      "/auth/login",
      { email, password }
    );
    setStoredToken(data.access_token);  // Save to localStorage
    await refreshUser();  // Fetch user profile
  };

  // Logout function
  const logout = () => {
    setStoredToken(null);  // Clear token
    setUser(null);         // Clear user state
    // Automatic redirect via RequireAuth
  };
}
```

### Login Page (LoginPage.tsx)

**Purpose**: User login form with email/password

**Key Features**:
- Email validation (HTML5 required + type="email")
- Password field (type="password")
- Loading state on submit button
- Error toast notifications
- Link to registration
- Redirect to referrer on success

**Flow**:
1. User enters email & password
2. Form submits → `login()` from AuthContext
3. If success: Token saved → AuthContext updated → Navigate to /app/analyze
4. If error: Toast error message displayed → User stays on page
5. If already logged in: Redirect to /app/analyze

```tsx
async function handleSubmit(e: FormEvent) {
  e.preventDefault();
  setBusy(true);
  try {
    await login(email.trim(), password);
    toast.success("Welcome back.");
    navigate(from, { replace: true });  // Redirect to original page
  } catch (err) {
    toast.error(err instanceof Error ? err.message : "Could not sign in.");
  } finally {
    setBusy(false);
  }
}
```

### Registration Page (RegisterPage.tsx)

**Purpose**: New user account creation

**Key Features**:
- Email input with validation
- Password field with 8+ character requirement
- Confirm password field with matching validation
- Client-side validation before submission
- Auto-login after successful registration
- Links to login page

**Validation Rules**:
- Email: Valid email format (HTML5)
- Password: Minimum 8 characters
- Confirm Password: Must match password field

**Flow**:
1. User enters email, password, confirm password
2. Client-side validation checks:
   - Password length ≥ 8
   - Password === Confirm password
3. Submit → `register(email, password)`
4. Backend creates account & returns user
5. Auto-login → Token saved → Redirect to /app/analyze

```tsx
async function handleSubmit(e: FormEvent) {
  e.preventDefault();
  if (password.length < 8) {
    toast.error("Password must be at least 8 characters.");
    return;
  }
  if (password !== confirm) {
    toast.error("Passwords do not match.");
    return;
  }
  await register(email.trim(), password);
  toast.success("Studio ready—we signed you in.");
  navigate("/app/analyze", { replace: true });
}
```

### API Client Configuration (client.ts)

**Purpose**: Configure Axios with auth interceptors

```tsx
export const api = axios.create({
  baseURL: `${apiBaseUrl}/api`,
  timeout: DEFAULT_TIMEOUT_MS,  // 18 seconds
  headers: {
    Accept: "application/json",
  },
});

// Interceptor: Automatically add token to requests
api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;  // JWT bearer token
  }
  return config;
});
```

**Why Interceptors?**
- Automatic token injection on every request
- Centralized authentication logic
- No need to manually add token to each API call
- Easy to add other request preprocessing

### Token Storage (localStorage)

```tsx
const STORAGE_KEY = "dermasoul_token";

// Get token from localStorage
export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;  // Handle private browsing
  }
}

// Save token to localStorage
export function setStoredToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(STORAGE_KEY, token);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    /* ignore quota / private mode */
  }
}
```

**Security Considerations**:
- localStorage is vulnerable to XSS attacks
- JWT itself is stateless (not revokable on client)
- Backend should validate token expiration
- Secure flag should be set on secure connections
- Consider httpOnly cookies for production (requires backend changes)

### Protected Routes (RequireAuth.tsx)

```tsx
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <PageLoader />;  // Show spinner while checking auth
  }

  if (!user) {
    // Redirect to login, save location for redirect after login
    return <Navigate 
      to="/login" 
      replace 
      state={{ from: location.pathname }} 
    />;
  }

  return <>{children}</>;  // User is authenticated
}
```

**In App.tsx**:
```tsx
<Route
  path="/app"
  element={
    <RequireAuth>
      <AppShell />  // Protected content
    </RequireAuth>
  }
>
  {/* Protected child routes */}
</Route>
```

### Session Flow in Detail

```
1. INITIAL PAGE LOAD
   ├─ React mounts
   ├─ AuthProvider initializes
   ├─ useEffect checks localStorage for token
   ├─ If token exists:
   │  ├─ GET /auth/me with Authorization header
   │  ├─ Backend validates JWT
   │  ├─ If valid: Return user data → setUser(data)
   │  └─ If invalid: setUser(null) → Redirect to /login
   └─ If no token: setUser(null) immediately

2. USER LOGIN
   ├─ User fills login form
   ├─ POST /auth/login with credentials
   ├─ Backend returns: { access_token: "...", user: {...} }
   ├─ Client saves token to localStorage
   ├─ AuthContext updates user state
   ├─ Axios interceptor starts auto-injecting token
   └─ Redirect to protected route

3. AUTHENTICATED REQUESTS
   ├─ User navigates to /app/admin/users
   ├─ RequireAuth checks: Is user set? Yes ✓
   ├─ Page renders and calls: fetchAdminUsers()
   ├─ Axios interceptor adds: Authorization: Bearer {token}
   ├─ Backend validates token → Returns data
   └─ Page displays data

4. TOKEN EXPIRATION
   ├─ Token TTL expires (backend sets this)
   ├─ User makes next request
   ├─ Backend returns: 401 Unauthorized
   ├─ Client catches error → setUser(null)
   ├─ RequireAuth intercepts → Redirect to /login
   └─ User sees login page

5. LOGOUT
   ├─ User clicks "Log out" button
   ├─ logout() called from context
   ├─ setStoredToken(null) → localStorage cleared
   ├─ setUser(null) → Auth state cleared
   ├─ No more Authorization header on requests
   └─ Redirect to home page
```

---

## Admin Module - Detailed Explanation

### Admin Architecture

The admin module is a **role-based access control (RBAC) subsystem** for platform governance:

```
Admin System Flow:
┌─────────────────────────────────────────────────────┐
│         User with role="admin" logs in              │
├─────────────────────────────────────────────────────┤
│                     ↓                               │
│  AuthContext.user.role = "admin" (from JWT)        │
├─────────────────────────────────────────────────────┤
│                     ↓                               │
│  /app/admin/* routes check: RequireAdmin            │
│  ├─ RequireAuth: Is user set? ✓                    │
│  └─ RequireAdmin: Is user.role === "admin"? ✓      │
├─────────────────────────────────────────────────────┤
│                     ↓                               │
│  AdminLayout renders with navigation tabs          │
│  ├─ Overview (AdminDashboardPage)                  │
│  ├─ Users & History (AdminUsersPage)               │
│  ├─ OTC Shelf (AdminProductsPage)                  │
│  ├─ Dermatologists (AdminDermatologistsPage)       │
│  └─ Disease Library (AdminEducationPage)           │
├─────────────────────────────────────────────────────┤
│                     ↓                               │
│  Admin APIs enforce backend authorization          │
│  All /api/admin/* endpoints check user.role        │
└─────────────────────────────────────────────────────┘
```

### RequireAdmin Component

```tsx
export function RequireAdmin({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <PageLoader />;  // Loading

  if (!user) {
    // Not authenticated
    return <Navigate 
      to="/login" 
      replace 
      state={{ from: location.pathname }} 
    />;
  }

  if (user.role !== "admin") {
    // Authenticated but not admin
    // Redirect to main app dashboard
    return <Navigate to="/app/analyze" replace />;
  }

  // All checks passed
  return <>{children}</>;
}
```

### Admin Layout (AdminLayout.tsx)

**Purpose**: Container for all admin pages with navigation

```tsx
const LINKS = [
  { to: "/app/admin/stats", label: "Overview" },        // Dashboard
  { to: "/app/admin/users", label: "Users & History" }, // User management
  { to: "/app/admin/products", label: "OTC Shelf" },    // Product management
  { to: "/app/admin/dermatologists", label: "Dermatologists" },
  { to: "/app/admin/education", label: "Disease Library" },
];
```

**Visual Structure**:
```
┌─────────────────────────────────────────────────┐
│  Admin Studio [Shield Icon]                     │
│  Platform operations and governance             │
│                                                 │
│  [Overview] [Users & History] [OTC] [Doctors]  │
│                                                 │
├─────────────────────────────────────────────────┤
│                                                 │
│             Current Tab Content                │
│             (Outlet from React Router)         │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Admin Dashboard Page (AdminDashboardPage.tsx)

**Purpose**: High-level overview of platform metrics and alerts

**Metrics Displayed**:
```
┌─────────────────────────────────────────────┐
│  Total Users        │  Active Users         │
│  123,456            │  98,765               │
├─────────────────────────────────────────────┤
│  Total Consultations │  High-Risk Cases    │
│  456,789            │  1,234                │
└─────────────────────────────────────────────┘

Recent High-Risk Consultations:
├─ Psoriasis [HIGH RISK] - Warning message
├─ Melanoma [HIGH RISK] - Doctor alert
└─ Severe Eczema [HIGH RISK] - Action needed
```

**API Calls**:
```tsx
// Fetch admin statistics
const [stats, setStats] = useState<AdminStats | null>(null);

useEffect(() => {
  const stats = await fetchAdminStats();  // GET /api/admin/stats
  const flagged = await fetchAdminFlaggedConsultations("High", 10);
  setStats(stats);
  setFlagged(flagged);
}, []);
```

**AdminStats Type**:
```tsx
type AdminStats = {
  total_users: number;              // All registered users
  active_users: number;             // Users with enabled accounts
  disabled_users: number;           // Soft-deleted/disabled users
  total_consultations: number;      // All consultations ever made
  high_risk_consultations: number;  // Consultations with risk_level="High"
};
```

### Admin Users Management (AdminUsersPage.tsx)

**Purpose**: Manage user accounts, view consultation history, disable accounts

**Split Panel Design**:
```
┌──────────────────────────┬──────────────────────────┐
│  User Management         │  Consultation History    │
├──────────────────────────┼──────────────────────────┤
│                          │                          │
│  Search: [email input]   │  Select user to view     │
│                          │  consultation history    │
│  ┌────────────────────┐  │                          │
│  │ user@example.com   │  │  ┌──────────────────────┐│
│  │ Role: user         │  │  │ Psoriasis [HIGH]     ││
│  │ Status: active     │  │  │ 2024-05-12 14:30     ││
│  │                    │  │  │ Type: Atopic         ││
│  │ [View History]     │  │  └──────────────────────┘│
│  │ [Disable User]     │  │                          │
│  └────────────────────┘  │  ┌──────────────────────┐│
│                          │  │ Eczema [MEDIUM]      ││
│  ┌────────────────────┐  │  │ 2024-05-10 09:15     ││
│  │ admin@site.com     │  │  │ Type: Seborrheic     ││
│  │ Role: admin        │  │  │ [View Detail]        ││
│  │ Status: active     │  │  └──────────────────────┘│
│  └────────────────────┘  │                          │
└──────────────────────────┴──────────────────────────┘
```

**Features**:

1. **User Search**
   ```tsx
   const [query, setQuery] = useState("");
   
   useEffect(() => {
     // Debounce search to 180ms
     const timer = setTimeout(() => {
       fetchAdminUsers({ search: query.trim() || undefined });
     }, 180);
     return () => clearTimeout(timer);
   }, [query]);
   ```

2. **User Status Toggle**
   ```tsx
   async function toggleStatus(user: AdminUserSummary) {
     const updated = await setAdminUserStatus(user.id, !user.is_active);
     // API: PATCH /api/admin/users/{userId}/status?is_active={bool}
     setUsers(prev => prev.map(u => 
       u.id === user.id ? { ...u, is_active: updated.is_active } : u
     ));
     toast.success(`User ${updated.is_active ? "enabled" : "disabled"}.`);
   }
   ```

3. **Consultation History**
   ```tsx
   async function openHistory(user: AdminUserSummary) {
     const res = await fetchAdminUserConsultations(user.id, 100, 0);
     // API: GET /api/admin/users/{userId}/consultations
     setHistory(res.items);  // Paginated list
   }
   ```

**API Endpoints Used**:
- `GET /api/admin/users` - List users with search
- `PATCH /api/admin/users/{userId}/status` - Enable/disable user
- `GET /api/admin/users/{userId}/consultations` - Get user's consultations

### Admin Products Management (AdminProductsPage.tsx)

**Purpose**: Manage OTC (over-the-counter) product database

**Two-Panel CRUD Interface**:
```
┌──────────────────────────┬──────────────────────────┐
│  OTC Shelf List          │  Product Editor          │
├──────────────────────────┼──────────────────────────┤
│ [New Product] button     │ Create/Edit Product      │
│                          │                          │
│ ┌────────────────────┐   │ Name*: [________]        │
│ │ CeraVe Moisturizer │   │ Category*: [________]    │
│ │ Brand: CeraVe      │   │ Brand: [________]        │
│ │ Category: Skincare │   │ Price: [________]        │
│ │ Avoids: Alcohol    │   │                          │
│ │ [Edit] [Delete]    │   │ [Ingredients]            │
│ └────────────────────┘   │ [________]               │
│                          │                          │
│ ┌────────────────────┐   │ Suitable Skin Types:     │
│ │ Neutrogena SPF 50  │   │ [________]               │
│ │ Brand: Neutrogena  │   │                          │
│ │ Category: Suncare  │   │ Supported Conditions:    │
│ │ Avoids: None       │   │ [________]               │
│ │ [Edit] [Delete]    │   │                          │
│ └────────────────────┘   │ [Save] [Cancel]          │
└──────────────────────────┴──────────────────────────┘
```

**CRUD Operations**:

1. **Create Product**
   ```tsx
   async function onSubmit(e: FormEvent) {
     // Validate
     if (!form.name.trim() || !form.category.trim()) {
       setFormError("Name and category are required.");
       return;
     }
     // Clean payload (empty strings → null)
     const payload = cleanPayload(form);
     // Create
     const created = await createAdminProduct(payload);
     // API: POST /api/products
     setItems(prev => [created, ...prev]);
     resetEditor();
   }
   ```

2. **Edit Product**
   ```tsx
   function beginEdit(p: Product) {
     setEditing(p);
     setForm({...p});  // Populate form with product data
   }

   async function onSubmit(e: FormEvent) {
     // ... validation
     const updated = await updateAdminProduct(editing.id, payload);
     // API: PUT /api/products/{id}
     setItems(prev => prev.map(p => p.id === updated.id ? updated : p));
   }
   ```

3. **Delete Product**
   ```tsx
   async function onDelete(id: string) {
     if (!window.confirm("Delete this OTC shelf item?")) return;
     await deleteAdminProduct(id);  // API: DELETE /api/products/{id}
     setItems(prev => prev.filter(p => p.id !== id));
   }
   ```

**Product Fields**:
```tsx
type ProductMutationInput = {
  name: string;                    // Required
  brand?: string;                  // Optional
  category: string;                // Required
  suitable_skin_types?: string;    // Comma-separated
  supported_conditions?: string;   // Comma-separated
  price_range?: string;           // E.g., "$20-40"
  availability?: string;          // E.g., "Online, Retail"
  product_url?: string;           // Full URL to product
  ingredients?: string;           // Text field
  avoid_if_allergic_to?: string;  // Allergy warnings
  contraindications?: string;     // Medical contraindications
};
```

**API Endpoints**:
- `GET /api/products` - List all products
- `POST /api/products` - Create product
- `PUT /api/products/{id}` - Update product
- `DELETE /api/products/{id}` - Delete product

### Admin Education Management (AdminEducationPage.tsx)

**Purpose**: Manage disease/condition knowledge base articles

**Features**:

1. **Article List with CRUD**
   - Sorted alphabetically by title
   - Search/filter by title
   - Edit inline
   - Delete with confirmation

2. **Article Form**
   ```tsx
   type EducationMutationInput = {
     title: string;                  // <= 200 chars
     slug: string;                   // URL-friendly ID
     category: string;               // <= 100 chars
     summary?: string;               // Short description
     content: string;                // >= 20 chars (main article)
     warnings?: string;              // Safety warnings
     precautions?: string;           // Prevention steps
     when_to_seek_doctor?: string;   // Medical alert criteria
     source_urls?: string;           // Comma-separated URLs
   };
   ```

3. **Slug Management**
   ```tsx
   // Auto-generate slug from title if not provided
   const normalizedSlug = (
     payload.slug?.trim() || 
     slugifyConditionLabel(payload.title)
   ).slice(0, 200);
   
   // Prevent duplicate slugs
   const existing = items.find(a => a.slug === normalizedSlug);
   if (existing) {
     // Update existing instead of creating new
     await updateEducationArticle(existing.slug, payload);
   }
   ```

4. **Validation**
   ```tsx
   // Title: 1-200 chars
   // Category: 1-100 chars
   // Content: >= 20 chars
   // Slug: <= 200 chars
   
   if (!form.title.trim() || !form.category.trim() || form.content.trim().length < 20) {
     setFormError("Title, category, and content (>= 20 chars) are required.");
     return;
   }
   ```

**API Endpoints**:
- `GET /api/education` - List articles
- `GET /api/education/{slug}` - Get article details
- `POST /api/education` - Create article
- `PUT /api/education/{slug}` - Update article
- `DELETE /api/education/{slug}` - Delete article

### Admin Dermatologists Management (AdminDermatologistsPage.tsx)

**Purpose**: Curate list of dermatologists for referrals

**Form Fields**:
```tsx
{
  full_name: string;           // Required, >= 2 chars
  clinic_name?: string;        // Optional
  city?: string;               // Optional
  country?: string;            // Optional
  specialties?: string;        // Optional, comma-separated
  supported_conditions?: string; // Conditions they treat
  specialty_tags?: string;     // For categorization
  regions_served?: string;     // Geographic coverage
  telemedicine_available: boolean; // Feature flag
  emergency_available: boolean;    // Feature flag
  languages?: string;          // Languages spoken
  years_experience?: number;   // Professional experience
  contact_email?: string;      // For referrals
  contact_phone?: string;      // For referrals
  booking_url?: string;        // Booking system URL
  notes?: string;              // Internal notes
  is_active: boolean;          // Referrals enabled?
}
```

**Operations**:
1. **Add Dermatologist**
   ```tsx
   async function onSave() {
     const payload = { ...form };  // Trim all fields
     await createDermatologist(payload);
     // API: POST /api/dermatologists
     setForm({...EMPTY_FORM});
     toast.success("Dermatologist added.");
   }
   ```

2. **Toggle Active Status**
   ```tsx
   async function onToggleActive(doctor: Dermatologist) {
     await updateDermatologist(doctor.id, { is_active: !doctor.is_active });
     // API: PATCH /api/dermatologists/{id}
   }
   ```

3. **Delete Entry**
   ```tsx
   async function onDelete(id: string) {
     if (!window.confirm("Delete this dermatologist entry?")) return;
     await deleteDermatologist(id);  // API: DELETE /api/dermatologists/{id}
   }
   ```

**API Endpoints**:
- `GET /api/dermatologists` - List all dermatologists
- `POST /api/dermatologists` - Create entry
- `PATCH /api/dermatologists/{id}` - Update entry
- `DELETE /api/dermatologists/{id}` - Delete entry

### Admin API Client (admin.ts)

All admin endpoints abstracted into typed functions:

```tsx
export async function fetchAdminStats() {
  const { data } = await api.get<AdminStats>("/admin/stats");
  return data;
}

export async function fetchAdminUsers(params: {
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const { data } = await api.get<AdminUserSummary[]>("/admin/users", { params });
  return data;
}

export async function setAdminUserStatus(userId: string, isActive: boolean) {
  const { data } = await api.patch<AdminUserSummary>(
    `/admin/users/${userId}/status`,
    null,
    { params: { is_active: isActive } }
  );
  return data;
}

export async function fetchAdminUserConsultations(
  userId: string,
  limit = 20,
  offset = 0
) {
  const { data } = await api.get<ConsultationPaginated>(
    `/admin/users/${userId}/consultations`,
    { params: { limit, offset } }
  );
  return data;
}

// ... more endpoints
```

### Admin Security Considerations

1. **Backend Authorization**
   - Every `/api/admin/*` endpoint checks `user.role == "admin"`
   - No front-end-only security
   - Token contains role claim

2. **Action Confirmation**
   - Destructive operations (delete) require confirmation
   - `window.confirm()` prevents accidental actions

3. **Error Handling**
   - API errors displayed to user
   - Form validation prevents invalid submissions
   - Network errors handled gracefully

---

## API Integration Layer

### Axios Configuration (api/client.ts)

```tsx
export const api = axios.create({
  baseURL: `${apiBaseUrl}/api`,      // Base: http://localhost:8010/api (dev)
  timeout: DEFAULT_TIMEOUT_MS,        // 18 seconds (default)
  headers: {
    Accept: "application/json",      // Only accept JSON responses
  },
});

// Request Interceptor: Inject JWT token
api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;  // Standard JWT format
  }
  return config;
});
```

### Typed API Functions

Each feature has its own API module with typed functions:

```tsx
// consultations.ts
export async function fetchConsultations(
  params: { limit?: number; offset?: number } = {}
) {
  const { data } = await api.get<ConsultationPaginated>("/consultations", {
    params,
  });
  return data;
}

export async function fetchConsultationDetail(id: string) {
  const { data } = await api.get<ConsultationDetail>(`/consultations/${id}`);
  return data;
}
```

### Error Handling Pattern

```tsx
try {
  const data = await fetchUsers();
  // Success: Use data
} catch (e) {
  const message = getApiErrorMessage(
    e,                              // Error object
    "Could not load users."         // Fallback message
  );
  toast.error(message);             // Show to user
}
```

### Error Message Formatter (lib/errors.ts)

Converts backend error formats to user-friendly messages:

```tsx
export function getApiErrorMessage(
  error: unknown,
  fallback = "Something went wrong."
): string {
  if (axios.isAxiosError(error)) {
    // Handle structured validation errors from Pydantic
    const data = error.response?.data as { detail?: unknown };
    if (data?.detail !== undefined) {
      if (typeof detail === "string") {
        return detail;  // Simple message
      }
      if (Array.isArray(detail)) {
        // Pydantic validation errors with field names
        return detail
          .map(entry => {
            const field = formatFieldName(entry.loc);
            const msg = entry.msg;
            return field ? `${field}: ${msg}` : msg;
          })
          .join("; ");
      }
    }
    // Network errors
    if (error.code === "ERR_NETWORK") {
      return "Network error. Check your connection and server status.";
    }
  }
  return fallback;
}
```

### API Modules Organization

| Module | Purpose | Key Functions |
|--------|---------|---|
| **client.ts** | Axios config | `api` instance, interceptors |
| **admin.ts** | Admin endpoints | Stats, users, consultations |
| **consultations.ts** | Consultation endpoints | List, detail, create |
| **diagnosis.ts** | Diagnosis/analysis | Run diagnosis, get results |
| **education.ts** | Disease library | List articles, get by slug |
| **products.ts** | OTC products | List, search, get details |
| **dermatologists.ts** | Dermatologist directory | List, search, details |
| **profile.ts** | User profile | Get, update, delete |

---

## Component Design System

### UI Component Hierarchy

```
Base Components (ui/)
├─ Button.tsx
│  └─ Variants: primary, secondary, ghost, danger
│  └─ States: loading, disabled
│  └─ Animations: hover scale, tap animation
│
├─ GlassCard.tsx
│  └─ Glassmorphism container
│  └─ Optional hover animations
│  └─ Consistent border & shadow
│
├─ PageLoader.tsx
│  └─ Full-screen loading spinner
│  └─ Used during auth check
│
├─ Skeleton.tsx
│  └─ Placeholder for loading state
│  └─ Matches content size
│
├─ EmptyState.tsx
│  └─ When no data available
│  └─ Title + body message
│
├─ StateBanner.tsx
│  └─ Error/success/warning messages
│  └─ Tone variants: error, success, info
│
└─ PageHeader.tsx
   └─ Page title section
   └─ Eyebrow, title, description
```

### Button Component

```tsx
export function Button({
  children,
  variant = "primary",
  loading = false,
  disabled = false,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  loading?: boolean;
}) {
  const isDisabled = Boolean(loading || disabled);
  
  return (
    <motion.span whileHover={isDisabled ? undefined : { y: -1 }}>
      <button
        disabled={isDisabled}
        className={`
          inline-flex min-h-[44px] items-center justify-center gap-2
          rounded-2xl px-5 py-2.5 text-sm font-medium
          transition-transform duration-200
          ${VARIANT_STYLES[variant]}
          ${className}
        `}
        {...props}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current" />
            Working…
          </span>
        ) : (
          children
        )}
      </button>
    </motion.span>
  );
}
```

**Variant Styles**:
- **primary**: Teal background, white text, hover brightens
- **secondary**: White/translucent, forest text, subtle ring
- **ghost**: Transparent, no styles until hover
- **danger**: Red background, white text, hover darkens

### GlassCard Component

```tsx
export function GlassCard({
  children,
  className = "",
  hover = false,
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
      whileHover={hover ? { y: -5, scale: 1.01 } : undefined}
      className={`
        relative overflow-hidden rounded-2xl
        border border-card-border
        bg-card p-6 shadow-card
        ${className}
      `}
    >
      {/* Subtle white gradient overlay */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-white/35 to-transparent"
      />
      {children}
    </motion.div>
  );
}
```

**Features**:
- Glassmorphism effect with border and shadow
- Optional hover animation (lift up, slight scale)
- Subtle white gradient top overlay
- Consistent styling across app

---

## Routing & Layout Strategy

### Route Tree

```
/ (Public)
├─ / → HomePage
├─ /login → LoginPage
├─ /register → RegisterPage
├─ /about → AboutPage
├─ /conditions → EducationPage
└─ /conditions/:slug → EducationDetailPage

/app/* (Protected)
├─ /app/analyze → AnalyzePage (Skin analysis)
├─ /app/consultations → ConsultationsPage (History)
├─ /app/consultations/:id → ConsultationDetailPage
├─ /app/consultations/:id/faq → ConsultationFaqPage
├─ /app/profile → ProfilePage
├─ /app/products → ProductsPage
├─ /app/doctors → DoctorsPage
│
└─ /app/admin/* (Protected + Admin Role)
   ├─ /app/admin/stats → AdminDashboardPage
   ├─ /app/admin/users → AdminUsersPage
   ├─ /app/admin/products → AdminProductsPage
   ├─ /app/admin/education → AdminEducationPage
   └─ /app/admin/dermatologists → AdminDermatologistsPage

Wildcards
└─ /* → Redirect to /
```

### Layout Components

#### PublicLayout
- Used for: /, /login, /register, /conditions, etc.
- Contains: SiteHeader, SiteFooter
- Navigation: Public pages only

#### AppShell
- Used for: /app/* (user authenticated)
- Contains: Sidebar navigation, main content
- Navigation: User dashboard, profile, products, doctors, admin link (if admin)

#### AdminLayout
- Used for: /app/admin/* (user authenticated + admin role)
- Contains: Admin navigation tabs
- Navigation: Overview, users, products, education, dermatologists

### Navigation Flow

```
Start
  ├─ Anonymous User
  │  ├─ Routes: /, /about, /conditions, /login, /register
  │  └─ Try /app/* → Redirect to /login
  │
  ├─ Regular User (authenticated)
  │  ├─ Routes: All public + /app/*
  │  └─ Try /app/admin/* → Redirect to /app/analyze
  │
  └─ Admin User (authenticated + role="admin")
     ├─ Routes: All public + /app/* + /app/admin/*
     └─ Nav shows: Admin link in sidebar
```

---

## State Management & Context API

### AuthContext (contexts/AuthContext.tsx)

**Purpose**: Centralized authentication state

```tsx
type AuthContextValue = {
  user: User | null;                        // Current user data or null
  loading: boolean;                         // Loading during initial auth check
  refreshUser: () => Promise<void>;         // Manual user refresh
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
```

### Usage Example

```tsx
function MyComponent() {
  const { user, logout } = useAuth();

  if (!user) {
    return <p>Not logged in</p>;
  }

  return (
    <>
      <p>Welcome {user.email}</p>
      {user.role === "admin" && <p>You are an admin</p>}
      <button onClick={logout}>Sign out</button>
    </>
  );
}
```

### Component-Level State

Pages use `useState` for local state:

```tsx
export function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserSummary[]>([]);     // Data
  const [loading, setLoading] = useState(true);                   // Loading flag
  const [selectedUser, setSelectedUser] = useState<... | null>(null); // Selection
  const [query, setQuery] = useState("");                         // Search input

  useEffect(() => {
    // Fetch data on mount
    (async () => {
      setLoading(true);
      try {
        const data = await fetchAdminUsers({ search: query });
        setUsers(data);
      } finally {
        setLoading(false);
      }
    })();
  }, [query]);
}
```

---

## Error Handling & User Feedback

### Toast Notifications

Using **react-hot-toast**:

```tsx
import toast from "react-hot-toast";

// Success
toast.success("User saved successfully.");

// Error
toast.error("Failed to save user. Please try again.");

// Info
toast.loading("Saving...");  // Auto-dismiss or manual
```

**Configuration** (in App.tsx):
```tsx
<Toaster
  toastOptions={{
    duration: 4200,                    // 4.2 seconds
    style: {
      background: "#2d6a6a",          // Teal background
      color: "#fafafa",               // Light text
      borderRadius: "14px",
      fontSize: "0.875rem",
    },
  }}
/>
```

### Error Banners

**StateBanner Component**:
```tsx
<StateBanner tone="error">
  Could not load products. Try refreshing the page.
</StateBanner>

<StateBanner tone="success">
  Product saved successfully!
</StateBanner>
```

### Form Validation Feedback

```tsx
const [formError, setFormError] = useState<string | null>(null);

function handleSubmit(e: FormEvent) {
  if (!form.name.trim()) {
    setFormError("Name is required.");
    return;
  }
  setFormError(null);
  // ... submit
}

{formError && <StateBanner tone="error">{formError}</StateBanner>}
```

### Empty States

```tsx
{items.length === 0 && !loading ? (
  <EmptyState
    title="No users found"
    body="Try a different search query."
  />
) : null}
```

### Loading Skeletons

```tsx
{loading
  ? Array.from({ length: 4 }).map((_, i) => (
      <Skeleton key={i} className="h-20 w-full rounded-2xl" />
    ))
  : items.map(item => <div key={item.id}>{item.name}</div>)}
```

---

## Design Tokens & Styling

### Tailwind Configuration

```js
// Colors used throughout the app
{
  teal: "#2a7f7f",              // Primary brand color
  "teal-strong": "#1a5f5f",     // Darker teal for hover/active
  sage: { 700: "#4a6b5e" },     // Secondary color
  "forest-900": "#1a3533",      // Dark text
  page: "#f5f7f7",              // Page background
  card: "rgba(255, 255, 255, 0.75)", // Card background with opacity
  "card-border": "rgb(255, 255, 255, 0.2)", // Subtle borders
  slate: { text: "#2a3f3e" },   // Body text color
}
```

### Responsive Breakpoints

```
xs:  360px  (default, mobile)
sm:  640px  (tablets)
md:  768px  (small laptops)
lg:  1024px (desktops)
xl:  1280px (large screens)
2xl: 1536px (ultra-wide)
```

### Common Responsive Patterns

```tsx
// Stack on mobile, 2 columns on desktop
<div className="grid gap-4 lg:grid-cols-[1fr_1fr]">

// Hide on mobile, show on desktop
<nav className="hidden md:flex">

// Smaller text on mobile
<p className="text-sm md:text-base lg:text-lg">

// Full width mobile, constrained desktop
<div className="w-full max-w-7xl mx-auto px-4 md:px-6">
```

### Global Styles (index.css)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto",
    "Helvetica Neue", Arial, sans-serif;
  background-color: #f5f7f7;
  color: #1a3533;
}

/* Custom animations */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
```

---

## Summary

The DermaSoul frontend is a **production-grade React application** featuring:

### Key Strengths
✅ **Type-Safe**: Full TypeScript coverage  
✅ **Modular**: Clear separation of concerns  
✅ **Accessible**: WCAG compliant components  
✅ **Performant**: Code splitting, lazy loading  
✅ **Beautiful**: Glassmorphism design system  
✅ **Maintainable**: Well-organized file structure  

### Architecture Highlights
✅ **JWT Authentication**: Stateless, secure token-based auth  
✅ **Role-Based Access Control**: Admin checks at route & component level  
✅ **Context API**: Global auth state without Redux  
✅ **Axios Interceptors**: Automatic token injection on requests  
✅ **Error Handling**: Formatted error messages from backend  
✅ **Toast Notifications**: Non-blocking user feedback  

### Admin Module Features
✅ **Dashboard**: Real-time platform metrics  
✅ **User Management**: Search, enable/disable, view history  
✅ **Product CRUD**: Create, read, update, delete OTC products  
✅ **Education Management**: Manage disease library articles  
✅ **Dermatologist Directory**: Curate specialist referrals  

### Authentication Flow
✅ **Login/Register**: Simple email + password  
✅ **Session Persistence**: Token stored in localStorage  
✅ **Automatic Injection**: Token added to all requests  
✅ **Protected Routes**: RequireAuth/RequireAdmin guards  
✅ **Graceful Degradation**: Redirect to login on token expiration  

This documentation provides a complete understanding of the frontend architecture, design decisions, authentication system, and admin module functionality.

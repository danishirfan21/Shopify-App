# Shopify Attribution Frontend

This is the React-based embedded Shopify Admin dashboard for the Shopify Attribution & Order Inspector app.

## Tech Stack

- **React 18** (Vite)
- **Shopify Polaris** (UI Components)
- **Shopify App Bridge** (Authentication & Admin Integration)
- **Recharts** (Data Visualization)
- **Axios** (API Client)
- **React Router 6** (Navigation)

## Setup & Local Development

### 1. Prerequisites

- Node.js >= 18
- Access to a Shopify Partner account
- The backend server running (default port 3000)

### 2. Installation

```bash
cd web/frontend
npm install
```

### 3. Environment Variables

Create a `.env` file in `web/frontend/` (Vite requires `VITE_` prefix):

```env
VITE_SHOPIFY_API_KEY=your_api_key_from_partners
VITE_BACKEND_URL=http://localhost:3000/api
```

### 4. Running Development Server

```bash
npm run dev
```

The frontend will run on `http://localhost:5173`. Vite is configured to proxy `/api` requests to the backend.

## Build and Deployment

To build the project for production:

```bash
npm run build
```

The build artifacts will be generated in `dist/frontend`. You should serve these static files from your production web server or integrate them with your Express.js backend.

## Shopify Partner Dashboard Configuration

To properly load this embedded app, configure your app in the [Shopify Partner Dashboard](https://partners.shopify.com):

1. **App Setup**:
   - **App URL**: `https://your-production-domain.com` (or your ngrok URL for development)
   - **Allowed redirection URL(s)**: `https://your-production-domain.com/auth/callback`
2. **Embedded App Settings**:
   - Ensure "Embedded app" is enabled.
3. **Navigation**:
   - The app uses App Bridge's `NavigationMenu`. Ensure your backend redirects to the Shopify Admin URL after OAuth:
     `https://{shop}/admin/apps/{api_key}?host={host}`

## API Integration & Authentication

The frontend uses **Session Token Authentication**.
- Every request made via the `useAuthenticatedFetch` hook automatically retrieves a short-lived JWT from Shopify App Bridge.
- This token is attached to the `Authorization: Bearer <token>` header.
- The backend verifies this JWT to identify the shop and authorize the request.

## Project Structure

- `src/main.jsx`: Entry point, sets up Polaris and Styles.
- `src/App.jsx`: App Bridge provider and Routing.
- `src/context/AuthContext.jsx`: Manages Shopify session.
- `src/hooks/useAuthenticatedFetch.js`: Hook for authorized backend calls.
- `src/components/`: Reusable UI components (Charts, Tables, Layout).
- `src/routes/`: Main page views (Dashboard, Orders).

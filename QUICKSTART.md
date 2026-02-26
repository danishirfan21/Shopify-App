# Quick Start Guide

Get your Shopify Attribution & Order Inspector running in 10 minutes.

## Prerequisites

- Node.js 18+ installed
- MySQL 8+ installed and running
- Shopify Partner account
- ngrok installed (`npm install -g ngrok`)

## 1. Install Dependencies

```bash
npm install
```

## 2. Setup Database

```sql
CREATE DATABASE shopify_attribution CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'shopify_app'@'localhost' IDENTIFIED BY 'password123';
GRANT ALL PRIVILEGES ON shopify_attribution.* TO 'shopify_app'@'localhost';
FLUSH PRIVILEGES;
```

## 3. Generate Security Keys

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output - you'll need it twice (for ENCRYPTION_KEY and SESSION_SECRET).

## 4. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and set:

```env
# Leave Shopify credentials blank for now
SHOPIFY_API_KEY=
SHOPIFY_API_SECRET=

# Database
DB_USER=shopify_app
DB_PASSWORD=password123
DB_NAME=shopify_attribution

# Security (paste your generated keys)
ENCRYPTION_KEY=your_64_char_hex_key_here
SESSION_SECRET=your_second_64_char_hex_key_here
WEBHOOK_SECRET=any_random_string_here

# Will update after ngrok starts
APP_URL=
```

## 5. Start ngrok

```bash
ngrok http 3000
```

Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`) and update `.env`:

```env
APP_URL=https://abc123.ngrok.io
SHOPIFY_APP_URL=https://abc123.ngrok.io
```

## 6. Create Shopify App

1. Go to https://partners.shopify.com
2. Click **Apps** → **Create app** → **Create app manually**
3. Name: "Attribution Inspector"
4. **App URL**: `https://abc123.ngrok.io`
5. **Allowed redirection URL**: `https://abc123.ngrok.io/auth/callback`
6. **API scopes**: Select `read_orders`, `read_customers`, `read_products`
7. Copy **Client ID** and **Client secret**

Update `.env`:

```env
SHOPIFY_API_KEY=your_client_id
SHOPIFY_API_SECRET=your_client_secret
```

## 7. Run Migrations

```bash
npm run migrate
```

## 8. Start the App

```bash
npm run dev
```

## 9. Install on Test Store

Visit: `https://abc123.ngrok.io/auth/install?shop=your-test-store.myshopify.com`

Click **Install app** → Grant permissions

## 10. Test API

After installation, visit in your browser:

```
https://abc123.ngrok.io/api/orders
```

You should see orders syncing!

## Next Steps

- Review [README.md](./README.md) for full documentation
- Check [API_EXAMPLES.md](./docs/API_EXAMPLES.md) for API response examples
- Read [SETUP_GUIDE.md](./docs/SETUP_GUIDE.md) for production deployment

## Common Issues

**"Invalid HMAC signature"**
→ Check SHOPIFY_API_SECRET has no trailing spaces

**"Database connection failed"**
→ Verify MySQL is running: `sudo systemctl status mysql`

**"Redirect URI mismatch"**
→ Ensure redirect URL in Partner Dashboard matches exactly

**ngrok URL changed**
→ Update APP_URL in .env and restart app
→ Update App URL in Partner Dashboard

## Quick Commands

```bash
# Development
npm run dev

# Run migrations
npm run migrate

# View logs
tail -f logs/app-*.log

# Test health
curl http://localhost:3000/health
```

## Project Structure

```
shopify-attribution-app/
├── src/
│   ├── config/          # Configuration
│   ├── controllers/     # Request handlers
│   ├── database/        # Database connection & migrations
│   ├── middleware/      # Express middleware
│   ├── repositories/    # Data access layer
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   │   ├── auth/        # OAuth
│   │   ├── shopify/     # Shopify API client
│   │   ├── webhooks/    # Webhook handling
│   │   └── analytics/   # Attribution analytics
│   ├── utils/           # Utilities
│   └── app.js           # Main application
├── docs/                # Documentation
├── .env.example         # Environment template
└── package.json         # Dependencies
```

## Need Help?

- Check [SETUP_GUIDE.md](./docs/SETUP_GUIDE.md) troubleshooting section
- Review application logs in `./logs/`
- Open a GitHub issue with error details

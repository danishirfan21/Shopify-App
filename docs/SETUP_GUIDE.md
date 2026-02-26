# Complete Setup Guide

Step-by-step guide to get your Shopify Attribution & Order Inspector running.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [Shopify Partner Configuration](#shopify-partner-configuration)
4. [Testing the Installation](#testing-the-installation)
5. [Production Deployment](#production-deployment)
6. [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software

- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 9.0.0 or higher
- **MySQL**: Version 8.0 or higher
- **Git**: For version control

### Accounts Needed

- **Shopify Partner Account**: [Sign up here](https://partners.shopify.com)
- **Development Store**: Create from Partner Dashboard
- **ngrok Account** (for local dev): [Sign up here](https://ngrok.com)

## Local Development Setup

### Step 1: Install Dependencies

```bash
# Clone the repository (or download)
cd shopify-attribution-app

# Install Node.js dependencies
npm install
```

### Step 2: MySQL Database Setup

Open MySQL and run:

```sql
-- Create database
CREATE DATABASE shopify_attribution CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create user
CREATE USER 'shopify_app'@'localhost' IDENTIFIED BY 'your_secure_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON shopify_attribution.* TO 'shopify_app'@'localhost';
FLUSH PRIVILEGES;
```

### Step 3: Generate Security Keys

Generate encryption key and session secret:

```bash
# Run this twice to generate two different keys
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Output example:**
```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
```

### Step 4: Environment Configuration

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
# Application
NODE_ENV=development
PORT=3000
APP_URL=https://your-subdomain.ngrok.io

# Shopify (leave blank for now, will fill after creating app)
SHOPIFY_API_KEY=
SHOPIFY_API_SECRET=
SHOPIFY_SCOPES=read_orders,read_customers,read_products,read_analytics
SHOPIFY_APP_URL=https://your-subdomain.ngrok.io

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=shopify_app
DB_PASSWORD=your_secure_password
DB_NAME=shopify_attribution

# Security (use generated keys from Step 3)
ENCRYPTION_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
SESSION_SECRET=f2e1d0c9b8a7z6y5x4w3v2u1t0s9r8q7p6o5n4m3l2k1j0i9h8g7f6e5d4c3b2a1
WEBHOOK_SECRET=your_webhook_secret_here

# Logging
LOG_LEVEL=debug
```

### Step 5: Setup ngrok

Install ngrok:
```bash
npm install -g ngrok
```

Start ngrok tunnel:
```bash
ngrok http 3000
```

**Copy the HTTPS URL** (e.g., `https://abc123.ngrok.io`) and update `APP_URL` in `.env`

### Step 6: Run Database Migrations

```bash
npm run migrate
```

**Expected output:**
```
Starting database migrations...
Found 6 migration(s)
Running migration: 001_create_shops.sql
✓ Migration completed: 001_create_shops.sql
Running migration: 002_create_orders.sql
✓ Migration completed: 002_create_orders.sql
...
✓ All migrations completed successfully
```

### Step 7: Start the Application

```bash
npm run dev
```

**Expected output:**
```
🚀 Shopify Attribution App running on port 3000
Available endpoints:
  auth: https://abc123.ngrok.io/auth/install
  api: https://abc123.ngrok.io/api/orders
  health: https://abc123.ngrok.io/health
```

## Shopify Partner Configuration

### Step 1: Create Shopify App

1. Go to [Shopify Partners Dashboard](https://partners.shopify.com/organizations)
2. Click **Apps** → **Create app**
3. Choose **Create app manually**
4. Enter app name: "Attribution Inspector"

### Step 2: Configure App URLs

In the app settings:

**App URL:**
```
https://abc123.ngrok.io
```

**Allowed redirection URL(s):**
```
https://abc123.ngrok.io/auth/callback
```

### Step 3: Configure API Scopes

In **Configuration** → **API access scopes**, select:
- ✓ read_orders
- ✓ read_customers
- ✓ read_products
- ✓ read_analytics

Click **Save**

### Step 4: Get API Credentials

In **Overview** tab, copy:
- **Client ID** (API Key)
- **Client secret** (API Secret)

Update `.env`:
```env
SHOPIFY_API_KEY=your_client_id_here
SHOPIFY_API_SECRET=your_client_secret_here
```

### Step 5: Restart Application

```bash
# Stop the app (Ctrl+C)
# Restart with new credentials
npm run dev
```

## Testing the Installation

### Step 1: Install App on Development Store

1. Create a development store in Partner Dashboard (if you don't have one)
2. Visit: `https://abc123.ngrok.io/auth/install?shop=your-dev-store.myshopify.com`
3. Click **Install app**
4. Grant permissions

### Step 2: Verify Installation

Check logs for:
```
OAuth callback received { shop: 'your-dev-store.myshopify.com' }
Shop installed successfully { shop: 'your-dev-store.myshopify.com', shopId: 1 }
Starting full sync { shop: 'your-dev-store.myshopify.com' }
```

### Step 3: Test API Endpoints

```bash
# Health check
curl https://abc123.ngrok.io/health

# Test orders endpoint (requires authentication via browser session)
# Open browser and visit after installing app:
https://abc123.ngrok.io/api/orders?page=1&limit=5
```

### Step 4: Verify Database

Check MySQL:

```sql
USE shopify_attribution;

-- Should show your shop
SELECT * FROM shops;

-- Should show synced orders
SELECT COUNT(*) FROM orders;

-- Check sync logs
SELECT * FROM sync_logs ORDER BY id DESC LIMIT 5;
```

### Step 5: Test Webhooks

1. Create a test order in your development store
2. Check logs for:
```
Orders create webhook received { shop: 'your-dev-store.myshopify.com' }
Webhook processed successfully
```

3. Verify in database:
```sql
SELECT * FROM webhook_events ORDER BY id DESC LIMIT 5;
```

## Production Deployment

### Option 1: VPS Deployment (DigitalOcean, AWS EC2, etc.)

**1. Server Setup:**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install MySQL
sudo apt install -y mysql-server
sudo mysql_secure_installation

# Install PM2
sudo npm install -g pm2
```

**2. Application Setup:**
```bash
# Clone repository
git clone your-repo-url
cd shopify-attribution-app

# Install dependencies
npm install --production

# Setup database (run migrations)
npm run migrate

# Start with PM2
pm2 start src/app.js --name shopify-app
pm2 startup
pm2 save
```

**3. Setup NGINX as reverse proxy:**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**4. Setup SSL with Let's Encrypt:**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### Option 2: Heroku Deployment

**1. Create Heroku app:**
```bash
heroku create your-app-name
```

**2. Add MySQL addon:**
```bash
heroku addons:create jawsdb:kitefin
```

**3. Set environment variables:**
```bash
heroku config:set NODE_ENV=production
heroku config:set SHOPIFY_API_KEY=your_key
heroku config:set SHOPIFY_API_SECRET=your_secret
# ... set all other env vars
```

**4. Deploy:**
```bash
git push heroku main
```

**5. Run migrations:**
```bash
heroku run npm run migrate
```

### Production Checklist

- [ ] All environment variables set
- [ ] Strong encryption keys generated
- [ ] Database backups configured
- [ ] SSL certificate installed
- [ ] Monitoring/alerting setup
- [ ] PM2/process manager configured
- [ ] Firewall rules configured
- [ ] Update Shopify app URLs to production domain
- [ ] Test OAuth flow
- [ ] Test webhook delivery
- [ ] Review logs for errors

## Troubleshooting

### OAuth Issues

**Problem**: "Invalid HMAC signature"
```
Solution:
1. Verify SHOPIFY_API_SECRET is correct
2. Check for trailing spaces in .env
3. Ensure shop parameter matches exactly
```

**Problem**: "Redirect URI mismatch"
```
Solution:
1. Check Partner Dashboard → App setup → URLs
2. Ensure redirect URL matches exactly (including https://)
3. No trailing slashes
```

### Database Connection Issues

**Problem**: "ECONNREFUSED"
```
Solution:
1. Verify MySQL is running: sudo systemctl status mysql
2. Check DB credentials in .env
3. Ensure database exists: SHOW DATABASES;
4. Check user permissions: SHOW GRANTS FOR 'shopify_app'@'localhost';
```

**Problem**: "Access denied"
```
Solution:
1. Verify DB_USER and DB_PASSWORD
2. Check user has correct privileges
3. Try connecting manually: mysql -u shopify_app -p
```

### Sync Issues

**Problem**: "No orders syncing"
```
Solution:
1. Check sync_logs table for errors
2. Verify OAuth scopes include read_orders
3. Check rate limiting logs
4. Ensure development store has orders
```

### Webhook Issues

**Problem**: "Webhooks not being received"
```
Solution:
1. Check webhook registration: SELECT * FROM webhooks in Shopify
2. Verify WEBHOOK_SECRET matches Shopify
3. Check ngrok is running (for local dev)
4. Review webhook_events table for errors
```

**Problem**: "HMAC verification failed"
```
Solution:
1. Ensure using raw body for verification
2. Check WEBHOOK_SECRET is set correctly
3. Verify Shopify webhook secret matches
```

### Rate Limiting Issues

**Problem**: "Rate limit exceeded"
```
Solution:
1. Check RateLimiter logs
2. Adjust RATE_LIMIT_MIN_THRESHOLD
3. Implement exponential backoff
4. Consider batch operations for large syncs
```

## Getting Help

If you encounter issues not covered here:

1. Check application logs: `./logs/app.log`
2. Check database for error details
3. Review [API_EXAMPLES.md](./API_EXAMPLES.md) for expected responses
4. Open a GitHub issue with:
   - Error message
   - Steps to reproduce
   - Relevant log output
   - Environment details

## Next Steps

After successful setup:

1. **Test Attribution Tracking**: Create orders with UTM parameters
2. **Explore API Endpoints**: Review [API_EXAMPLES.md](./API_EXAMPLES.md)
3. **Setup Monitoring**: Implement error tracking (Sentry, etc.)
4. **Customize Analytics**: Add custom attribution queries
5. **Scale**: Setup database replicas, caching, queue system

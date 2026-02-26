# Shopify Attribution & Order Inspector

A production-grade Shopify app that tracks order attribution data, synchronizes order information, and provides revenue analytics through a robust API.

## Features

- **OAuth 2.0 Authentication**: Secure Shopify app installation flow
- **GraphQL API Integration**: Efficient data fetching with automatic rate limiting
- **Real-time Webhooks**: Instant order updates via Shopify webhooks
- **Attribution Tracking**: UTM parameter extraction and first/last-touch attribution
- **Revenue Analytics**: Comprehensive analytics endpoints for business insights
- **MySQL Persistence**: Normalized database schema optimized for analytics
- **Production-Ready**: Rate limiting, error handling, logging, and security best practices

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MySQL 8.0+
- **API**: Shopify GraphQL Admin API
- **Security**: Helmet, HMAC verification, encrypted token storage
- **Logging**: Winston with daily rotation

## Prerequisites

- Node.js >= 18.0.0
- MySQL >= 8.0
- Shopify Partner account
- ngrok (for local development)

## Installation

### 1. Clone and Install Dependencies

```bash
npm install
```

### 2. Database Setup

Create a MySQL database:

```sql
CREATE DATABASE shopify_attribution CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'shopify_app'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON shopify_attribution.* TO 'shopify_app'@'localhost';
FLUSH PRIVILEGES;
```

### 3. Environment Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

**Required Configuration:**

```env
# Shopify App Credentials (from Partner Dashboard)
SHOPIFY_API_KEY=your_api_key
SHOPIFY_API_SECRET=your_api_secret

# Database
DB_HOST=localhost
DB_USER=shopify_app
DB_PASSWORD=your_password
DB_NAME=shopify_attribution

# Security Keys (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
ENCRYPTION_KEY=your_64_char_hex_encryption_key
SESSION_SECRET=your_session_secret
WEBHOOK_SECRET=your_webhook_secret

# App URL (use ngrok for local dev)
APP_URL=https://your-app.ngrok.io
```

### 4. Run Database Migrations

```bash
npm run migrate
```

### 5. Start the Application

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

## Shopify App Setup

### 1. Create Shopify App

1. Go to [Shopify Partners](https://partners.shopify.com)
2. Create new app
3. Configure app URLs:
   - **App URL**: `https://your-app.ngrok.io`
   - **Allowed redirection URL(s)**: `https://your-app.ngrok.io/auth/callback`

### 2. Configure Scopes

Required scopes:
- `read_orders`
- `read_customers`
- `read_products`
- `read_analytics`

### 3. Install App

Visit: `https://your-app.ngrok.io/auth/install?shop=your-store.myshopify.com`

## API Documentation

### Authentication

All API endpoints require authentication via session cookie obtained during OAuth installation.

### Endpoints

#### Orders

**Get Orders (Paginated)**
```http
GET /api/orders?page=1&limit=50&start_date=2024-01-01&utm_source=google
```

**Get Single Order**
```http
GET /api/orders/:id
```

**Revenue Analytics**
```http
GET /api/orders/analytics/revenue?start_date=2024-01-01&end_date=2024-01-31
```

**Top Products**
```http
GET /api/orders/analytics/top-products?start_date=2024-01-01&end_date=2024-01-31&limit=10
```

#### Attribution

**Revenue by Source**
```http
GET /api/attribution/sources?start_date=2024-01-01&end_date=2024-01-31
```

**Attribution Funnel**
```http
GET /api/attribution/funnel?start_date=2024-01-01&end_date=2024-01-31
```

**Top Campaigns**
```http
GET /api/attribution/campaigns?start_date=2024-01-01&end_date=2024-01-31&limit=10
```

**Model Comparison (First-touch vs Last-touch)**
```http
GET /api/attribution/model-comparison?start_date=2024-01-01&end_date=2024-01-31
```

See [API_EXAMPLES.md](./docs/API_EXAMPLES.md) for detailed response examples.

## Architecture

### Key Components

- **OAuth Service**: Handles Shopify OAuth 2.0 flow
- **Shopify API Client**: GraphQL client with rate limiting
- **Rate Limiter**: Token bucket algorithm for API throttling
- **Order Fetcher**: Paginated order synchronization
- **Webhook Processor**: Async webhook event processing
- **Sync Orchestrator**: Coordinates full and incremental syncs
- **Attribution Analytics**: Revenue attribution analysis

### Data Flow

```
Shopify → OAuth → App Installation → Initial Sync → Webhooks → Real-time Updates
                                   ↓
                              MySQL Database
                                   ↓
                              API Endpoints → Analytics
```

### Database Schema

- `shops`: OAuth credentials and shop metadata
- `orders`: Order data with attribution fields
- `line_items`: Product line items
- `customers`: Customer data with first-touch attribution
- `sync_logs`: Synchronization audit trail
- `webhook_events`: Webhook processing queue

## Security

- **Token Encryption**: AES-256-GCM encryption for access tokens
- **HMAC Verification**: Webhook signature validation
- **Rate Limiting**: Per-IP request limits
- **Session Security**: HTTP-only, secure cookies
- **SQL Injection Protection**: Parameterized queries
- **HTTPS Required**: TLS 1.2+ in production

## Monitoring & Logging

**Logs Location**: `./logs/`

**Log Levels**:
- `error`: Critical errors requiring attention
- `warn`: Warning conditions
- `info`: General informational messages
- `debug`: Detailed debugging information

**Health Check**:
```http
GET /health
```

## Production Deployment

### Environment Variables

Ensure all production environment variables are set:
- Set `NODE_ENV=production`
- Use strong encryption keys
- Configure proper session secrets
- Enable HTTPS

### Database

- Use connection pooling (configured in `database.js`)
- Regular backups
- Consider read replicas for analytics queries

### Process Management

Use PM2 or similar:

```bash
pm2 start src/app.js --name shopify-app
pm2 startup
pm2 save
```

### Scaling Considerations

- Horizontal scaling: Stateless app servers
- Redis for session storage (optional)
- Queue system for webhooks (Bull/BullMQ)
- Database optimization: indexes, query optimization

## Troubleshooting

### OAuth Errors

- Verify `SHOPIFY_API_KEY` and `SHOPIFY_API_SECRET`
- Check redirect URL matches Partner Dashboard
- Ensure HMAC validation passes

### Database Connection Issues

- Verify MySQL credentials
- Check connection pool settings
- Ensure database exists and migrations ran

### Rate Limiting

- Monitor rate limit status via logs
- Adjust `RATE_LIMIT_MIN_THRESHOLD` if needed
- Check Shopify API cost in responses

### Webhook Issues

- Verify `WEBHOOK_SECRET` matches Shopify
- Check webhook HMAC signatures
- Review `webhook_events` table for failed events

## Development

### Running Tests

```bash
npm test
```

### Code Formatting

```bash
npm run format
```

### Linting

```bash
npm run lint
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT

## Support

For issues and questions, please open a GitHub issue.

## Acknowledgments

Built with:
- [Shopify Admin API](https://shopify.dev/docs/api/admin)
- [Express.js](https://expressjs.com/)
- [MySQL](https://www.mysql.com/)
- [Winston](https://github.com/winstonjs/winston)

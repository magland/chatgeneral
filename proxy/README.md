# ChatGeneral Proxy

A Cloudflare Worker proxy server for ChatGeneral.

## Features

- **CORS Handling**: Allows requests from authorized origins (localhost and production app)
- **Security**: Origin allowlist prevents unauthorized access
- **Error Handling**: Clear error messages for validation failures and API errors
- **Lightweight**: No dependencies, optimized for Cloudflare Workers

## Setup

### Prerequisites

- Node.js (v18 or later)
- npm or yarn
- Cloudflare account (for deployment)

### Installation

```bash
cd proxy
npm install
```

### Development

Run the worker locally:

```bash
npm run dev
```

The worker will be available at `http://localhost:8787`.

## Testing Locally

You can test the proxy with curl:

```bash
# Health check
curl http://localhost:8787/health
```

## Deployment

### 1. Configure Wrangler

Make sure you're logged in to Cloudflare:

```bash
npx wrangler login
```

### 2. Deploy to Cloudflare Workers

```bash
npm run deploy
```

This will deploy the worker to Cloudflare and provide you with a URL like:
`https://chatgeneral-proxy.your-subdomain.workers.dev`

### 3. Update Client Configuration

Update the `.env` file in the main project:

```env
VITE_PROXY_URL=https://chatgeneral-proxy.your-subdomain.workers.dev
```

## API Endpoints

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "service": "chatgeneral-proxy",
  "version": "1.0.0"
}
```

## Security

### Allowed Origins

The proxy only accepts requests from:
- `http://localhost:5173` (development)
- `https://magland.github.io` (production)

To add additional origins, modify the `ALLOWED_ORIGINS` array in `src/index.ts`.

## Troubleshooting

### CORS Errors

If you see CORS errors, ensure:
1. Your origin is in the `ALLOWED_ORIGINS` list
2. You're sending the `Origin` header with requests
3. The proxy is running and accessible

### Deployment Issues

- Make sure you're logged in: `npx wrangler login`
- Check your Cloudflare account has Workers enabled
- Verify the worker name in `wrangler.toml` is unique

## Development

### Adding Features

To add new endpoints or modify validation logic, edit the appropriate files in `src/`.

## License

Same as the parent project.

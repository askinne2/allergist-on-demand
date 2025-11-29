# Cloudflare Worker Deployment Guide

## Overview

This Cloudflare Worker acts as a secure proxy between the AlleDrops Symptom Quiz and the Shopify Admin API. It receives quiz summary data and updates customer metafields without exposing sensitive API credentials in the browser.

## Prerequisites

- Cloudflare account (free tier works)
- Shopify Admin API access token with `write_customers` permission
- Your Shopify store domain

## Environment Variables

The worker requires the following environment variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `SHOPIFY_STORE_DOMAIN` | Your Shopify store domain | `allergist-on-demand.myshopify.com` |
| `SHOPIFY_ACCESS_TOKEN` | Admin API access token | `shpat_xxxxxxxxxxxxx` |
| `ALLOWED_ORIGINS` | Comma-separated allowed origins | `https://allergist-on-demand.myshopify.com,https://yourdomain.com` |

## Getting Shopify Admin API Access Token

1. Log in to your Shopify Admin
2. Go to **Settings** → **Apps and sales channels** → **Develop apps**
3. Click **Create an app**
4. Name it "AlleDrops Quiz Integration"
5. Click **Configure Admin API scopes**
6. Select:
   - `write_customers` (to update customer data)
   - `read_customers` (to find existing customers)
7. Click **Save**, then **Install app**
8. Copy the **Admin API access token**

## Deployment Options

### Option 1: Deploy via Wrangler CLI (Recommended)

1. **Install Wrangler:**
   ```bash
   npm install -g wrangler
   ```

2. **Login to Cloudflare:**
   ```bash
   wrangler login
   ```

3. **Create wrangler.toml file:**
   ```toml
   name = "alledrops-quiz-worker"
   type = "javascript"
   account_id = "your-account-id"
   workers_dev = true
   compatibility_date = "2024-01-01"

   [env.production]
   route = "https://alledrops-api.workers.dev/*"
   ```

4. **Deploy the worker:**
   ```bash
   cd cloudflare-worker
   wrangler publish
   ```

5. **Set environment variables:**
   ```bash
   wrangler secret put SHOPIFY_STORE_DOMAIN
   # Enter: allergist-on-demand.myshopify.com

   wrangler secret put SHOPIFY_ACCESS_TOKEN
   # Paste your Shopify Admin API token

   wrangler secret put ALLOWED_ORIGINS
   # Enter: https://allergist-on-demand.myshopify.com
   ```

### Option 2: Deploy via Cloudflare Dashboard

1. Go to [Cloudflare Workers Dashboard](https://dash.cloudflare.com/)
2. Click **Create a Service**
3. Name it `alledrops-quiz-worker`
4. Click **Create Service**
5. Click **Quick Edit**
6. Copy and paste the contents of `worker.js`
7. Click **Save and Deploy**
8. Go to **Settings** → **Variables**
9. Add the three environment variables as **Secrets**:
   - `SHOPIFY_STORE_DOMAIN`
   - `SHOPIFY_ACCESS_TOKEN`
   - `ALLOWED_ORIGINS`

## Testing the Worker

### Test with cURL

```bash
curl -X POST https://your-worker-url.workers.dev/customer-update \
  -H "Content-Type: application/json" \
  -H "Origin: https://allergist-on-demand.myshopify.com" \
  -d '{
    "email": "test@example.com",
    "symptom_profile_id": "AOD_20241128_abc123",
    "quiz_score": 18,
    "quiz_region": "southeast",
    "quiz_date": "2024-11-28T10:30:00Z",
    "severity_level": "moderate"
  }'
```

### Expected Response

```json
{
  "success": true,
  "customerId": "gid://shopify/Customer/123456789",
  "message": "Customer metafields updated successfully"
}
```

### Error Responses

**400 Bad Request:**
```json
{
  "error": "Valid email is required"
}
```

**403 Forbidden:**
```json
{
  "error": "Origin not allowed"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Failed to update metafields",
  "details": [...]
}
```

## Configure Shopify Theme

After deploying the worker, update your Shopify theme settings:

1. Go to **Online Store** → **Themes** → **Customize**
2. Navigate to the Symptom Quiz page
3. Click on the **Symptom Quiz** section
4. Under **API Configuration**, enter:
   - **Cloudflare Worker URL**: `https://your-worker-name.workers.dev/customer-update`

## Security Considerations

1. **CORS Configuration**: The worker validates the request origin. Make sure `ALLOWED_ORIGINS` includes all domains where the quiz will be hosted.

2. **API Token Security**: The Shopify Admin API token is stored as a Cloudflare secret and never exposed to the browser.

3. **Rate Limiting**: Consider adding rate limiting to prevent abuse:
   ```javascript
   // Add to worker.js
   const RATE_LIMIT = 10; // requests per minute per IP
   ```

4. **Input Validation**: The worker validates all incoming data before making API calls.

## Monitoring

### View Logs

```bash
wrangler tail
```

Or view logs in the Cloudflare Dashboard under **Workers** → **Your Worker** → **Logs**.

### Analytics

Check worker performance in the Cloudflare Dashboard:
- Request volume
- Error rate
- Response time
- Bandwidth usage

## Troubleshooting

### Issue: "Origin not allowed"

**Solution**: Add your Shopify store domain to `ALLOWED_ORIGINS`:
```
https://allergist-on-demand.myshopify.com
```

### Issue: "Failed to find or create customer"

**Possible causes:**
1. Invalid Shopify access token
2. Insufficient API permissions
3. Invalid store domain

**Solution**: Verify your environment variables and API token permissions.

### Issue: "Failed to update metafields"

**Possible causes:**
1. Metafield definitions not created in Shopify
2. Invalid metafield data types
3. Shopify API rate limits

**Solution**: 
1. Ensure customer metafields are defined in Shopify Admin
2. Check the worker logs for specific error messages

## Customer Metafields Schema

The worker creates/updates these metafields in the `alledrops` namespace:

| Key | Type | Description |
|-----|------|-------------|
| `symptom_profile_id` | single_line_text_field | Unique profile ID (AOD_YYYYMMDD_xxxxx) |
| `quiz_score` | number_integer | Total symptom score (0-60) |
| `quiz_region` | single_line_text_field | Selected region |
| `quiz_date` | date_time | Quiz completion timestamp |
| `severity_level` | single_line_text_field | Severity level (minimal/mild/moderate/severe) |

## Updating the Worker

To update the worker after making changes:

```bash
wrangler publish
```

## Cost Considerations

Cloudflare Workers free tier includes:
- 100,000 requests per day
- 10ms CPU time per request

This should be more than sufficient for most quiz implementations. Monitor usage in the Cloudflare Dashboard.

## Support

For issues or questions:
1. Check Cloudflare Worker logs
2. Verify Shopify API permissions
3. Test with the cURL command above
4. Review Shopify Admin API documentation

## Additional Resources

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Shopify Admin API Reference](https://shopify.dev/api/admin)
- [Wrangler CLI Guide](https://developers.cloudflare.com/workers/wrangler/)


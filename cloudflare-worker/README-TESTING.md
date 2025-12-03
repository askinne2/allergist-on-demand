# Testing Quiz Submissions Locally

This guide shows how to test the Cloudflare Worker metafield integration without completing the full quiz.

## Quick Test

Run a single test submission:

```bash
cd cloudflare-worker
node test-quiz-submission.js --single
```

## Run All Test Cases

Test multiple quiz scenarios:

```bash
cd cloudflare-worker
node test-quiz-submission.js
```

This will submit 4 different quiz scenarios:
- Severe symptoms (60 points)
- Moderate symptoms (25 points)
- Mild symptoms (8 points)
- Minimal symptoms (3 points)

## What Gets Tested

Each test submission will:
1. ✅ Find or create customer by email
2. ✅ Fetch existing `quiz_history` metafield
3. ✅ Add new quiz entry to history array
4. ✅ Update latest quiz metafields
5. ✅ Update `quiz_history` metafield

## Verify Results

After running tests, check in Shopify Admin:

1. Go to **Customers** → Find customer by email (`askinne2@gmail.com`)
2. Click on customer → Scroll to **Metafields**
3. You should see:
   - **Latest quiz data**: Individual metafields (symptom_profile_id, quiz_score, etc.)
   - **quiz_history**: JSON array with all quiz attempts

## Customizing Test Data

Edit `test-quiz-submission.js` to customize:
- Email address
- Quiz scores
- Regions
- Profile IDs
- Add more test cases

## Example Test Data Format

```javascript
{
  email: 'test@example.com',
  symptom_profile_id: 'AOD_20251129_test001',
  quiz_score: 45,
  quiz_region: 'northwest',
  quiz_date: '2025-11-29T14:46:06.008Z',
  severity_level: 'severe'
}
```

## Troubleshooting

### Error: "Origin not allowed"
Make sure your `ALLOWED_ORIGINS` environment variable includes the origin you're testing from.

### Error: "Failed to find or create customer"
Check that your Shopify Admin API token has `write_customers` permission.

### No history showing up
- Check Cloudflare Worker logs: `wrangler tail`
- Verify the `quiz_history` metafield was created (type: `json`)
- Check that the GraphQL query is working correctly


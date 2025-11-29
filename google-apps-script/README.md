# Google Sheets Integration Setup Guide

## Overview

This guide will walk you through setting up Google Sheets to receive quiz submission data via a Google Apps Script web app. This is simpler than the Google Sheets API and requires no authentication tokens.

## Prerequisites

- Google account (free)
- Google Sheets (free)

## Step-by-Step Setup

### 1. Create Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Click **Blank** to create a new spreadsheet
3. Name it: "AlleDrops Symptom Assessments"
4. The sheet will automatically have a tab named "Sheet1" - rename it to **"Symptom Responses"**
   - Right-click the tab → **Rename** → Enter "Symptom Responses"

### 2. Set Up Apps Script

1. In your Google Sheet, click **Extensions** → **Apps Script**
2. Delete any default code
3. Copy and paste the code from `Code.gs`
4. Click **Save** (💾 icon) or press `Cmd+S` / `Ctrl+S`
5. Name the project: "AlleDrops Quiz Integration"

### 3. Deploy as Web App

1. Click **Deploy** → **New deployment**
2. Click the gear icon ⚙️ next to "Select type"
3. Choose **Web app**
4. Configure settings:
   - **Description**: "AlleDrops Symptom Quiz Data Receiver"
   - **Execute as**: **Me** (your Google account)
   - **Who has access**: **Anyone** (required for public quiz)
5. Click **Deploy**
6. Click **Authorize access** (first time only)
   - Choose your Google account
   - Click **Advanced** → **Go to AlleDrops Quiz Integration (unsafe)**
   - Click **Allow**
7. Copy the **Web app URL** - you'll need this for Shopify!

### 4. Test the Web App

1. Copy the web app URL
2. Open it in a new browser tab
3. You should see:
   ```json
   {
     "status": "AlleDrops Symptom Quiz Web App is running",
     "version": "1.0.0",
     "sheet": "Symptom Responses"
   }
   ```

### 5. Configure Shopify Theme

1. Go to **Online Store** → **Themes** → **Customize**
2. Navigate to your quiz page
3. Click on the **Symptom Quiz** section
4. Under **API Configuration**:
   - **Google Sheets Web App URL**: Paste the URL you copied
5. Click **Save**

### 6. Test Quiz Submission

1. Complete the quiz on your store
2. Check your Google Sheet
3. You should see a new row with all the quiz data!

## Sheet Structure

The script automatically creates these columns in order:

| Column | Description |
|--------|-------------|
| Profile ID | Unique identifier (AOD_YYYYMMDD_xxxxx) |
| Customer Name | Full name |
| Customer Email | Email address |
| Total Score | Quiz score (0-60) |
| Severity Level | Minimal/Mild/Moderate/Severe |
| Region | Selected region |
| Submission Date | ISO timestamp |
| Completion Time (seconds) | Time to complete quiz |
| Nasal - Runny | 0-3 |
| Nasal - Stuffy | 0-3 |
| Nasal - Sneezing | 0-3 |
| Nasal - Postnasal Drip | 0-3 |
| Nasal - Loss of Smell | 0-3 |
| Eye - Watery | 0-3 |
| Eye - Itchy | 0-3 |
| Eye - Redness | 0-3 |
| Eye - Swollen | 0-3 |
| Respiratory - Cough | 0-3 |
| Respiratory - Wheezing | 0-3 |
| Respiratory - Chest Tightness | 0-3 |
| Respiratory - Shortness of Breath | 0-3 |
| Skin - Rash | 0-3 |
| Skin - Hives | 0-3 |
| Skin - Itching | 0-3 |
| Skin - Eczema | 0-3 |
| Throat - Itchy | 0-3 |
| Throat - Sore | 0-3 |
| Throat - Mouth Itchy | 0-3 |
| Seasonal Timing | When symptoms occur |
| Duration | How long experiencing symptoms |
| Full Response JSON | Complete form data as JSON |

## Troubleshooting

### Issue: "Sheet not found: Symptom Responses"

**Solution**: Make sure your sheet tab is named exactly "Symptom Responses" (case-sensitive)

### Issue: "Authorization required"

**Solution**: 
1. Go back to Apps Script
2. Click **Deploy** → **Manage deployments**
3. Click the pencil icon ✏️ to edit
4. Click **Authorize access** again

### Issue: Data not appearing in sheet

**Check**:
1. Web app URL is correct in Shopify settings
2. Sheet tab name matches exactly
3. Check Apps Script execution logs:
   - In Apps Script, click **Executions** (clock icon)
   - View any error messages

### Issue: CORS errors in browser console

**Solution**: Make sure web app is deployed with "Anyone" access, not "Only myself"

## Security Notes

- The web app URL is public but doesn't expose your Google account
- Anyone with the URL can submit data (this is intentional for the quiz)
- Consider adding rate limiting if you expect high volume
- The script validates data before writing to prevent errors

## Customization

### Change Sheet Name

If you want a different sheet tab name:

1. In `Code.gs`, change:
   ```javascript
   const SHEET_NAME = 'Your Sheet Name';
   ```
2. Redeploy the web app

### Add Data Validation

You can add validation in the `doPost` function:

```javascript
// Example: Validate email format
if (!rowData[2].includes('@')) {
  return ContentService.createTextOutput(
    JSON.stringify({ success: false, error: 'Invalid email' })
  ).setMimeType(ContentService.MimeType.JSON);
}
```

### Formatting

The script automatically:
- Makes headers bold and blue
- Freezes the header row
- Sets proper column widths (you may need to adjust manually)

## Updating the Script

If you need to update the script:

1. Make changes in Apps Script editor
2. Click **Deploy** → **Manage deployments**
3. Click the pencil icon ✏️ next to your deployment
4. Under **Version**, select **New version**
5. Click **Deploy**
6. No need to update the URL - it stays the same!

## Testing

You can test the script manually:

1. In Apps Script, select `testSubmission` from the function dropdown
2. Click **Run** ▶️
3. Check your Google Sheet for the test row
4. Delete the test row when done

## Limits

Google Apps Script free tier limits:
- **6 minutes execution time** per request (plenty for our use)
- **20,000 URL fetch calls per day** (more than enough)
- **100,000 total executions per day**

For most stores, the free tier is more than sufficient.

## Support

If you encounter issues:
1. Check Apps Script execution logs
2. Verify sheet tab name matches exactly
3. Test the web app URL directly in browser
4. Check browser console for JavaScript errors
5. Verify web app is deployed with "Anyone" access

---

**That's it!** Your Google Sheets integration is ready to receive quiz data. 🎉


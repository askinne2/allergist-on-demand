# AlleDrops Symptom Quiz - Admin Guide

## Table of Contents

1. [Overview](#overview)
2. [Setting Up the Quiz](#setting-up-the-quiz)
3. [Managing Quiz Questions](#managing-quiz-questions)
4. [Configuring API Integrations](#configuring-api-integrations)
5. [Customizing Results Messages](#customizing-results-messages)
6. [Viewing Quiz Responses](#viewing-quiz-responses)
7. [Troubleshooting](#troubleshooting)

## Overview

The AlleDrops Symptom Quiz is a comprehensive assessment tool that helps customers find the right regional allergy drops for their symptoms. This guide will walk you through managing the quiz from the Shopify admin.

## Setting Up the Quiz

### 1. Create a Quiz Page

1. Go to **Online Store** → **Pages**
2. Click **Add page**
3. Title: "Symptom Assessment" (or your preferred title)
4. For the template, select **page.symptom-quiz**
5. Click **Save**

### 2. Add Quiz to Navigation

1. Go to **Online Store** → **Navigation**
2. Select the menu where you want the quiz to appear
3. Click **Add menu item**
4. Name: "Take Quiz" or "Assessment"
5. Link: Select the page you created
6. Click **Save**

### 3. Configure Quiz Settings

1. Go to **Online Store** → **Themes**
2. Click **Customize** on your active theme
3. Navigate to the Symptom Assessment page
4. Click on the **Symptom Quiz** section
5. Configure the settings (see sections below)

## Managing Quiz Questions

### Option 1: Using Hardcoded Questions (Default)

By default, the quiz uses 35 pre-configured questions covering:
- Region selection
- Nasal symptoms (5 questions)
- Eye symptoms (4 questions)
- Respiratory symptoms (4 questions)
- Skin symptoms (4 questions)
- Throat symptoms (3 questions)
- Timing & pattern (2 questions)
- Contact information (3 questions)

**No configuration needed** - the quiz works out of the box!

### Option 2: Using Metaobjects (Advanced)

For admins who want to customize questions:

#### Step 1: Enable Metaobjects

1. In theme customizer, go to the Symptom Quiz section
2. Under **API Configuration**, check **Load Questions from Metaobjects**
3. Click **Save**

#### Step 2: Create Metaobject Definition

1. Go to **Settings** → **Custom data** → **Metaobjects**
2. Click **Add definition**
3. Name: "Quiz Question"
4. Type: `quiz_question`
5. Add these fields:

| Field Name | Field Type | Required | Description |
|------------|------------|----------|-------------|
| question_id | Single line text | Yes | Unique identifier (e.g., `nasal_runny`) |
| question_text | Multi-line text | Yes | The question displayed to users |
| question_subtitle | Multi-line text | No | Helper text below question |
| question_type | Single line text | Yes | One of: `single_choice`, `severity_scale`, `text_input`, `email_input`, `checkbox` |
| options | Multi-line text | No | JSON array for single_choice (see below) |
| order | Integer | Yes | Display order (use increments of 10) |
| required | Boolean | Yes | Whether the question is required |
| category | Single line text | Yes | Group: `demographics`, `nasal`, `eye`, `respiratory`, `skin`, `throat`, `contact` |
| placeholder | Single line text | No | Placeholder text for inputs |

6. Click **Save**

#### Step 3: Add Questions

1. Go to **Content** → **Metaobjects** → **Quiz Questions**
2. Click **Add entry**
3. Fill in the fields:

**Example: Severity Scale Question**
```
Question ID: nasal_runny
Question Text: Runny Nose
Question Type: severity_scale
Order: 20
Required: Yes
Category: nasal
```

**Example: Single Choice Question**
```
Question ID: region
Question Text: Where do you live most of the year?
Subtitle: Our Regional Allergy Drops are formulated to specific areas.
Question Type: single_choice
Options:
[
  { "value": "northwest", "label": "Northwest" },
  { "value": "southwest", "label": "Southwest" },
  { "value": "northeast", "label": "Northeast" }
]
Order: 10
Required: Yes
Category: demographics
```

4. Click **Save**
5. Repeat for all questions

### Question Ordering Best Practices

- Use increments of 10 (10, 20, 30, etc.) for order values
- This allows inserting questions later (e.g., add 15 between 10 and 20)
- Group by category using order ranges:
  - Demographics: 10-19
  - Nasal: 20-29
  - Eye: 30-39
  - Respiratory: 40-49
  - Skin: 50-59
  - Throat: 60-69
  - Contact: 80-89

## Configuring API Integrations

### Google Sheets Setup

Google Sheets stores detailed symptom responses for record-keeping and analysis. This uses Google Apps Script (free, no API keys needed).

#### 1. Create Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Click **Blank** to create a new spreadsheet
3. Name it: "AlleDrops Symptom Assessments"
4. Rename the default tab to **"Symptom Responses"**
   - Right-click the tab → **Rename** → Enter "Symptom Responses"

#### 2. Set Up Apps Script

1. In your Google Sheet, click **Extensions** → **Apps Script**
2. Delete any default code
3. Copy the code from `google-apps-script/Code.gs` in your theme files
4. Paste it into the Apps Script editor
5. Click **Save** (💾 icon)
6. Name the project: "AlleDrops Quiz Integration"

#### 3. Deploy as Web App

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
7. **Copy the Web app URL** - you'll need this!

#### 4. Configure in Shopify

1. In theme customizer → Symptom Quiz section
2. Under **API Configuration**:
   - **Google Sheets Web App URL**: Paste the URL you copied
3. Click **Save**

#### 5. Test the Integration

1. Complete the quiz on your store
2. Check your Google Sheet
3. You should see a new row with all the quiz data!

**Note**: The script automatically creates column headers on first submission. See `google-apps-script/README.md` for detailed setup instructions.

### Cloudflare Worker Setup

See the [Cloudflare Worker README](/cloudflare-worker/README.md) for detailed deployment instructions.

Quick setup:
1. Deploy the worker from `/cloudflare-worker/worker.js`
2. Set environment variables (Shopify domain, API token, allowed origins)
3. Copy the worker URL
4. In theme customizer → **Cloudflare Worker URL**, paste the URL
5. Click **Save**

## Customizing Results Messages

### Score-Based Messages

1. In theme customizer, navigate to the quiz page
2. Click on the **Quiz Results** section
3. Edit messages for each severity level:

**Minimal (0-4 points):**
- Title: "Minimal Symptoms"
- Message: Customize the recommendation text
- CTA: Configure educational content URL

**Mild (5-9 points):**
- Title: "Mild Symptoms"
- Message: Customize consultation recommendation
- CTA: Configure consultation booking URL

**Moderate (10-19 points):**
- Title: "Moderate Symptoms"
- Message: Encourage product purchase
- Product will be shown automatically

**Severe (20+ points):**
- Title: "Severe Symptoms"
- Message: Strong product recommendation
- Product will be shown automatically

### Product Matching

Products are matched by region using this format:
- Handle format: `{region}-allergy-drops`
- Examples:
  - User selects "Southeast" → Shows product with handle `southeast-allergy-drops`
  - User selects "North Central" → Shows product with handle `north-central-allergy-drops`

**To set up regional products:**
1. Go to **Products**
2. For each region, ensure the product handle matches the pattern
3. Product handle must be lowercase with hyphens

## Viewing Quiz Responses

### In Google Sheets

1. Log in to [Google Sheets](https://sheets.google.com)
2. Open your "AlleDrops Symptom Assessments" spreadsheet
3. View the "Symptom Responses" tab
4. Use Google Sheets features to analyze data:
   - **Filter views**: Filter by region, severity level, date
   - **Sort**: Click column headers to sort
   - **Charts**: Insert → Chart to visualize trends
   - **Pivot tables**: Analyze symptom patterns
   - **Export**: File → Download to export as CSV/Excel

### In Shopify Customer Records

Summary data is stored in customer metafields:

1. Go to **Customers**
2. Click on a customer
3. Scroll to **Metafields**
4. Look for the `alledrops` namespace:
   - `symptom_profile_id`: Reference to full Airtable record
   - `quiz_score`: Total score
   - `quiz_region`: Selected region
   - `quiz_date`: Completion date
   - `severity_level`: Calculated severity

**To view metafields:**
If metafields aren't visible:
1. Go to **Settings** → **Custom data** → **Customers**
2. Add metafield definitions for the `alledrops` namespace

## Troubleshooting

### Quiz Not Showing Questions

**Problem**: Quiz page loads but no questions appear

**Solutions:**
1. Check browser console for JavaScript errors
2. Verify `quiz-config.js` is loading (check Network tab)
3. If using Metaobjects, disable that option temporarily to use hardcoded questions
4. Clear browser cache and reload

### Google Sheets Submissions Failing

**Problem**: Quiz completes but data not in Google Sheets

**Solutions:**
1. Verify Web App URL is correct (test it in browser - should show status message)
2. Check sheet tab name is exactly "Symptom Responses" (case-sensitive)
3. Ensure web app is deployed with "Anyone" access (not "Only myself")
4. Check Apps Script execution logs:
   - In Apps Script, click **Executions** (clock icon)
   - View any error messages
5. Verify authorization: Re-authorize the web app if needed
6. Check browser console for JavaScript errors

### Cloudflare Worker Errors

**Problem**: Customer metafields not updating

**Solutions:**
1. Test worker URL directly (see worker README)
2. Verify environment variables are set correctly
3. Check worker logs in Cloudflare dashboard
4. Ensure allowed origins include your Shopify store
5. Verify Shopify API token has `write_customers` permission

### Products Not Showing in Results

**Problem**: Score is high enough but no product displayed

**Solutions:**
1. Check product handle matches pattern: `{region}-allergy-drops`
2. Ensure product is published and available
3. Verify region value is being captured correctly
4. Check browser console for product fetch errors

### Validation Errors

**Problem**: Users can't proceed through quiz

**Solutions:**
1. Check that all required fields have `required: true`
2. Verify email validation is working
3. Ensure radio buttons and checkboxes are properly grouped
4. Test with different browsers

## Best Practices

### Data Privacy

- Inform users about data collection in the disclaimer
- Link to your privacy policy
- Only collect necessary information
- Regularly review and clean old submissions

### Testing

Before launching:
1. Complete the quiz multiple times with different responses
2. Test on mobile devices
3. Verify Google Sheets submissions (check sheet for new rows)
4. Check customer metafield updates (if Cloudflare Worker configured)
5. Test all score ranges (minimal, mild, moderate, severe)

### Maintenance

Regular tasks:
- Review quiz responses monthly
- Update product recommendations seasonally
- Check API usage and limits
- Update question wording based on feedback
- Monitor completion rates

## Support Resources

- **Technical Documentation**: `/docs/technical-docs.md`
- **Cloudflare Worker Guide**: `/cloudflare-worker/README.md`
- **Google Sheets Setup**: `/google-apps-script/README.md`
- **Question Schema**: `/docs/quiz-questions-schema.md`
- **Shopify Theme Documentation**: [Shopify Dev Docs](https://shopify.dev/themes)
- **Google Apps Script Docs**: [Apps Script Documentation](https://developers.google.com/apps-script)


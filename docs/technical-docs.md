# AlleDrops Symptom Quiz - Technical Documentation

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [File Structure](#file-structure)
3. [Data Flow](#data-flow)
4. [API Endpoints](#api-endpoints)
5. [Data Schema](#data-schema)
6. [JavaScript Classes](#javascript-classes)
7. [Scoring Algorithm](#scoring-algorithm)
8. [Security Implementation](#security-implementation)
9. [Performance Optimization](#performance-optimization)
10. [Browser Compatibility](#browser-compatibility)

## Architecture Overview

The AlleDrops Symptom Quiz uses a multi-tiered architecture:

```
┌─────────────────────────────────────────────────────────────┐
│ Frontend (Shopify Theme)                                     │
│  - Liquid Templates                                          │
│  - Vanilla JavaScript (ES6+)                                 │
│  - CSS (BEM Methodology)                                     │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ├──────────────────┐
                       ↓                  ↓
        ┌──────────────────────┐   ┌───────────────────────┐
        │ Google Sheets         │   │ Cloudflare Worker     │
        │ (Detailed Data)      │   │ (Proxy to Shopify)    │
        └──────────────────────┘   └───────┬───────────────┘
                                            ↓
                                   ┌────────────────────────┐
                                   │ Shopify Admin API      │
                                   │ (Customer Metafields)  │
                                   └────────────────────────┘
```

### Design Principles

1. **Separation of Concerns**: Quiz logic, data storage, and UI are modular
2. **Progressive Enhancement**: Works without JavaScript (form submission fallback)
3. **Security First**: No sensitive credentials in browser, input sanitization
4. **Mobile-First**: Responsive design starting from 320px width
5. **Accessibility**: WCAG 2.1 AA compliant
6. **Performance**: Lazy-load sections, minimize API calls

## File Structure

```
shopify-theme/
├── assets/
│   ├── symptom-quiz.js           # Main quiz controller (850 lines)
│   ├── symptom-quiz.css          # Quiz styles (1200 lines)
│   ├── quiz-config.js            # Question loader (400 lines)
│   ├── quiz-results.js           # Results display (350 lines)
│   └── google-sheets-integration.js   # Google Sheets API wrapper (150 lines)
├── sections/
│   ├── symptom-quiz.liquid       # Main quiz section (150 lines)
│   └── quiz-results.liquid       # Results section (180 lines)
├── snippets/
│   ├── quiz-question.liquid      # Question template (120 lines)
│   ├── quiz-progress.liquid      # Progress indicator (30 lines)
│   └── severity-scale.liquid     # Severity input (60 lines)
├── templates/
│   └── page.symptom-quiz.json    # Quiz page template (JSON)
└── cloudflare-worker/
    ├── worker.js                 # Cloudflare Worker (400 lines)
    └── README.md                 # Deployment guide
```

## Data Flow

### Quiz Submission Flow

```
1. User loads quiz page
   ↓
2. QuizConfigLoader initializes
   - Attempts to load from Metaobjects (if enabled)
   - Falls back to hardcoded questions
   ↓
3. SymptomQuiz renders first category
   ↓
4. User navigates through categories
   - Validation on each "Next" click
   - Responses stored in memory
   ↓
5. User clicks "Submit"
   - Honeypot check (bot prevention)
   - Final validation
   - Score calculation
   - Profile ID generation
   ↓
6. Parallel API submissions:
   a) Google Sheets (detailed data)
   b) Cloudflare Worker (summary data)
   ↓
7. Cloudflare Worker processes:
   - Finds or creates customer
   - Updates customer metafields
   ↓
8. Results displayed
   - Score visualization
   - Product recommendation (if score >= 10)
   - OR Consultation CTA (if score 5-9)
   - OR Educational content (if score 0-4)
```

### State Management

The quiz maintains state in:
- `SymptomQuiz.responses`: User responses (key-value pairs)
- `SymptomQuiz.currentCategoryIndex`: Current step
- `SymptomQuiz.questions`: Loaded question data

**No localStorage used** for privacy reasons - all state is in-memory.

## API Endpoints

### Google Sheets Web App (Apps Script)

**Endpoint**: `https://script.google.com/macros/s/{SCRIPT_ID}/exec`

**Method**: POST

**Headers**:
```
Content-Type: application/json
```

**Request Body**:
```json
{
  "data": [
    "AOD_20241128_abc123",
    "John Smith",
    "john@example.com",
    18,
    "Moderate",
    "Southeast",
    "2024-11-28T10:30:00Z",
    120,
    2, 3, 1, 2, 0,
    1, 2, 1, 0,
    1, 0, 0, 0,
    0, 0, 1, 0,
    2, 1, 1,
    "spring",
    "3_5yrs",
    "{\"test\": \"data\"}"
  ]
}
```

**Response** (Success - 200):
```json
{
  "success": true,
  "rowNumber": 2,
  "message": "Data appended successfully"
}
```

**Error Handling**:
- Network errors: Retry after 2 seconds
- Invalid data: Returns error message, quiz continues
- Sheet not found: Returns error, check sheet tab name

### Cloudflare Worker

**Endpoint**: `https://your-worker.workers.dev/customer-update`

**Method**: POST

**Headers**:
```
Content-Type: application/json
Origin: https://allergist-on-demand.myshopify.com
```

**Request Body**:
```json
{
  "email": "john@example.com",
  "symptom_profile_id": "AOD_20241128_abc123",
  "quiz_score": 18,
  "quiz_region": "southeast",
  "quiz_date": "2024-11-28T10:30:00Z",
  "severity_level": "moderate"
}
```

**Response** (Success - 200):
```json
{
  "success": true,
  "customerId": "gid://shopify/Customer/123456789",
  "message": "Customer metafields updated successfully"
}
```

**Response** (Error - 400/500):
```json
{
  "error": "Error description",
  "details": "Additional error information"
}
```

### Shopify Product API

**Endpoint**: `/products/{handle}.js`

**Method**: GET

**Response**:
```json
{
  "id": 123456789,
  "title": "Southeast Allergy Drops",
  "handle": "southeast-allergy-drops",
  "description": "...",
  "featured_image": "https://...",
  "variants": [{
    "id": 987654321,
    "price": 8999,
    "available": true
  }]
}
```

### Shopify Cart API

**Endpoint**: `/cart/add.js`

**Method**: POST

**Request Body**:
```json
{
  "items": [{
    "id": 987654321,
    "quantity": 1
  }]
}
```

## Data Schema

### Google Sheets Columns

| Field Name | Type | Description | Example |
|------------|------|-------------|---------|
| Profile ID | Single line text | Unique identifier | `AOD_20241128_abc123` |
| Customer Name | Single line text | Full name | `John Smith` |
| Customer Email | Email | Email address | `john@example.com` |
| Total Score | Number | Sum of severity values | `18` |
| Severity Level | Single select | Calculated severity | `Moderate` |
| Region | Single select | Selected region | `Southeast` |
| Submission Date | Date | ISO timestamp | `2024-11-28T10:30:00Z` |
| Completion Time (seconds) | Number | Time to complete | `145` |
| Nasal - Runny | Number (0-3) | Symptom severity | `2` |
| Nasal - Stuffy | Number (0-3) | Symptom severity | `3` |
| Nasal - Sneezing | Number (0-3) | Symptom severity | `1` |
| Nasal - Postnasal Drip | Number (0-3) | Symptom severity | `2` |
| Nasal - Loss of Smell | Number (0-3) | Symptom severity | `0` |
| Eye - Watery | Number (0-3) | Symptom severity | `1` |
| Eye - Itchy | Number (0-3) | Symptom severity | `2` |
| Eye - Redness | Number (0-3) | Symptom severity | `1` |
| Eye - Swollen | Number (0-3) | Symptom severity | `0` |
| Respiratory - Cough | Number (0-3) | Symptom severity | `1` |
| Respiratory - Wheezing | Number (0-3) | Symptom severity | `0` |
| Respiratory - Chest Tightness | Number (0-3) | Symptom severity | `0` |
| Respiratory - Shortness of Breath | Number (0-3) | Symptom severity | `0` |
| Skin - Rash | Number (0-3) | Symptom severity | `0` |
| Skin - Hives | Number (0-3) | Symptom severity | `0` |
| Skin - Itching | Number (0-3) | Symptom severity | `1` |
| Skin - Eczema | Number (0-3) | Symptom severity | `0` |
| Throat - Itchy | Number (0-3) | Symptom severity | `2` |
| Throat - Sore | Number (0-3) | Symptom severity | `1` |
| Throat - Mouth Itchy | Number (0-3) | Symptom severity | `1` |
| Seasonal Timing | Single line text | When symptoms occur | `spring` |
| Duration | Single line text | How long experiencing | `3_5yrs` |
| Full Response JSON | Long text | Complete form data | `{...}` |

### Shopify Customer Metafields

| Namespace | Key | Type | Description |
|-----------|-----|------|-------------|
| alledrops | symptom_profile_id | single_line_text_field | Links to Google Sheets record |
| alledrops | quiz_score | number_integer | Total score (0-60) |
| alledrops | quiz_region | single_line_text_field | Selected region |
| alledrops | quiz_date | date_time | Completion timestamp |
| alledrops | severity_level | single_line_text_field | Severity category |

### Question Object Schema

```typescript
interface Question {
  id: string;                    // Unique identifier
  type: QuestionType;            // Question type
  text: string;                  // Question text
  subtitle?: string;             // Optional helper text
  category: string;              // Group: nasal, eye, etc.
  order: number;                 // Display order
  required: boolean;             // Whether required
  options?: Option[];            // For single_choice
  placeholder?: string;          // For text inputs
}

type QuestionType = 
  | 'single_choice'
  | 'severity_scale' 
  | 'text_input'
  | 'email_input'
  | 'checkbox';

interface Option {
  value: string;                 // Internal value
  label: string;                 // Display text
}
```

## JavaScript Classes

### SymptomQuiz

Main controller class for the quiz.

**Constructor**:
```javascript
new SymptomQuiz(config: Object)
```

**Public Methods**:
- `init()`: Initialize quiz, load questions
- `showCategory(index: number)`: Display specific category
- `nextCategory()`: Navigate to next category
- `previousCategory()`: Navigate to previous category
- `validateCurrentCategory()`: Validate current questions
- `calculateScore()`: Calculate total score
- `handleSubmit(event)`: Process form submission

**Private Methods**:
- `renderQuestion(question)`: Render individual question
- `updateNavigation()`: Update button visibility
- `updateProgress()`: Update progress bar
- `showError(message)`: Display error message

### QuizConfigLoader

Manages loading and organizing questions.

**Constructor**:
```javascript
new QuizConfigLoader(useMetaobjects: boolean, shopUrl: string)
```

**Public Methods**:
- `loadQuestions()`: Load questions (hybrid approach)
- `loadFromMetaobjects()`: Fetch from Shopify API
- `groupByCategory()`: Group questions by category
- `getById(id)`: Get specific question
- `validateQuestion(question)`: Validate question structure
- `getScoringQuestions()`: Get severity_scale questions only

### GoogleSheetsIntegration

Handles Google Sheets API communication via Apps Script Web App.

**Static Methods**:
- `submitResponses(data, config)`: Submit to Google Sheets
- `prepareRowData(data)`: Transform data for Google Sheets (array format)
- `validateConfig(config)`: Check Web App URL

### QuizResults

Manages results display.

**Static Methods**:
- `displayResults(data)`: Show results section
- `updateScoreDisplay(score, severity)`: Update score UI
- `showProductRecommendation(region, score)`: Show product
- `fetchProduct(handle)`: Get product from Shopify
- `addToCart(variantId)`: Add product to cart

## Scoring Algorithm

### Calculation

```javascript
// Total score = sum of all severity_scale question values
// Each severity_scale question has values 0-3
// Maximum possible score = 60 (20 symptoms × 3)

const scoringQuestions = questions.filter(q => q.type === 'severity_scale');
let totalScore = 0;

scoringQuestions.forEach(question => {
  const value = parseInt(responses[question.id]) || 0;
  totalScore += value; // 0, 1, 2, or 3
});
```

### Severity Levels

| Score Range | Severity | Recommendation |
|-------------|----------|----------------|
| 0-4 | Minimal | Educational content |
| 5-9 | Mild | Consultation booking |
| 10-19 | Moderate | Product recommendation |
| 20-60 | Severe | Product recommendation |

### Category Breakdown

Maximum scores by category:
- Nasal: 15 points (5 symptoms × 3)
- Eye: 12 points (4 symptoms × 3)
- Respiratory: 12 points (4 symptoms × 3)
- Skin: 12 points (4 symptoms × 3)
- Throat: 9 points (3 symptoms × 3)

## Security Implementation

### Input Sanitization

All user inputs are sanitized before API submission:

```javascript
// Honeypot field check
if (honeypotField.value !== '') {
  // Bot detected, silently fail
  return;
}

// Email validation
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  // Invalid email
  return;
}

// Numeric validation for scores
const score = parseInt(value);
if (isNaN(score) || score < 0 || score > 3) {
  // Invalid score
  return;
}
```

### CORS Configuration

Cloudflare Worker validates origins:

```javascript
const allowedOrigins = [
  'https://allergist-on-demand.myshopify.com',
  'https://yourdomain.com'
];

if (!allowedOrigins.includes(origin)) {
  return 403 Forbidden;
}
```

### API Key Security

- Google Sheets Web App URL: Stored in theme settings (no API keys needed)
- Shopify Admin API token: Stored in Cloudflare Worker secrets
- No credentials exposed to browser

### Data Privacy

- No sensitive data stored in localStorage
- Session data cleared on page reload
- Only summary data in Shopify (detailed data in Google Sheets)
- Honeypot field for bot prevention

## Performance Optimization

### Lazy Loading

- Questions rendered on-demand per category
- Product images lazy-loaded: `loading="lazy"`
- JavaScript deferred: `<script defer>`

### API Optimization

- Parallel API calls (Google Sheets + Cloudflare)
- Retry logic with exponential backoff
- Debounced input handlers

### CSS Optimization

- CSS custom properties for theming
- Mobile-first media queries
- Reduced motion support: `@media (prefers-reduced-motion: reduce)`

### Bundle Size

- No external dependencies (vanilla JS)
- quiz-config.js: ~15KB
- symptom-quiz.js: ~35KB
- quiz-results.js: ~12KB
- google-sheets-integration.js: ~5KB
- symptom-quiz.css: ~25KB
- **Total**: ~92KB (uncompressed)

## Browser Compatibility

### Minimum Requirements

- Chrome/Edge 88+
- Firefox 85+
- Safari 14+
- iOS Safari 14+
- Chrome Mobile 88+

### Feature Detection

```javascript
// ES6+ features used
const hasRequiredFeatures = 
  typeof Promise !== 'undefined' &&
  typeof fetch !== 'undefined' &&
  typeof Object.assign !== 'undefined';

if (!hasRequiredFeatures) {
  // Show fallback message
}
```

### Polyfills

None required for target browsers. If supporting older browsers, add:
- Promise polyfill
- Fetch polyfill
- Object.assign polyfill

### Accessibility Features

- ARIA labels on all interactive elements
- Keyboard navigation (Tab, Enter, Space)
- Screen reader announcements
- Focus indicators (3px outline)
- Color contrast: 4.5:1 minimum
- Touch targets: 44×44px minimum

## Error Handling

### User-Facing Errors

```javascript
try {
  // Quiz operation
} catch (error) {
  showError('Something went wrong. Please try again.');
  console.error('Error details:', error);
}
```

### API Errors

```javascript
// Google Sheets submission
if (error.message.includes('Failed to fetch')) {
  // Network error - retry after delay
  await delay(2000);
  return submitResponses(data, config);
}

// Cloudflare Worker
if (!response.ok) {
  // Log but don't block quiz completion
  console.error('Metafield update failed');
}
```

### Validation Errors

- Real-time validation on field blur
- Category-level validation on "Next"
- Final validation on "Submit"
- Clear error messages next to fields

## Debugging

### Console Logging

Development mode logging:

```javascript
console.log(`Quiz initialized with ${questions.length} questions`);
console.log(`Loaded ${metaobjectQuestions.length} questions from Metaobjects`);
console.log(`Quiz completed: Score=${score}, Severity=${severity}`);
console.log('Google Sheets submission successful:', rowNumber);
```

### Browser DevTools

- Network tab: Check API calls
- Console tab: View errors and logs
- Application tab: Verify no localStorage usage
- Performance tab: Check load times

### Common Issues

1. **Questions not loading**: Check `quiz-config.js` in Network tab
2. **Validation failing**: Check browser console for JavaScript errors
3. **API submissions failing**: Check Network tab for 4xx/5xx responses
4. **Products not showing**: Verify product handle format

## Maintenance

### Regular Updates

- Update question wording based on user feedback
- Review API usage and rate limits
- Monitor Google Sheets row limits (5 million rows free tier)
- Update product handles if regions change

### Version Control

Track changes to:
- Question configuration (Metaobjects)
- Theme settings
- API credentials
- Scoring thresholds

### Backup Strategy

- Export Google Sheets data monthly (File → Download)
- Version control theme files
- Document all customizations

## Support

For technical issues:
1. Check browser console for errors
2. Verify API configurations
3. Test with sample data
4. Review this documentation
5. Check Shopify theme logs

---

**Version**: 1.0.0  
**Last Updated**: 2024-11-28  
**Maintained By**: AlleDrops Development Team


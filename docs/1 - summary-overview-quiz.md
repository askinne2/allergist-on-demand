# Comprehensive Cursor Prompt for AlleDrops Symptom Quiz

```markdown
# AlleDrops Symptom Assessment Quiz - Shopify Theme Customization

## Project Overview
Build a custom symptom assessment quiz for AlleDrops (Shopify store) that:
- Collects clinical symptom data with severity ratings
- Calculates an allergy severity score
- Recommends appropriate regional allergy drop products
- Stores detailed responses in Airtable (separate from Shopify for data privacy)
- Stores only score + region + symptom_profile_id in Shopify customer metafields
- Provides an admin-friendly way to update quiz questions without code changes

## Technical Requirements

### Platform & Stack
- **CMS**: Shopify (theme customization)
- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **Data Storage**: 
  - Airtable (detailed symptom responses)
  - Shopify Customer Metafields (score, region, profile ID only)
- **API Integration**: Cloudflare Worker (proxy for Shopify Admin API calls)
- **Styling**: Mobile-first, accessible, clinical-but-friendly aesthetic

### Architecture Principles
- **Separation of Concerns**: Quiz logic, data storage, and UI should be modular
- **Progressive Enhancement**: Works without JavaScript (form submission fallback)
- **Accessibility**: WCAG 2.1 AA compliant
- **Performance**: Lazy-load quiz sections, minimize API calls
- **Maintainability**: Quiz questions stored in Shopify metaobjects for easy admin updates

## File Structure

```
shopify-theme/
├── assets/
│   ├── symptom-quiz.js           # Main quiz controller
│   ├── symptom-quiz.css          # Quiz-specific styles
│   ├── quiz-config.js            # Question configuration loader
│   └── airtable-integration.js   # Airtable API wrapper
├── sections/
│   ├── symptom-quiz.liquid       # Main quiz section
│   └── quiz-results.liquid       # Results display section
├── snippets/
│   ├── quiz-question.liquid      # Reusable question template
│   ├── quiz-progress.liquid      # Progress indicator
│   └── severity-scale.liquid     # Symptom severity input (None/Mild/Moderate/Severe)
├── templates/
│   └── page.symptom-quiz.liquid  # Quiz page template
└── config/
    └── settings_schema.json      # Theme settings for API keys

metaobjects/ (create in Shopify admin)
└── quiz_questions                # Dynamic question storage
```

## Core Features

### 1. Multi-Step Quiz Interface
- **Progress Indicator**: Visual bar showing completion percentage
- **Question Navigation**: Next/Previous buttons with validation
- **Question Types**:
  - Single choice (radio buttons) - for region, seasonal timing
  - Severity scale (0-3) - for symptom ratings
  - Text input - for name/email
  - Checkbox - for consent

### 2. Scoring Algorithm
```javascript
// Scoring Logic
const SEVERITY_WEIGHTS = {
  none: 0,
  mild: 1,
  moderate: 2,
  severe: 3
};

// Total score = sum of all symptom severity values
// Score categories:
// 0-4: Minimal (not recommended)
// 5-9: Mild (consultation recommended)
// 10-19: Moderate (good candidate)
// 20+: Severe (excellent candidate)
```

### 3. Data Flow
```
User completes quiz
    ↓
JavaScript calculates score
    ↓
Generate symptom_profile_id (e.g., "AOD_20241128_abc123")
    ↓
Send detailed responses to Airtable → Store all symptom data
    ↓
Send to Cloudflare Worker → Worker calls Shopify Admin API
    ↓
Store in Shopify customer metafields:
  - alledrops.symptom_profile_id
  - alledrops.quiz_score
  - alledrops.quiz_region
  - alledrops.quiz_date
    ↓
Redirect to results page with URL params
    ↓
Display personalized product recommendation
```

### 4. Admin Question Management
Use Shopify Metaobjects to store quiz questions (editable via Shopify admin):

**Metaobject Definition: `quiz_question`**
```json
{
  "name": "Quiz Question",
  "type": "quiz_question",
  "fields": [
    {
      "key": "question_id",
      "name": "Question ID",
      "type": "single_line_text_field",
      "required": true
    },
    {
      "key": "question_text",
      "name": "Question Text",
      "type": "multi_line_text_field",
      "required": true
    },
    {
      "key": "question_subtitle",
      "name": "Subtitle/Helper Text",
      "type": "multi_line_text_field"
    },
    {
      "key": "question_type",
      "name": "Type",
      "type": "single_line_text_field",
      "validations": [
        {
          "name": "choices",
          "value": "[\"single_choice\", \"severity_scale\", \"text_input\"]"
        }
      ]
    },
    {
      "key": "options",
      "name": "Answer Options (JSON)",
      "type": "multi_line_text_field",
      "description": "For single_choice: JSON array of {\"value\": \"key\", \"label\": \"Display Text\"}"
    },
    {
      "key": "order",
      "name": "Display Order",
      "type": "number_integer",
      "required": true
    },
    {
      "key": "required",
      "name": "Required",
      "type": "boolean"
    },
    {
      "key": "category",
      "name": "Symptom Category",
      "type": "single_line_text_field",
      "description": "e.g., nasal, eye, respiratory, skin, demographics"
    }
  ]
}
```

## Implementation Steps

### Phase 1: Theme Setup & Basic Structure
1. Create liquid templates and sections
2. Build CSS grid layout with mobile-first approach
3. Implement question navigation (prev/next buttons)
4. Add progress indicator

### Phase 2: Quiz Logic & Scoring
1. Build `SymptomQuiz` JavaScript class
2. Implement form validation
3. Create scoring algorithm
4. Add question type handlers (radio, severity scale, text)

### Phase 3: Data Integration
1. Set up Airtable base and API integration
2. Create Cloudflare Worker for Shopify API proxy
3. Implement customer metafield storage
4. Add error handling and fallbacks

### Phase 4: Results & Recommendations
1. Build results page with score visualization
2. Create product recommendation logic based on region + score
3. Add conditional CTAs (buy now vs. schedule consultation)
4. Implement "view past results" for logged-in customers

### Phase 5: Admin Experience
1. Create Shopify metaobjects for quiz questions
2. Build Liquid logic to load questions from metaobjects
3. Add theme settings for API keys (Airtable, Cloudflare Worker URL)
4. Create admin documentation

## Code Quality Standards

### JavaScript
- Use ES6+ features (classes, async/await, template literals)
- JSDoc comments for all public methods
- Error handling with try/catch and user-friendly messages
- No jQuery dependencies (vanilla JS only)
- Debounce API calls to prevent rate limiting

### Liquid
- Use proper variable scoping (`assign`, `capture`)
- Schema settings for all configurable content
- Semantic HTML5 elements
- Avoid inline styles (use BEM CSS methodology)

### CSS
- Mobile-first responsive design
- CSS custom properties for theming
- BEM naming convention: `.quiz-question__title--active`
- Accessibility: focus states, sufficient color contrast (4.5:1 minimum)

### Accessibility
- ARIA labels for all interactive elements
- Keyboard navigation support
- Screen reader announcements for score results
- Form field labels properly associated
- Focus trap within quiz modal (if modal design)

## Security & Privacy

### Data Handling
- Never store sensitive symptom data in localStorage
- Sanitize all user inputs before API submission
- Use HTTPS for all API calls
- Implement CORS properly on Cloudflare Worker
- Add honeypot field to prevent bot submissions

### Consent & Compliance
- Clear consent checkbox before submission
- Privacy policy link visible on quiz
- Disclaimer: "This assessment is for product recommendation purposes only and does not constitute medical advice"
- Data retention policy statement

## API Configurations

### Airtable Setup
**Base Name**: AlleDrops Symptom Assessments
**Table Name**: Symptom Responses

**Fields**:
```
Profile ID (Single line text) - Primary key
Customer Name (Single line text)
Customer Email (Email)
Total Score (Number)
Severity Level (Single select: minimal, mild, moderate, severe)
Region (Single select: Northwest, Southwest, North Central, South Central, Midwest, Southeast, Northeast)
Submission Date (Date)

# Symptom Fields (all Number 0-3)
Nasal - Runny
Nasal - Stuffy  
Nasal - Sneezing
Nasal - Postnasal Drip
Eye - Watery
Eye - Itchy
Eye - Redness
Respiratory - Cough
Respiratory - Wheezing
Respiratory - Chest Tightness
Skin - Rash
Skin - Hives
Skin - Itching

# Metadata
Full Response JSON (Long text) - backup of all form data
Recommended Product (Linked to Products table - optional)
```

### Shopify Customer Metafields
**Namespace**: `alledrops`

```
alledrops.symptom_profile_id (single_line_text_field)
alledrops.quiz_score (number_integer)
alledrops.quiz_region (single_line_text_field)
alledrops.quiz_date (date_time)
alledrops.severity_level (single_line_text_field)
```

### Cloudflare Worker
**Endpoint**: `https://alledrops-api.workers.dev/customer-update`

**Request Body**:
```json
{
  "email": "customer@example.com",
  "symptom_profile_id": "AOD_20241128_abc123",
  "quiz_score": 18,
  "quiz_region": "southeast",
  "quiz_date": "2024-11-28T10:30:00Z",
  "severity_level": "moderate"
}
```

## UI/UX Design Guidelines

### Visual Style
- **Clinical-but-Friendly**: Professional without being sterile
- **Color Palette**:
  - Primary: #2C5F7C (Medical blue)
  - Success: #4CAF50 (Green for positive results)
  - Warning: #FF9800 (Orange for consultation needed)
  - Neutral: #F5F5F5 (Light gray background)
- **Typography**:
  - Headers: System font stack (San Francisco, Segoe UI, Roboto)
  - Body: 16px minimum for accessibility
  - Line height: 1.6 for readability

### Interaction Patterns
- Button states: default, hover, focus, active, disabled
- Loading states for API calls (spinner + text)
- Success/error toast notifications
- Smooth transitions between questions (300ms ease-in-out)

### Mobile Considerations
- Stack severity scale vertically on mobile (<768px)
- Sticky "Next" button at bottom of viewport
- Prevent zoom on input focus (font-size: 16px minimum)
- Touch-friendly tap targets (minimum 44x44px)

## Testing Checklist

### Functional Testing
- [ ] All question types render correctly
- [ ] Validation prevents skipping required questions
- [ ] Score calculation matches expected values
- [ ] Airtable receives all data correctly
- [ ] Shopify metafields update properly
- [ ] Results page shows correct product recommendation
- [ ] Logged-in users can view past quiz history

### Cross-Browser Testing
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile Safari (iOS 15+)
- [ ] Chrome Mobile (Android)

### Accessibility Testing
- [ ] Keyboard navigation works throughout quiz
- [ ] Screen reader announces questions and errors
- [ ] Color contrast meets WCAG AA standards
- [ ] Focus indicators visible on all interactive elements

### Performance Testing
- [ ] Quiz loads in <2 seconds on 3G connection
- [ ] No layout shift during question transitions
- [ ] API calls complete in <1 second
- [ ] Lighthouse score >90 for Accessibility

## Documentation Deliverables

1. **Admin Guide**: How to update quiz questions via Shopify metaobjects
2. **Technical Documentation**: API endpoints, data schema, code structure
3. **User Privacy Statement**: What data is collected and how it's used
4. **Maintenance Guide**: How to add new regions, update scoring thresholds

## Success Metrics

- Quiz completion rate >70%
- Score calculation accuracy 100%
- API success rate >99%
- Mobile completion rate >60%
- Average completion time <3 minutes

## Out of Scope (Future Enhancements)

- Multi-language support
- Quiz analytics dashboard
- A/B testing different question orders
- Integration with email marketing (Klaviyo)
- PDF export of quiz results
- Integration with scheduling system (for consultations)

---

## Build Instructions

Please create all files following this specification. Start with:

1. The quiz data schema (Markdown file of questions)
2. Shopify Liquid templates (sections/symptom-quiz.liquid)
3. JavaScript quiz controller (assets/symptom-quiz.js)
4. CSS styling (assets/symptom-quiz.css)
5. Cloudflare Worker code (worker.js)

Prioritize clean, maintainable code with extensive comments explaining the medical logic and data flow.
```

---

# Quiz Questions Schema (Markdown)

Save this as `quiz-questions-schema.md`:

```markdown
# AlleDrops Symptom Assessment Questions

**Version**: 1.0  
**Last Updated**: 2024-11-28  
**Total Questions**: 8 sections (35 individual data points)

---

## Section 1: Demographics & Location
**Category**: `demographics`  
**Display Order**: 1

### Question 1.1: Geographic Region
**ID**: `region`  
**Type**: `single_choice` (radio buttons)  
**Required**: Yes  
**Question**: "Where do you live most of the year?"  
**Subtitle**: "Our Regional Allergy Drops are formulated to specific areas of the United States."

**Options**:
```json
[
  { "value": "northwest", "label": "Northwest" },
  { "value": "southwest", "label": "Southwest" },
  { "value": "north_central", "label": "North Central" },
  { "value": "south_central", "label": "South Central" },
  { "value": "midwest", "label": "Midwest" },
  { "value": "southeast", "label": "Southeast" },
  { "value": "northeast", "label": "Northeast" }
]
```

**Scoring**: No points (used for product matching only)

---

## Section 2: Nasal Symptoms
**Category**: `nasal`  
**Display Order**: 2  
**Question**: "How would you rate the following nasal symptoms?"  
**Subtitle**: "Select the severity level that best describes your experience."

### Question 2.1: Runny Nose
**ID**: `nasal_runny`  
**Type**: `severity_scale`  
**Required**: Yes  
**Scale**: None (0) | Mild (1) | Moderate (2) | Severe (3)

### Question 2.2: Stuffy/Congested Nose
**ID**: `nasal_stuffy`  
**Type**: `severity_scale`  
**Required**: Yes  
**Scale**: None (0) | Mild (1) | Moderate (2) | Severe (3)

### Question 2.3: Sneezing
**ID**: `nasal_sneezing`  
**Type**: `severity_scale`  
**Required**: Yes  
**Scale**: None (0) | Mild (1) | Moderate (2) | Severe (3)

### Question 2.4: Postnasal Drip
**ID**: `nasal_postnasal`  
**Type**: `severity_scale`  
**Required**: Yes  
**Scale**: None (0) | Mild (1) | Moderate (2) | Severe (3)

### Question 2.5: Loss of Smell
**ID**: `nasal_smell_loss`  
**Type**: `severity_scale`  
**Required**: Yes  
**Scale**: None (0) | Mild (1) | Moderate (2) | Severe (3)

**Scoring**: Sum of all nasal symptom values (max 15 points)

---

## Section 3: Eye Symptoms
**Category**: `eye`  
**Display Order**: 3  
**Question**: "How would you rate the following eye symptoms?"

### Question 3.1: Watery Eyes
**ID**: `eye_watery`  
**Type**: `severity_scale`  
**Required**: Yes  
**Scale**: None (0) | Mild (1) | Moderate (2) | Severe (3)

### Question 3.2: Itchy Eyes
**ID**: `eye_itchy`  
**Type**: `severity_scale`  
**Required**: Yes  
**Scale**: None (0) | Mild (1) | Moderate (2) | Severe (3)

### Question 3.3: Red/Bloodshot Eyes
**ID**: `eye_red`  
**Type**: `severity_scale`  
**Required**: Yes  
**Scale**: None (0) | Mild (1) | Moderate (2) | Severe (3)

### Question 3.4: Swollen Eyelids
**ID**: `eye_swollen`  
**Type**: `severity_scale`  
**Required**: Yes  
**Scale**: None (0) | Mild (1) | Moderate (2) | Severe (3)

**Scoring**: Sum of all eye symptom values (max 12 points)

---

## Section 4: Respiratory Symptoms
**Category**: `respiratory`  
**Display Order**: 4  
**Question**: "How would you rate the following respiratory symptoms?"

### Question 4.1: Cough
**ID**: `respiratory_cough`  
**Type**: `severity_scale`  
**Required**: Yes  
**Scale**: None (0) | Mild (1) | Moderate (2) | Severe (3)

### Question 4.2: Wheezing
**ID**: `respiratory_wheeze`  
**Type**: `severity_scale`  
**Required**: Yes  
**Scale**: None (0) | Mild (1) | Moderate (2) | Severe (3)

### Question 4.3: Chest Tightness
**ID**: `respiratory_tight`  
**Type**: `severity_scale`  
**Required**: Yes  
**Scale**: None (0) | Mild (1) | Moderate (2) | Severe (3)

### Question 4.4: Shortness of Breath
**ID**: `respiratory_breath`  
**Type**: `severity_scale`  
**Required**: Yes  
**Scale**: None (0) | Mild (1) | Moderate (2) | Severe (3)

**Scoring**: Sum of all respiratory symptom values (max 12 points)

---

## Section 5: Skin Symptoms
**Category**: `skin`  
**Display Order**: 5  
**Question**: "How would you rate the following skin symptoms?"

### Question 5.1: Rash
**ID**: `skin_rash`  
**Type**: `severity_scale`  
**Required**: Yes  
**Scale**: None (0) | Mild (1) | Moderate (2) | Severe (3)

### Question 5.2: Hives
**ID**: `skin_hives`  
**Type**: `severity_scale`  
**Required**: Yes  
**Scale**: None (0) | Mild (1) | Moderate (2) | Severe (3)

### Question 5.3: Itching
**ID**: `skin_itching`  
**Type**: `severity_scale`  
**Required**: Yes  
**Scale**: None (0) | Mild (1) | Moderate (2) | Severe (3)

### Question 5.4: Eczema/Dry Patches
**ID**: `skin_eczema`  
**Type**: `severity_scale`  
**Required**: Yes  
**Scale**: None (0) | Mild (1) | Moderate (2) | Severe (3)

**Scoring**: Sum of all skin symptom values (max 12 points)

---

## Section 6: Throat & Mouth Symptoms
**Category**: `throat`  
**Display Order**: 6  
**Question**: "How would you rate the following throat and mouth symptoms?"

### Question 6.1: Itchy Throat
**ID**: `throat_itchy`  
**Type**: `severity_scale`  
**Required**: Yes  
**Scale**: None (0) | Mild (1) | Moderate (2) | Severe (3)

### Question 6.2: Sore Throat
**ID**: `throat_sore`  
**Type**: `severity_scale`  
**Required**: Yes  
**Scale**: None (0) | Mild (1) | Moderate (2) | Severe (3)

### Question 6.3: Itchy Mouth or Tongue
**ID**: `throat_mouth_itchy`  
**Type**: `severity_scale`  
**Required**: Yes  
**Scale**: None (0) | Mild (1) | Moderate (2) | Severe (3)

**Scoring**: Sum of all throat symptom values (max 9 points)

---

## Section 7: Timing & Pattern
**Category**: `demographics`  
**Display Order**: 7

### Question 7.1: When do your symptoms occur?
**ID**: `timing_seasonal`  
**Type**: `single_choice` (radio buttons)  
**Required**: Yes  
**Question**: "When do your allergy symptoms usually flare up?"  
**Subtitle**: "This helps us understand your allergy pattern."

**Options**:
```json
[
  { "value": "spring", "label": "Primarily Spring (March-May)" },
  { "value": "summer", "label": "Primarily Summer (June-August)" },
  { "value": "fall", "label": "Primarily Fall (September-November)" },
  { "value": "winter", "label": "Primarily Winter (December-February)" },
  { "value": "year_round", "label": "Year-Round" },
  { "value": "multiple_seasons", "label": "Multiple Seasons" }
]
```

**Scoring**: No points (informational only)

### Question 7.2: How long have you had allergy symptoms?
**ID**: `timing_duration`  
**Type**: `single_choice` (radio buttons)  
**Required**: Yes  
**Question**: "How long have you been experiencing allergy symptoms?"

**Options**:
```json
[
  { "value": "less_than_1yr", "label": "Less than 1 year" },
  { "value": "1_3yrs", "label": "1-3 years" },
  { "value": "3_5yrs", "label": "3-5 years" },
  { "value": "5_10yrs", "label": "5-10 years" },
  { "value": "over_10yrs", "label": "More than 10 years" }
]
```

**Scoring**: No points (informational only)

---

## Section 8: Contact Information
**Category**: `contact`  
**Display Order**: 8

### Question 8.1: Full Name
**ID**: `customer_name`  
**Type**: `text_input`  
**Required**: Yes  
**Question**: "Your Full Name"  
**Placeholder**: "John Smith"

### Question 8.2: Email Address
**ID**: `customer_email`  
**Type**: `email_input`  
**Required**: Yes  
**Question**: "Your Email Address"  
**Placeholder**: "john.smith@example.com"  
**Validation**: Must be valid email format

### Question 8.3: Consent
**ID**: `consent`  
**Type**: `checkbox`  
**Required**: Yes  
**Question**: "I consent to AlleDrops storing my symptom information for product recommendation purposes. I understand this assessment does not constitute medical advice and does not replace consultation with a healthcare provider."

**Scoring**: No points (consent only)

---

## Scoring Algorithm

### Total Possible Score
- Nasal: 15 points
- Eye: 12 points
- Respiratory: 12 points
- Skin: 12 points
- Throat: 9 points
- **Maximum Total**: 60 points

### Score Interpretation

| Score Range | Severity Level | Recommendation |
|-------------|---------------|----------------|
| 0-4         | Minimal       | "Your symptoms appear minimal. Sublingual immunotherapy may not be necessary at this time." → Educational content |
| 5-9         | Mild          | "You have mild allergy symptoms. We recommend scheduling a consultation before starting treatment." → Consultation CTA |
| 10-19       | Moderate      | "You're a good candidate for AlleDrops! Your moderate symptoms indicate sublingual immunotherapy could help." → Product recommendation |
| 20+         | Severe        | "You're an excellent candidate for AlleDrops! Your severe symptoms strongly indicate a need for immunotherapy." → Product recommendation |

### Product Matching Logic
```
IF score >= 10 AND region IS NOT NULL:
  Recommend: {region} Regional Allergy Drops
  CTA: "Add to Cart" or "View Product"
  
ELSE IF score >= 5 AND score < 10:
  Recommend: Schedule consultation first
  CTA: "Book Free Consultation"
  
ELSE:
  Recommend: Educational resources
  CTA: "Learn More About Allergies"
```

---

## Question Update Instructions (For Admins)

### To Add a New Question:
1. Go to Shopify Admin → Settings → Custom Data → Metaobjects → quiz_question
2. Click "Add entry"
3. Fill in all required fields:
   - **Question ID**: Unique snake_case identifier (e.g., `nasal_drainage`)
   - **Question Text**: The question as displayed to users
   - **Subtitle**: Optional helper text
   - **Type**: `single_choice`, `severity_scale`, or `text_input`
   - **Options**: JSON array for single_choice questions
   - **Order**: Numeric order for display (use increments of 10 to allow insertions)
   - **Category**: Group questions logically (nasal, eye, etc.)
4. Save

### To Change Scoring Thresholds:
Edit the scoring constants in `assets/symptom-quiz.js`:
```javascript
const SCORE_THRESHOLDS = {
  minimal: { max: 4 },
  mild: { min: 5, max: 9 },
  moderate: { min: 10, max: 19 },
  severe: { min: 20 }
};
```

### To Update Regional Products:
Questions tagged with `region` value will automatically map to Shopify products with handle:
`{region}-allergy-drops`

Example: If user selects "southeast", product handle must be: `southeast-allergy-drops`

---

## Data Privacy Notes

**What is stored in Airtable** (detailed symptom data):
- All individual symptom severity ratings
- Full name, email
- Timing and duration info
- Raw JSON of complete form submission

**What is stored in Shopify** (summary only):
- Symptom Profile ID (reference key)
- Total score (number)
- Region (text)
- Quiz completion date
- Severity level (minimal/mild/moderate/severe)

**Separation ensures**:
- Shopify store doesn't contain detailed health data
- Customer service can reference Profile ID to look up details in Airtable
- Meets client's requirement for "patient ID" system
```

---


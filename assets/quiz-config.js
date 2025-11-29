/**
 * Quiz Configuration and Question Loader
 * Hybrid system: Loads from Shopify Metaobjects if available, otherwise uses hardcoded questions
 * 
 * @author AlleDrops Development Team
 * @version 1.0.0
 */

/**
 * Hardcoded quiz questions following the schema
 * This serves as fallback when Metaobjects are not configured
 */
const HARDCODED_QUESTIONS = [
  // Section 1: Demographics & Location
  {
    id: 'region',
    type: 'single_choice',
    text: 'Where do you live most of the year?',
    subtitle: 'Our Regional Allergy Drops are formulated to specific areas of the United States.',
    category: 'demographics',
    order: 10,
    required: true,
    options: [
      { value: 'northwest', label: 'Northwest' },
      { value: 'southwest', label: 'Southwest' },
      { value: 'north_central', label: 'North Central' },
      { value: 'south_central', label: 'South Central' },
      { value: 'midwest', label: 'Midwest' },
      { value: 'southeast', label: 'Southeast' },
      { value: 'northeast', label: 'Northeast' }
    ]
  },
  
  // Section 2: Nasal Symptoms
  {
    id: 'nasal_runny',
    type: 'severity_scale',
    text: 'Runny Nose',
    subtitle: '',
    category: 'nasal',
    order: 20,
    required: true
  },
  {
    id: 'nasal_stuffy',
    type: 'severity_scale',
    text: 'Stuffy/Congested Nose',
    subtitle: '',
    category: 'nasal',
    order: 21,
    required: true
  },
  {
    id: 'nasal_sneezing',
    type: 'severity_scale',
    text: 'Sneezing',
    subtitle: '',
    category: 'nasal',
    order: 22,
    required: true
  },
  {
    id: 'nasal_postnasal',
    type: 'severity_scale',
    text: 'Postnasal Drip',
    subtitle: '',
    category: 'nasal',
    order: 23,
    required: true
  },
  {
    id: 'nasal_smell_loss',
    type: 'severity_scale',
    text: 'Loss of Smell',
    subtitle: '',
    category: 'nasal',
    order: 24,
    required: true
  },
  
  // Section 3: Eye Symptoms
  {
    id: 'eye_watery',
    type: 'severity_scale',
    text: 'Watery Eyes',
    subtitle: '',
    category: 'eye',
    order: 30,
    required: true
  },
  {
    id: 'eye_itchy',
    type: 'severity_scale',
    text: 'Itchy Eyes',
    subtitle: '',
    category: 'eye',
    order: 31,
    required: true
  },
  {
    id: 'eye_red',
    type: 'severity_scale',
    text: 'Red/Bloodshot Eyes',
    subtitle: '',
    category: 'eye',
    order: 32,
    required: true
  },
  {
    id: 'eye_swollen',
    type: 'severity_scale',
    text: 'Swollen Eyelids',
    subtitle: '',
    category: 'eye',
    order: 33,
    required: true
  },
  
  // Section 4: Respiratory Symptoms
  {
    id: 'respiratory_cough',
    type: 'severity_scale',
    text: 'Cough',
    subtitle: '',
    category: 'respiratory',
    order: 40,
    required: true
  },
  {
    id: 'respiratory_wheeze',
    type: 'severity_scale',
    text: 'Wheezing',
    subtitle: '',
    category: 'respiratory',
    order: 41,
    required: true
  },
  {
    id: 'respiratory_tight',
    type: 'severity_scale',
    text: 'Chest Tightness',
    subtitle: '',
    category: 'respiratory',
    order: 42,
    required: true
  },
  {
    id: 'respiratory_breath',
    type: 'severity_scale',
    text: 'Shortness of Breath',
    subtitle: '',
    category: 'respiratory',
    order: 43,
    required: true
  },
  
  // Section 5: Skin Symptoms
  {
    id: 'skin_rash',
    type: 'severity_scale',
    text: 'Rash',
    subtitle: '',
    category: 'skin',
    order: 50,
    required: true
  },
  {
    id: 'skin_hives',
    type: 'severity_scale',
    text: 'Hives',
    subtitle: '',
    category: 'skin',
    order: 51,
    required: true
  },
  {
    id: 'skin_itching',
    type: 'severity_scale',
    text: 'Itching',
    subtitle: '',
    category: 'skin',
    order: 52,
    required: true
  },
  {
    id: 'skin_eczema',
    type: 'severity_scale',
    text: 'Eczema/Dry Patches',
    subtitle: '',
    category: 'skin',
    order: 53,
    required: true
  },
  
  // Section 6: Throat & Mouth Symptoms
  {
    id: 'throat_itchy',
    type: 'severity_scale',
    text: 'Itchy Throat',
    subtitle: '',
    category: 'throat',
    order: 60,
    required: true
  },
  {
    id: 'throat_sore',
    type: 'severity_scale',
    text: 'Sore Throat',
    subtitle: '',
    category: 'throat',
    order: 61,
    required: true
  },
  {
    id: 'throat_mouth_itchy',
    type: 'severity_scale',
    text: 'Itchy Mouth or Tongue',
    subtitle: '',
    category: 'throat',
    order: 62,
    required: true
  },
  
  // Section 7: Timing & Pattern
  {
    id: 'timing_seasonal',
    type: 'single_choice',
    text: 'When do your allergy symptoms usually flare up?',
    subtitle: 'This helps us understand your allergy pattern.',
    category: 'demographics',
    order: 70,
    required: true,
    options: [
      { value: 'spring', label: 'Primarily Spring (March-May)' },
      { value: 'summer', label: 'Primarily Summer (June-August)' },
      { value: 'fall', label: 'Primarily Fall (September-November)' },
      { value: 'winter', label: 'Primarily Winter (December-February)' },
      { value: 'year_round', label: 'Year-Round' },
      { value: 'multiple_seasons', label: 'Multiple Seasons' }
    ]
  },
  {
    id: 'timing_duration',
    type: 'single_choice',
    text: 'How long have you been experiencing allergy symptoms?',
    subtitle: '',
    category: 'demographics',
    order: 71,
    required: true,
    options: [
      { value: 'less_than_1yr', label: 'Less than 1 year' },
      { value: '1_3yrs', label: '1-3 years' },
      { value: '3_5yrs', label: '3-5 years' },
      { value: '5_10yrs', label: '5-10 years' },
      { value: 'over_10yrs', label: 'More than 10 years' }
    ]
  },
  
  // Section 8: Contact Information
  {
    id: 'customer_name',
    type: 'text_input',
    text: 'Your Full Name',
    subtitle: '',
    category: 'contact',
    order: 80,
    required: true,
    placeholder: 'John Smith'
  },
  {
    id: 'customer_email',
    type: 'email_input',
    text: 'Your Email Address',
    subtitle: '',
    category: 'contact',
    order: 81,
    required: true,
    placeholder: 'john.smith@example.com'
  },
  {
    id: 'consent',
    type: 'checkbox',
    text: 'I consent to AlleDrops storing my symptom information for product recommendation purposes. I understand this assessment does not constitute medical advice and does not replace consultation with a healthcare provider.',
    subtitle: '',
    category: 'contact',
    order: 82,
    required: true
  }
];

/**
 * Category display configuration
 * Groups questions into sections with titles and descriptions
 */
const CATEGORY_CONFIG = {
  demographics: {
    title: 'About You',
    description: 'Help us understand your location and allergy patterns'
  },
  nasal: {
    title: 'Nasal Symptoms',
    description: 'How would you rate the following nasal symptoms?'
  },
  eye: {
    title: 'Eye Symptoms',
    description: 'How would you rate the following eye symptoms?'
  },
  respiratory: {
    title: 'Respiratory Symptoms',
    description: 'How would you rate the following respiratory symptoms?'
  },
  skin: {
    title: 'Skin Symptoms',
    description: 'How would you rate the following skin symptoms?'
  },
  throat: {
    title: 'Throat & Mouth Symptoms',
    description: 'How would you rate the following throat and mouth symptoms?'
  },
  contact: {
    title: 'Contact Information',
    description: 'We need your information to provide personalized recommendations'
  }
};

/**
 * QuizConfigLoader Class
 * Manages loading and organizing quiz questions
 */
class QuizConfigLoader {
  constructor(useMetaobjects = false, shopUrl = '') {
    this.useMetaobjects = useMetaobjects;
    this.shopUrl = shopUrl;
    this.questions = [];
    this.categories = CATEGORY_CONFIG;
  }

  /**
   * Load questions from Shopify Metaobjects via Storefront API
   * @returns {Promise<Array>} Array of question objects
   */
  async loadFromMetaobjects() {
    try {
      const query = `
        query {
          metaobjects(type: "quiz_question", first: 100) {
            edges {
              node {
                id
                fields {
                  key
                  value
                }
              }
            }
          }
        }
      `;

      const response = await fetch(`${this.shopUrl}/api/2024-01/graphql.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query })
      });

      const data = await response.json();
      
      if (data.errors) {
        console.error('GraphQL errors:', data.errors);
        return [];
      }

      // Transform metaobject data to question format
      const questions = data.data.metaobjects.edges.map(edge => {
        const fields = edge.node.fields.reduce((acc, field) => {
          acc[field.key] = field.value;
          return acc;
        }, {});

        return {
          id: fields.question_id,
          type: fields.question_type,
          text: fields.question_text,
          subtitle: fields.question_subtitle || '',
          category: fields.category || 'general',
          order: parseInt(fields.order) || 0,
          required: fields.required === 'true' || fields.required === true,
          options: fields.options ? JSON.parse(fields.options) : [],
          placeholder: fields.placeholder || ''
        };
      });

      return questions.sort((a, b) => a.order - b.order);
    } catch (error) {
      console.error('Error loading metaobjects:', error);
      return [];
    }
  }

  /**
   * Load questions (hybrid approach)
   * Try Metaobjects first, fallback to hardcoded
   * @returns {Promise<Array>} Array of question objects
   */
  async loadQuestions() {
    if (this.useMetaobjects) {
      const metaobjectQuestions = await this.loadFromMetaobjects();
      
      if (metaobjectQuestions.length > 0) {
        console.log(`Loaded ${metaobjectQuestions.length} questions from Metaobjects`);
        this.questions = metaobjectQuestions;
        return this.questions;
      }
      
      console.warn('No Metaobject questions found, using hardcoded fallback');
    }

    // Use hardcoded questions
    this.questions = [...HARDCODED_QUESTIONS].sort((a, b) => a.order - b.order);
    console.log(`Loaded ${this.questions.length} hardcoded questions`);
    return this.questions;
  }

  /**
   * Group questions by category
   * @returns {Object} Questions grouped by category
   */
  groupByCategory() {
    const grouped = {};
    
    this.questions.forEach(question => {
      const cat = question.category || 'general';
      if (!grouped[cat]) {
        grouped[cat] = [];
      }
      grouped[cat].push(question);
    });

    return grouped;
  }

  /**
   * Get questions for a specific category
   * @param {string} category - Category name
   * @returns {Array} Questions in that category
   */
  getByCategory(category) {
    return this.questions.filter(q => q.category === category);
  }

  /**
   * Get a specific question by ID
   * @param {string} id - Question ID
   * @returns {Object|null} Question object or null
   */
  getById(id) {
    return this.questions.find(q => q.id === id) || null;
  }

  /**
   * Get category metadata
   * @param {string} category - Category name
   * @returns {Object} Category configuration
   */
  getCategoryInfo(category) {
    return this.categories[category] || {
      title: category,
      description: ''
    };
  }

  /**
   * Validate question data
   * @param {Object} question - Question to validate
   * @returns {boolean} True if valid
   */
  validateQuestion(question) {
    if (!question.id || !question.type || !question.text) {
      return false;
    }

    const validTypes = ['single_choice', 'severity_scale', 'text_input', 'email_input', 'checkbox'];
    if (!validTypes.includes(question.type)) {
      return false;
    }

    if (question.type === 'single_choice' && (!question.options || question.options.length === 0)) {
      return false;
    }

    return true;
  }

  /**
   * Get all validated questions
   * @returns {Array} Validated questions only
   */
  getValidQuestions() {
    return this.questions.filter(q => this.validateQuestion(q));
  }

  /**
   * Get total question count
   * @returns {number} Number of questions
   */
  getQuestionCount() {
    return this.questions.length;
  }

  /**
   * Get questions that contribute to scoring
   * @returns {Array} Severity scale questions only
   */
  getScoringQuestions() {
    return this.questions.filter(q => q.type === 'severity_scale');
  }
}

/**
 * Initialize and export the quiz configuration
 */
window.QuizConfigLoader = QuizConfigLoader;

// Expose hardcoded questions for debugging
window.HARDCODED_QUIZ_QUESTIONS = HARDCODED_QUESTIONS;
window.QUIZ_CATEGORY_CONFIG = CATEGORY_CONFIG;


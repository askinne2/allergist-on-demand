/**
 * Symptom Quiz Controller
 * Main JavaScript class for handling quiz navigation, validation, and submission
 * 
 * @author AlleDrops Development Team
 * @version 1.0.0
 */

/**
 * Scoring thresholds for severity levels
 */
const SCORE_THRESHOLDS = {
  minimal: { min: 0, max: 4 },
  mild: { min: 5, max: 9 },
  moderate: { min: 10, max: 19 },
  severe: { min: 20, max: 60 }
};

/**
 * Severity weights for scoring
 */
const SEVERITY_WEIGHTS = {
  none: 0,
  mild: 1,
  moderate: 2,
  severe: 3
};

/**
 * SymptomQuiz Class
 * Manages the entire quiz experience from navigation to submission
 */
class SymptomQuiz {
  /**
   * Initialize the quiz
   * @param {Object} config - Configuration object from window.AlleDropsQuizConfig
   */
  constructor(config) {
    this.config = config || {};
    this.configLoader = null;
    this.questions = [];
    this.groupedQuestions = {};
    this.categories = [];
    this.currentCategoryIndex = 0;
    this.responses = {};
    this.startTime = Date.now();
    
    // DOM elements
    this.form = document.querySelector('[data-quiz-form]');
    this.questionContainer = document.querySelector('[data-question-container]');
    this.prevBtn = document.querySelector('[data-quiz-prev]');
    this.nextBtn = document.querySelector('[data-quiz-next]');
    this.submitBtn = document.querySelector('[data-quiz-submit]');
    this.errorContainer = document.querySelector('[data-quiz-error]');
    this.progressBar = document.querySelector('[data-progress-bar]');
    this.progressCurrent = document.querySelector('[data-progress-current]');
    this.progressTotal = document.querySelector('[data-progress-total]');
    this.progressPercentage = document.querySelector('[data-progress-percentage]');
    
    this.init();
  }

  /**
   * Initialize the quiz
   */
  async init() {
    try {
      // Load quiz configuration
      this.configLoader = new QuizConfigLoader(
        this.config.useMetaobjects,
        this.config.shopUrl
      );
      
      await this.configLoader.loadQuestions();
      this.questions = this.configLoader.getValidQuestions();
      this.groupedQuestions = this.configLoader.groupByCategory();
      this.categories = Object.keys(this.groupedQuestions);
      
      if (this.questions.length === 0) {
        this.showError('Unable to load quiz questions. Please refresh the page.');
        return;
      }
      
      console.log(`Quiz initialized with ${this.questions.length} questions across ${this.categories.length} categories`);
      
      // Update progress total
      if (this.progressTotal) {
        this.progressTotal.textContent = this.categories.length;
      }
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Show first category
      this.showCategory(0);
      
    } catch (error) {
      console.error('Quiz initialization error:', error);
      this.showError('Failed to initialize quiz. Please refresh the page.');
    }
  }

  /**
   * Set up event listeners for navigation and form submission
   */
  setupEventListeners() {
    if (this.prevBtn) {
      this.prevBtn.addEventListener('click', () => this.previousCategory());
    }
    
    if (this.nextBtn) {
      this.nextBtn.addEventListener('click', () => this.nextCategory());
    }
    
    if (this.form) {
      this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    }
    
    // Auto-save responses when inputs change
    if (this.form) {
      this.form.addEventListener('change', (e) => {
        if (e.target.name && e.target.name !== 'quiz_website') {
          this.saveResponse(e.target.name, this.getInputValue(e.target));
        }
      });
    }
  }

  /**
   * Show a specific category of questions
   * @param {number} categoryIndex - Index of category to show
   */
  showCategory(categoryIndex) {
    if (categoryIndex < 0 || categoryIndex >= this.categories.length) {
      return;
    }
    
    this.currentCategoryIndex = categoryIndex;
    const categoryKey = this.categories[categoryIndex];
    const categoryQuestions = this.groupedQuestions[categoryKey];
    const categoryInfo = this.configLoader.getCategoryInfo(categoryKey);
    
    // Clear container
    this.questionContainer.innerHTML = '';
    
    // Add category header
    const header = document.createElement('div');
    header.className = 'quiz-category-header';
    header.innerHTML = `
      <h2 class="quiz-category-header__title">${categoryInfo.title}</h2>
      ${categoryInfo.description ? `<p class="quiz-category-header__description">${categoryInfo.description}</p>` : ''}
    `;
    this.questionContainer.appendChild(header);
    
    // Render questions
    categoryQuestions.forEach(question => {
      const questionEl = this.renderQuestion(question);
      this.questionContainer.appendChild(questionEl);
      
      // Restore previous responses
      if (this.responses[question.id] !== undefined) {
        this.setQuestionValue(question.id, this.responses[question.id]);
      }
    });
    
    // Update navigation buttons
    this.updateNavigation();
    
    // Update progress
    this.updateProgress();
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Render a single question
   * @param {Object} question - Question object
   * @returns {HTMLElement} Rendered question element
   */
  renderQuestion(question) {
    const wrapper = document.createElement('div');
    wrapper.className = 'quiz-question';
    wrapper.setAttribute('data-question-id', question.id);
    wrapper.setAttribute('data-question-category', question.category);
    
    switch (question.type) {
      case 'severity_scale':
        wrapper.innerHTML = this.renderSeverityScale(question);
        break;
      case 'single_choice':
        wrapper.innerHTML = this.renderSingleChoice(question);
        break;
      case 'text_input':
        wrapper.innerHTML = this.renderTextInput(question);
        break;
      case 'email_input':
        wrapper.innerHTML = this.renderEmailInput(question);
        break;
      case 'checkbox':
        wrapper.innerHTML = this.renderCheckbox(question);
        break;
      default:
        wrapper.innerHTML = this.renderTextInput(question);
    }
    
    return wrapper;
  }

  /**
   * Render severity scale question
   * @param {Object} question - Question object
   * @returns {string} HTML string
   */
  renderSeverityScale(question) {
    return `
      <fieldset class="severity-scale" data-severity-scale>
        <legend class="severity-scale__legend">
          ${question.text}
          ${question.required ? '<span class="severity-scale__required" aria-label="required">*</span>' : ''}
        </legend>
        ${question.subtitle ? `<p class="quiz-question__subtitle">${question.subtitle}</p>` : ''}
        <div class="severity-scale__options">
          <div class="severity-scale__option">
            <input type="radio" id="${question.id}_none" name="${question.id}" value="0" class="severity-scale__input" ${question.required ? 'required' : ''}>
            <label for="${question.id}_none" class="severity-scale__label severity-scale__label--none">
              <span class="severity-scale__value">0</span>
              <span class="severity-scale__text">None</span>
            </label>
          </div>
          <div class="severity-scale__option">
            <input type="radio" id="${question.id}_mild" name="${question.id}" value="1" class="severity-scale__input" ${question.required ? 'required' : ''}>
            <label for="${question.id}_mild" class="severity-scale__label severity-scale__label--mild">
              <span class="severity-scale__value">1</span>
              <span class="severity-scale__text">Mild</span>
            </label>
          </div>
          <div class="severity-scale__option">
            <input type="radio" id="${question.id}_moderate" name="${question.id}" value="2" class="severity-scale__input" ${question.required ? 'required' : ''}>
            <label for="${question.id}_moderate" class="severity-scale__label severity-scale__label--moderate">
              <span class="severity-scale__value">2</span>
              <span class="severity-scale__text">Moderate</span>
            </label>
          </div>
          <div class="severity-scale__option">
            <input type="radio" id="${question.id}_severe" name="${question.id}" value="3" class="severity-scale__input" ${question.required ? 'required' : ''}>
            <label for="${question.id}_severe" class="severity-scale__label severity-scale__label--severe">
              <span class="severity-scale__value">3</span>
              <span class="severity-scale__text">Severe</span>
            </label>
          </div>
        </div>
      </fieldset>
    `;
  }

  /**
   * Render single choice question
   * @param {Object} question - Question object
   * @returns {string} HTML string
   */
  renderSingleChoice(question) {
    const optionsHtml = question.options.map(option => `
      <div class="quiz-question__option">
        <input type="radio" id="${question.id}_${option.value}" name="${question.id}" value="${option.value}" class="quiz-question__radio" ${question.required ? 'required' : ''}>
        <label for="${question.id}_${option.value}" class="quiz-question__radio-label">
          ${option.label}
        </label>
      </div>
    `).join('');
    
    return `
      <fieldset class="quiz-question__fieldset">
        <legend class="quiz-question__legend">
          ${question.text}
          ${question.required ? '<span class="quiz-question__required" aria-label="required">*</span>' : ''}
        </legend>
        ${question.subtitle ? `<p class="quiz-question__subtitle">${question.subtitle}</p>` : ''}
        <div class="quiz-question__options">
          ${optionsHtml}
        </div>
      </fieldset>
    `;
  }

  /**
   * Render text input question
   * @param {Object} question - Question object
   * @returns {string} HTML string
   */
  renderTextInput(question) {
    return `
      <div class="quiz-question__input-group">
        <label for="${question.id}" class="quiz-question__label">
          ${question.text}
          ${question.required ? '<span class="quiz-question__required" aria-label="required">*</span>' : ''}
        </label>
        ${question.subtitle ? `<p class="quiz-question__subtitle">${question.subtitle}</p>` : ''}
        <input 
          type="text" 
          id="${question.id}" 
          name="${question.id}" 
          class="quiz-question__input"
          placeholder="${question.placeholder || ''}"
          ${question.required ? 'required' : ''}
          aria-describedby="${question.id}_error"
        >
        <span id="${question.id}_error" class="quiz-question__error" role="alert"></span>
      </div>
    `;
  }

  /**
   * Render email input question
   * @param {Object} question - Question object
   * @returns {string} HTML string
   */
  renderEmailInput(question) {
    return `
      <div class="quiz-question__input-group">
        <label for="${question.id}" class="quiz-question__label">
          ${question.text}
          ${question.required ? '<span class="quiz-question__required" aria-label="required">*</span>' : ''}
        </label>
        ${question.subtitle ? `<p class="quiz-question__subtitle">${question.subtitle}</p>` : ''}
        <input 
          type="email" 
          id="${question.id}" 
          name="${question.id}" 
          class="quiz-question__input quiz-question__input--email"
          placeholder="${question.placeholder || ''}"
          ${question.required ? 'required' : ''}
          aria-describedby="${question.id}_error"
        >
        <span id="${question.id}_error" class="quiz-question__error" role="alert"></span>
      </div>
    `;
  }

  /**
   * Render checkbox question
   * @param {Object} question - Question object
   * @returns {string} HTML string
   */
  renderCheckbox(question) {
    return `
      <div class="quiz-question__checkbox-group">
        <input 
          type="checkbox" 
          id="${question.id}" 
          name="${question.id}" 
          value="true"
          class="quiz-question__checkbox"
          ${question.required ? 'required' : ''}
          aria-describedby="${question.id}_error"
        >
        <label for="${question.id}" class="quiz-question__checkbox-label">
          ${question.text}
          ${question.required ? '<span class="quiz-question__required" aria-label="required">*</span>' : ''}
        </label>
        <span id="${question.id}_error" class="quiz-question__error" role="alert"></span>
      </div>
    `;
  }

  /**
   * Get value from an input element
   * @param {HTMLElement} input - Input element
   * @returns {string|boolean} Input value
   */
  getInputValue(input) {
    if (input.type === 'checkbox') {
      return input.checked;
    } else if (input.type === 'radio') {
      const checked = this.form.querySelector(`input[name="${input.name}"]:checked`);
      return checked ? checked.value : '';
    }
    return input.value;
  }

  /**
   * Set value for a question
   * @param {string} questionId - Question ID
   * @param {*} value - Value to set
   */
  setQuestionValue(questionId, value) {
    const question = this.configLoader.getById(questionId);
    if (!question) return;
    
    if (question.type === 'checkbox') {
      const checkbox = this.form.querySelector(`input[name="${questionId}"]`);
      if (checkbox) checkbox.checked = value === true || value === 'true';
    } else if (question.type === 'severity_scale' || question.type === 'single_choice') {
      const radio = this.form.querySelector(`input[name="${questionId}"][value="${value}"]`);
      if (radio) radio.checked = true;
    } else {
      const input = this.form.querySelector(`input[name="${questionId}"]`);
      if (input) input.value = value;
    }
  }

  /**
   * Save a response
   * @param {string} questionId - Question ID
   * @param {*} value - Response value
   */
  saveResponse(questionId, value) {
    this.responses[questionId] = value;
    console.log(`Saved response: ${questionId} = ${value}`);
  }

  /**
   * Validate current category
   * @returns {boolean} True if valid
   */
  validateCurrentCategory() {
    const categoryKey = this.categories[this.currentCategoryIndex];
    const categoryQuestions = this.groupedQuestions[categoryKey];
    
    let isValid = true;
    const errors = [];
    
    categoryQuestions.forEach(question => {
      if (!question.required) return;
      
      const value = this.responses[question.id];
      
      if (value === undefined || value === '' || value === null) {
        isValid = false;
        errors.push(`${question.text} is required`);
        
        // Show error on field
        const errorEl = document.getElementById(`${question.id}_error`);
        if (errorEl) {
          errorEl.textContent = 'This field is required';
        }
      } else if (question.type === 'email_input') {
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          isValid = false;
          errors.push(`Please enter a valid email address`);
          
          const errorEl = document.getElementById(`${question.id}_error`);
          if (errorEl) {
            errorEl.textContent = 'Please enter a valid email address';
          }
        }
      }
    });
    
    if (!isValid) {
      this.showError('Please answer all required questions before continuing.');
    } else {
      this.hideError();
    }
    
    return isValid;
  }

  /**
   * Navigate to previous category
   */
  previousCategory() {
    if (this.currentCategoryIndex > 0) {
      this.showCategory(this.currentCategoryIndex - 1);
    }
  }

  /**
   * Navigate to next category
   */
  nextCategory() {
    // Check for honeypot
    const honeypot = this.form.querySelector('input[name="quiz_website"]');
    if (honeypot && honeypot.value !== '') {
      console.warn('Honeypot triggered');
      return;
    }
    
    if (!this.validateCurrentCategory()) {
      return;
    }
    
    if (this.currentCategoryIndex < this.categories.length - 1) {
      this.showCategory(this.currentCategoryIndex + 1);
    }
  }

  /**
   * Update navigation button visibility
   */
  updateNavigation() {
    const isFirst = this.currentCategoryIndex === 0;
    const isLast = this.currentCategoryIndex === this.categories.length - 1;
    
    if (this.prevBtn) {
      this.prevBtn.style.display = isFirst ? 'none' : 'inline-flex';
    }
    
    if (this.nextBtn) {
      this.nextBtn.style.display = isLast ? 'none' : 'inline-flex';
    }
    
    if (this.submitBtn) {
      this.submitBtn.style.display = isLast ? 'inline-flex' : 'none';
    }
  }

  /**
   * Update progress indicator
   */
  updateProgress() {
    const current = this.currentCategoryIndex + 1;
    const total = this.categories.length;
    const percentage = Math.round((current / total) * 100);
    
    if (this.progressBar) {
      this.progressBar.style.width = `${percentage}%`;
    }
    
    if (this.progressCurrent) {
      this.progressCurrent.textContent = current;
    }
    
    if (this.progressPercentage) {
      this.progressPercentage.textContent = `${percentage}%`;
    }
  }

  /**
   * Calculate total quiz score
   * @returns {number} Total score
   */
  calculateScore() {
    const scoringQuestions = this.configLoader.getScoringQuestions();
    let totalScore = 0;
    
    scoringQuestions.forEach(question => {
      const value = parseInt(this.responses[question.id]) || 0;
      totalScore += value;
    });
    
    return totalScore;
  }

  /**
   * Determine severity level from score
   * @param {number} score - Total score
   * @returns {string} Severity level
   */
  getSeverityLevel(score) {
    if (score <= SCORE_THRESHOLDS.minimal.max) return 'minimal';
    if (score <= SCORE_THRESHOLDS.mild.max) return 'mild';
    if (score <= SCORE_THRESHOLDS.moderate.max) return 'moderate';
    return 'severe';
  }

  /**
   * Generate symptom profile ID
   * @returns {string} Profile ID in format AOD_YYYYMMDD_random
   */
  generateProfileId() {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 8);
    return `AOD_${dateStr}_${random}`;
  }

  /**
   * Handle form submission
   * @param {Event} e - Submit event
   */
  async handleSubmit(e) {
    e.preventDefault();
    
    // Check honeypot
    const honeypot = this.form.querySelector('input[name="quiz_website"]');
    if (honeypot && honeypot.value !== '') {
      console.warn('Honeypot triggered on submit');
      return;
    }
    
    // Validate final category
    if (!this.validateCurrentCategory()) {
      return;
    }
    
    // Disable submit button and show loading
    this.setSubmitLoading(true);
    
    try {
      // Calculate score
      const score = this.calculateScore();
      const severityLevel = this.getSeverityLevel(score);
      const profileId = this.generateProfileId();
      const region = this.responses.region || '';
      
      console.log(`Quiz completed: Score=${score}, Severity=${severityLevel}, Profile=${profileId}`);
      
      // Prepare data for submission
      const submissionData = {
        profileId,
        score,
        severityLevel,
        region,
        customerName: this.responses.customer_name || '',
        customerEmail: this.responses.customer_email || '',
        responses: { ...this.responses },
        submissionDate: new Date().toISOString(),
        completionTime: Math.round((Date.now() - this.startTime) / 1000) // seconds
      };
      
      // Submit to Google Sheets (detailed data)
      if (window.GoogleSheetsIntegration && this.config.googleSheetsWebAppUrl) {
        await window.GoogleSheetsIntegration.submitResponses(submissionData, this.config);
      }
      
      // Submit to Cloudflare Worker (summary data for Shopify)
      if (this.config.cloudflareWorkerUrl) {
        await this.submitToCloudflare(submissionData);
      }
      
      // Show results
      this.showResults(submissionData);
      
    } catch (error) {
      console.error('Submission error:', error);
      this.showError('There was an error submitting your assessment. Please try again.');
      this.setSubmitLoading(false);
    }
  }

  /**
   * Submit data to Cloudflare Worker
   * @param {Object} data - Submission data
   */
  async submitToCloudflare(data) {
    try {
      const response = await fetch(this.config.cloudflareWorkerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.customerEmail,
          symptom_profile_id: data.profileId,
          quiz_score: data.score,
          quiz_region: data.region,
          quiz_date: data.submissionDate,
          severity_level: data.severityLevel
        })
      });
      
      if (!response.ok) {
        throw new Error(`Cloudflare Worker error: ${response.status}`);
      }
      
      console.log('Successfully submitted to Cloudflare Worker');
    } catch (error) {
      console.error('Cloudflare submission error:', error);
      // Don't throw - we still want to show results even if Shopify update fails
    }
  }

  /**
   * Show quiz results
   * @param {Object} data - Submission data
   */
  showResults(data) {
    // Hide quiz form
    const quizWrapper = document.querySelector('[data-symptom-quiz]');
    if (quizWrapper) {
      quizWrapper.style.display = 'none';
    }
    
    // Show results section
    const resultsWrapper = document.querySelector('[data-quiz-results]');
    if (resultsWrapper) {
      resultsWrapper.style.display = 'block';
      
      // Populate results using the results module
      if (window.QuizResults) {
        window.QuizResults.displayResults(data);
      }
    }
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Set submit button loading state
   * @param {boolean} loading - Loading state
   */
  setSubmitLoading(loading) {
    if (!this.submitBtn) return;
    
    const submitText = this.submitBtn.querySelector('[data-submit-text]');
    const submitLoading = this.submitBtn.querySelector('[data-submit-loading]');
    
    this.submitBtn.disabled = loading;
    
    if (submitText) {
      submitText.style.display = loading ? 'none' : 'inline';
    }
    
    if (submitLoading) {
      submitLoading.style.display = loading ? 'inline-flex' : 'none';
    }
  }

  /**
   * Show error message
   * @param {string} message - Error message
   */
  showError(message) {
    if (!this.errorContainer) return;
    
    const p = this.errorContainer.querySelector('p');
    if (p) {
      p.textContent = message;
    }
    
    this.errorContainer.style.display = 'block';
    this.errorContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  /**
   * Hide error message
   */
  hideError() {
    if (this.errorContainer) {
      this.errorContainer.style.display = 'none';
    }
    
    // Clear all field errors
    const fieldErrors = document.querySelectorAll('.quiz-question__error');
    fieldErrors.forEach(error => {
      error.textContent = '';
    });
  }
}

/**
 * Initialize quiz when DOM is ready
 */
document.addEventListener('DOMContentLoaded', () => {
  // Wait for dependencies
  if (typeof QuizConfigLoader === 'undefined') {
    console.error('QuizConfigLoader not loaded');
    return;
  }
  
  const quizElement = document.querySelector('[data-symptom-quiz]');
  if (!quizElement) {
    return; // Not on quiz page
  }
  
  const config = window.AlleDropsQuizConfig || {};
  window.symptomQuiz = new SymptomQuiz(config);
});

// Export for global access
window.SymptomQuiz = SymptomQuiz;
window.SCORE_THRESHOLDS = SCORE_THRESHOLDS;


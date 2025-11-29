/**
 * Quiz Results Display Module
 * Handles displaying personalized results, product recommendations, and CTAs
 * 
 * @author AlleDrops Development Team
 * @version 1.0.0
 */

/**
 * QuizResults Class
 * Manages the results display after quiz submission
 */
class QuizResults {
  /**
   * Display quiz results
   * @param {Object} data - Submission data containing score, region, severity, etc.
   */
  static displayResults(data) {
    console.log('Displaying results:', data);
    
    // Update score display
    QuizResults.updateScoreDisplay(data.score, data.severityLevel);
    
    // Update recommendation message
    QuizResults.updateRecommendationMessage(data.severityLevel);
    
    // Show appropriate CTA based on score
    if (data.score >= 10) {
      // Moderate or Severe: Show product recommendation
      QuizResults.showProductRecommendation(data.region, data.score);
    } else if (data.score >= 5) {
      // Mild: Show consultation CTA
      QuizResults.showConsultationCTA();
    } else {
      // Minimal: Show educational content
      QuizResults.showEducationalCTA();
    }
    
    // Update profile ID
    QuizResults.updateProfileId(data.profileId);
    
    // Set up retake button
    QuizResults.setupRetakeButton();
  }

  /**
   * Update score circle display
   * @param {number} score - Total score
   * @param {string} severity - Severity level
   */
  static updateScoreDisplay(score, severity) {
    const scoreEl = document.querySelector('[data-results-score]');
    const severityEl = document.querySelector('[data-results-severity]');
    const circleEl = document.querySelector('[data-results-circle]');
    
    if (scoreEl) {
      scoreEl.textContent = score;
    }
    
    if (severityEl) {
      severityEl.textContent = severity.charAt(0).toUpperCase() + severity.slice(1);
    }
    
    // Update circle color based on severity
    if (circleEl) {
      circleEl.classList.remove(
        'quiz-results__score-circle--minimal',
        'quiz-results__score-circle--mild',
        'quiz-results__score-circle--moderate',
        'quiz-results__score-circle--severe'
      );
      circleEl.classList.add(`quiz-results__score-circle--${severity}`);
    }
  }

  /**
   * Update recommendation message
   * @param {string} severity - Severity level
   */
  static updateRecommendationMessage(severity) {
    const messageEl = document.querySelector('[data-results-message]');
    if (!messageEl) return;
    
    const config = window.AlleDropsResultsConfig || {};
    const messages = config.messages || {};
    const message = messages[severity] || {};
    
    const title = message.title || 'Your Results';
    const text = message.text || '';
    
    messageEl.innerHTML = `
      <h3>${title}</h3>
      <p>${text}</p>
    `;
  }

  /**
   * Show product recommendation
   * @param {string} region - Selected region
   * @param {number} score - Quiz score
   */
  static async showProductRecommendation(region, score) {
    const productContainer = document.querySelector('[data-results-product]');
    if (!productContainer) return;
    
    // Hide other CTAs
    QuizResults.hideElement('[data-results-consultation]');
    QuizResults.hideElement('[data-results-education]');
    
    // Generate product handle
    const config = window.AlleDropsResultsConfig || {};
    const handleFormat = config.productHandleFormat || '{region}-allergy-drops';
    const productHandle = handleFormat.replace('{region}', region.replace('_', '-'));
    
    console.log('Looking up product:', productHandle);
    
    try {
      // Fetch product from Shopify
      const product = await QuizResults.fetchProduct(productHandle);
      
      if (product) {
        QuizResults.renderProductCard(product, productContainer);
        productContainer.style.display = 'block';
      } else {
        console.warn('Product not found:', productHandle);
        // Fallback to consultation CTA
        QuizResults.showConsultationCTA();
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      // Fallback to consultation CTA
      QuizResults.showConsultationCTA();
    }
  }

  /**
   * Fetch product from Shopify
   * @param {string} handle - Product handle
   * @returns {Promise<Object>} Product data
   */
  static async fetchProduct(handle) {
    try {
      const response = await fetch(`/products/${handle}.js`);
      
      if (!response.ok) {
        return null;
      }
      
      const product = await response.json();
      return product;
    } catch (error) {
      console.error('Product fetch error:', error);
      return null;
    }
  }

  /**
   * Render product card
   * @param {Object} product - Product object from Shopify
   * @param {HTMLElement} container - Container element
   */
  static renderProductCard(product, container) {
    const cardEl = container.querySelector('[data-product-card]');
    if (!cardEl) return;
    
    const variant = product.variants[0];
    const image = product.featured_image || (product.images && product.images[0]);
    const price = variant ? QuizResults.formatMoney(variant.price) : '';
    
    cardEl.innerHTML = `
      <div class="quiz-results__product-content">
        ${image ? `
          <div class="quiz-results__product-image">
            <img src="${image}" alt="${product.title}" loading="lazy">
          </div>
        ` : ''}
        <div class="quiz-results__product-info">
          <h4 class="quiz-results__product-name">${product.title}</h4>
          ${product.description ? `
            <div class="quiz-results__product-description">
              ${QuizResults.truncateHtml(product.description, 150)}
            </div>
          ` : ''}
          <div class="quiz-results__product-price">
            <span class="quiz-results__price-amount">${price}</span>
          </div>
          <div class="quiz-results__product-actions">
            <button 
              class="quiz-results__btn quiz-results__btn--primary quiz-results__add-to-cart"
              data-variant-id="${variant.id}"
              data-product-title="${product.title}"
            >
              Add to Cart
            </button>
            <a 
              href="/products/${product.handle}" 
              class="quiz-results__btn quiz-results__btn--secondary"
            >
              View Product Details
            </a>
          </div>
        </div>
      </div>
    `;
    
    // Set up add to cart button
    const addToCartBtn = cardEl.querySelector('.quiz-results__add-to-cart');
    if (addToCartBtn) {
      addToCartBtn.addEventListener('click', () => {
        QuizResults.addToCart(variant.id, product.title);
      });
    }
  }

  /**
   * Add product to cart
   * @param {number} variantId - Variant ID
   * @param {string} productTitle - Product title
   */
  static async addToCart(variantId, productTitle) {
    try {
      const response = await fetch('/cart/add.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: [{
            id: variantId,
            quantity: 1
          }]
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to add to cart');
      }
      
      // Show success message
      QuizResults.showToast(`${productTitle} added to cart!`, 'success');
      
      // Optionally redirect to cart
      setTimeout(() => {
        window.location.href = '/cart';
      }, 1500);
      
    } catch (error) {
      console.error('Add to cart error:', error);
      QuizResults.showToast('Failed to add to cart. Please try again.', 'error');
    }
  }

  /**
   * Show consultation CTA
   */
  static showConsultationCTA() {
    QuizResults.showElement('[data-results-consultation]');
    QuizResults.hideElement('[data-results-product]');
    QuizResults.hideElement('[data-results-education]');
  }

  /**
   * Show educational CTA
   */
  static showEducationalCTA() {
    QuizResults.showElement('[data-results-education]');
    QuizResults.hideElement('[data-results-product]');
    QuizResults.hideElement('[data-results-consultation]');
  }

  /**
   * Update profile ID display
   * @param {string} profileId - Profile ID
   */
  static updateProfileId(profileId) {
    const profileEl = document.querySelector('[data-results-profile-id]');
    if (profileEl) {
      profileEl.textContent = profileId;
    }
  }

  /**
   * Set up retake button
   */
  static setupRetakeButton() {
    const retakeBtn = document.querySelector('[data-retake-quiz]');
    if (retakeBtn) {
      retakeBtn.addEventListener('click', () => {
        window.location.reload();
      });
    }
  }

  /**
   * Show element
   * @param {string} selector - Element selector
   */
  static showElement(selector) {
    const el = document.querySelector(selector);
    if (el) {
      el.style.display = 'block';
    }
  }

  /**
   * Hide element
   * @param {string} selector - Element selector
   */
  static hideElement(selector) {
    const el = document.querySelector(selector);
    if (el) {
      el.style.display = 'none';
    }
  }

  /**
   * Format money according to Shopify format
   * @param {number} cents - Price in cents
   * @returns {string} Formatted price
   */
  static formatMoney(cents) {
    const dollars = (cents / 100).toFixed(2);
    return `$${dollars}`;
  }

  /**
   * Truncate HTML content
   * @param {string} html - HTML content
   * @param {number} length - Max length
   * @returns {string} Truncated content
   */
  static truncateHtml(html, length) {
    const div = document.createElement('div');
    div.innerHTML = html;
    const text = div.textContent || div.innerText || '';
    
    if (text.length <= length) {
      return text;
    }
    
    return text.substring(0, length) + '...';
  }

  /**
   * Show toast notification
   * @param {string} message - Message text
   * @param {string} type - Type (success, error, info)
   */
  static showToast(message, type = 'info') {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `quiz-results__toast quiz-results__toast--${type}`;
    toast.textContent = message;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'polite');
    
    document.body.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => {
      toast.classList.add('quiz-results__toast--visible');
    }, 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
      toast.classList.remove('quiz-results__toast--visible');
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 3000);
  }
}

// Export for global access
window.QuizResults = QuizResults;


/**
 * Quiz Results Display Module
 * Handles displaying personalized results, product recommendations, and CTAs
 * 
 * @author AlleDrops Development Team
 * @version 1.0.0
 */

/**
 * Sample test data for preview mode
 */
const SAMPLE_DATA = {
  severe: {
    profileId: 'AOD_20251129_preview_severe',
    score: 60,
    severityLevel: 'severe',
    region: 'northwest',
    customerName: 'Test User',
    customerEmail: 'test@example.com'
  },
  moderate: {
    profileId: 'AOD_20251129_preview_moderate',
    score: 25,
    severityLevel: 'moderate',
    region: 'southeast',
    customerName: 'Test User',
    customerEmail: 'test@example.com'
  },
  mild: {
    profileId: 'AOD_20251129_preview_mild',
    score: 8,
    severityLevel: 'mild',
    region: 'northeast',
    customerName: 'Test User',
    customerEmail: 'test@example.com'
  },
  minimal: {
    profileId: 'AOD_20251129_preview_minimal',
    score: 3,
    severityLevel: 'minimal',
    region: 'midwest',
    customerName: 'Test User',
    customerEmail: 'test@example.com'
  }
};

/**
 * QuizResults Class
 * Manages the results display after quiz submission
 */
class QuizResults {
  /**
   * Initialize preview mode if URL parameter is present
   * Call this on page load to enable ?preview=severe, ?preview=moderate, etc.
   */
  static initPreviewMode() {
    const urlParams = new URLSearchParams(window.location.search);
    const previewType = urlParams.get('preview') || urlParams.get('test');
    
    if (previewType && SAMPLE_DATA[previewType]) {
      console.log(`🎨 Preview mode activated: ${previewType}`);
      
      // Hide quiz form
      const quizWrapper = document.querySelector('[data-symptom-quiz]');
      if (quizWrapper) {
        quizWrapper.closest('.symptom-quiz-wrapper').style.display = 'none';
      }
      
      // Show results section
      const resultsWrapper = document.querySelector('[data-quiz-results]');
      if (resultsWrapper) {
        resultsWrapper.style.display = 'block';
      }
      
      // Display sample data
      QuizResults.displayResults(SAMPLE_DATA[previewType]);
      
      // Add preview indicator
      const header = document.querySelector('.quiz-results__header');
      if (header) {
        const previewBadge = document.createElement('div');
        previewBadge.style.cssText = `
          background: rgba(255, 193, 7, 0.2);
          border: 1px solid rgba(255, 193, 7, 0.5);
          border-radius: 4px;
          padding: 8px 16px;
          margin-bottom: 16px;
          font-size: 14px;
          color: rgba(var(--color-foreground), 0.8);
        `;
        previewBadge.textContent = `🧪 Preview Mode: ${previewType.charAt(0).toUpperCase() + previewType.slice(1)} Symptoms`;
        header.insertBefore(previewBadge, header.firstChild);
      }
    }
  }
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
    // Format: {region}-alledrops (e.g., northwest-alledrops, north-central-alledrops)
    const config = window.AlleDropsResultsConfig || {};
    const handleFormat = config.productHandleFormat || '{region}-alledrops';
    
    // Convert region to handle format (replace underscores with hyphens)
    // e.g., "north_central" -> "north-central", "northwest" -> "northwest"
    const regionHandle = region.replace(/_/g, '-');
    const productHandle = handleFormat.replace('{region}', regionHandle);
    
    console.log('Product lookup config:', {
      region: region,
      regionHandle: regionHandle,
      handleFormat: handleFormat,
      productHandle: productHandle
    });
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
   * Render product card using Shopify's native card-product structure
   * This matches the structure used in featured-collection sections
   * @param {Object} product - Product object from Shopify JSON API
   * @param {HTMLElement} container - Container element
   */
  static renderProductCard(product, container) {
    const cardEl = container.querySelector('[data-product-card]');
    if (!cardEl) return;
    
    const variant = product.variants && product.variants[0];
    const featuredImage = product.featured_image || (product.images && product.images[0]);
    const compareAtPrice = variant && variant.compare_at_price ? QuizResults.formatMoney(variant.compare_at_price) : null;
    const price = variant ? QuizResults.formatMoney(variant.price) : '';
    const onSale = variant && variant.compare_at_price && variant.compare_at_price > variant.price;
    
    // Render using Shopify's card-product structure
    // This matches the structure from snippets/card-product.liquid and featured-collection sections
    cardEl.innerHTML = `
      <li class="grid__item">
        <div class="card-wrapper product-card-wrapper underline-links-hover">
          <div class="card card--standard ${featuredImage ? 'card--media' : 'card--text'}">
            <div class="card__inner ratio" style="--ratio-percent: ${featuredImage ? '100' : '100'}%;">
              ${featuredImage ? `
                <div class="card__media">
                  <div class="media media--transparent media--hover-effect">
                    <img
                      srcset="${featuredImage}?width=165 165w, ${featuredImage}?width=360 360w, ${featuredImage}?width=533 533w, ${featuredImage}?width=720 720w, ${featuredImage}?width=940 940w, ${featuredImage}?width=1066 1066w"
                      src="${featuredImage}?width=533"
                      sizes="(min-width: 990px) calc((100vw - 130px) / 4), (min-width: 750px) calc((100vw - 120px) / 3), calc((100vw - 35px) / 2)"
                      alt="${product.title}"
                      class="motion-reduce"
                      loading="lazy"
                      width="${product.featured_image_width || 533}"
                      height="${product.featured_image_height || 533}"
                    >
                  </div>
                </div>
              ` : ''}
            </div>
            <div class="card__content">
              <div class="card__information">
                <h3 class="card__heading h5">
                  <a
                    href="/products/${product.handle}"
                    id="CardLink-quiz-results-${product.id}"
                    class="full-unstyled-link"
                    aria-labelledby="CardLink-quiz-results-${product.id}"
                  >
                    ${product.title}
                  </a>
                </h3>
                <div class="card-information">
                  ${QuizResults.renderPrice(price, compareAtPrice, onSale)}
                </div>
              </div>
              ${variant ? `
                <div class="card__quick-add">
                  <button
                    class="quick-add__submit button button--secondary"
                    data-variant-id="${variant.id}"
                    data-product-title="${product.title}"
                    aria-haspopup="dialog"
                  >
                    Add to cart
                    <span class="sold-out-message hidden">
                      Sold out
                    </span>
                    <div class="loading-overlay__spinner hidden">
                      <svg aria-hidden="true" focusable="false" class="spinner" viewBox="0 0 66 66" xmlns="http://www.w3.org/2000/svg">
                        <circle class="path" fill="none" stroke-width="6" cx="33" cy="33" r="30"></circle>
                      </svg>
                    </div>
                  </button>
                </div>
              ` : ''}
            </div>
          </div>
        </div>
      </li>
    `;
    
    // Set up add to cart button using Shopify's quick-add functionality
    const addToCartBtn = cardEl.querySelector('.quick-add__submit');
    if (addToCartBtn) {
      addToCartBtn.addEventListener('click', (e) => {
        e.preventDefault();
        QuizResults.addToCart(variant.id, product.title);
      });
    }
  }

  /**
   * Render price using Shopify's price structure
   * @param {string} price - Current price
   * @param {string|null} compareAtPrice - Compare at price (if on sale)
   * @param {boolean} onSale - Whether product is on sale
   * @returns {string} HTML for price display
   */
  static renderPrice(price, compareAtPrice, onSale) {
    if (onSale && compareAtPrice) {
      return `
        <div class="price">
          <div class="price__container">
            <div class="price__regular">
              <span class="visually-hidden visually-hidden--inline">Regular price</span>
              <span class="price-item price-item--regular">
                ${compareAtPrice}
              </span>
            </div>
            <div class="price__sale">
              <span class="visually-hidden visually-hidden--inline">Sale price</span>
              <span class="price-item price-item--sale price-item--last">
                ${price}
              </span>
            </div>
          </div>
        </div>
      `;
    }
    
    return `
      <div class="price">
        <div class="price__container">
          <div class="price__regular">
            <span class="visually-hidden visually-hidden--inline">Regular price</span>
            <span class="price-item price-item--regular">
              ${price}
            </span>
          </div>
        </div>
      </div>
    `;
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

// Initialize preview mode on page load if URL parameter is present
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    QuizResults.initPreviewMode();
  });
} else {
  // DOM already loaded
  QuizResults.initPreviewMode();
}


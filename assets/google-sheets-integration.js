/**
 * Google Sheets Integration Module
 * Handles submission of detailed symptom responses to Google Sheets via Apps Script Web App
 * 
 * @author AlleDrops Development Team
 * @version 1.0.0
 */

/**
 * GoogleSheetsIntegration Class
 * Manages communication with Google Sheets via Apps Script Web App
 */
class GoogleSheetsIntegration {
  /**
   * Submit quiz responses to Google Sheets
   * @param {Object} data - Submission data
   * @param {Object} config - Configuration with Web App URL
   * @returns {Promise<Object>} Response from Google Sheets
   */
  static async submitResponses(data, config) {
    if (!config.googleSheetsWebAppUrl) {
      console.warn('Google Sheets Web App URL not configured, skipping submission');
      return { success: false, error: 'Not configured' };
    }
    
    // Skip Google Sheets submission in local development (CORS limitations)
    // This prevents errors during local testing - will work in production
    if (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost') {
      console.warn('Local development detected - skipping Google Sheets submission (CORS limitation)');
      console.log('Quiz data that would be submitted:', data);
      return { 
        success: true, 
        skipped: true,
        message: 'Skipped in local development - will work in production' 
      };
    }
    
    try {
      const rowData = GoogleSheetsIntegration.prepareRowData(data);
      const url = config.googleSheetsWebAppUrl;
      
      console.log('Submitting to Google Sheets:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ data: rowData })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Google Sheets API error: ${response.status} - ${errorText}`);
      }
      
      const result = await response.json();
      console.log('Google Sheets submission successful:', result);
      
      return {
        success: true,
        rowNumber: result.rowNumber,
        data: result
      };
      
    } catch (error) {
      console.error('Google Sheets submission error:', error);
      
      // Retry logic for network errors
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        console.log('Network error, retrying in 2 seconds...');
        await GoogleSheetsIntegration.delay(2000);
        return GoogleSheetsIntegration.submitResponses(data, config);
      }
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Prepare row data for Google Sheets
   * Returns data as an array matching the sheet columns
   * @param {Object} data - Submission data
   * @returns {Array} Row data array
   */
  static prepareRowData(data) {
    const responses = data.responses || {};
    
    // Return as array matching sheet column order
    // Column order must match the Google Sheet headers
    return [
      data.profileId || '',                                    // Profile ID
      data.customerName || '',                                 // Customer Name
      data.customerEmail || '',                                // Customer Email
      data.score || 0,                                         // Total Score
      GoogleSheetsIntegration.capitalizeSeverity(data.severityLevel), // Severity Level
      GoogleSheetsIntegration.formatRegion(data.region),       // Region
      data.submissionDate || new Date().toISOString(),        // Submission Date
      data.completionTime || 0,                                // Completion Time (seconds)
      
      // Nasal symptoms
      parseInt(responses.nasal_runny) || 0,
      parseInt(responses.nasal_stuffy) || 0,
      parseInt(responses.nasal_sneezing) || 0,
      parseInt(responses.nasal_postnasal) || 0,
      parseInt(responses.nasal_smell_loss) || 0,
      
      // Eye symptoms
      parseInt(responses.eye_watery) || 0,
      parseInt(responses.eye_itchy) || 0,
      parseInt(responses.eye_red) || 0,
      parseInt(responses.eye_swollen) || 0,
      
      // Respiratory symptoms
      parseInt(responses.respiratory_cough) || 0,
      parseInt(responses.respiratory_wheeze) || 0,
      parseInt(responses.respiratory_tight) || 0,
      parseInt(responses.respiratory_breath) || 0,
      
      // Skin symptoms
      parseInt(responses.skin_rash) || 0,
      parseInt(responses.skin_hives) || 0,
      parseInt(responses.skin_itching) || 0,
      parseInt(responses.skin_eczema) || 0,
      
      // Throat symptoms
      parseInt(responses.throat_itchy) || 0,
      parseInt(responses.throat_sore) || 0,
      parseInt(responses.throat_mouth_itchy) || 0,
      
      // Demographics
      responses.timing_seasonal || '',
      responses.timing_duration || '',
      
      // Full Response JSON
      JSON.stringify(responses, null, 2)
    ];
  }

  /**
   * Capitalize severity level
   * @param {string} severity - Severity level
   * @returns {string} Capitalized severity
   */
  static capitalizeSeverity(severity) {
    if (!severity) return '';
    return severity.charAt(0).toUpperCase() + severity.slice(1).toLowerCase();
  }

  /**
   * Format region name
   * @param {string} region - Region code
   * @returns {string} Formatted region name
   */
  static formatRegion(region) {
    if (!region) return '';
    
    const regionMap = {
      'northwest': 'Northwest',
      'southwest': 'Southwest',
      'north_central': 'North Central',
      'south_central': 'South Central',
      'midwest': 'Midwest',
      'southeast': 'Southeast',
      'northeast': 'Northeast'
    };
    
    return regionMap[region] || region;
  }

  /**
   * Delay helper for retry logic
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise} Promise that resolves after delay
   */
  static delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Validate Google Sheets configuration
   * @param {Object} config - Configuration object
   * @returns {boolean} True if valid
   */
  static validateConfig(config) {
    if (!config) return false;
    if (!config.googleSheetsWebAppUrl || config.googleSheetsWebAppUrl === '') {
      console.warn('Google Sheets Web App URL is missing');
      return false;
    }
    
    // Validate URL format
    try {
      new URL(config.googleSheetsWebAppUrl);
      return true;
    } catch (e) {
      console.warn('Invalid Google Sheets Web App URL format');
      return false;
    }
  }
}

// Export for global access
window.GoogleSheetsIntegration = GoogleSheetsIntegration;


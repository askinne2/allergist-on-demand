/**
 * Cloudflare Worker for AlleDrops Symptom Quiz
 * Proxies customer metafield updates to Shopify Admin API
 * 
 * This worker receives quiz summary data and updates customer metafields in Shopify.
 * It acts as a secure proxy to avoid exposing Shopify Admin API credentials in the browser.
 * 
 * @author AlleDrops Development Team
 * @version 1.0.0
 */

/**
 * Environment variables required:
 * - SHOPIFY_STORE_DOMAIN: Your Shopify store domain (e.g., allergist-on-demand.myshopify.com)
 * - SHOPIFY_ACCESS_TOKEN: Admin API access token with write_customers permission
 * - ALLOWED_ORIGINS: Comma-separated list of allowed origins for CORS
 */

/**
 * Handle incoming requests
 */
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

/**
 * Main request handler
 * @param {Request} request - Incoming request
 * @returns {Response} Response object
 */
async function handleRequest(request) {
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return handleCORS(request);
  }
  
  // Only accept POST requests
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }
  
  // Check origin
  const origin = request.headers.get('Origin');
  if (!isAllowedOrigin(origin)) {
    return jsonResponse({ error: 'Origin not allowed' }, 403);
  }
  
  try {
    // Parse request body
    const data = await request.json();
    
    // Validate required fields
    const validation = validateRequestData(data);
    if (!validation.valid) {
      return jsonResponse({ error: validation.error }, 400);
    }
    
    // Find or create customer in Shopify
    const customer = await findOrCreateCustomer(data.email);
    
    if (!customer) {
      return jsonResponse({ error: 'Failed to find or create customer' }, 500);
    }
    
    // Update customer metafields
    const result = await updateCustomerMetafields(customer.id, data);
    
    if (!result.success) {
      return jsonResponse({ error: result.error }, 500);
    }
    
    return jsonResponse({
      success: true,
      customerId: customer.id,
      message: 'Customer metafields updated successfully'
    }, 200, origin);
    
  } catch (error) {
    console.error('Worker error:', error);
    return jsonResponse({ 
      error: 'Internal server error',
      details: error.message 
    }, 500);
  }
}

/**
 * Validate request data
 * @param {Object} data - Request data
 * @returns {Object} Validation result
 */
function validateRequestData(data) {
  if (!data.email || !isValidEmail(data.email)) {
    return { valid: false, error: 'Valid email is required' };
  }
  
  if (!data.symptom_profile_id) {
    return { valid: false, error: 'symptom_profile_id is required' };
  }
  
  if (typeof data.quiz_score !== 'number') {
    return { valid: false, error: 'quiz_score must be a number' };
  }
  
  if (!data.quiz_region) {
    return { valid: false, error: 'quiz_region is required' };
  }
  
  if (!data.severity_level) {
    return { valid: false, error: 'severity_level is required' };
  }
  
  return { valid: true };
}

/**
 * Validate email format
 * @param {string} email - Email address
 * @returns {boolean} True if valid
 */
function isValidEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Find or create customer in Shopify
 * @param {string} email - Customer email
 * @returns {Promise<Object>} Customer object
 */
async function findOrCreateCustomer(email) {
  // First, try to find existing customer
  const searchQuery = `
    query findCustomer($email: String!) {
      customers(first: 1, query: $email) {
        edges {
          node {
            id
            email
          }
        }
      }
    }
  `;
  
  const searchResponse = await shopifyGraphQL(searchQuery, { email });
  
  if (searchResponse.data.customers.edges.length > 0) {
    return searchResponse.data.customers.edges[0].node;
  }
  
  // Customer not found, create new one
  const createMutation = `
    mutation createCustomer($input: CustomerInput!) {
      customerCreate(input: $input) {
        customer {
          id
          email
        }
        userErrors {
          field
          message
        }
      }
    }
  `;
  
  const createResponse = await shopifyGraphQL(createMutation, {
    input: {
      email: email,
      acceptsMarketing: false
    }
  });
  
  if (createResponse.data.customerCreate.userErrors.length > 0) {
    console.error('Customer creation errors:', createResponse.data.customerCreate.userErrors);
    return null;
  }
  
  return createResponse.data.customerCreate.customer;
}

/**
 * Update customer metafields
 * @param {string} customerId - Shopify customer GID
 * @param {Object} data - Metafield data
 * @returns {Promise<Object>} Update result
 */
async function updateCustomerMetafields(customerId, data) {
  const mutation = `
    mutation setCustomerMetafields($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        metafields {
          id
          namespace
          key
          value
        }
        userErrors {
          field
          message
        }
      }
    }
  `;
  
  const metafields = [
    {
      ownerId: customerId,
      namespace: 'alledrops',
      key: 'symptom_profile_id',
      type: 'single_line_text_field',
      value: data.symptom_profile_id
    },
    {
      ownerId: customerId,
      namespace: 'alledrops',
      key: 'quiz_score',
      type: 'number_integer',
      value: data.quiz_score.toString()
    },
    {
      ownerId: customerId,
      namespace: 'alledrops',
      key: 'quiz_region',
      type: 'single_line_text_field',
      value: data.quiz_region
    },
    {
      ownerId: customerId,
      namespace: 'alledrops',
      key: 'quiz_date',
      type: 'date_time',
      value: data.quiz_date || new Date().toISOString()
    },
    {
      ownerId: customerId,
      namespace: 'alledrops',
      key: 'severity_level',
      type: 'single_line_text_field',
      value: data.severity_level
    }
  ];
  
  const response = await shopifyGraphQL(mutation, { metafields });
  
  if (response.data.metafieldsSet.userErrors.length > 0) {
    console.error('Metafield update errors:', response.data.metafieldsSet.userErrors);
    return {
      success: false,
      error: 'Failed to update metafields',
      details: response.data.metafieldsSet.userErrors
    };
  }
  
  return { success: true };
}

/**
 * Make GraphQL request to Shopify Admin API
 * @param {string} query - GraphQL query or mutation
 * @param {Object} variables - Query variables
 * @returns {Promise<Object>} Response data
 */
async function shopifyGraphQL(query, variables = {}) {
  const url = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/2024-01/graphql.json`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN
    },
    body: JSON.stringify({ query, variables })
  });
  
  if (!response.ok) {
    throw new Error(`Shopify API error: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  
  if (data.errors) {
    console.error('GraphQL errors:', data.errors);
    throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
  }
  
  return data;
}

/**
 * Check if origin is allowed
 * @param {string} origin - Request origin
 * @returns {boolean} True if allowed
 */
function isAllowedOrigin(origin) {
  if (!origin) return false;
  
  const allowedOrigins = (ALLOWED_ORIGINS || '').split(',').map(o => o.trim());
  
  // Allow any origin if ALLOWED_ORIGINS is '*'
  if (allowedOrigins.includes('*')) return true;
  
  return allowedOrigins.includes(origin);
}

/**
 * Handle CORS preflight requests
 * @param {Request} request - Incoming request
 * @returns {Response} CORS response
 */
function handleCORS(request) {
  const origin = request.headers.get('Origin');
  
  if (!isAllowedOrigin(origin)) {
    return new Response(null, { status: 403 });
  }
  
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    }
  });
}

/**
 * Create JSON response with CORS headers
 * @param {Object} data - Response data
 * @param {number} status - HTTP status code
 * @param {string} origin - Request origin
 * @returns {Response} Response object
 */
function jsonResponse(data, status = 200, origin = null) {
  const headers = {
    'Content-Type': 'application/json'
  };
  
  if (origin && isAllowedOrigin(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  }
  
  return new Response(JSON.stringify(data), { status, headers });
}


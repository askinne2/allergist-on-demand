/**
 * Google Apps Script Web App for AlleDrops Symptom Quiz
 * Receives quiz submission data and appends to Google Sheet
 * 
 * Setup Instructions:
 * 1. Create a new Google Sheet
 * 2. Add headers in Row 1 (see HEADERS constant below)
 * 3. Open Extensions → Apps Script
 * 4. Paste this code
 * 5. Save and deploy as web app
 * 6. Set execute as: "Me"
 * 7. Set access: "Anyone"
 * 8. Copy the web app URL to Shopify theme settings
 * 
 * @author AlleDrops Development Team
 * @version 1.0.0
 */

// Sheet name - change if your sheet tab has a different name
const SHEET_NAME = 'Symptom Responses';

// Column headers - must match the order in google-sheets-integration.js
const HEADERS = [
  'Profile ID',
  'Customer Name',
  'Customer Email',
  'Total Score',
  'Severity Level',
  'Region',
  'Submission Date',
  'Completion Time (seconds)',
  'Nasal - Runny',
  'Nasal - Stuffy',
  'Nasal - Sneezing',
  'Nasal - Postnasal Drip',
  'Nasal - Loss of Smell',
  'Eye - Watery',
  'Eye - Itchy',
  'Eye - Redness',
  'Eye - Swollen',
  'Respiratory - Cough',
  'Respiratory - Wheezing',
  'Respiratory - Chest Tightness',
  'Respiratory - Shortness of Breath',
  'Skin - Rash',
  'Skin - Hives',
  'Skin - Itching',
  'Skin - Eczema',
  'Throat - Itchy',
  'Throat - Sore',
  'Throat - Mouth Itchy',
  'Seasonal Timing',
  'Duration',
  'Full Response JSON'
];

/**
 * doPost - Handles POST requests from the quiz
 * This is the main entry point for the web app
 */
function doPost(e) {
  try {
    // Parse incoming JSON data
    const requestData = JSON.parse(e.postData.contents);
    const rowData = requestData.data;
    
    // Validate data
    if (!rowData || !Array.isArray(rowData)) {
      return createCORSResponse(
        JSON.stringify({ success: false, error: 'Invalid data format' })
      );
    }
    
    // Get the active spreadsheet
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      return createCORSResponse(
        JSON.stringify({ success: false, error: 'Sheet not found: ' + SHEET_NAME })
      );
    }
    
    // Ensure headers exist
    ensureHeaders(sheet);
    
    // Append the new row
    const lastRow = sheet.getLastRow();
    sheet.appendRow(rowData);
    const newRowNumber = lastRow + 1;
    
    // Return success response with CORS headers
    return createCORSResponse(
      JSON.stringify({
        success: true,
        rowNumber: newRowNumber,
        message: 'Data appended successfully'
      })
    );
    
  } catch (error) {
    // Log error and return error response
    console.error('Error processing request:', error);
    return createCORSResponse(
      JSON.stringify({
        success: false,
        error: error.toString()
      })
    );
  }
}

/**
 * doOptions - Handles OPTIONS requests for CORS preflight
 */
function doOptions(e) {
  return createCORSResponse('');
}

/**
 * doGet - Handles GET requests (for testing)
 * Returns a simple status message
 */
function doGet(e) {
  return createCORSResponse(
    JSON.stringify({
      status: 'AlleDrops Symptom Quiz Web App is running',
      version: '1.0.0',
      sheet: SHEET_NAME
    })
  );
}

/**
 * Create response with CORS headers
 * This allows cross-origin requests from any domain
 */
function createCORSResponse(content) {
  return ContentService.createTextOutput(content)
    .setMimeType(ContentService.MimeType.JSON)
    .setHeaders({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '3600'
    });
}

/**
 * Ensure headers exist in the first row
 * If headers don't exist, add them
 */
function ensureHeaders(sheet) {
  const firstRow = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  
  // Check if first row is empty or doesn't match headers
  const isEmpty = firstRow.every(cell => !cell || cell === '');
  const matchesHeaders = firstRow.length === HEADERS.length && 
                         firstRow.every((cell, index) => cell === HEADERS[index]);
  
  if (isEmpty || !matchesHeaders) {
    // Set headers
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    
    // Format header row
    const headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#4285F4');
    headerRange.setFontColor('#FFFFFF');
    
    // Freeze header row
    sheet.setFrozenRows(1);
  }
}

/**
 * Test function - Run this manually to test the script
 */
function testSubmission() {
  const testData = {
    data: [
      'AOD_TEST_123',
      'Test User',
      'test@example.com',
      18,
      'Moderate',
      'Southeast',
      new Date().toISOString(),
      120,
      2, 3, 1, 2, 0,  // Nasal
      1, 2, 1, 0,     // Eye
      1, 0, 0, 0,     // Respiratory
      0, 0, 1, 0,     // Skin
      2, 1, 1,        // Throat
      'spring',
      '3_5yrs',
      '{"test": "data"}'
    ]
  };
  
  const mockEvent = {
    postData: {
      contents: JSON.stringify(testData)
    }
  };
  
  const result = doPost(mockEvent);
  Logger.log(result.getContent());
}


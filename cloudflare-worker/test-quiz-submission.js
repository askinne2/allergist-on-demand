/**
 * Test script for quiz submission to Cloudflare Worker
 * Run with: node test-quiz-submission.js
 * 
 * This allows testing the metafield integration without completing the full quiz
 */

const WORKER_URL = 'https://alledrops-quiz-worker.andrew-879.workers.dev';

// Example quiz submission data
const testData = {
  email: 'askinne2@gmail.com',
  symptom_profile_id: 'AOD_20251129_kodojp',
  quiz_score: 60,
  quiz_region: 'northwest',
  quiz_date: '2025-11-29T14:46:06.008Z',
  severity_level: 'severe'
};

// Additional test cases
const testCases = [
  {
    name: 'Severe symptoms (60 points)',
    data: {
      email: 'askinne2@gmail.com',
      symptom_profile_id: 'AOD_20251129_test001',
      quiz_score: 60,
      quiz_region: 'northwest',
      quiz_date: new Date().toISOString(),
      severity_level: 'severe'
    }
  },
  {
    name: 'Moderate symptoms (25 points)',
    data: {
      email: 'askinne2@gmail.com',
      symptom_profile_id: 'AOD_20251129_test002',
      quiz_score: 25,
      quiz_region: 'southeast',
      quiz_date: new Date().toISOString(),
      severity_level: 'moderate'
    }
  },
  {
    name: 'Mild symptoms (8 points)',
    data: {
      email: 'askinne2@gmail.com',
      symptom_profile_id: 'AOD_20251129_test003',
      quiz_score: 8,
      quiz_region: 'northeast',
      quiz_date: new Date().toISOString(),
      severity_level: 'mild'
    }
  },
  {
    name: 'Minimal symptoms (3 points)',
    data: {
      email: 'askinne2@gmail.com',
      symptom_profile_id: 'AOD_20251129_test004',
      quiz_score: 3,
      quiz_region: 'midwest',
      quiz_date: new Date().toISOString(),
      severity_level: 'minimal'
    }
  }
];

/**
 * Submit test data to Cloudflare Worker
 */
async function testSubmission(testCase) {
  try {
    console.log(`\n🧪 Testing: ${testCase.name}`);
    console.log('📤 Sending data:', JSON.stringify(testCase.data, null, 2));
    
    const response = await fetch(WORKER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://allergist-on-demand.myshopify.com'
      },
      body: JSON.stringify(testCase.data)
    });
    
    const result = await response.json();
    
    if (response.ok && result.success) {
      console.log('✅ Success!');
      console.log('📊 Response:', JSON.stringify(result, null, 2));
      if (result.historyCount) {
        console.log(`📚 Quiz history now contains ${result.historyCount} entries`);
      }
    } else {
      console.log('❌ Error:', JSON.stringify(result, null, 2));
    }
    
    return result;
  } catch (error) {
    console.error('❌ Request failed:', error.message);
    throw error;
  }
}

/**
 * Run all test cases
 */
async function runTests() {
  console.log('🚀 Starting quiz submission tests...');
  console.log(`📍 Worker URL: ${WORKER_URL}\n`);
  
  // Test single submission
  if (process.argv[2] === '--single') {
    await testSubmission({ name: 'Single test', data: testData });
    return;
  }
  
  // Run all test cases with delay between them
  for (let i = 0; i < testCases.length; i++) {
    await testSubmission(testCases[i]);
    
    // Wait 1 second between requests to avoid rate limiting
    if (i < testCases.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  console.log('\n✨ All tests completed!');
  console.log('\n💡 Check Shopify Admin → Customers → [Your Email] → Metafields');
  console.log('   You should see:');
  console.log('   - Latest quiz data (individual metafields)');
  console.log('   - quiz_history (JSON array with all quiz attempts)');
}

// Run tests
runTests().catch(error => {
  console.error('💥 Test suite failed:', error);
  process.exit(1);
});


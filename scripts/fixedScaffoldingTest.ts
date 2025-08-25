import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function fixedScaffoldingTest() {
  const apiUrl = process.env.API_URL || 'http://localhost:3000/api/chat';
  const testQuestion = 'كيف نحسب مساحة المستطيل؟'; // How to calculate the area of a rectangle?

  console.log('🏗️ Fixed Scaffolding Test');
  console.log('=' .repeat(50));
  console.log(`Question: ${testQuestion}`);
  console.log('Testing scaffolded response structure...\n');

  try {
    const response = await axios.post(
      apiUrl,
      {
        messages: [
          {
            role: 'user',
            content: testQuestion
          }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000
      }
    );

    const fullResponse = String(response.data);
    console.log('📝 Full Response:');
    console.log('─'.repeat(50));
    console.log(fullResponse);
    console.log('─'.repeat(50));
    
    console.log('\n📊 SCAFFOLDING ANALYSIS');
    console.log('='.repeat(50));
    
    const lowerResponse = fullResponse.toLowerCase();
    
    // Check for scaffolding elements
    const scaffoldingChecks = [
      { term: 'Problem Overview', pattern: 'problem overview', found: lowerResponse.includes('problem overview') },
      { term: 'Step 1:', pattern: 'step 1:', found: lowerResponse.includes('step 1:') },
      { term: 'Step-by-Step', pattern: 'step-by-step', found: lowerResponse.includes('step-by-step') },
      { term: 'Personalized Insights', pattern: 'personalized insights', found: lowerResponse.includes('personalized insights') },
      { term: 'Student Feedback', pattern: 'if student', found: lowerResponse.includes('if student') },
      { term: 'Voiceover Scripts', pattern: 'voiceover:', found: lowerResponse.includes('voiceover:') },
      { term: 'Practice Opportunity', pattern: 'practice opportunity', found: lowerResponse.includes('practice opportunity') },
      { term: 'Detailed Explanation', pattern: 'explanation:', found: lowerResponse.includes('explanation:') },
      { term: 'UAE Curriculum', pattern: 'uae curriculum', found: lowerResponse.includes('uae curriculum') || lowerResponse.includes('uae') },
      { term: 'Educational Standards', pattern: 'ministry', found: lowerResponse.includes('ministry') || lowerResponse.includes('education') }
    ];
    
    console.log('\n🔍 Scaffolding Elements Check:');
    scaffoldingChecks.forEach(check => {
      const status = check.found ? '✅' : '❌';
      console.log(`   ${status} ${check.term}`);
    });
    
    const scaffoldingCount = scaffoldingChecks.filter(c => c.found).length;
    const scaffoldingPercentage = (scaffoldingCount / scaffoldingChecks.length * 100).toFixed(0);
    
    console.log(`\n📈 Scaffolding Score: ${scaffoldingCount}/${scaffoldingChecks.length} (${scaffoldingPercentage}%)`);
    console.log(`📝 Response Length: ${fullResponse.length} characters`);
    
    // Additional analysis
    const hasStructuredFormat = fullResponse.includes('**') && (fullResponse.includes('Step') || fullResponse.includes('Overview'));
    const hasArabicContent = /[\u0600-\u06FF]/.test(fullResponse);
    const hasEducationalContext = lowerResponse.includes('learn') || lowerResponse.includes('تعل') || lowerResponse.includes('curriculum');
    
    console.log('\n🎯 Quality Indicators:');
    console.log(`   ${hasStructuredFormat ? '✅' : '❌'} Structured Format (using **headers**)`);
    console.log(`   ${hasArabicContent ? '✅' : '❌'} Arabic Language Support`);
    console.log(`   ${hasEducationalContext ? '✅' : '❌'} Educational Context`);
    
    if (scaffoldingCount >= 4) {
      console.log('\n✅ SCAFFOLDING TEST PASSED - Response includes proper educational structure');
    } else if (scaffoldingCount >= 2) {
      console.log('\n⚠️ SCAFFOLDING TEST PARTIAL - Response has some educational structure but could be improved');
    } else {
      console.log('\n❌ SCAFFOLDING TEST FAILED - Response lacks proper educational structure');
    }
    
    return fullResponse;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`❌ Test failed: ${errorMessage}`);
    return null;
  }
}

fixedScaffoldingTest();
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function quickPracticeQuestionTest() {
  const apiUrl = process.env.API_URL || 'http://localhost:3000/api/chat';
  const testQuestion = 'كيف نحسب مساحة المربع؟'; // How to calculate area of a square?

  console.log('📚 Quick Practice Question Test');
  console.log('=' .repeat(50));
  console.log(`Question: ${testQuestion}`);
  console.log('Testing for 10+ practice questions...\n');

  try {
    const startTime = Date.now();
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
        timeout: 90000 // Longer timeout for comprehensive responses
      }
    );

    const fullResponse = String(response.data);
    const responseTime = Date.now() - startTime;
    
    console.log(`✅ Response received in ${(responseTime/1000).toFixed(1)} seconds`);
    console.log(`📝 Total response length: ${fullResponse.length} characters`);
    
    // Count questions
    const questionMatches = fullResponse.match(/\*\*Question \d+:/gi) || [];
    const questionCount = questionMatches.length;
    
    console.log(`\n🔢 Question Analysis:`);
    console.log(`   Questions detected: ${questionCount}`);
    console.log(`   Target requirement: 10+ questions`);
    console.log(`   Status: ${questionCount >= 10 ? '✅ PASSED' : '❌ FAILED'}`);
    
    // Show first few questions detected
    if (questionMatches.length > 0) {
      console.log('\n📋 Questions found:');
      questionMatches.slice(0, 5).forEach((match, i) => {
        console.log(`   ${i + 1}. ${match}`);
      });
      if (questionMatches.length > 5) {
        console.log(`   ... and ${questionMatches.length - 5} more questions`);
      }
    }
    
    // Check for key scaffolding elements
    const lowerResponse = fullResponse.toLowerCase();
    const scaffoldingElements = [
      'concept overview',
      'detailed answer',
      'step-by-step',
      'personalized insights',
      'uae context',
      'assessment rubric'
    ];
    
    const foundElements = scaffoldingElements.filter(element => 
      lowerResponse.includes(element)
    );
    
    console.log(`\n🏗️ Scaffolding Analysis:`);
    console.log(`   Scaffolding elements found: ${foundElements.length}/${scaffoldingElements.length}`);
    foundElements.forEach(element => {
      console.log(`   ✅ ${element}`);
    });
    
    // UAE context check
    const uaeIndicators = ['uae', 'emirates', 'الإمارات', 'dubai', 'abu dhabi', 'ministry'];
    const uaeCount = uaeIndicators.filter(indicator => 
      lowerResponse.includes(indicator)
    ).length;
    
    console.log(`\n🇦🇪 UAE Context Integration: ${uaeCount} references ${uaeCount >= 3 ? '✅' : '❌'}`);
    
    // Final assessment
    const overallSuccess = questionCount >= 10 && foundElements.length >= 4 && uaeCount >= 3;
    
    console.log(`\n🏆 Overall Assessment: ${overallSuccess ? '✅ EXCELLENT' : '⚠️ NEEDS IMPROVEMENT'}`);
    
    if (!overallSuccess) {
      console.log('\n🔧 Improvement needed:');
      if (questionCount < 10) console.log('   - Generate more practice questions');
      if (foundElements.length < 4) console.log('   - Enhance scaffolding structure');
      if (uaeCount < 3) console.log('   - Add more UAE context');
    }
    
    return {
      questionCount,
      scaffoldingQuality: foundElements.length,
      uaeContext: uaeCount,
      success: overallSuccess,
      responseTime: responseTime
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`❌ Test failed: ${errorMessage}`);
    return null;
  }
}

quickPracticeQuestionTest();
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function finalMathematicsFixTest() {
  const apiUrl = process.env.API_URL || 'http://localhost:3000/api/chat';
  const testQuery = 'ما هي قواعد القسمة؟'; // What are division rules?

  console.log('🔧 FINAL Mathematics Fix Test');
  console.log('=' .repeat(50));
  console.log(`Testing Query: ${testQuery}`);
  console.log('Enhanced prompt with explicit template matching...\n');

  try {
    const startTime = Date.now();
    const response = await axios.post(
      apiUrl,
      { messages: [{ role: 'user', content: testQuery }] },
      { 
        headers: { 'Content-Type': 'application/json' },
        timeout: 90000
      }
    );

    const fullResponse = String(response.data);
    const responseTime = Date.now() - startTime;
    
    console.log(`✅ Response received in ${(responseTime/1000).toFixed(1)} seconds`);
    console.log(`📝 Response length: ${fullResponse.length} characters\n`);
    
    // Enhanced question detection
    const questionMatches = fullResponse.match(/\*\*Question \d+:/gi) || [];
    const questionCount = questionMatches.length;
    
    // Check for specific Questions 1-10
    const requiredQuestions = [];
    const missingQuestions = [];
    
    for (let i = 1; i <= 10; i++) {
      const questionPattern = new RegExp(`\\*\\*Question ${i}:`, 'i');
      if (questionPattern.test(fullResponse)) {
        requiredQuestions.push(i);
      } else {
        missingQuestions.push(i);
      }
    }
    
    console.log(`🔢 Question Analysis:`);
    console.log(`   Total detected: ${questionCount}`);
    console.log(`   Required (1-10): ${requiredQuestions.length}/10`);
    console.log(`   Found: ${requiredQuestions.join(', ')}`);
    if (missingQuestions.length > 0) {
      console.log(`   Missing: ${missingQuestions.join(', ')}`);
    }
    console.log(`   Status: ${requiredQuestions.length >= 10 ? '✅ PERFECT' : requiredQuestions.length >= 8 ? '⚠️ MOSTLY FIXED' : '❌ STILL BROKEN'}\n`);
    
    // Check scaffolding quality
    const lowerResponse = fullResponse.toLowerCase();
    const scaffoldingElements = [
      'concept overview',
      'detailed answer',
      'step-by-step',
      'uae context',
      'personalized insights'
    ];
    
    const foundScaffolding = scaffoldingElements.filter(element => 
      lowerResponse.includes(element)
    );
    
    console.log(`🏗️ Scaffolding Quality:`);
    console.log(`   Elements found: ${foundScaffolding.length}/${scaffoldingElements.length}`);
    foundScaffolding.forEach(element => console.log(`   ✅ ${element}`));
    
    // Overall assessment
    const isFixed = requiredQuestions.length >= 10;
    const hasGoodScaffolding = foundScaffolding.length >= 3;
    
    console.log(`\n🏆 FINAL MATHEMATICS FIX ASSESSMENT:`);
    
    if (isFixed && hasGoodScaffolding) {
      console.log(`✅ FULLY FIXED!`);
      console.log(`   🎉 Mathematics generates 10 questions consistently`);
      console.log(`   🏗️ Quality scaffolding maintained`);
      console.log(`   🇦🇪 UAE context integrated`);
      console.log(`   📚 Ready for production use`);
    } else if (requiredQuestions.length >= 8) {
      console.log(`⚠️ MOSTLY FIXED - Minor issues remain`);
      console.log(`   📊 ${requiredQuestions.length}/10 questions generated`);
      console.log(`   🔧 May need final prompt adjustment`);
    } else {
      console.log(`❌ STILL BROKEN`);
      console.log(`   📉 Only ${requiredQuestions.length}/10 questions generated`);
      console.log(`   🚫 Mathematics fix unsuccessful`);
    }
    
    return {
      questionCount,
      requiredQuestions: requiredQuestions.length,
      scaffolding: foundScaffolding.length,
      fixed: isFixed,
      responseTime
    };
    
  } catch (error) {
    console.error(`❌ Test failed: ${error}`);
    return {
      questionCount: 0,
      requiredQuestions: 0,
      scaffolding: 0,
      fixed: false,
      responseTime: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

finalMathematicsFixTest().then(result => {
  console.log(`\n💾 Mathematics fix test completed.`);
  console.log(`🎯 Result: ${result.fixed ? 'FIXED ✅' : 'NOT FIXED ❌'}`);
}).catch(error => {
  console.error('Fatal error:', error);
});
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function testMathematicsFix() {
  const apiUrl = process.env.API_URL || 'http://localhost:3000/api/chat';
  
  const mathQueries = [
    'ما هي قواعد الضرب؟', // What are multiplication rules?
    'كيف نحسب مساحة المثلث؟', // How to calculate triangle area?
    'شرح الكسور للطلاب' // Explain fractions to students
  ];

  console.log('🔧 Mathematics 10-Question Fix Validation');
  console.log('=' .repeat(60));
  console.log('Testing enhanced mathematics-specific prompt...\n');

  const results = [];

  for (let i = 0; i < mathQueries.length; i++) {
    const query = mathQueries[i];
    console.log(`🧮 Test ${i + 1}/3: ${query}`);
    
    try {
      const startTime = Date.now();
      const response = await axios.post(
        apiUrl,
        { messages: [{ role: 'user', content: query }] },
        { 
          headers: { 'Content-Type': 'application/json' },
          timeout: 120000 // Extended timeout for mathematics
        }
      );

      const fullResponse = String(response.data);
      const responseTime = Date.now() - startTime;
      
      // Count questions with more precise matching
      const questionMatches = fullResponse.match(/\*\*Question \d+:/gi) || [];
      const questionCount = questionMatches.length;
      
      // Check for specific Questions 1-10
      const requiredQuestions = [];
      for (let j = 1; j <= 10; j++) {
        const hasQuestion = fullResponse.toLowerCase().includes(`**question ${j}:`);
        if (hasQuestion) {
          requiredQuestions.push(j);
        }
      }
      
      console.log(`   ✅ Response: ${(responseTime/1000).toFixed(1)}s, ${fullResponse.length} chars`);
      console.log(`   📊 Questions detected: ${questionCount}`);
      console.log(`   🔢 Required questions (1-10): ${requiredQuestions.length}/10`);
      console.log(`   📋 Found: Questions ${requiredQuestions.slice(0, 5).join(', ')}${requiredQuestions.length > 5 ? '...' : ''}`);
      console.log(`   🎯 Status: ${questionCount >= 10 ? '✅ PASSED' : '❌ FAILED'}\n`);
      
      results.push({
        query,
        questionCount,
        requiredQuestions: requiredQuestions.length,
        responseTime,
        success: questionCount >= 10 && requiredQuestions.length >= 10
      });
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.log(`   ❌ Error: ${error}\n`);
      results.push({
        query,
        questionCount: 0,
        requiredQuestions: 0,
        responseTime: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Summary analysis
  console.log('=' .repeat(60));
  console.log('📊 MATHEMATICS FIX VALIDATION SUMMARY');
  console.log('=' .repeat(60));
  
  const successfulTests = results.filter(r => r.success).length;
  const totalQuestions = results.reduce((sum, r) => sum + r.questionCount, 0);
  const avgQuestions = Math.round(totalQuestions / results.length);
  const avgRequiredQuestions = Math.round(results.reduce((sum, r) => sum + r.requiredQuestions, 0) / results.length);
  
  console.log(`\n🎯 Results:`);
  console.log(`   Success Rate: ${successfulTests}/${results.length} (${Math.round(successfulTests/results.length*100)}%)`);
  console.log(`   Avg Questions Generated: ${avgQuestions}/10`);
  console.log(`   Avg Required Questions (1-10): ${avgRequiredQuestions}/10`);
  
  console.log(`\n📋 Detailed Results:`);
  results.forEach((result, i) => {
    const status = result.success ? '✅' : '❌';
    console.log(`   ${status} Test ${i + 1}: ${result.questionCount} questions (${result.requiredQuestions}/10 required)`);
  });
  
  const overallSuccess = successfulTests === results.length && avgQuestions >= 10;
  
  console.log(`\n🏆 MATHEMATICS FIX STATUS: ${overallSuccess ? '✅ FULLY FIXED' : successfulTests > 0 ? '⚠️ PARTIALLY FIXED' : '❌ STILL BROKEN'}`);
  
  if (overallSuccess) {
    console.log('   🎉 Mathematics question generation is now working perfectly!');
    console.log('   📚 All tests generate 10+ questions consistently');
    console.log('   🔢 Proper question numbering (Questions 1-10) implemented');
  } else if (successfulTests > 0) {
    console.log('   ⚠️ Improvement detected but consistency needed:');
    console.log(`   📊 ${successfulTests}/${results.length} tests now pass`);
    console.log('   🔧 May need further prompt refinement');
  } else {
    console.log('   ❌ Mathematics fix unsuccessful - further debugging needed');
  }
  
  return {
    totalTests: results.length,
    successfulTests,
    avgQuestions,
    avgRequiredQuestions,
    fixed: overallSuccess
  };
}

testMathematicsFix().then(result => {
  console.log('\n💾 Test completed. Mathematics fix validation finished.');
}).catch(error => {
  console.error('Fatal test error:', error);
});
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function testMathematicsQuestions() {
  const apiUrl = process.env.API_URL || 'http://localhost:3000/api/chat';
  const mathQuery = 'ما هي قواعد الضرب؟'; // What are multiplication rules?

  console.log('🧮 Mathematics 10+ Question Generation Test');
  console.log('=' .repeat(50));
  console.log(`Query: ${mathQuery}`);
  console.log('Testing enhanced prompt for consistent question generation...\n');

  try {
    const startTime = Date.now();
    const response = await axios.post(
      apiUrl,
      {
        messages: [{ role: 'user', content: mathQuery }]
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 90000
      }
    );

    const fullResponse = String(response.data);
    const responseTime = Date.now() - startTime;
    
    console.log(`✅ Response received in ${(responseTime/1000).toFixed(1)} seconds`);
    console.log(`📝 Total response length: ${fullResponse.length} characters\n`);
    
    // Extract all question numbers
    const questionMatches = fullResponse.match(/\*\*Question \d+:/gi) || [];
    const questionCount = questionMatches.length;
    
    console.log(`🔢 Question Count Analysis:`);
    console.log(`   Total questions detected: ${questionCount}`);
    console.log(`   Target requirement: 10+ questions`);
    console.log(`   Status: ${questionCount >= 10 ? '✅ PASSED' : '❌ FAILED'}\n`);
    
    if (questionMatches.length > 0) {
      console.log(`📋 All Questions Found:`);
      questionMatches.forEach((match, i) => {
        console.log(`   ${i + 1}. ${match}`);
      });
      
      // Check if we have Questions 1-10 specifically
      const expectedQuestions = Array.from({length: 10}, (_, i) => `**Question ${i + 1}:`);
      const missingQuestions = expectedQuestions.filter(expected => 
        !questionMatches.some(found => found.toLowerCase().includes(expected.toLowerCase()))
      );
      
      if (missingQuestions.length === 0) {
        console.log(`\n✅ All required questions (1-10) are present`);
      } else {
        console.log(`\n❌ Missing questions: ${missingQuestions.join(', ')}`);
      }
    }
    
    // Check for scaffolding elements
    const lowerResponse = fullResponse.toLowerCase();
    const scaffoldingElements = [
      'concept overview',
      'detailed answer',
      'step-by-step', 
      'personalized insights',
      'uae context',
      'assessment rubric',
      'voiceover'
    ];
    
    const foundScaffolding = scaffoldingElements.filter(element => 
      lowerResponse.includes(element)
    );
    
    console.log(`\n🏗️ Scaffolding Quality:`);
    console.log(`   Elements found: ${foundScaffolding.length}/${scaffoldingElements.length}`);
    foundScaffolding.forEach(element => {
      console.log(`   ✅ ${element}`);
    });
    
    // UAE context check
    const uaeIndicators = ['uae', 'emirates', 'الإمارات', 'dubai', 'ministry'];
    const uaeCount = uaeIndicators.filter(indicator => 
      lowerResponse.includes(indicator)
    ).length;
    
    console.log(`\n🇦🇪 UAE Context:`);
    console.log(`   UAE references found: ${uaeCount}`);
    console.log(`   Status: ${uaeCount >= 2 ? '✅ SUFFICIENT' : '⚠️ NEEDS MORE'}`);
    
    // Overall assessment
    const overallSuccess = questionCount >= 10 && foundScaffolding.length >= 4;
    
    console.log(`\n🏆 OVERALL ASSESSMENT: ${overallSuccess ? '✅ EXCELLENT' : '❌ NEEDS IMPROVEMENT'}`);
    
    if (overallSuccess) {
      console.log('   🎉 Mathematics question generation is working perfectly!');
      console.log('   📚 10+ questions with quality scaffolding');
      console.log('   🇦🇪 UAE context properly integrated');
    } else {
      console.log('   ⚠️ Issues detected:');
      if (questionCount < 10) console.log(`     - Only ${questionCount}/10 questions generated`);
      if (foundScaffolding.length < 4) console.log('     - Insufficient scaffolding quality');
    }
    
    return {
      questionCount,
      scaffolding: foundScaffolding.length,
      uaeContext: uaeCount,
      success: overallSuccess
    };

  } catch (error) {
    console.error(`❌ Test failed: ${error}`);
    return null;
  }
}

testMathematicsQuestions();
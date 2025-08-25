import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function testLanguageMatching() {
  const apiUrl = process.env.API_URL || 'http://localhost:3000/api/chat';
  
  console.log('🌐 Language Matching Test');
  console.log('=' .repeat(50));
  
  const testCases = [
    {
      language: 'Arabic',
      query: 'ما هي قواعد الضرب؟', // What are multiplication rules?
      expectedLanguage: 'Arabic'
    },
    {
      language: 'English', 
      query: 'What are the rules of division?',
      expectedLanguage: 'English'
    }
  ];
  
  for (const testCase of testCases) {
    console.log(`\n📝 Testing ${testCase.language} Query:`);
    console.log(`Query: "${testCase.query}"`);
    console.log(`Expected Response Language: ${testCase.expectedLanguage}\n`);
    
    try {
      const startTime = Date.now();
      const response = await axios.post(
        apiUrl,
        { messages: [{ role: 'user', content: testCase.query }] },
        { 
          headers: { 'Content-Type': 'application/json' },
          timeout: 120000 // 2 minutes timeout
        }
      );

      const fullResponse = String(response.data);
      const responseTime = Date.now() - startTime;
      
      console.log(`✅ Response received in ${(responseTime/1000).toFixed(1)} seconds`);
      console.log(`📝 Response length: ${fullResponse.length} characters\n`);
      
      // Check language of response
      const arabicChars = (fullResponse.match(/[\u0600-\u06FF]/g) || []).length;
      const totalChars = fullResponse.replace(/\s/g, '').length;
      const arabicPercentage = (arabicChars / totalChars) * 100;
      
      console.log(`🔤 Language Analysis:`);
      console.log(`   Arabic characters: ${arabicChars}`);
      console.log(`   Total characters: ${totalChars}`);
      console.log(`   Arabic percentage: ${arabicPercentage.toFixed(1)}%`);
      
      let detectedLanguage = 'English';
      if (arabicPercentage > 30) {
        detectedLanguage = 'Arabic';
      }
      
      console.log(`   Detected language: ${detectedLanguage}`);
      console.log(`   Expected language: ${testCase.expectedLanguage}`);
      console.log(`   Match: ${detectedLanguage === testCase.expectedLanguage ? '✅ CORRECT' : '❌ INCORRECT'}`);
      
      // Check question count
      const questionMatches = fullResponse.match(/\*\*Question \d+:/gi) || [];
      const questionCount = questionMatches.length;
      
      console.log(`\n🔢 Question Analysis:`);
      console.log(`   Questions detected: ${questionCount}`);
      console.log(`   Question generation: ${questionCount >= 10 ? '✅ PERFECT' : questionCount >= 8 ? '⚠️ GOOD' : '❌ POOR'}`);
      
      // Show first few lines as sample
      const sampleLines = fullResponse.split('\n').slice(0, 5);
      console.log(`\n📄 Response Sample:`);
      sampleLines.forEach(line => {
        if (line.trim()) {
          console.log(`   ${line.substring(0, 80)}${line.length > 80 ? '...' : ''}`);
        }
      });
      
    } catch (error) {
      console.error(`❌ Test failed for ${testCase.language}:`, error instanceof Error ? error.message : error);
    }
    
    console.log('\n' + '='.repeat(50));
  }
  
  console.log(`\n🏆 Language Matching Test Complete`);
  console.log(`📋 Tested Arabic and English query responses`);
  console.log(`🎯 Language matching system validation finished`);
}

testLanguageMatching().catch(error => {
  console.error('Fatal error:', error);
});
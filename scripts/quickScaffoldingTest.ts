import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function quickScaffoldingTest() {
  const apiUrl = process.env.API_URL || 'http://localhost:3000/api/chat';
  const testQuestion = 'كيف نحسب مساحة المستطيل؟'; // How to calculate the area of a rectangle?

  console.log('🏗️ Quick Scaffolding Test');
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
        timeout: 30000,
        responseType: 'stream'
      }
    );

    let fullResponse = '';
    
    return new Promise((resolve, reject) => {
      response.data.on('data', (chunk: Buffer) => {
        const text = chunk.toString();
        const lines = text.split('\n');
        for (const line of lines) {
          if (line.startsWith('0:')) {
            const content = line.substring(2).replace(/"/g, '');
            if (content && content !== '\n') {
              fullResponse += content;
              process.stdout.write(content); // Live output
            }
          }
        }
      });

      response.data.on('end', () => {
        console.log('\n\n' + '='.repeat(50));
        console.log('📊 SCAFFOLDING ANALYSIS');
        console.log('='.repeat(50));
        
        const lowerResponse = fullResponse.toLowerCase();
        
        // Check for scaffolding elements
        const scaffoldingChecks = [
          { term: 'problem overview', found: lowerResponse.includes('problem overview') },
          { term: 'step 1:', found: lowerResponse.includes('step 1:') },
          { term: 'step-by-step', found: lowerResponse.includes('step-by-step') },
          { term: 'personalized insights', found: lowerResponse.includes('personalized insights') },
          { term: 'if student answers correctly', found: lowerResponse.includes('if student answers correctly') },
          { term: 'voiceover:', found: lowerResponse.includes('voiceover:') },
          { term: 'practice opportunity', found: lowerResponse.includes('practice opportunity') },
          { term: 'explanation:', found: lowerResponse.includes('explanation:') },
          { term: 'uae curriculum', found: lowerResponse.includes('uae curriculum') },
          { term: 'ministry of education', found: lowerResponse.includes('ministry of education') }
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
        
        if (scaffoldingCount >= 3) {
          console.log('✅ SCAFFOLDING TEST PASSED - Response includes proper educational structure');
        } else {
          console.log('❌ SCAFFOLDING TEST FAILED - Response lacks proper educational structure');
        }
        
        resolve(fullResponse);
      });

      response.data.on('error', (error: Error) => {
        console.error(`❌ Stream error: ${error.message}`);
        reject(error);
      });
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`❌ Test failed: ${errorMessage}`);
    return null;
  }
}

quickScaffoldingTest();
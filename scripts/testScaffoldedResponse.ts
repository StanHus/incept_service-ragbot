import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

class ScaffoldingTester {
  private apiUrl: string;

  constructor() {
    this.apiUrl = process.env.API_URL || 'http://localhost:3000/api/chat';
  }

  private getScaffoldingTestQuestions() {
    return [
      {
        category: 'Mathematics - Grade 6',
        question: 'كيف نحسب مساحة المستطيل؟',
        language: 'arabic',
        expectedScaffolding: ['Step-by-Step', 'Problem Overview', 'Personalized Insights', 'Voiceover']
      },
      {
        category: 'Science - Grade 8', 
        question: 'What are the main parts of a plant cell according to UAE curriculum?',
        language: 'english',
        expectedScaffolding: ['Step-by-Step', 'Problem Overview', 'Personalized Insights', 'Practice Opportunity']
      },
      {
        category: 'Islamic Education - Grade 5',
        question: 'ما هي أركان الإسلام الخمسة؟',
        language: 'arabic',
        expectedScaffolding: ['Step-by-Step', 'Problem Overview', 'UAE context', 'Voiceover']
      }
    ];
  }

  async testScaffoldedQuestion(question: any): Promise<{
    question: any;
    response: string;
    responseTime: number;
    hasScaffolding: boolean;
    scaffoldingElements: string[];
    success: boolean;
    error?: string;
  }> {
    const startTime = Date.now();
    
    try {
      console.log(`\n🏗️ Testing Scaffolded Response: ${question.category}`);
      console.log(`❓ Question: ${question.question}`);
      
      const response = await axios.post(
        this.apiUrl,
        {
          messages: [
            {
              role: 'user',
              content: question.question
            }
          ]
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 45000,
          responseType: 'stream'
        }
      );

      // Collect streamed response
      let fullResponse = '';
      return new Promise((resolve) => {
        response.data.on('data', (chunk: Buffer) => {
          const text = chunk.toString();
          const lines = text.split('\n');
          for (const line of lines) {
            if (line.startsWith('0:')) {
              const content = line.substring(2).replace(/"/g, '');
              if (content && content !== '\n') {
                fullResponse += content;
              }
            }
          }
        });

        response.data.on('end', () => {
          const responseTime = Date.now() - startTime;
          
          // Analyze scaffolding structure
          const lowerResponse = fullResponse.toLowerCase();
          let scaffoldingElements: string[] = [];
          
          // Check for scaffolding indicators
          const scaffoldingIndicators = [
            { term: 'problem overview', label: 'Problem Overview' },
            { term: 'step 1:', label: 'Step-by-Step Solution' },
            { term: 'step-by-step', label: 'Step-by-Step Structure' },
            { term: 'personalized insights', label: 'Personalized Insights' },
            { term: 'if student answers correctly', label: 'Differentiated Feedback' },
            { term: 'voiceover:', label: 'Voiceover Script' },
            { term: 'practice opportunity', label: 'Practice Opportunity' },
            { term: 'explanation:', label: 'Detailed Explanations' },
            { term: 'uae curriculum', label: 'UAE Curriculum Reference' },
            { term: 'ministry of education', label: 'MOE Reference' }
          ];
          
          scaffoldingIndicators.forEach(indicator => {
            if (lowerResponse.includes(indicator.term)) {
              scaffoldingElements.push(indicator.label);
            }
          });
          
          const hasScaffolding = scaffoldingElements.length >= 3; // At least 3 scaffolding elements
          
          console.log(`✅ Response received (${responseTime}ms)`);
          console.log(`🏗️ Scaffolding Elements Found: ${scaffoldingElements.length}`);
          console.log(`📋 Elements: ${scaffoldingElements.join(', ')}`);
          console.log(`📝 Response Preview: ${fullResponse.substring(0, 200)}...`);
          
          const result = {
            question,
            response: fullResponse,
            responseTime,
            hasScaffolding,
            scaffoldingElements,
            success: true
          };
          
          resolve(result);
        });

        response.data.on('error', (error: Error) => {
          const responseTime = Date.now() - startTime;
          console.error(`❌ Stream error: ${error.message}`);
          
          resolve({
            question,
            response: '',
            responseTime,
            hasScaffolding: false,
            scaffoldingElements: [],
            success: false,
            error: error.message
          });
        });
      });

    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Error: ${errorMessage}`);
      
      return {
        question,
        response: '',
        responseTime,
        hasScaffolding: false,
        scaffoldingElements: [],
        success: false,
        error: errorMessage
      };
    }
  }

  async runScaffoldingTests() {
    const questions = this.getScaffoldingTestQuestions();
    console.log(`\n🏗️ Starting Scaffolded Response Testing with ${questions.length} questions`);
    console.log('=' .repeat(80));

    const results: any[] = [];

    for (const question of questions) {
      const result = await this.testScaffoldedQuestion(question);
      results.push(result);
      
      // Add delay between questions
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    // Analyze results
    console.log('\n' + '='.repeat(80));
    console.log('🏗️ SCAFFOLDED RESPONSE TEST ANALYSIS');
    console.log('='.repeat(80));

    const successfulTests = results.filter(r => r.success).length;
    const scaffoldedTests = results.filter(r => r.hasScaffolding).length;
    const avgScaffoldingElements = results.reduce((sum, r) => sum + r.scaffoldingElements.length, 0) / results.length;
    const avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;

    console.log('\n📊 Scaffolding Analysis:');
    console.log(`   Total Tests: ${results.length}`);
    console.log(`   ✅ Successful: ${successfulTests} (${(successfulTests/results.length*100).toFixed(1)}%)`);
    console.log(`   🏗️ Properly Scaffolded: ${scaffoldedTests} (${(scaffoldedTests/results.length*100).toFixed(1)}%)`);
    console.log(`   📈 Avg Scaffolding Elements: ${avgScaffoldingElements.toFixed(1)}`);
    console.log(`   ⏱️  Avg Response Time: ${avgResponseTime.toFixed(0)}ms`);

    // Element breakdown
    console.log('\n🔧 Scaffolding Elements Usage:');
    const elementCounts: Record<string, number> = {};
    results.forEach(r => {
      r.scaffoldingElements.forEach((element: string) => {
        elementCounts[element] = (elementCounts[element] || 0) + 1;
      });
    });

    Object.entries(elementCounts)
      .sort(([,a], [,b]) => b - a)
      .forEach(([element, count]) => {
        console.log(`   ${element}: ${count}/${results.length} (${(count/results.length*100).toFixed(0)}%)`);
      });

    // Language analysis
    console.log('\n🌐 Language Performance:');
    const langStats: Record<string, any> = {};
    results.forEach(r => {
      const lang = r.question.language;
      if (!langStats[lang]) {
        langStats[lang] = { total: 0, scaffolded: 0, avgElements: 0 };
      }
      langStats[lang].total++;
      if (r.hasScaffolding) langStats[lang].scaffolded++;
      langStats[lang].avgElements += r.scaffoldingElements.length;
    });

    Object.entries(langStats).forEach(([lang, stats]) => {
      stats.avgElements = stats.avgElements / stats.total;
      const langName = lang === 'arabic' ? 'Arabic' : 'English';
      console.log(`   ${langName}: ${stats.scaffolded}/${stats.total} scaffolded (${stats.avgElements.toFixed(1)} avg elements)`);
    });

    return results;
  }
}

async function main() {
  const tester = new ScaffoldingTester();
  
  try {
    const results = await tester.runScaffoldingTests();
    
    // Save results
    const fs = require('fs');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `scaffolding_test_results_${timestamp}.json`;
    
    fs.writeFileSync(filename, JSON.stringify({
      timestamp: new Date().toISOString(),
      testType: 'Scaffolded Response Test',
      summary: {
        total: results.length,
        successful: results.filter((r: any) => r.success).length,
        properlyScaffolded: results.filter((r: any) => r.hasScaffolding).length
      },
      results: results
    }, null, 2));
    
    console.log(`\n💾 Scaffolding test results saved to: ${filename}`);
    
  } catch (error) {
    console.error('Fatal error:', error);
  }
}

main().catch(console.error);
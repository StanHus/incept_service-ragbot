import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

interface PracticeQuestionTest {
  category: string;
  query: string;
  language: 'ar' | 'en';
  expectedElements: string[];
  minQuestions: number;
}

class ComprehensivePracticeQuestionTester {
  private apiUrl: string;

  constructor() {
    this.apiUrl = process.env.API_URL || 'http://localhost:3000/api/chat';
  }

  private getTestQueries(): PracticeQuestionTest[] {
    return [
      {
        category: 'Mathematics - Geometry',
        query: 'كيف نحسب مساحة المستطيل؟', // How to calculate rectangle area
        language: 'ar',
        expectedElements: ['Concept Overview', 'Practice Questions Set', 'Question', 'Detailed Answer', 'UAE Context'],
        minQuestions: 10
      },
      {
        category: 'Science - Physics', 
        query: 'What is Newton\'s first law of motion according to UAE curriculum?',
        language: 'en',
        expectedElements: ['Concept Overview', 'Practice Questions Set', 'Question', 'Step-by-Step Solution', 'Assessment Rubric'],
        minQuestions: 10
      },
      {
        category: 'Islamic Education',
        query: 'ما هي أركان الإسلام الخمسة؟', // What are the five pillars of Islam
        language: 'ar',
        expectedElements: ['Practice Questions Set', 'UAE Context', 'Personalized Insights', 'Additional Practice Extensions'],
        minQuestions: 10
      }
    ];
  }

  async testComprehensiveQuestions(test: PracticeQuestionTest): Promise<{
    test: PracticeQuestionTest;
    response: string;
    responseTime: number;
    questionCount: number;
    hasRequiredElements: boolean;
    scaffoldingQuality: number;
    success: boolean;
    analysis: any;
    error?: string;
  }> {
    const startTime = Date.now();
    
    try {
      console.log(`\n📚 Testing Comprehensive Practice Questions: ${test.category}`);
      console.log(`❓ Query: ${test.query}`);
      console.log(`🎯 Expected: ${test.minQuestions}+ questions with detailed scaffolding`);
      
      const response = await axios.post(
        this.apiUrl,
        {
          messages: [
            {
              role: 'user',
              content: test.query
            }
          ]
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 120000, // Longer timeout for comprehensive responses
        }
      );

      const fullResponse = String(response.data);
      const responseTime = Date.now() - startTime;
      
      console.log(`✅ Response received (${responseTime}ms)`);
      console.log(`📝 Response length: ${fullResponse.length} characters`);
      
      // Analyze question count
      const questionMatches = fullResponse.match(/\*\*Question \d+:/gi) || [];
      const questionCount = questionMatches.length;
      
      console.log(`🔢 Questions detected: ${questionCount}`);
      
      // Check for required elements
      const lowerResponse = fullResponse.toLowerCase();
      let elementCount = 0;
      const foundElements: string[] = [];
      
      test.expectedElements.forEach(element => {
        if (lowerResponse.includes(element.toLowerCase())) {
          elementCount++;
          foundElements.push(element);
        }
      });
      
      const hasRequiredElements = elementCount >= (test.expectedElements.length * 0.7); // 70% of required elements
      
      // Analyze scaffolding quality for questions
      const scaffoldingIndicators = [
        'detailed answer',
        'step-by-step',
        'explanation:',
        'voiceover:',
        'personalized insights',
        'uae context',
        'problem overview',
        'if student answers correctly',
        'assessment rubric',
        'additional practice'
      ];
      
      let scaffoldingCount = 0;
      scaffoldingIndicators.forEach(indicator => {
        if (lowerResponse.includes(indicator)) {
          scaffoldingCount++;
        }
      });
      
      const scaffoldingQuality = (scaffoldingCount / scaffoldingIndicators.length) * 100;
      
      // UAE context analysis
      const uaeIndicators = ['dubai', 'abu dhabi', 'uae', 'emirates', 'الإمارات', 'دبي', 'أبوظبي'];
      const uaeContextCount = uaeIndicators.filter(indicator => 
        lowerResponse.includes(indicator)
      ).length;
      
      // Difficulty progression analysis
      const difficultyLevels = ['easy', 'medium', 'challenging', 'سهل', 'متوسط', 'صعب'];
      const difficultyProgression = difficultyLevels.filter(level => 
        lowerResponse.includes(level)
      ).length;
      
      const analysis = {
        questionCount,
        hasRequiredElements,
        scaffoldingQuality: Math.round(scaffoldingQuality),
        foundElements,
        uaeContextIntegration: uaeContextCount,
        difficultyProgression,
        meetsMinimumQuestions: questionCount >= test.minQuestions,
        avgQuestionLength: fullResponse.length / Math.max(questionCount, 1)
      };
      
      console.log(`\n🎯 Analysis Results:`);
      console.log(`   Questions: ${questionCount}/${test.minQuestions} (${questionCount >= test.minQuestions ? '✅' : '❌'})`);
      console.log(`   Required Elements: ${elementCount}/${test.expectedElements.length} (${hasRequiredElements ? '✅' : '❌'})`);
      console.log(`   Scaffolding Quality: ${Math.round(scaffoldingQuality)}% (${scaffoldingQuality >= 60 ? '✅' : '❌'})`);
      console.log(`   UAE Context Integration: ${uaeContextCount} references (${uaeContextCount >= 3 ? '✅' : '❌'})`);
      console.log(`   Difficulty Progression: ${difficultyProgression > 0 ? '✅' : '❌'}`);
      
      const success = questionCount >= test.minQuestions && 
                     hasRequiredElements && 
                     scaffoldingQuality >= 60;
      
      if (success) {
        console.log(`🏆 TEST PASSED - Comprehensive practice questions generated successfully`);
      } else {
        console.log(`❌ TEST FAILED - Requirements not fully met`);
      }
      
      return {
        test,
        response: fullResponse,
        responseTime,
        questionCount,
        hasRequiredElements,
        scaffoldingQuality: Math.round(scaffoldingQuality),
        success,
        analysis
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Error: ${errorMessage}`);
      
      return {
        test,
        response: '',
        responseTime,
        questionCount: 0,
        hasRequiredElements: false,
        scaffoldingQuality: 0,
        success: false,
        analysis: {},
        error: errorMessage
      };
    }
  }

  async runComprehensiveTests() {
    const tests = this.getTestQueries();
    console.log(`\n📚 Starting Comprehensive Practice Question Testing`);
    console.log(`Testing ${tests.length} different subjects with 10+ questions each`);
    console.log('=' .repeat(80));

    const results: any[] = [];

    for (const test of tests) {
      const result = await this.testComprehensiveQuestions(test);
      results.push(result);
      
      // Add longer delay between tests due to comprehensive responses
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    // Comprehensive analysis
    console.log('\n' + '='.repeat(80));
    console.log('📚 COMPREHENSIVE PRACTICE QUESTION TEST ANALYSIS');
    console.log('='.repeat(80));

    const successfulTests = results.filter(r => r.success).length;
    const totalQuestions = results.reduce((sum, r) => sum + r.questionCount, 0);
    const avgQuestionsPerTest = totalQuestions / results.length;
    const avgScaffoldingQuality = results.reduce((sum, r) => sum + r.scaffoldingQuality, 0) / results.length;
    const avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;

    console.log('\n📊 Overall Performance:');
    console.log(`   Total Tests: ${results.length}`);
    console.log(`   ✅ Successful: ${successfulTests} (${(successfulTests/results.length*100).toFixed(1)}%)`);
    console.log(`   📝 Total Questions Generated: ${totalQuestions}`);
    console.log(`   📈 Avg Questions per Test: ${avgQuestionsPerTest.toFixed(1)}`);
    console.log(`   🏗️ Avg Scaffolding Quality: ${avgScaffoldingQuality.toFixed(1)}%`);
    console.log(`   ⏱️ Avg Response Time: ${(avgResponseTime/1000).toFixed(1)} seconds`);

    // Subject breakdown
    console.log('\n📚 Subject Performance:');
    results.forEach(r => {
      const status = r.success ? '✅' : '❌';
      console.log(`   ${status} ${r.test.category}: ${r.questionCount} questions (${r.scaffoldingQuality}% scaffolding)`);
    });

    // Quality metrics
    console.log('\n🎯 Quality Metrics:');
    const meetsQuestionRequirement = results.filter(r => r.questionCount >= r.test.minQuestions).length;
    const hasGoodScaffolding = results.filter(r => r.scaffoldingQuality >= 60).length;
    const hasUAEContext = results.filter(r => r.analysis.uaeContextIntegration >= 3).length;
    
    console.log(`   Question Quantity: ${meetsQuestionRequirement}/${results.length} tests (${(meetsQuestionRequirement/results.length*100).toFixed(0)}%)`);
    console.log(`   Scaffolding Quality: ${hasGoodScaffolding}/${results.length} tests (${(hasGoodScaffolding/results.length*100).toFixed(0)}%)`);
    console.log(`   UAE Context Integration: ${hasUAEContext}/${results.length} tests (${(hasUAEContext/results.length*100).toFixed(0)}%)`);

    // Language analysis
    console.log('\n🌐 Language Performance:');
    const arabicTests = results.filter(r => r.test.language === 'ar');
    const englishTests = results.filter(r => r.test.language === 'en');
    
    if (arabicTests.length > 0) {
      const arabicSuccess = arabicTests.filter(r => r.success).length;
      const arabicAvgQuestions = arabicTests.reduce((sum, r) => sum + r.questionCount, 0) / arabicTests.length;
      console.log(`   Arabic: ${arabicSuccess}/${arabicTests.length} successful (${arabicAvgQuestions.toFixed(1)} avg questions)`);
    }
    
    if (englishTests.length > 0) {
      const englishSuccess = englishTests.filter(r => r.success).length;
      const englishAvgQuestions = englishTests.reduce((sum, r) => sum + r.questionCount, 0) / englishTests.length;
      console.log(`   English: ${englishSuccess}/${englishTests.length} successful (${englishAvgQuestions.toFixed(1)} avg questions)`);
    }

    return results;
  }
}

async function main() {
  const tester = new ComprehensivePracticeQuestionTester();
  
  try {
    const results = await tester.runComprehensiveTests();
    
    // Save detailed results
    const fs = require('fs');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `comprehensive_practice_questions_test_${timestamp}.json`;
    
    fs.writeFileSync(filename, JSON.stringify({
      timestamp: new Date().toISOString(),
      testType: 'Comprehensive Practice Questions Test',
      summary: {
        total: results.length,
        successful: results.filter((r: any) => r.success).length,
        totalQuestions: results.reduce((sum: number, r: any) => sum + r.questionCount, 0),
        avgScaffoldingQuality: Math.round(results.reduce((sum: number, r: any) => sum + r.scaffoldingQuality, 0) / results.length)
      },
      results: results
    }, null, 2));
    
    console.log(`\n💾 Comprehensive test results saved to: ${filename}`);
    
  } catch (error) {
    console.error('Fatal error:', error);
  }
}

main().catch(console.error);
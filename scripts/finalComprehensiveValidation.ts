import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

interface ValidationTest {
  subject: string;
  query: string;
  language: 'ar' | 'en';
}

class FinalComprehensiveValidator {
  private apiUrl: string;

  constructor() {
    this.apiUrl = process.env.API_URL || 'http://localhost:3000/api/chat';
  }

  private getValidationTests(): ValidationTest[] {
    return [
      {
        subject: 'Mathematics',
        query: 'ما هي قواعد الضرب؟', // What are the rules of multiplication?
        language: 'ar'
      },
      {
        subject: 'Science', 
        query: 'Explain photosynthesis for UAE students',
        language: 'en'
      },
      {
        subject: 'Islamic Education',
        query: 'كيف نؤدي الوضوء؟', // How do we perform ablution?
        language: 'ar'
      }
    ];
  }

  async validateComprehensiveSystem(test: ValidationTest): Promise<{
    subject: string;
    questionCount: number;
    scaffoldingElements: number;
    uaeContextCount: number;
    responseTime: number;
    success: boolean;
    qualityScore: number;
  }> {
    console.log(`\n🧪 Validating: ${test.subject}`);
    console.log(`📝 Query: ${test.query}`);
    
    const startTime = Date.now();
    
    try {
      const response = await axios.post(
        this.apiUrl,
        {
          messages: [{ role: 'user', content: test.query }]
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 90000
        }
      );

      const fullResponse = String(response.data);
      const responseTime = Date.now() - startTime;
      
      // Count questions
      const questionMatches = fullResponse.match(/\*\*Question \d+:/gi) || [];
      const questionCount = questionMatches.length;
      
      // Analyze scaffolding
      const lowerResponse = fullResponse.toLowerCase();
      const scaffoldingElements = [
        'concept overview',
        'detailed answer', 
        'step-by-step',
        'personalized insights',
        'uae context',
        'assessment rubric',
        'additional practice',
        'voiceover'
      ];
      
      const foundScaffolding = scaffoldingElements.filter(element => 
        lowerResponse.includes(element)
      ).length;
      
      // UAE context analysis
      const uaeIndicators = ['uae', 'emirates', 'الإمارات', 'dubai', 'abu dhabi', 'ministry', 'vision 2071'];
      const uaeContextCount = uaeIndicators.filter(indicator => 
        lowerResponse.includes(indicator)
      ).length;
      
      // Quality score calculation
      const questionScore = Math.min(questionCount / 10, 1) * 40; // 40% weight
      const scaffoldingScore = (foundScaffolding / scaffoldingElements.length) * 35; // 35% weight  
      const uaeScore = Math.min(uaeContextCount / 3, 1) * 25; // 25% weight
      const qualityScore = Math.round(questionScore + scaffoldingScore + uaeScore);
      
      const success = questionCount >= 10 && foundScaffolding >= 4 && uaeContextCount >= 2;
      
      console.log(`✅ Analysis Complete (${(responseTime/1000).toFixed(1)}s)`);
      console.log(`   Questions: ${questionCount}/10 ${questionCount >= 10 ? '✅' : '❌'}`);
      console.log(`   Scaffolding: ${foundScaffolding}/${scaffoldingElements.length} ${foundScaffolding >= 4 ? '✅' : '❌'}`);
      console.log(`   UAE Context: ${uaeContextCount} references ${uaeContextCount >= 2 ? '✅' : '❌'}`);
      console.log(`   Quality Score: ${qualityScore}/100 ${qualityScore >= 80 ? '🏆' : qualityScore >= 60 ? '✅' : '⚠️'}`);
      console.log(`   Overall: ${success ? '✅ PASSED' : '❌ FAILED'}`);
      
      return {
        subject: test.subject,
        questionCount,
        scaffoldingElements: foundScaffolding,
        uaeContextCount,
        responseTime,
        success,
        qualityScore
      };
      
    } catch (error) {
      console.error(`❌ Error validating ${test.subject}: ${error}`);
      return {
        subject: test.subject,
        questionCount: 0,
        scaffoldingElements: 0,
        uaeContextCount: 0,
        responseTime: Date.now() - startTime,
        success: false,
        qualityScore: 0
      };
    }
  }

  async runFinalValidation() {
    const tests = this.getValidationTests();
    console.log(`\n🎯 FINAL COMPREHENSIVE PRACTICE QUESTION VALIDATION`);
    console.log(`Testing ${tests.length} subjects for 10+ question generation`);
    console.log('='.repeat(80));

    const results: any[] = [];

    for (const test of tests) {
      const result = await this.validateComprehensiveSystem(test);
      results.push(result);
      
      // Delay between tests
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Final analysis
    console.log('\n' + '='.repeat(80));
    console.log('🏆 FINAL VALIDATION RESULTS');
    console.log('='.repeat(80));

    const totalTests = results.length;
    const passedTests = results.filter(r => r.success).length;
    const avgQuestions = Math.round(results.reduce((sum, r) => sum + r.questionCount, 0) / totalTests);
    const avgScaffolding = Math.round(results.reduce((sum, r) => sum + r.scaffoldingElements, 0) / totalTests);
    const avgQuality = Math.round(results.reduce((sum, r) => sum + r.qualityScore, 0) / totalTests);
    const avgResponseTime = Math.round(results.reduce((sum, r) => sum + r.responseTime, 0) / totalTests / 1000);

    console.log('\n📊 Overall Performance:');
    console.log(`   🎯 Success Rate: ${passedTests}/${totalTests} (${Math.round(passedTests/totalTests*100)}%)`);
    console.log(`   📚 Avg Questions per Test: ${avgQuestions}`);
    console.log(`   🏗️ Avg Scaffolding Elements: ${avgScaffolding}`);
    console.log(`   🏆 Avg Quality Score: ${avgQuality}/100`);
    console.log(`   ⏱️ Avg Response Time: ${avgResponseTime}s`);

    // Subject breakdown
    console.log('\n📋 Subject Performance:');
    results.forEach(r => {
      const status = r.success ? '✅' : '❌';
      console.log(`   ${status} ${r.subject}: ${r.questionCount} questions, ${r.qualityScore}/100 quality`);
    });

    // Final assessment
    const overallSuccess = passedTests === totalTests && avgQuestions >= 10 && avgQuality >= 80;
    
    console.log(`\n🎖️ FINAL ASSESSMENT: ${overallSuccess ? '🏆 EXCELLENT' : passedTests >= totalTests*0.8 ? '✅ GOOD' : '⚠️ NEEDS IMPROVEMENT'}`);
    
    if (overallSuccess) {
      console.log('\n🎉 COMPREHENSIVE PRACTICE QUESTION SYSTEM VALIDATION COMPLETE!');
      console.log('   ✅ All tests passed with 10+ questions per query');
      console.log('   ✅ High-quality scaffolding implemented');  
      console.log('   ✅ UAE context properly integrated');
      console.log('   ✅ System ready for production use');
    } else {
      console.log('\n⚠️ System needs refinement:');
      if (avgQuestions < 10) console.log('   - Increase question generation consistency');
      if (avgQuality < 80) console.log('   - Enhance response quality and scaffolding');
      if (passedTests < totalTests) console.log('   - Address failing test cases');
    }

    return {
      totalTests,
      passedTests,
      avgQuestions,
      avgQuality,
      overallSuccess
    };
  }
}

async function main() {
  const validator = new FinalComprehensiveValidator();
  
  try {
    const results = await validator.runFinalValidation();
    
    // Save validation results
    const fs = require('fs');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `final_comprehensive_validation_${timestamp}.json`;
    
    fs.writeFileSync(filename, JSON.stringify({
      timestamp: new Date().toISOString(),
      testType: 'Final Comprehensive Practice Question Validation',
      summary: results,
      status: results.overallSuccess ? 'PASSED' : 'NEEDS_IMPROVEMENT'
    }, null, 2));
    
    console.log(`\n💾 Final validation results saved to: ${filename}`);
    
  } catch (error) {
    console.error('Fatal validation error:', error);
  }
}

main().catch(console.error);
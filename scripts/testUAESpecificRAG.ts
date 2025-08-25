import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

interface UAETestQuestion {
  category: string;
  question: string;
  language: 'ar' | 'en' | 'mixed';
  expectedUAEContent?: string[];
}

class UAESpecificTester {
  private apiUrl: string;

  constructor() {
    this.apiUrl = process.env.API_URL || 'http://localhost:3000/api/chat';
  }

  private getUAETestQuestions(): UAETestQuestion[] {
    return [
      // UAE Ministry of Education specific questions
      {
        category: 'UAE MOE Structure',
        question: 'What are the key components of UAE\'s educational system according to the Ministry of Education?',
        language: 'en',
        expectedUAEContent: ['ministry', 'education', 'UAE', 'system']
      },
      {
        category: 'UAE Vision 2071',
        question: 'How does UAE Vision 2071 impact the educational curriculum and teaching methods?',
        language: 'en',
        expectedUAEContent: ['vision', '2071', 'UAE', 'curriculum']
      },
      {
        category: 'UAE Education Development',
        question: 'ما هي مراحل تطور التعليم في دولة الإمارات العربية المتحدة؟',
        language: 'ar',
        expectedUAEContent: ['تطور', 'التعليم', 'الإمارات', 'دولة']
      },
      {
        category: 'UAE Curriculum Assessment',
        question: 'كيف يتم تقييم المناهج التعليمية في النظام التعليمي الإماراتي؟',
        language: 'ar',
        expectedUAEContent: ['تقييم', 'المناهج', 'الإماراتي', 'النظام']
      },
      {
        category: 'UAE Educational Research',
        question: 'What research has been conducted on English and Mathematics teaching methods in UAE schools?',
        language: 'en',
        expectedUAEContent: ['research', 'english', 'mathematics', 'UAE', 'teaching']
      },
      {
        category: 'UAE Early Childhood Education',
        question: 'ما هي استراتيجية دولة الإمارات لتعليم الأطفال في رياض الأطفال؟',
        language: 'ar',
        expectedUAEContent: ['استراتيجية', 'الإمارات', 'رياض', 'الأطفال']
      },
      {
        category: 'UAE Adult Education',
        question: 'How does the UAE approach adult education and lifelong learning initiatives?',
        language: 'en',
        expectedUAEContent: ['adult', 'education', 'UAE', 'learning']
      },
      {
        category: 'UAE Educational Standards',
        question: 'What are the specific educational standards and benchmarks used in UAE schools?',
        language: 'en',
        expectedUAEContent: ['standards', 'benchmarks', 'UAE', 'schools']
      },
      {
        category: 'UAE Language Education',
        question: 'كيف يتم تدريس اللغة الإنجليزية والعربية في المدارس الإماراتية؟',
        language: 'ar',
        expectedUAEContent: ['تدريس', 'اللغة', 'الإنجليزية', 'الإماراتية']
      },
      {
        category: 'UAE Educational Innovation',
        question: 'What innovative teaching methods and technologies are being implemented in UAE education?',
        language: 'en',
        expectedUAEContent: ['innovative', 'teaching', 'technologies', 'UAE']
      }
    ];
  }

  async testUAEQuestion(question: UAETestQuestion): Promise<{
    question: UAETestQuestion;
    response: string;
    responseTime: number;
    hasUAEContent: boolean;
    contentScore: number;
    success: boolean;
    error?: string;
  }> {
    const startTime = Date.now();
    
    try {
      console.log(`\n🇦🇪 Testing UAE Category: ${question.category}`);
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
          timeout: 45000, // Longer timeout for UAE-specific queries
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
          
          // Analyze UAE content
          const lowerResponse = fullResponse.toLowerCase();
          let contentScore = 0;
          let matchedTerms: string[] = [];
          
          if (question.expectedUAEContent) {
            question.expectedUAEContent.forEach(term => {
              if (lowerResponse.includes(term.toLowerCase())) {
                contentScore++;
                matchedTerms.push(term);
              }
            });
          }
          
          // Check for UAE-specific indicators
          const uaeIndicators = [
            'uae', 'emirates', 'الإمارات', 'إماراتي', 'ministry of education', 
            'وزارة التربية', 'vision 2071', 'رؤية 2071', 'dubai', 'abu dhabi'
          ];
          
          let uaeContentFound = false;
          uaeIndicators.forEach(indicator => {
            if (lowerResponse.includes(indicator)) {
              uaeContentFound = true;
            }
          });
          
          console.log(`✅ Response received (${responseTime}ms)`);
          console.log(`🎯 UAE Content Score: ${contentScore}/${question.expectedUAEContent?.length || 0}`);
          console.log(`🇦🇪 UAE References Found: ${uaeContentFound ? 'Yes' : 'No'}`);
          console.log(`📝 Response Preview: ${fullResponse.substring(0, 150)}...`);
          
          if (matchedTerms.length > 0) {
            console.log(`✓ Matched UAE Terms: ${matchedTerms.join(', ')}`);
          }
          
          const result = {
            question,
            response: fullResponse,
            responseTime,
            hasUAEContent: uaeContentFound,
            contentScore: contentScore / (question.expectedUAEContent?.length || 1),
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
            hasUAEContent: false,
            contentScore: 0,
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
        hasUAEContent: false,
        contentScore: 0,
        success: false,
        error: errorMessage
      };
    }
  }

  async runUAETests() {
    const questions = this.getUAETestQuestions();
    console.log(`\n🇦🇪 Starting UAE-Specific RAG Testing with ${questions.length} questions`);
    console.log('=' .repeat(80));

    const results: any[] = [];

    for (const question of questions) {
      const result = await this.testUAEQuestion(question);
      results.push(result);
      
      // Add delay between questions
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    // Analyze results
    console.log('\n' + '='.repeat(80));
    console.log('🇦🇪 UAE-SPECIFIC RAG TEST ANALYSIS');
    console.log('='.repeat(80));

    const successfulTests = results.filter(r => r.success).length;
    const uaeContentTests = results.filter(r => r.hasUAEContent).length;
    const avgContentScore = results.reduce((sum, r) => sum + r.contentScore, 0) / results.length;
    const avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;

    console.log('\n📊 UAE Content Analysis:');
    console.log(`   Total Tests: ${results.length}`);
    console.log(`   ✅ Successful: ${successfulTests} (${(successfulTests/results.length*100).toFixed(1)}%)`);
    console.log(`   🇦🇪 Contains UAE Content: ${uaeContentTests} (${(uaeContentTests/results.length*100).toFixed(1)}%)`);
    console.log(`   📈 Avg Content Score: ${(avgContentScore*100).toFixed(1)}%`);
    console.log(`   ⏱️  Avg Response Time: ${avgResponseTime.toFixed(0)}ms`);

    // Category breakdown
    console.log('\n📚 Category Performance:');
    const categoryStats: Record<string, any> = {};
    results.forEach(r => {
      const cat = r.question.category;
      if (!categoryStats[cat]) {
        categoryStats[cat] = { total: 0, success: 0, uaeContent: 0, scoreSum: 0 };
      }
      categoryStats[cat].total++;
      if (r.success) categoryStats[cat].success++;
      if (r.hasUAEContent) categoryStats[cat].uaeContent++;
      categoryStats[cat].scoreSum += r.contentScore;
    });

    Object.entries(categoryStats).forEach(([category, stats]) => {
      const avgScore = (stats.scoreSum / stats.total * 100).toFixed(0);
      console.log(`   ${category}: ${stats.uaeContent}/${stats.total} UAE content (${avgScore}% avg score)`);
    });

    // Language analysis
    console.log('\n🌐 Language Performance:');
    const langStats: Record<string, any> = {};
    results.forEach(r => {
      const lang = r.question.language;
      if (!langStats[lang]) {
        langStats[lang] = { total: 0, uaeContent: 0 };
      }
      langStats[lang].total++;
      if (r.hasUAEContent) langStats[lang].uaeContent++;
    });

    Object.entries(langStats).forEach(([lang, stats]) => {
      const langName = lang === 'ar' ? 'Arabic' : 'English';
      console.log(`   ${langName}: ${stats.uaeContent}/${stats.total} (${(stats.uaeContent/stats.total*100).toFixed(0)}%)`);
    });

    return results;
  }
}

async function main() {
  const tester = new UAESpecificTester();
  
  try {
    const results = await tester.runUAETests();
    
    // Save results
    const fs = require('fs');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `uae_rag_test_results_${timestamp}.json`;
    
    fs.writeFileSync(filename, JSON.stringify({
      timestamp: new Date().toISOString(),
      testType: 'UAE-Specific RAG Test',
      summary: {
        total: results.length,
        successful: results.filter((r: any) => r.success).length,
        withUAEContent: results.filter((r: any) => r.hasUAEContent).length
      },
      results: results
    }, null, 2));
    
    console.log(`\n💾 UAE test results saved to: ${filename}`);
    
  } catch (error) {
    console.error('Fatal error:', error);
  }
}

main().catch(console.error);
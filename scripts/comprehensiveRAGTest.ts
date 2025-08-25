import axios from 'axios';
import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';

dotenv.config({ path: '.env.local' });

interface TestQuestion {
  grade: number;
  subject: string;
  question: string;
  language: 'ar' | 'en' | 'mixed';
  expectedTopics?: string[];
}

interface TestResult {
  question: TestQuestion;
  response: string;
  responseTime: number;
  success: boolean;
  error?: string;
}

class ComprehensiveRAGTester {
  private apiUrl: string;
  private client: MongoClient;
  private results: TestResult[] = [];

  constructor() {
    // Use the actual deployment URL or localhost
    this.apiUrl = process.env.API_URL || 'http://localhost:3000/api/chat';
    this.client = new MongoClient(process.env.MONGODB_URI!);
  }

  async connect() {
    await this.client.connect();
    console.log('Connected to MongoDB for tracking');
  }

  async disconnect() {
    await this.client.close();
  }

  // Comprehensive test questions covering all grades and subjects
  private getTestQuestions(): TestQuestion[] {
    return [
      // Grade 1-2 (Primary - Foundation)
      { grade: 1, subject: 'القرآن الكريم', question: 'ما هي السورة الأولى في القرآن الكريم؟', language: 'ar' },
      { grade: 1, subject: 'اللغة العربية', question: 'ما هي حروف الهجاء العربية؟', language: 'ar' },
      { grade: 1, subject: 'الرياضيات', question: 'كم يساوي ٢ + ٣؟', language: 'ar' },
      { grade: 2, subject: 'القرآن الكريم', question: 'كم عدد أركان الإسلام؟', language: 'ar' },
      { grade: 2, subject: 'اللغة العربية', question: 'ما هو جمع كلمة "كتاب"؟', language: 'ar' },
      { grade: 2, subject: 'العلوم', question: 'ما هي حواس الإنسان الخمس؟', language: 'ar' },

      // Grade 3-4 (Primary - Intermediate)
      { grade: 3, subject: 'اللغة العربية', question: 'اشرح الفرق بين الاسم والفعل والحرف', language: 'ar' },
      { grade: 3, subject: 'الرياضيات', question: 'كيف نحسب محيط المربع؟', language: 'ar' },
      { grade: 3, subject: 'القرآن الكريم', question: 'ما معنى البسملة؟', language: 'ar' },
      { grade: 4, subject: 'العلوم', question: 'ما هي دورة الماء في الطبيعة؟', language: 'ar' },
      { grade: 4, subject: 'بلادي الكويت', question: 'متى تم اكتشاف النفط في الكويت؟', language: 'ar' },
      { grade: 4, subject: 'اللغة العربية', question: 'ما هي أنواع الجموع في اللغة العربية؟', language: 'ar' },
      { grade: 4, subject: 'الرياضيات', question: 'اشرح عملية القسمة الطويلة', language: 'ar' },
      { grade: 4, subject: 'TIMSS علوم', question: 'What are the states of matter?', language: 'en' },

      // Grade 5-6 (Middle School - Foundation)
      { grade: 5, subject: 'اللغة العربية', question: 'ما هي علامات الإعراب الأصلية والفرعية؟', language: 'ar' },
      { grade: 5, subject: 'الرياضيات', question: 'كيف نحول الكسور العادية إلى كسور عشرية؟', language: 'ar' },
      { grade: 5, subject: 'العلوم', question: 'اشرح عملية البناء الضوئي', language: 'ar' },
      { grade: 5, subject: 'بلادي الكويت', question: 'ما هي محافظات دولة الكويت؟', language: 'ar' },
      { grade: 5, subject: 'عالمنا الرقمي', question: 'ما هي مكونات الحاسوب الأساسية؟', language: 'ar' },
      { grade: 5, subject: 'English', question: 'What are the parts of speech in English?', language: 'en' },
      { grade: 6, subject: 'اللغة العربية', question: 'ما هي البحور الشعرية؟', language: 'ar' },
      { grade: 6, subject: 'الرياضيات', question: 'اشرح مفهوم النسبة والتناسب', language: 'ar' },
      { grade: 6, subject: 'العلوم', question: 'ما هي أجهزة جسم الإنسان؟', language: 'ar' },
      { grade: 6, subject: 'عالم التقنية', question: 'ما هي لغات البرمجة الأساسية؟', language: 'ar' },

      // Grade 7-8 (Middle School - Advanced)
      { grade: 7, subject: 'اللغة العربية', question: 'اشرح أنواع الخبر في الجملة الاسمية', language: 'ar' },
      { grade: 7, subject: 'الرياضيات', question: 'كيف نحل المعادلات من الدرجة الأولى؟', language: 'ar' },
      { grade: 7, subject: 'العلوم', question: 'ما هي أنواع الصخور وكيف تتكون؟', language: 'ar' },
      { grade: 7, subject: 'الاجتماعيات', question: 'ما هي أسباب قيام الحضارة الإسلامية؟', language: 'ar' },
      { grade: 7, subject: 'عالم التقنية', question: 'ما هو الذكاء الاصطناعي وتطبيقاته؟', language: 'ar' },
      { grade: 8, subject: 'اللغة العربية', question: 'ما هي المشتقات في اللغة العربية؟', language: 'ar' },
      { grade: 8, subject: 'الرياضيات', question: 'اشرح نظرية فيثاغورس وتطبيقاتها', language: 'ar' },
      { grade: 8, subject: 'العلوم', question: 'ما هي قوانين نيوتن للحركة؟', language: 'ar' },
      { grade: 8, subject: 'الاجتماعيات', question: 'ما هي نتائج الحرب العالمية الأولى؟', language: 'ar' },
      { grade: 8, subject: 'TIMSS رياضيات', question: 'Explain algebraic expressions and equations', language: 'en' },

      // Grade 9-10 (High School - Foundation)
      { grade: 9, subject: 'اللغة العربية', question: 'اشرح علم البيان وأقسامه', language: 'ar' },
      { grade: 9, subject: 'الرياضيات', question: 'ما هي الدوال المثلثية الأساسية؟', language: 'ar' },
      { grade: 9, subject: 'الفيزياء', question: 'اشرح قانون أوم للكهرباء', language: 'ar' },
      { grade: 9, subject: 'الكيمياء', question: 'ما هو الجدول الدوري وكيف نستخدمه؟', language: 'ar' },
      { grade: 9, subject: 'الأحياء', question: 'اشرح عملية الانقسام الخلوي', language: 'ar' },
      { grade: 10, subject: 'فنون البلاغة', question: 'ما هي أنواع المحسنات البديعية؟', language: 'ar' },
      { grade: 10, subject: 'قواعد النحو والصرف', question: 'اشرح أحكام العدد والمعدود', language: 'ar' },
      { grade: 10, subject: 'الرياضيات', question: 'كيف نحل المعادلات من الدرجة الثانية؟', language: 'ar' },
      { grade: 10, subject: 'الفيزياء', question: 'ما هي قوانين الديناميكا الحرارية؟', language: 'ar' },
      { grade: 10, subject: 'الكيمياء', question: 'اشرح أنواع التفاعلات الكيميائية', language: 'ar' },

      // Grade 11-12 (High School - Advanced)
      { grade: 11, subject: 'فنون البلاغة', question: 'اشرح علم المعاني وأبوابه', language: 'ar' },
      { grade: 11, subject: 'قواعد النحو والصرف', question: 'ما هي أحكام الممنوع من الصرف؟', language: 'ar' },
      { grade: 11, subject: 'الرياضيات', question: 'اشرح مفهوم التفاضل والتكامل', language: 'ar' },
      { grade: 11, subject: 'الفيزياء', question: 'ما هي النظرية النسبية لأينشتاين؟', language: 'ar' },
      { grade: 11, subject: 'الكيمياء', question: 'اشرح الكيمياء العضوية والمركبات الهيدروكربونية', language: 'ar' },
      { grade: 11, subject: 'الأحياء', question: 'ما هي الهندسة الوراثية وتطبيقاتها؟', language: 'ar' },
      { grade: 11, subject: 'الجيولوجيا', question: 'اشرح نظرية الصفائح التكتونية', language: 'ar' },
      { grade: 11, subject: 'علم النفس والاجتماع', question: 'ما هي نظريات التعلم في علم النفس؟', language: 'ar' },
      { grade: 11, subject: 'الجغرافيا والاقتصاد', question: 'اشرح العوامل المؤثرة في التنمية الاقتصادية', language: 'ar' },
      { grade: 11, subject: 'اللغة الفرنسية', question: 'Quels sont les temps verbaux en français?', language: 'mixed' },
      { grade: 12, subject: 'الفلسفة', question: 'ما هي المدارس الفلسفية الرئيسية؟', language: 'ar' },
      { grade: 12, subject: 'الرياضيات', question: 'اشرح المصفوفات والمحددات', language: 'ar' },
      { grade: 12, subject: 'الفيزياء', question: 'ما هي ميكانيكا الكم؟', language: 'ar' },
      { grade: 12, subject: 'الكيمياء', question: 'اشرح الاتزان الكيميائي وقانون لوشاتلييه', language: 'ar' },
      { grade: 12, subject: 'الأحياء', question: 'ما هي نظرية التطور وأدلتها؟', language: 'ar' },

      // Mixed language and cross-curricular questions
      { grade: 6, subject: 'Mixed', question: 'Compare photosynthesis and respiration عمليتي البناء الضوئي والتنفس', language: 'mixed' },
      { grade: 8, subject: 'Mixed', question: 'Explain Pythagorean theorem نظرية فيثاغورس with examples', language: 'mixed' },
      { grade: 10, subject: 'Mixed', question: 'What are chemical bonds? ما هي الروابط الكيميائية؟', language: 'mixed' },
    ];
  }

  async testQuestion(question: TestQuestion): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      console.log(`\n📚 Testing Grade ${question.grade} - ${question.subject}`);
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
          timeout: 30000,
          responseType: 'stream'
        }
      );

      // Collect streamed response
      let fullResponse = '';
      return new Promise((resolve) => {
        response.data.on('data', (chunk: Buffer) => {
          const text = chunk.toString();
          // Parse streaming response format
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
          console.log(`✅ Response received (${responseTime}ms)`);
          console.log(`📝 Answer preview: ${fullResponse.substring(0, 200)}...`);
          
          const result: TestResult = {
            question,
            response: fullResponse,
            responseTime,
            success: true
          };
          
          this.results.push(result);
          resolve(result);
        });

        response.data.on('error', (error: Error) => {
          const responseTime = Date.now() - startTime;
          console.error(`❌ Stream error: ${error.message}`);
          
          const result: TestResult = {
            question,
            response: '',
            responseTime,
            success: false,
            error: error.message
          };
          
          this.results.push(result);
          resolve(result);
        });
      });

    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Error: ${errorMessage}`);
      
      const result: TestResult = {
        question,
        response: '',
        responseTime,
        success: false,
        error: errorMessage
      };
      
      this.results.push(result);
      return result;
    }
  }

  async runTests() {
    const questions = this.getTestQuestions();
    console.log(`\n🚀 Starting comprehensive RAG testing with ${questions.length} questions`);
    console.log('=' .repeat(80));

    // Group questions by grade for organized testing
    const gradeGroups = questions.reduce((acc, q) => {
      if (!acc[q.grade]) acc[q.grade] = [];
      acc[q.grade].push(q);
      return acc;
    }, {} as Record<number, TestQuestion[]>);

    // Test each grade sequentially
    for (const grade of Object.keys(gradeGroups).sort((a, b) => Number(a) - Number(b))) {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`📚 TESTING GRADE ${grade}`);
      console.log(`${'='.repeat(80)}`);
      
      const gradeQuestions = gradeGroups[Number(grade)];
      for (const question of gradeQuestions) {
        await this.testQuestion(question);
        // Add delay between questions to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }

  analyzeResults() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 TEST RESULTS ANALYSIS');
    console.log('='.repeat(80));

    // Overall statistics
    const totalTests = this.results.length;
    const successfulTests = this.results.filter(r => r.success).length;
    const failedTests = this.results.filter(r => !r.success).length;
    const avgResponseTime = this.results.reduce((sum, r) => sum + r.responseTime, 0) / totalTests;

    console.log('\n📈 Overall Statistics:');
    console.log(`   Total Tests: ${totalTests}`);
    console.log(`   ✅ Successful: ${successfulTests} (${(successfulTests/totalTests*100).toFixed(1)}%)`);
    console.log(`   ❌ Failed: ${failedTests} (${(failedTests/totalTests*100).toFixed(1)}%)`);
    console.log(`   ⏱️  Avg Response Time: ${avgResponseTime.toFixed(0)}ms`);

    // Grade-level analysis
    console.log('\n📚 Grade-Level Performance:');
    const gradeStats = this.results.reduce((acc, r) => {
      const grade = r.question.grade;
      if (!acc[grade]) {
        acc[grade] = { total: 0, success: 0, avgTime: 0, times: [] };
      }
      acc[grade].total++;
      if (r.success) acc[grade].success++;
      acc[grade].times.push(r.responseTime);
      return acc;
    }, {} as Record<number, any>);

    for (const grade of Object.keys(gradeStats).sort((a, b) => Number(a) - Number(b))) {
      const stats = gradeStats[Number(grade)];
      stats.avgTime = stats.times.reduce((a: number, b: number) => a + b, 0) / stats.times.length;
      console.log(`   Grade ${grade}: ${stats.success}/${stats.total} success (${(stats.success/stats.total*100).toFixed(0)}%) - Avg ${stats.avgTime.toFixed(0)}ms`);
    }

    // Subject analysis
    console.log('\n📖 Subject Performance:');
    const subjectStats = this.results.reduce((acc, r) => {
      const subject = r.question.subject;
      if (!acc[subject]) {
        acc[subject] = { total: 0, success: 0 };
      }
      acc[subject].total++;
      if (r.success) acc[subject].success++;
      return acc;
    }, {} as Record<string, any>);

    for (const [subject, stats] of Object.entries(subjectStats)) {
      console.log(`   ${subject}: ${stats.success}/${stats.total} (${(stats.success/stats.total*100).toFixed(0)}%)`);
    }

    // Language analysis
    console.log('\n🌐 Language Performance:');
    const langStats = this.results.reduce((acc, r) => {
      const lang = r.question.language;
      if (!acc[lang]) {
        acc[lang] = { total: 0, success: 0 };
      }
      acc[lang].total++;
      if (r.success) acc[lang].success++;
      return acc;
    }, {} as Record<string, any>);

    for (const [lang, stats] of Object.entries(langStats)) {
      const langName = lang === 'ar' ? 'Arabic' : lang === 'en' ? 'English' : 'Mixed';
      console.log(`   ${langName}: ${stats.success}/${stats.total} (${(stats.success/stats.total*100).toFixed(0)}%)`);
    }

    // Response quality analysis
    console.log('\n📝 Response Quality Indicators:');
    const qualityMetrics = this.results.filter(r => r.success).map(r => ({
      grade: r.question.grade,
      subject: r.question.subject,
      responseLength: r.response.length,
      hasStructure: r.response.includes('1.') || r.response.includes('أولاً'),
      hasExamples: r.response.includes('مثال') || r.response.includes('example'),
      responseLang: this.detectResponseLanguage(r.response)
    }));

    const avgResponseLength = qualityMetrics.reduce((sum, m) => sum + m.responseLength, 0) / qualityMetrics.length;
    const structuredResponses = qualityMetrics.filter(m => m.hasStructure).length;
    const withExamples = qualityMetrics.filter(m => m.hasExamples).length;

    console.log(`   Average Response Length: ${avgResponseLength.toFixed(0)} characters`);
    console.log(`   Structured Responses: ${structuredResponses}/${qualityMetrics.length} (${(structuredResponses/qualityMetrics.length*100).toFixed(0)}%)`);
    console.log(`   Responses with Examples: ${withExamples}/${qualityMetrics.length} (${(withExamples/qualityMetrics.length*100).toFixed(0)}%)`);

    // Failed tests details
    if (failedTests > 0) {
      console.log('\n⚠️ Failed Tests Details:');
      this.results.filter(r => !r.success).forEach(r => {
        console.log(`   Grade ${r.question.grade} - ${r.question.subject}: ${r.error}`);
      });
    }

    // Save detailed results to file
    this.saveResults();
  }

  private detectResponseLanguage(response: string): string {
    const arabicPattern = /[\u0600-\u06FF]/g;
    const englishPattern = /[a-zA-Z]/g;
    
    const arabicMatches = response.match(arabicPattern) || [];
    const englishMatches = response.match(englishPattern) || [];
    
    const arabicRatio = arabicMatches.length / response.length;
    const englishRatio = englishMatches.length / response.length;
    
    if (arabicRatio > 0.3 && englishRatio > 0.1) return 'mixed';
    if (arabicRatio > 0.3) return 'arabic';
    if (englishRatio > 0.3) return 'english';
    return 'unknown';
  }

  private saveResults() {
    const fs = require('fs');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `rag_test_results_${timestamp}.json`;
    
    const output = {
      timestamp: new Date().toISOString(),
      summary: {
        total: this.results.length,
        successful: this.results.filter(r => r.success).length,
        failed: this.results.filter(r => !r.success).length
      },
      results: this.results.map(r => ({
        grade: r.question.grade,
        subject: r.question.subject,
        question: r.question.question,
        responsePreview: r.response.substring(0, 500),
        responseLength: r.response.length,
        responseTime: r.responseTime,
        success: r.success,
        error: r.error
      }))
    };

    fs.writeFileSync(filename, JSON.stringify(output, null, 2));
    console.log(`\n💾 Detailed results saved to: ${filename}`);
  }
}

async function main() {
  const tester = new ComprehensiveRAGTester();
  
  try {
    await tester.connect();
    await tester.runTests();
    tester.analyzeResults();
  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    await tester.disconnect();
  }
}

// Run the comprehensive test
main().catch(console.error);
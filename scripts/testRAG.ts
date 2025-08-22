import { MongoDBAtlasVectorSearch } from '@langchain/community/vectorstores/mongodb_atlas';
import { OpenAIEmbeddings } from '@langchain/openai';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import { promises as fs } from 'fs';

dotenv.config({ path: '.env.local' });

interface TestQuestion {
  id: string;
  grade: number;
  subject: string;
  question: string;
  expectedTopics: string[];
  language: 'arabic' | 'english' | 'mixed';
}

interface TestResult {
  question: TestQuestion;
  retrievedDocs: any[];
  relevanceScore: number;
  foundTopics: string[];
  passed: boolean;
  summary: string;
}

class RAGTester {
  private vectorStore: MongoDBAtlasVectorSearch;
  private client: MongoClient;
  
  constructor() {
    this.client = new MongoClient(process.env.MONGODB_URI!);
    const collection = this.client.db('chatter').collection('training_data');
    
    this.vectorStore = new MongoDBAtlasVectorSearch(
      new OpenAIEmbeddings({ openAIApiKey: process.env.OPENAI_API_KEY! }),
      {
        collection,
        indexName: "vector_index",
        textKey: "text",
        embeddingKey: "text_embedding",
      }
    );
  }

  async connect() {
    await this.client.connect();
    console.log('Connected to MongoDB for RAG testing');
  }

  async disconnect() {
    await this.client.close();
    console.log('Disconnected from MongoDB');
  }

  getTestQuestions(): TestQuestion[] {
    return [
      // Grade 1-3 (Primary)
      {
        id: "ar_lang_1_1",
        grade: 1,
        subject: "اللغة العربية",
        question: "ما هي الحروف الأبجدية العربية؟",
        expectedTopics: ["حروف", "أبجدية", "ألف", "باء", "تاء"],
        language: "arabic"
      },
      {
        id: "math_1_1",
        grade: 1,
        subject: "الرياضيات",
        question: "كيف نعد الأرقام من 1 إلى 10؟",
        expectedTopics: ["أرقام", "عد", "واحد", "اثنان", "ثلاثة"],
        language: "arabic"
      },
      {
        id: "science_1_1",
        grade: 1,
        subject: "العلوم",
        question: "ما هي أجزاء النبات الأساسية؟",
        expectedTopics: ["نبات", "جذور", "ساق", "أوراق", "زهرة"],
        language: "arabic"
      },
      {
        id: "islamic_2_1",
        grade: 2,
        subject: "التربية الإسلامية",
        question: "ما هي أركان الإسلام الخمسة؟",
        expectedTopics: ["شهادة", "صلاة", "زكاة", "صوم", "حج"],
        language: "arabic"
      },
      
      // Grade 4-6 (Elementary)
      {
        id: "ar_lang_4_1",
        grade: 4,
        subject: "اللغة العربية",
        question: "ما هي أنواع الكلمة في اللغة العربية؟",
        expectedTopics: ["اسم", "فعل", "حرف", "كلمة", "نحو"],
        language: "arabic"
      },
      {
        id: "math_5_1",
        grade: 5,
        subject: "الرياضيات",
        question: "كيف نحسب مساحة المستطيل؟",
        expectedTopics: ["مساحة", "مستطيل", "طول", "عرض", "ضرب"],
        language: "arabic"
      },
      {
        id: "social_5_1",
        grade: 5,
        subject: "الدراسات الاجتماعية",
        question: "ما هي دول مجلس التعاون الخليجي؟",
        expectedTopics: ["الكويت", "السعودية", "الإمارات", "قطر", "البحرين", "عمان"],
        language: "arabic"
      },
      {
        id: "science_6_1",
        grade: 6,
        subject: "العلوم",
        question: "ما هي المجموعات الغذائية الأساسية؟",
        expectedTopics: ["بروتين", "كربوهيدرات", "دهون", "فيتامين", "معادن"],
        language: "arabic"
      },

      // Grade 7-9 (Middle School)
      {
        id: "biology_7_1",
        grade: 7,
        subject: "الأحياء",
        question: "ما هي أجزاء الخلية النباتية؟",
        expectedTopics: ["خلية", "نواة", "سيتوبلازم", "جدار خلوي", "بلاستيدات"],
        language: "arabic"
      },
      {
        id: "physics_8_1",
        grade: 8,
        subject: "الفيزياء",
        question: "ما هو قانون نيوتن الأول للحركة؟",
        expectedTopics: ["نيوتن", "قصور", "حركة", "قوة", "سكون"],
        language: "arabic"
      },
      {
        id: "chemistry_9_1",
        grade: 9,
        subject: "الكيمياء",
        question: "ما هي العناصر في الجدول الدوري؟",
        expectedTopics: ["جدول دوري", "عناصر", "ذرة", "هيدروجين", "أكسجين"],
        language: "arabic"
      },
      {
        id: "arabic_grammar_8_1",
        grade: 8,
        subject: "قواعد النحو والصرف",
        question: "ما هي علامات الإعراب الأصلية؟",
        expectedTopics: ["إعراب", "ضمة", "فتحة", "كسرة", "سكون"],
        language: "arabic"
      },

      // Grade 10-12 (High School)
      {
        id: "advanced_physics_11_1",
        grade: 11,
        subject: "الفيزياء المتقدمة",
        question: "ما هي قوانين الديناميكا الحرارية؟",
        expectedTopics: ["حرارة", "طاقة", "إنتروبيا", "قانون أول", "قانون ثاني"],
        language: "arabic"
      },
      {
        id: "advanced_chemistry_12_1",
        grade: 12,
        subject: "الكيمياء المتقدمة",
        question: "ما هي أنواع التفاعلات الكيميائية؟",
        expectedTopics: ["تفاعل", "أكسدة", "اختزال", "حمض", "قاعدة"],
        language: "arabic"
      },
      {
        id: "islamic_history_11_1",
        grade: 11,
        subject: "التاريخ الإسلامي",
        question: "ما هي أهم أحداث العصر العباسي؟",
        expectedTopics: ["عباسي", "خلافة", "بغداد", "هارون الرشيد", "ترجمة"],
        language: "arabic"
      },
      {
        id: "geography_11_1",
        grade: 11,
        subject: "الجغرافيا",
        question: "ما هي خصائص المناخ في الخليج العربي؟",
        expectedTopics: ["مناخ", "خليج", "حرارة", "رطوبة", "صحراء"],
        language: "arabic"
      },
      {
        id: "english_10_1",
        grade: 10,
        subject: "اللغة الإنجليزية",
        question: "What are the main tenses in English grammar?",
        expectedTopics: ["present", "past", "future", "tense", "grammar"],
        language: "english"
      },

      // Specialized Subjects
      {
        id: "quran_6_1",
        grade: 6,
        subject: "القرآن الكريم",
        question: "ما هي آداب تلاوة القرآن الكريم؟",
        expectedTopics: ["تلاوة", "وضوء", "قبلة", "تجويد", "احترام"],
        language: "arabic"
      },
      {
        id: "tech_9_1",
        grade: 9,
        subject: "تقنية المعلومات",
        question: "ما هي مكونات الحاسوب الأساسية؟",
        expectedTopics: ["حاسوب", "معالج", "ذاكرة", "قرص صلب", "شاشة"],
        language: "arabic"
      },
      {
        id: "home_economics_7_1",
        grade: 7,
        subject: "الاقتصاد المنزلي",
        question: "ما هي أسس التغذية السليمة؟",
        expectedTopics: ["تغذية", "فيتامينات", "بروتين", "صحة", "وجبات"],
        language: "arabic"
      }
    ];
  }

  async testQuestion(question: TestQuestion): Promise<TestResult> {
    console.log(`\n🔍 Testing: ${question.subject} - Grade ${question.grade}`);
    console.log(`❓ Question: ${question.question}`);
    
    try {
      // Search for relevant documents
      const docs = await this.vectorStore.similaritySearch(question.question, 5);
      
      if (!docs || docs.length === 0) {
        return {
          question,
          retrievedDocs: [],
          relevanceScore: 0,
          foundTopics: [],
          passed: false,
          summary: "No documents retrieved"
        };
      }

      // Analyze retrieved documents
      const combinedText = docs.map(doc => doc.pageContent).join(' ').toLowerCase();
      const foundTopics = question.expectedTopics.filter(topic => 
        combinedText.includes(topic.toLowerCase())
      );
      
      const relevanceScore = foundTopics.length / question.expectedTopics.length;
      const passed = relevanceScore >= 0.3; // 30% topic match threshold

      console.log(`📚 Retrieved ${docs.length} documents`);
      console.log(`🎯 Found topics: ${foundTopics.join(', ')}`);
      console.log(`⭐ Relevance score: ${(relevanceScore * 100).toFixed(1)}%`);
      console.log(`${passed ? '✅ PASSED' : '❌ FAILED'}`);

      return {
        question,
        retrievedDocs: docs,
        relevanceScore,
        foundTopics,
        passed,
        summary: `Found ${foundTopics.length}/${question.expectedTopics.length} expected topics`
      };

    } catch (error) {
      console.error(`❌ Error testing question: ${error}`);
      return {
        question,
        retrievedDocs: [],
        relevanceScore: 0,
        foundTopics: [],
        passed: false,
        summary: `Error: ${error}`
      };
    }
  }

  async runAllTests(): Promise<void> {
    const questions = this.getTestQuestions();
    const results: TestResult[] = [];

    console.log(`🚀 Starting RAG testing with ${questions.length} questions`);
    console.log('='.repeat(60));

    for (const question of questions) {
      const result = await this.testQuestion(question);
      results.push(result);
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Generate summary report
    await this.generateReport(results);
  }

  async generateReport(results: TestResult[]): Promise<void> {
    const passed = results.filter(r => r.passed);
    const failed = results.filter(r => !r.passed);
    
    console.log('\n📊 TEST SUMMARY REPORT');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${results.length}`);
    console.log(`✅ Passed: ${passed.length} (${((passed.length / results.length) * 100).toFixed(1)}%)`);
    console.log(`❌ Failed: ${failed.length} (${((failed.length / results.length) * 100).toFixed(1)}%)`);
    
    // By Grade Analysis
    const gradeResults = new Map<number, { passed: number, total: number }>();
    results.forEach(r => {
      const grade = r.question.grade;
      const current = gradeResults.get(grade) || { passed: 0, total: 0 };
      current.total++;
      if (r.passed) current.passed++;
      gradeResults.set(grade, current);
    });

    console.log('\n📚 Results by Grade:');
    Array.from(gradeResults.entries()).sort().forEach(([grade, stats]) => {
      const percentage = ((stats.passed / stats.total) * 100).toFixed(1);
      console.log(`Grade ${grade}: ${stats.passed}/${stats.total} (${percentage}%)`);
    });

    // By Subject Analysis
    const subjectResults = new Map<string, { passed: number, total: number }>();
    results.forEach(r => {
      const subject = r.question.subject;
      const current = subjectResults.get(subject) || { passed: 0, total: 0 };
      current.total++;
      if (r.passed) current.passed++;
      subjectResults.set(subject, current);
    });

    console.log('\n🎓 Results by Subject:');
    Array.from(subjectResults.entries()).forEach(([subject, stats]) => {
      const percentage = ((stats.passed / stats.total) * 100).toFixed(1);
      console.log(`${subject}: ${stats.passed}/${stats.total} (${percentage}%)`);
    });

    // Failed Tests Details
    if (failed.length > 0) {
      console.log('\n❌ Failed Tests Details:');
      failed.forEach(r => {
        console.log(`- Grade ${r.question.grade} ${r.question.subject}: ${r.summary}`);
      });
    }

    // Top Performing Areas
    const avgScoreBySubject = new Map<string, number>();
    subjectResults.forEach((stats, subject) => {
      const subjectTests = results.filter(r => r.question.subject === subject);
      const avgScore = subjectTests.reduce((sum, r) => sum + r.relevanceScore, 0) / subjectTests.length;
      avgScoreBySubject.set(subject, avgScore);
    });

    console.log('\n🏆 Subject Performance (Average Relevance Score):');
    Array.from(avgScoreBySubject.entries())
      .sort((a, b) => b[1] - a[1])
      .forEach(([subject, score]) => {
        console.log(`${subject}: ${(score * 100).toFixed(1)}%`);
      });

    // Save detailed results
    const reportData = {
      timestamp: new Date().toISOString(),
      totalTests: results.length,
      passed: passed.length,
      failed: failed.length,
      passRate: (passed.length / results.length) * 100,
      gradeResults: Object.fromEntries(gradeResults),
      subjectResults: Object.fromEntries(subjectResults),
      detailedResults: results.map(r => ({
        id: r.question.id,
        grade: r.question.grade,
        subject: r.question.subject,
        question: r.question.question,
        passed: r.passed,
        relevanceScore: r.relevanceScore,
        foundTopics: r.foundTopics,
        expectedTopics: r.question.expectedTopics,
        summary: r.summary
      }))
    };

    await fs.writeFile(
      '/Users/stanhus/Documents/work/incept_service-ragbot/rag_test_results.json',
      JSON.stringify(reportData, null, 2)
    );

    console.log('\n💾 Detailed results saved to: rag_test_results.json');
  }
}

async function main() {
  const tester = new RAGTester();
  
  try {
    await tester.connect();
    await tester.runAllTests();
  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    await tester.disconnect();
  }
}

main().catch(console.error);
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

interface SubjectTest {
  subject: string;
  grade: number;
  testType: 'vocabulary' | 'concepts' | 'applications' | 'problem_solving';
  keywords: string[];
  description: string;
}

const subjectTests: SubjectTest[] = [
  // Arabic Language Tests
  {
    subject: "اللغة العربية",
    grade: 1,
    testType: "vocabulary",
    keywords: ["حروف", "كلمة", "جملة", "قراءة", "كتابة", "نطق"],
    description: "Basic Arabic language vocabulary for Grade 1"
  },
  {
    subject: "اللغة العربية",
    grade: 5,
    testType: "concepts",
    keywords: ["نحو", "صرف", "إعراب", "فاعل", "مفعول", "حال"],
    description: "Grammar concepts for Grade 5"
  },
  {
    subject: "اللغة العربية",
    grade: 10,
    testType: "applications",
    keywords: ["بلاغة", "تشبيه", "استعارة", "كناية", "أسلوب", "بيان"],
    description: "Advanced rhetoric and literary analysis"
  },

  // Mathematics Tests
  {
    subject: "الرياضيات",
    grade: 1,
    testType: "vocabulary",
    keywords: ["جمع", "طرح", "عدد", "رقم", "حساب", "عد"],
    description: "Basic arithmetic vocabulary"
  },
  {
    subject: "الرياضيات",
    grade: 5,
    testType: "concepts",
    keywords: ["كسر", "عشري", "نسبة", "تناسب", "هندسة", "مساحة"],
    description: "Fractions, decimals, and geometry concepts"
  },
  {
    subject: "الرياضيات",
    grade: 9,
    testType: "applications",
    keywords: ["جبر", "معادلة", "متباينة", "دالة", "رسم بياني", "إحصاء"],
    description: "Algebraic applications and statistics"
  },
  {
    subject: "الرياضيات",
    grade: 12,
    testType: "problem_solving",
    keywords: ["تفاضل", "تكامل", "نهاية", "مشتقة", "تطبيقات", "مسائل"],
    description: "Advanced calculus and problem solving"
  },

  // Science Tests
  {
    subject: "العلوم",
    grade: 2,
    testType: "vocabulary",
    keywords: ["حيوان", "نبات", "ماء", "هواء", "ضوء", "حرارة"],
    description: "Basic science vocabulary about living things and environment"
  },
  {
    subject: "العلوم",
    grade: 6,
    testType: "concepts",
    keywords: ["طاقة", "مادة", "تغيير", "تفاعل", "قوة", "حركة"],
    description: "Energy, matter, and forces concepts"
  },
  {
    subject: "الأحياء",
    grade: 8,
    testType: "concepts",
    keywords: ["خلية", "نسيج", "عضو", "جهاز", "وراثة", "تطور"],
    description: "Cell biology and genetics"
  },
  {
    subject: "الفيزياء",
    grade: 11,
    testType: "applications",
    keywords: ["موجة", "ضوء", "صوت", "كهرباء", "مغناطيس", "قوانين"],
    description: "Wave physics and electromagnetic concepts"
  },
  {
    subject: "الكيمياء",
    grade: 10,
    testType: "concepts",
    keywords: ["ذرة", "عنصر", "مركب", "تفاعل", "حمض", "قاعدة"],
    description: "Atomic structure and chemical reactions"
  },

  // Islamic Studies Tests
  {
    subject: "التربية الإسلامية",
    grade: 2,
    testType: "vocabulary",
    keywords: ["صلاة", "وضوء", "قرآن", "حديث", "نبي", "صحابة"],
    description: "Basic Islamic terms and practices"
  },
  {
    subject: "التربية الإسلامية",
    grade: 6,
    testType: "concepts",
    keywords: ["عبادة", "أخلاق", "سيرة", "فقه", "عقيدة", "شريعة"],
    description: "Islamic worship, ethics, and jurisprudence"
  },
  {
    subject: "التاريخ الإسلامي",
    grade: 9,
    testType: "concepts",
    keywords: ["خلافة", "فتوحات", "حضارة", "علماء", "مدن", "ثقافة"],
    description: "Islamic civilization and history"
  },

  // Social Studies Tests
  {
    subject: "الدراسات الاجتماعية",
    grade: 4,
    testType: "vocabulary",
    keywords: ["عائلة", "مجتمع", "وطن", "ثقافة", "تقاليد", "عادات"],
    description: "Family, community, and cultural concepts"
  },
  {
    subject: "الجغرافيا",
    grade: 7,
    testType: "concepts",
    keywords: ["قارة", "محيط", "مناخ", "تضاريس", "سكان", "موارد"],
    description: "Physical and human geography"
  },
  {
    subject: "الجغرافيا",
    grade: 11,
    testType: "applications",
    keywords: ["اقتصاد", "تنمية", "بيئة", "تلوث", "استدامة", "تخطيط"],
    description: "Economic geography and environmental planning"
  },

  // English Language Tests
  {
    subject: "اللغة الإنجليزية",
    grade: 5,
    testType: "vocabulary",
    keywords: ["english", "vocabulary", "grammar", "reading", "writing", "speaking"],
    description: "Basic English language skills"
  },
  {
    subject: "اللغة الإنجليزية",
    grade: 10,
    testType: "concepts",
    keywords: ["tenses", "passive", "conditional", "reported speech", "literature", "essay"],
    description: "Advanced grammar and literature"
  },

  // Technology Tests
  {
    subject: "تقنية المعلومات",
    grade: 8,
    testType: "vocabulary",
    keywords: ["حاسوب", "برمجة", "شبكة", "إنترنت", "ملف", "برنامج"],
    description: "Computer and technology terminology"
  },
  {
    subject: "تقنية المعلومات",
    grade: 11,
    testType: "applications",
    keywords: ["قاعدة بيانات", "تطبيق", "موقع", "أمان", "شفرة", "خوارزمية"],
    description: "Database, applications, and programming concepts"
  }
];

class SubjectSpecificTester {
  private client: MongoClient;
  private db: any;
  private dataCollection: any;

  constructor() {
    this.client = new MongoClient(process.env.MONGODB_URI!);
  }

  async connect() {
    await this.client.connect();
    this.db = this.client.db('chatter');
    this.dataCollection = this.db.collection('training_data');
    console.log('✅ Connected for subject-specific testing');
  }

  async disconnect() {
    await this.client.close();
  }

  async testSubjectKnowledge(test: SubjectTest): Promise<any> {
    console.log(`\n📚 Subject: ${test.subject} | Grade: ${test.grade}`);
    console.log(`🔍 Test Type: ${test.testType}`);
    console.log(`📝 Description: ${test.description}`);

    let foundKeywords = 0;
    let totalChunks = 0;
    const foundContent: any[] = [];

    for (const keyword of test.keywords) {
      const chunks = await this.dataCollection.find({
        text: { $regex: keyword, $options: 'i' }
      }).limit(5).toArray();

      if (chunks.length > 0) {
        foundKeywords++;
        totalChunks += chunks.length;
        foundContent.push({
          keyword,
          chunks: chunks.length,
          bestMatch: chunks[0]
        });
        console.log(`  ✅ "${keyword}": ${chunks.length} chunks`);
      } else {
        console.log(`  ❌ "${keyword}": No content found`);
      }
    }

    const keywordCoverage = (foundKeywords / test.keywords.length) * 100;
    
    console.log(`📊 Keyword Coverage: ${foundKeywords}/${test.keywords.length} (${keywordCoverage.toFixed(1)}%)`);
    console.log(`📦 Total Chunks Found: ${totalChunks}`);

    // Show best matches
    if (foundContent.length > 0) {
      console.log(`💡 Sample Content:`);
      const sample = foundContent[0].bestMatch;
      const preview = sample.text.substring(0, 100).replace(/\s+/g, ' ');
      console.log(`   "${preview}..."`);
      console.log(`   Source: ${sample.source || 'Unknown'}`);
    }

    let status = '';
    if (keywordCoverage >= 90) {
      status = '🌟 EXCELLENT';
    } else if (keywordCoverage >= 70) {
      status = '✅ GOOD';
    } else if (keywordCoverage >= 50) {
      status = '⚠️  FAIR';
    } else if (keywordCoverage >= 30) {
      status = '🔶 POOR';
    } else {
      status = '❌ MISSING';
    }

    console.log(`🏆 Status: ${status}`);

    return {
      subject: test.subject,
      grade: test.grade,
      testType: test.testType,
      keywordCoverage,
      foundKeywords,
      totalKeywords: test.keywords.length,
      totalChunks,
      status,
      foundContent
    };
  }

  async runSubjectSpecificTests() {
    console.log('🎯 Starting Subject-Specific Knowledge Testing');
    console.log('📋 Testing curriculum depth across subjects and grades');
    console.log('=' .repeat(60));

    const results: any[] = [];

    // Group by subject for organized testing
    const testsBySubject = subjectTests.reduce((acc, test) => {
      if (!acc[test.subject]) acc[test.subject] = [];
      acc[test.subject].push(test);
      return acc;
    }, {} as {[key: string]: SubjectTest[]});

    for (const [subject, tests] of Object.entries(testsBySubject)) {
      console.log(`\n🏛️  === ${subject.toUpperCase()} TESTING ===`);
      
      for (const test of tests) {
        const result = await this.testSubjectKnowledge(test);
        results.push(result);
        
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 800));
      }
    }

    // Generate subject analysis report
    await this.generateSubjectReport(results);
  }

  async generateSubjectReport(results: any[]) {
    console.log('\n📈 SUBJECT-SPECIFIC ANALYSIS REPORT');
    console.log('=' .repeat(60));

    // Overall statistics
    const totalTests = results.length;
    const excellentTests = results.filter(r => r.keywordCoverage >= 90).length;
    const goodTests = results.filter(r => r.keywordCoverage >= 70).length;
    const fairTests = results.filter(r => r.keywordCoverage >= 50).length;
    const poorTests = results.filter(r => r.keywordCoverage >= 30).length;
    const missingTests = results.filter(r => r.keywordCoverage < 30).length;

    console.log(`📊 Test Distribution:`);
    console.log(`   🌟 Excellent (90%+): ${excellentTests}/${totalTests}`);
    console.log(`   ✅ Good (70-89%): ${goodTests}/${totalTests}`);
    console.log(`   ⚠️  Fair (50-69%): ${fairTests}/${totalTests}`);
    console.log(`   🔶 Poor (30-49%): ${poorTests}/${totalTests}`);
    console.log(`   ❌ Missing (<30%): ${missingTests}/${totalTests}`);

    // Subject-wise performance
    console.log('\n📚 SUBJECT PERFORMANCE:');
    const subjectPerformance = new Map<string, {tests: number, avgCoverage: number, totalChunks: number}>();
    
    results.forEach(result => {
      const current = subjectPerformance.get(result.subject) || {tests: 0, avgCoverage: 0, totalChunks: 0};
      current.tests++;
      current.avgCoverage += result.keywordCoverage;
      current.totalChunks += result.totalChunks;
      subjectPerformance.set(result.subject, current);
    });

    Array.from(subjectPerformance.entries())
      .sort((a, b) => (b[1].avgCoverage / b[1].tests) - (a[1].avgCoverage / a[1].tests))
      .forEach(([subject, stats]) => {
        const avgCoverage = (stats.avgCoverage / stats.tests).toFixed(1);
        console.log(`${subject}: ${avgCoverage}% avg coverage (${stats.totalChunks} chunks across ${stats.tests} tests)`);
      });

    // Grade progression analysis
    console.log('\n🎓 GRADE PROGRESSION:');
    const gradeProgression = new Map<number, {tests: number, avgCoverage: number}>();
    
    results.forEach(result => {
      const current = gradeProgression.get(result.grade) || {tests: 0, avgCoverage: 0};
      current.tests++;
      current.avgCoverage += result.keywordCoverage;
      gradeProgression.set(result.grade, current);
    });

    Array.from(gradeProgression.entries())
      .sort()
      .forEach(([grade, stats]) => {
        const avgCoverage = (stats.avgCoverage / stats.tests).toFixed(1);
        console.log(`Grade ${grade}: ${avgCoverage}% avg coverage (${stats.tests} tests)`);
      });

    // Test type analysis
    console.log('\n🔬 TEST TYPE ANALYSIS:');
    const testTypeAnalysis = new Map<string, {tests: number, avgCoverage: number}>();
    
    results.forEach(result => {
      const current = testTypeAnalysis.get(result.testType) || {tests: 0, avgCoverage: 0};
      current.tests++;
      current.avgCoverage += result.keywordCoverage;
      testTypeAnalysis.set(result.testType, current);
    });

    Array.from(testTypeAnalysis.entries()).forEach(([testType, stats]) => {
      const avgCoverage = (stats.avgCoverage / stats.tests).toFixed(1);
      console.log(`${testType}: ${avgCoverage}% avg coverage (${stats.tests} tests)`);
    });

    // Strengths and weaknesses
    console.log('\n🌟 CURRICULUM STRENGTHS:');
    results.filter(r => r.keywordCoverage >= 80)
      .sort((a, b) => b.keywordCoverage - a.keywordCoverage)
      .slice(0, 5)
      .forEach(result => {
        console.log(`- ${result.subject} Grade ${result.grade} (${result.testType}): ${result.keywordCoverage.toFixed(1)}%`);
      });

    console.log('\n🔴 AREAS FOR IMPROVEMENT:');
    results.filter(r => r.keywordCoverage < 50)
      .sort((a, b) => a.keywordCoverage - b.keywordCoverage)
      .slice(0, 5)
      .forEach(result => {
        console.log(`- ${result.subject} Grade ${result.grade} (${result.testType}): ${result.keywordCoverage.toFixed(1)}%`);
      });

    console.log('\n💾 Subject-specific test results completed!');
  }
}

async function main() {
  const tester = new SubjectSpecificTester();
  
  try {
    await tester.connect();
    await tester.runSubjectSpecificTests();
  } catch (error) {
    console.error('❌ Subject testing failed:', error);
  } finally {
    await tester.disconnect();
  }
}

main().catch(console.error);
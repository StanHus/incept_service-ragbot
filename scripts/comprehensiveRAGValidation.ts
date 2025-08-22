import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

interface ComprehensiveTest {
  grade: number;
  subject: string;
  chapter: string;
  question: string;
  expectedContent: string[];
  difficulty: 'basic' | 'intermediate' | 'advanced';
  type: 'definition' | 'explanation' | 'application' | 'analysis';
}

const comprehensiveTests: ComprehensiveTest[] = [
  // Grade 1 Tests
  {
    grade: 1,
    subject: "اللغة العربية",
    chapter: "الحروف الأبجدية",
    question: "ما هي الحروف الثلاثة الأولى في الأبجدية العربية؟",
    expectedContent: ["ألف", "باء", "تاء", "حروف", "أبجدية"],
    difficulty: "basic",
    type: "definition"
  },
  {
    grade: 1,
    subject: "الرياضيات",
    chapter: "الأرقام",
    question: "كيف نكتب الرقم خمسة؟",
    expectedContent: ["خمسة", "٥", "5", "رقم", "عدد"],
    difficulty: "basic",
    type: "application"
  },
  {
    grade: 1,
    subject: "العلوم",
    chapter: "الكائنات الحية",
    question: "ما الفرق بين النبات والحيوان؟",
    expectedContent: ["نبات", "حيوان", "كائن حي", "حركة", "غذاء"],
    difficulty: "basic",
    type: "explanation"
  },
  {
    grade: 1,
    subject: "التربية الإسلامية",
    chapter: "الوضوء",
    question: "كيف نتوضأ؟",
    expectedContent: ["وضوء", "طهارة", "ماء", "وجه", "يدين"],
    difficulty: "basic",
    type: "application"
  },

  // Grade 2 Tests
  {
    grade: 2,
    subject: "اللغة العربية",
    chapter: "الكلمة والجملة",
    question: "ما هي الكلمة وما هي الجملة؟",
    expectedContent: ["كلمة", "جملة", "معنى", "حروف", "تركيب"],
    difficulty: "basic",
    type: "definition"
  },
  {
    grade: 2,
    subject: "الرياضيات",
    chapter: "الجمع والطرح",
    question: "كيف نجمع ونطرح الأرقام؟",
    expectedContent: ["جمع", "طرح", "عملية", "حساب", "نتيجة"],
    difficulty: "basic",
    type: "application"
  },
  {
    grade: 2,
    subject: "العلوم",
    chapter: "حواس الإنسان",
    question: "ما هي الحواس الخمس؟",
    expectedContent: ["حواس", "نظر", "سمع", "شم", "ذوق", "لمس"],
    difficulty: "basic",
    type: "definition"
  },
  {
    grade: 2,
    subject: "التربية الإسلامية",
    chapter: "أركان الإسلام",
    question: "ما هي أركان الإسلام الخمسة؟",
    expectedContent: ["شهادة", "صلاة", "زكاة", "صوم", "حج", "أركان"],
    difficulty: "basic",
    type: "definition"
  },

  // Grade 3 Tests
  {
    grade: 3,
    subject: "اللغة العربية",
    chapter: "القراءة والفهم",
    question: "كيف نفهم معنى النص؟",
    expectedContent: ["قراءة", "فهم", "معنى", "نص", "تفكير"],
    difficulty: "intermediate",
    type: "explanation"
  },
  {
    grade: 3,
    subject: "الرياضيات",
    chapter: "الضرب والقسمة",
    question: "ما هي عملية الضرب؟",
    expectedContent: ["ضرب", "قسمة", "جدول", "عملية", "رقم"],
    difficulty: "intermediate",
    type: "explanation"
  },
  {
    grade: 3,
    subject: "العلوم",
    chapter: "دورة الحياة",
    question: "كيف تنمو النباتات؟",
    expectedContent: ["نمو", "بذرة", "شجرة", "ماء", "ضوء", "تربة"],
    difficulty: "intermediate",
    type: "explanation"
  },
  {
    grade: 3,
    subject: "الدراسات الاجتماعية",
    chapter: "العائلة والمجتمع",
    question: "ما هي أفراد العائلة؟",
    expectedContent: ["عائلة", "أب", "أم", "أطفال", "مجتمع"],
    difficulty: "basic",
    type: "definition"
  },

  // Grade 4 Tests
  {
    grade: 4,
    subject: "اللغة العربية",
    chapter: "النحو والصرف",
    question: "ما هي أنواع الكلمة في اللغة العربية؟",
    expectedContent: ["اسم", "فعل", "حرف", "كلمة", "نحو"],
    difficulty: "intermediate",
    type: "definition"
  },
  {
    grade: 4,
    subject: "الرياضيات",
    chapter: "الكسور",
    question: "ما هو الكسر وكيف نكتبه؟",
    expectedContent: ["كسر", "بسط", "مقام", "جزء", "عدد"],
    difficulty: "intermediate",
    type: "definition"
  },
  {
    grade: 4,
    subject: "العلوم",
    chapter: "الطقس والمناخ",
    question: "ما الفرق بين الطقس والمناخ؟",
    expectedContent: ["طقس", "مناخ", "حرارة", "أمطار", "رياح"],
    difficulty: "intermediate",
    type: "explanation"
  },
  {
    grade: 4,
    subject: "التربية الإسلامية",
    chapter: "الصلاة",
    question: "كيف نؤدي الصلاة؟",
    expectedContent: ["صلاة", "ركعة", "سجود", "ركوع", "تكبير"],
    difficulty: "intermediate",
    type: "application"
  },

  // Grade 5 Tests
  {
    grade: 5,
    subject: "اللغة العربية",
    chapter: "الأدب والشعر",
    question: "ما هو الشعر وما هي أجزاؤه؟",
    expectedContent: ["شعر", "بيت", "شطر", "قافية", "بحر"],
    difficulty: "intermediate",
    type: "definition"
  },
  {
    grade: 5,
    subject: "الرياضيات",
    chapter: "الهندسة",
    question: "كيف نحسب مساحة المستطيل؟",
    expectedContent: ["مساحة", "مستطيل", "طول", "عرض", "ضرب"],
    difficulty: "intermediate",
    type: "application"
  },
  {
    grade: 5,
    subject: "العلوم",
    chapter: "جسم الإنسان",
    question: "ما هي أجهزة جسم الإنسان؟",
    expectedContent: ["جهاز", "هضم", "تنفس", "دوران", "عصبي"],
    difficulty: "intermediate",
    type: "definition"
  },
  {
    grade: 5,
    subject: "الدراسات الاجتماعية",
    chapter: "دول الخليج",
    question: "ما هي دول مجلس التعاون الخليجي؟",
    expectedContent: ["الكويت", "السعودية", "الإمارات", "قطر", "البحرين", "عمان"],
    difficulty: "basic",
    type: "definition"
  },

  // Grade 6 Tests
  {
    grade: 6,
    subject: "اللغة العربية",
    chapter: "البلاغة",
    question: "ما هو التشبيه في الأدب؟",
    expectedContent: ["تشبيه", "مشبه", "مشبه به", "أداة", "وجه شبه"],
    difficulty: "intermediate",
    type: "definition"
  },
  {
    grade: 6,
    subject: "الرياضيات",
    chapter: "النسب والتناسب",
    question: "ما هي النسبة والتناسب؟",
    expectedContent: ["نسبة", "تناسب", "كسر", "مقارنة", "تساوي"],
    difficulty: "intermediate",
    type: "definition"
  },
  {
    grade: 6,
    subject: "العلوم",
    chapter: "الطاقة والحركة",
    question: "ما هي أنواع الطاقة؟",
    expectedContent: ["طاقة", "حركة", "حرارة", "ضوء", "صوت"],
    difficulty: "intermediate",
    type: "definition"
  },
  {
    grade: 6,
    subject: "القرآن الكريم",
    chapter: "التلاوة والتجويد",
    question: "ما هي آداب تلاوة القرآن؟",
    expectedContent: ["تلاوة", "تجويد", "وضوء", "قبلة", "احترام"],
    difficulty: "intermediate",
    type: "application"
  },

  // Grade 7 Tests
  {
    grade: 7,
    subject: "اللغة العربية",
    chapter: "النقد الأدبي",
    question: "كيف نحلل النص الأدبي؟",
    expectedContent: ["تحليل", "نقد", "أسلوب", "معنى", "جمال"],
    difficulty: "advanced",
    type: "analysis"
  },
  {
    grade: 7,
    subject: "الرياضيات",
    chapter: "الجبر",
    question: "ما هي المتغيرات في الجبر؟",
    expectedContent: ["متغير", "معادلة", "حل", "جبر", "رمز"],
    difficulty: "advanced",
    type: "definition"
  },
  {
    grade: 7,
    subject: "الأحياء",
    chapter: "الخلية",
    question: "ما هي أجزاء الخلية النباتية؟",
    expectedContent: ["خلية", "نواة", "سيتوبلازم", "جدار خلوي", "بلاستيدات"],
    difficulty: "advanced",
    type: "definition"
  },
  {
    grade: 7,
    subject: "التاريخ الإسلامي",
    chapter: "العصر النبوي",
    question: "ما هي أهم أحداث السيرة النبوية؟",
    expectedContent: ["سيرة", "نبوي", "هجرة", "غزوات", "فتح مكة"],
    difficulty: "intermediate",
    type: "definition"
  },

  // Grade 8 Tests
  {
    grade: 8,
    subject: "اللغة العربية",
    chapter: "قواعد النحو المتقدمة",
    question: "ما هي علامات الإعراب؟",
    expectedContent: ["إعراب", "ضمة", "فتحة", "كسرة", "سكون"],
    difficulty: "advanced",
    type: "definition"
  },
  {
    grade: 8,
    subject: "الرياضيات",
    chapter: "الهندسة التحليلية",
    question: "كيف نجد معادلة الخط المستقيم؟",
    expectedContent: ["معادلة", "خط مستقيم", "ميل", "نقطة", "إحداثيات"],
    difficulty: "advanced",
    type: "application"
  },
  {
    grade: 8,
    subject: "الفيزياء",
    chapter: "الحركة والقوة",
    question: "ما هو قانون نيوتن الأول؟",
    expectedContent: ["نيوتن", "قانون", "قصور", "حركة", "قوة"],
    difficulty: "advanced",
    type: "definition"
  },
  {
    grade: 8,
    subject: "الكيمياء",
    chapter: "التفاعلات الكيميائية",
    question: "ما هي أنواع التفاعلات الكيميائية؟",
    expectedContent: ["تفاعل", "كيميائي", "أكسدة", "اختزال", "تركيب"],
    difficulty: "advanced",
    type: "definition"
  },

  // Grade 9 Tests
  {
    grade: 9,
    subject: "اللغة العربية",
    chapter: "الأدب الحديث",
    question: "ما هي خصائص الشعر الحديث؟",
    expectedContent: ["شعر حديث", "تجديد", "موضوعات", "أسلوب", "تطور"],
    difficulty: "advanced",
    type: "analysis"
  },
  {
    grade: 9,
    subject: "الرياضيات",
    chapter: "المثلثات",
    question: "ما هي النسب المثلثية؟",
    expectedContent: ["مثلث", "جيب", "جيب تمام", "ظل", "زاوية"],
    difficulty: "advanced",
    type: "definition"
  },
  {
    grade: 9,
    subject: "الأحياء",
    chapter: "الوراثة",
    question: "كيف تنتقل الصفات الوراثية؟",
    expectedContent: ["وراثة", "جينات", "كروموسومات", "صفات", "انتقال"],
    difficulty: "advanced",
    type: "explanation"
  },
  {
    grade: 9,
    subject: "الجغرافيا",
    chapter: "المناخ والطقس",
    question: "ما هي العوامل المؤثرة في المناخ؟",
    expectedContent: ["مناخ", "عوامل", "حرارة", "رطوبة", "موقع"],
    difficulty: "advanced",
    type: "explanation"
  },

  // Grade 10 Tests
  {
    grade: 10,
    subject: "اللغة العربية",
    chapter: "فنون البلاغة",
    question: "ما هي أنواع البديع في البلاغة؟",
    expectedContent: ["بديع", "جناس", "طباق", "سجع", "بلاغة"],
    difficulty: "advanced",
    type: "definition"
  },
  {
    grade: 10,
    subject: "الرياضيات",
    chapter: "التفاضل والتكامل",
    question: "ما هو مفهوم النهاية؟",
    expectedContent: ["نهاية", "تفاضل", "تكامل", "دالة", "حد"],
    difficulty: "advanced",
    type: "definition"
  },
  {
    grade: 10,
    subject: "الفيزياء",
    chapter: "الكهرباء والمغناطيسية",
    question: "ما هو قانون أوم؟",
    expectedContent: ["أوم", "تيار", "جهد", "مقاومة", "كهرباء"],
    difficulty: "advanced",
    type: "definition"
  },
  {
    grade: 10,
    subject: "اللغة الإنجليزية",
    chapter: "Grammar",
    question: "What are the main tenses in English?",
    expectedContent: ["present", "past", "future", "tense", "grammar"],
    difficulty: "intermediate",
    type: "definition"
  },

  // Grade 11 Tests
  {
    grade: 11,
    subject: "اللغة العربية",
    chapter: "الأدب الجاهلي",
    question: "ما هي خصائص الشعر الجاهلي؟",
    expectedContent: ["جاهلي", "معلقات", "فروسية", "طبيعة", "بداوة"],
    difficulty: "advanced",
    type: "analysis"
  },
  {
    grade: 11,
    subject: "الرياضيات",
    chapter: "المتتاليات والمتسلسلات",
    question: "ما هي المتتالية الحسابية؟",
    expectedContent: ["متتالية", "حسابية", "أساس", "حد", "مجموع"],
    difficulty: "advanced",
    type: "definition"
  },
  {
    grade: 11,
    subject: "الفيزياء",
    chapter: "البصريات",
    question: "كيف تتكون الصورة في العدسة؟",
    expectedContent: ["عدسة", "صورة", "انكسار", "بؤرة", "ضوء"],
    difficulty: "advanced",
    type: "explanation"
  },
  {
    grade: 11,
    subject: "التاريخ الإسلامي",
    chapter: "العصر العباسي",
    question: "ما هي أهم إنجازات العصر العباسي؟",
    expectedContent: ["عباسي", "خلافة", "بغداد", "ترجمة", "علوم"],
    difficulty: "advanced",
    type: "explanation"
  },

  // Grade 12 Tests
  {
    grade: 12,
    subject: "اللغة العربية",
    chapter: "الأدب المعاصر",
    question: "ما هي اتجاهات الأدب العربي المعاصر؟",
    expectedContent: ["أدب معاصر", "تجديد", "واقعية", "رمزية", "حداثة"],
    difficulty: "advanced",
    type: "analysis"
  },
  {
    grade: 12,
    subject: "الرياضيات",
    chapter: "الإحصاء والاحتمالات",
    question: "ما هي قوانين الاحتمال؟",
    expectedContent: ["احتمال", "إحصاء", "عينة", "توزيع", "متوسط"],
    difficulty: "advanced",
    type: "definition"
  },
  {
    grade: 12,
    subject: "الفيزياء",
    chapter: "الفيزياء الحديثة",
    question: "ما هي نظرية النسبية؟",
    expectedContent: ["نسبية", "أينشتاين", "طاقة", "كتلة", "سرعة الضوء"],
    difficulty: "advanced",
    type: "explanation"
  },
  {
    grade: 12,
    subject: "الكيمياء",
    chapter: "الكيمياء العضوية",
    question: "ما هي خصائص المركبات العضوية؟",
    expectedContent: ["عضوية", "كربون", "هيدروكربونات", "مجموعات وظيفية", "تفاعلات"],
    difficulty: "advanced",
    type: "explanation"
  },
  {
    grade: 12,
    subject: "الجغرافيا",
    chapter: "الجغرافيا الاقتصادية",
    question: "ما هي أنواع الأنشطة الاقتصادية؟",
    expectedContent: ["اقتصاد", "زراعة", "صناعة", "خدمات", "تجارة"],
    difficulty: "advanced",
    type: "definition"
  }
];

class ComprehensiveRAGValidator {
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
    console.log('✅ Connected to MongoDB for comprehensive RAG validation');
  }

  async disconnect() {
    await this.client.close();
    console.log('👋 Disconnected from MongoDB');
  }

  async validateSingleTest(test: ComprehensiveTest): Promise<any> {
    console.log(`\n🎓 Grade ${test.grade} - ${test.subject}`);
    console.log(`📚 Chapter: ${test.chapter}`);
    console.log(`❓ Question: ${test.question}`);
    console.log(`🎯 Difficulty: ${test.difficulty} | Type: ${test.type}`);

    let totalMatches = 0;
    let relevantChunks: any[] = [];
    
    // Search for each expected content piece
    for (const content of test.expectedContent) {
      const chunks = await this.dataCollection.find({
        text: { $regex: content, $options: 'i' }
      }).limit(3).toArray();
      
      if (chunks.length > 0) {
        totalMatches++;
        relevantChunks.push(...chunks.slice(0, 1)); // Add one chunk per content
      }
    }

    const coverageScore = (totalMatches / test.expectedContent.length) * 100;
    
    console.log(`📊 Content Coverage: ${totalMatches}/${test.expectedContent.length} (${coverageScore.toFixed(1)}%)`);
    console.log(`📝 Relevant Chunks Found: ${relevantChunks.length}`);
    
    if (relevantChunks.length > 0) {
      const bestChunk = relevantChunks[0];
      const preview = bestChunk.text.substring(0, 120).replace(/\s+/g, ' ');
      console.log(`💡 Best Match Preview: "${preview}..."`);
      console.log(`📖 Source: ${bestChunk.source || 'Unknown'}`);
    }

    let status = '';
    if (coverageScore >= 80) {
      status = '🌟 EXCELLENT';
    } else if (coverageScore >= 60) {
      status = '✅ GOOD';
    } else if (coverageScore >= 40) {
      status = '⚠️  FAIR';
    } else if (coverageScore >= 20) {
      status = '🔶 POOR';
    } else {
      status = '❌ MISSING';
    }
    
    console.log(`🏆 Status: ${status}`);
    
    return {
      grade: test.grade,
      subject: test.subject,
      chapter: test.chapter,
      question: test.question,
      difficulty: test.difficulty,
      type: test.type,
      coverageScore,
      totalMatches,
      expectedCount: test.expectedContent.length,
      relevantChunks: relevantChunks.length,
      status,
      bestMatch: relevantChunks.length > 0 ? relevantChunks[0].source : null
    };
  }

  async runComprehensiveValidation() {
    console.log('🚀 Starting Comprehensive RAG Validation');
    console.log('📋 Testing Kuwaiti School Curriculum (Grades 1-12)');
    console.log('=' .repeat(70));
    
    const results: any[] = [];
    let totalTests = 0;
    let passedTests = 0;
    
    // Group tests by grade for better organization
    const testsByGrade = comprehensiveTests.reduce((acc, test) => {
      if (!acc[test.grade]) acc[test.grade] = [];
      acc[test.grade].push(test);
      return acc;
    }, {} as {[key: number]: ComprehensiveTest[]});

    for (let grade = 1; grade <= 12; grade++) {
      if (testsByGrade[grade]) {
        console.log(`\n🎒 === GRADE ${grade} VALIDATION ===`);
        
        for (const test of testsByGrade[grade]) {
          const result = await this.validateSingleTest(test);
          results.push(result);
          totalTests++;
          
          if (result.coverageScore >= 40) { // 40% threshold for passing
            passedTests++;
          }
          
          // Small delay between tests
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    }

    // Generate comprehensive report
    await this.generateComprehensiveReport(results, totalTests, passedTests);
  }

  async generateComprehensiveReport(results: any[], totalTests: number, passedTests: number) {
    console.log('\n📈 COMPREHENSIVE VALIDATION REPORT');
    console.log('=' .repeat(70));
    
    const overallPassRate = (passedTests / totalTests) * 100;
    console.log(`📊 Overall Results: ${passedTests}/${totalTests} tests passed (${overallPassRate.toFixed(1)}%)`);
    
    // Grade-wise analysis
    console.log('\n🎓 GRADE-WISE ANALYSIS:');
    const gradeStats = new Map<number, {passed: number, total: number, avgScore: number}>();
    
    results.forEach(result => {
      const grade = result.grade;
      const current = gradeStats.get(grade) || {passed: 0, total: 0, avgScore: 0};
      current.total++;
      current.avgScore += result.coverageScore;
      if (result.coverageScore >= 40) current.passed++;
      gradeStats.set(grade, current);
    });
    
    Array.from(gradeStats.entries()).sort().forEach(([grade, stats]) => {
      const passRate = (stats.passed / stats.total) * 100;
      const avgScore = (stats.avgScore / stats.total).toFixed(1);
      console.log(`Grade ${grade}: ${stats.passed}/${stats.total} (${passRate.toFixed(1)}%) - Avg Score: ${avgScore}%`);
    });

    // Subject-wise analysis
    console.log('\n📚 SUBJECT-WISE ANALYSIS:');
    const subjectStats = new Map<string, {passed: number, total: number, avgScore: number}>();
    
    results.forEach(result => {
      const subject = result.subject;
      const current = subjectStats.get(subject) || {passed: 0, total: 0, avgScore: 0};
      current.total++;
      current.avgScore += result.coverageScore;
      if (result.coverageScore >= 40) current.passed++;
      subjectStats.set(subject, current);
    });
    
    Array.from(subjectStats.entries()).forEach(([subject, stats]) => {
      const passRate = (stats.passed / stats.total) * 100;
      const avgScore = (stats.avgScore / stats.total).toFixed(1);
      console.log(`${subject}: ${stats.passed}/${stats.total} (${passRate.toFixed(1)}%) - Avg Score: ${avgScore}%`);
    });

    // Difficulty analysis
    console.log('\n🎯 DIFFICULTY ANALYSIS:');
    const difficultyStats = new Map<string, {passed: number, total: number, avgScore: number}>();
    
    results.forEach(result => {
      const difficulty = result.difficulty;
      const current = difficultyStats.get(difficulty) || {passed: 0, total: 0, avgScore: 0};
      current.total++;
      current.avgScore += result.coverageScore;
      if (result.coverageScore >= 40) current.passed++;
      difficultyStats.set(difficulty, current);
    });
    
    Array.from(difficultyStats.entries()).forEach(([difficulty, stats]) => {
      const passRate = (stats.passed / stats.total) * 100;
      const avgScore = (stats.avgScore / stats.total).toFixed(1);
      console.log(`${difficulty}: ${stats.passed}/${stats.total} (${passRate.toFixed(1)}%) - Avg Score: ${avgScore}%`);
    });

    // Top performing areas
    console.log('\n🌟 TOP PERFORMING AREAS:');
    const excellent = results.filter(r => r.coverageScore >= 80).slice(0, 5);
    excellent.forEach(result => {
      console.log(`- Grade ${result.grade} ${result.subject}: ${result.coverageScore.toFixed(1)}% (${result.chapter})`);
    });

    // Areas needing improvement
    console.log('\n🔴 AREAS NEEDING IMPROVEMENT:');
    const needsWork = results.filter(r => r.coverageScore < 40).slice(0, 5);
    needsWork.forEach(result => {
      console.log(`- Grade ${result.grade} ${result.subject}: ${result.coverageScore.toFixed(1)}% (${result.chapter})`);
    });

    // Overall assessment
    console.log('\n🎯 OVERALL ASSESSMENT:');
    if (overallPassRate >= 80) {
      console.log('🌟 EXCELLENT: Curriculum coverage is comprehensive across grades and subjects');
    } else if (overallPassRate >= 60) {
      console.log('✅ GOOD: Strong curriculum foundation with some gaps to address');
    } else if (overallPassRate >= 40) {
      console.log('⚠️  FAIR: Partial coverage - needs significant content improvement');
    } else {
      console.log('❌ POOR: Insufficient curriculum coverage - major gaps exist');
    }

    // Save detailed report
    const detailedReport = {
      timestamp: new Date().toISOString(),
      totalTests,
      passedTests,
      overallPassRate,
      gradeStats: Object.fromEntries(gradeStats),
      subjectStats: Object.fromEntries(subjectStats),
      difficultyStats: Object.fromEntries(difficultyStats),
      detailedResults: results
    };

    console.log('\n💾 Detailed validation report saved to comprehensive_rag_validation.json');
  }
}

async function main() {
  const validator = new ComprehensiveRAGValidator();
  
  try {
    await validator.connect();
    await validator.runComprehensiveValidation();
  } catch (error) {
    console.error('❌ Validation failed:', error);
  } finally {
    await validator.disconnect();
  }
}

main().catch(console.error);
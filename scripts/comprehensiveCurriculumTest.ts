import fetch from 'node-fetch';
import { promises as fs } from 'fs';

interface CurriculumQuestion {
  id: string;
  grade: number;
  subject: string;
  chapter?: string;
  questionAR: string;
  questionEN?: string;
  expectedConcepts: string[];
  difficulty: 'basic' | 'intermediate' | 'advanced';
  questionType: 'definition' | 'explanation' | 'problem_solving' | 'analysis' | 'application';
}

interface TestResult {
  question: CurriculumQuestion;
  response: string;
  responseTime: number;
  foundConcepts: string[];
  conceptScore: number;
  qualityScore: number;
  passed: boolean;
  feedback: string;
}

class CurriculumTester {
  private results: TestResult[] = [];
  private apiUrl = 'http://localhost:3000/api/chat';

  // Comprehensive curriculum questions across all grades and subjects
  private getGrade1Questions(): CurriculumQuestion[] {
    return [
      {
        id: "ar1_letters_1",
        grade: 1,
        subject: "اللغة العربية",
        chapter: "الحروف الأبجدية",
        questionAR: "ما هي الحروف الثلاثة الأولى في الأبجدية العربية؟",
        expectedConcepts: ["ألف", "باء", "تاء", "حروف", "أبجدية"],
        difficulty: "basic",
        questionType: "definition"
      },
      {
        id: "ar1_letters_2", 
        grade: 1,
        subject: "اللغة العربية",
        questionAR: "كيف نكتب حرف الألف؟",
        expectedConcepts: ["ألف", "كتابة", "حرف", "شكل"],
        difficulty: "basic",
        questionType: "application"
      },
      {
        id: "math1_numbers_1",
        grade: 1, 
        subject: "الرياضيات",
        chapter: "الأرقام",
        questionAR: "عدّ من 1 إلى 5",
        expectedConcepts: ["واحد", "اثنان", "ثلاثة", "أربعة", "خمسة", "عد", "أرقام"],
        difficulty: "basic",
        questionType: "application"
      },
      {
        id: "math1_shapes_1",
        grade: 1,
        subject: "الرياضيات", 
        questionAR: "ما هو الشكل المستدير؟",
        expectedConcepts: ["دائرة", "مستدير", "شكل"],
        difficulty: "basic",
        questionType: "definition"
      },
      {
        id: "science1_animals_1",
        grade: 1,
        subject: "العلوم",
        questionAR: "ما هي أصوات الحيوانات؟ مثل صوت القط؟",
        expectedConcepts: ["حيوانات", "أصوات", "قط", "مواء"],
        difficulty: "basic", 
        questionType: "application"
      }
    ];
  }

  private getGrade2Questions(): CurriculumQuestion[] {
    return [
      {
        id: "ar2_reading_1",
        grade: 2,
        subject: "اللغة العربية", 
        questionAR: "كيف نقرأ الكلمات البسيطة مثل 'بيت' و 'قلم'؟",
        expectedConcepts: ["قراءة", "كلمات", "بيت", "قلم", "حروف"],
        difficulty: "basic",
        questionType: "application"
      },
      {
        id: "math2_addition_1",
        grade: 2,
        subject: "الرياضيات",
        questionAR: "ما هو ناتج 2 + 3؟",
        expectedConcepts: ["جمع", "اثنان", "ثلاثة", "خمسة", "ناتج"],
        difficulty: "basic",
        questionType: "problem_solving"
      },
      {
        id: "islamic2_pillars_1", 
        grade: 2,
        subject: "التربية الإسلامية",
        questionAR: "ما هي أركان الإسلام؟",
        expectedConcepts: ["شهادة", "صلاة", "زكاة", "صوم", "حج", "أركان الإسلام"],
        difficulty: "intermediate",
        questionType: "definition"
      }
    ];
  }

  private getGrade4Questions(): CurriculumQuestion[] {
    return [
      {
        id: "ar4_grammar_1",
        grade: 4,
        subject: "اللغة العربية",
        questionAR: "ما هي أنواع الكلمة في اللغة العربية؟",
        expectedConcepts: ["اسم", "فعل", "حرف", "كلمة", "أنواع"],
        difficulty: "intermediate",
        questionType: "definition"
      },
      {
        id: "math4_multiplication_1", 
        grade: 4,
        subject: "الرياضيات",
        questionAR: "ما هو جدول الضرب للرقم 4؟",
        expectedConcepts: ["ضرب", "جدول", "أربعة", "ثمانية", "اثنا عشر"],
        difficulty: "intermediate",
        questionType: "application"
      },
      {
        id: "science4_plants_1",
        grade: 4,
        subject: "العلوم", 
        questionAR: "ما هي أجزاء النبات ووظيفة كل جزء؟",
        expectedConcepts: ["جذور", "ساق", "أوراق", "زهرة", "وظيفة", "نبات"],
        difficulty: "intermediate",
        questionType: "explanation"
      }
    ];
  }

  private getGrade6Questions(): CurriculumQuestion[] {
    return [
      {
        id: "math6_fractions_1",
        grade: 6,
        subject: "الرياضيات",
        questionAR: "كيف نجمع الكسور؟ مثل 1/2 + 1/4؟",
        expectedConcepts: ["كسور", "جمع", "نصف", "ربع", "مقام مشترك"],
        difficulty: "intermediate", 
        questionType: "problem_solving"
      },
      {
        id: "social6_kuwait_1",
        grade: 6,
        subject: "الدراسات الاجتماعية",
        questionAR: "ما هي محافظات دولة الكويت؟",
        expectedConcepts: ["محافظات", "الكويت", "العاصمة", "حولي", "الأحمدي"],
        difficulty: "intermediate",
        questionType: "definition"
      },
      {
        id: "science6_body_1",
        grade: 6,
        subject: "العلوم",
        questionAR: "ما هي أجهزة الجسم الأساسية؟",
        expectedConcepts: ["جهاز هضمي", "جهاز تنفسي", "جهاز دوري", "أجهزة الجسم"],
        difficulty: "intermediate",
        questionType: "definition"
      }
    ];
  }

  private getGrade8Questions(): CurriculumQuestion[] {
    return [
      {
        id: "physics8_motion_1",
        grade: 8,
        subject: "الفيزياء",
        questionAR: "ما هو قانون نيوتن الأول للحركة؟",
        expectedConcepts: ["نيوتن", "قصور", "حركة", "سكون", "قوة"],
        difficulty: "advanced",
        questionType: "explanation"
      },
      {
        id: "chemistry8_elements_1", 
        grade: 8,
        subject: "الكيمياء",
        questionAR: "ما هي أول 10 عناصر في الجدول الدوري؟",
        expectedConcepts: ["هيدروجين", "هيليوم", "ليثيوم", "جدول دوري", "عناصر"],
        difficulty: "advanced",
        questionType: "definition"
      },
      {
        id: "biology8_cells_1",
        grade: 8, 
        subject: "الأحياء",
        questionAR: "ما هي مكونات الخلية النباتية؟",
        expectedConcepts: ["نواة", "سيتوبلازم", "جدار خلوي", "بلاستيدات خضراء", "خلية"],
        difficulty: "advanced",
        questionType: "definition"
      }
    ];
  }

  private getGrade10Questions(): CurriculumQuestion[] {
    return [
      {
        id: "arabic10_grammar_1",
        grade: 10,
        subject: "قواعد النحو والصرف",
        questionAR: "ما هي علامات الإعراب الأصلية والفرعية؟",
        expectedConcepts: ["إعراب", "ضمة", "فتحة", "كسرة", "علامات أصلية", "علامات فرعية"],
        difficulty: "advanced",
        questionType: "definition"
      },
      {
        id: "english10_tenses_1",
        grade: 10,
        subject: "اللغة الإنجليزية",
        questionAR: "What are the main verb tenses in English?",
        questionEN: "What are the main verb tenses in English?",
        expectedConcepts: ["present", "past", "future", "tense", "verbs"],
        difficulty: "intermediate",
        questionType: "definition"
      }
    ];
  }

  private getGrade11Questions(): CurriculumQuestion[] {
    return [
      {
        id: "history11_islamic_1",
        grade: 11,
        subject: "التاريخ الإسلامي", 
        questionAR: "ما هي أهم إنجازات العصر العباسي؟",
        expectedConcepts: ["عباسي", "بغداد", "بيت الحكمة", "ترجمة", "هارون الرشيد"],
        difficulty: "advanced",
        questionType: "analysis"
      },
      {
        id: "geography11_climate_1",
        grade: 11,
        subject: "الجغرافيا",
        questionAR: "ما هي خصائص المناخ الصحراوي في الخليج العربي؟",
        expectedConcepts: ["مناخ صحراوي", "حرارة عالية", "قلة أمطار", "خليج عربي"],
        difficulty: "advanced", 
        questionType: "explanation"
      }
    ];
  }

  private getGrade12Questions(): CurriculumQuestion[] {
    return [
      {
        id: "physics12_advanced_1",
        grade: 12,
        subject: "الفيزياء المتقدمة",
        questionAR: "اشرح قوانين الديناميكا الحرارية",
        expectedConcepts: ["قانون أول", "قانون ثاني", "إنتروبيا", "طاقة", "حرارة"],
        difficulty: "advanced",
        questionType: "explanation"
      },
      {
        id: "chemistry12_reactions_1",
        grade: 12,
        subject: "الكيمياء المتقدمة", 
        questionAR: "ما هي أنواع التفاعلات الكيميائية الرئيسية؟",
        expectedConcepts: ["أكسدة", "اختزال", "حمض", "قاعدة", "تفاعل", "كيميائية"],
        difficulty: "advanced",
        questionType: "definition"
      }
    ];
  }

  private getAllQuestions(): CurriculumQuestion[] {
    return [
      ...this.getGrade1Questions(),
      ...this.getGrade2Questions(), 
      ...this.getGrade4Questions(),
      ...this.getGrade6Questions(),
      ...this.getGrade8Questions(),
      ...this.getGrade10Questions(),
      ...this.getGrade11Questions(),
      ...this.getGrade12Questions()
    ];
  }

  private async testQuestion(question: CurriculumQuestion): Promise<TestResult> {
    const startTime = Date.now();
    
    console.log(`\n🔍 Testing Grade ${question.grade} - ${question.subject}`);
    console.log(`📚 Chapter: ${question.chapter || 'General'}`);
    console.log(`❓ Question: ${question.questionAR}`);
    console.log(`🎯 Difficulty: ${question.difficulty} | Type: ${question.questionType}`);
    
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: question.questionAR }]
        })
      });

      const responseTime = Date.now() - startTime;
      
      if (!response.ok) {
        return this.createFailedResult(question, `HTTP ${response.status}`, responseTime);
      }

      const responseText = await response.text();
      
      // Analyze response quality
      const foundConcepts = this.findConcepts(responseText, question.expectedConcepts);
      const conceptScore = foundConcepts.length / question.expectedConcepts.length;
      const qualityScore = this.assessResponseQuality(responseText, question);
      
      const passed = conceptScore >= 0.3 && qualityScore >= 0.5;
      
      console.log(`⏱️  Response time: ${responseTime}ms`);
      console.log(`📝 Response: ${responseText.substring(0, 150)}...`);
      console.log(`🎯 Found concepts: ${foundConcepts.join(', ')}`);
      console.log(`⭐ Concept score: ${(conceptScore * 100).toFixed(1)}%`);
      console.log(`🏆 Quality score: ${(qualityScore * 100).toFixed(1)}%`);
      console.log(`${passed ? '✅ PASSED' : '❌ FAILED'}`);

      return {
        question,
        response: responseText,
        responseTime,
        foundConcepts,
        conceptScore,
        qualityScore,
        passed,
        feedback: this.generateFeedback(conceptScore, qualityScore, foundConcepts, question)
      };

    } catch (error) {
      return this.createFailedResult(question, `Error: ${error}`, Date.now() - startTime);
    }
  }

  private findConcepts(text: string, expectedConcepts: string[]): string[] {
    const lowerText = text.toLowerCase();
    return expectedConcepts.filter(concept => 
      lowerText.includes(concept.toLowerCase()) ||
      lowerText.includes(this.arabicNormalize(concept))
    );
  }

  private arabicNormalize(text: string): string {
    // Handle Arabic text variations (تشكيل removal, etc.)
    return text
      .replace(/[ًٌٍَُِْ]/g, '') // Remove diacritics
      .replace(/[أإآ]/g, 'ا') // Normalize alef
      .replace(/[ؤئ]/g, 'ء') // Normalize hamza
      .toLowerCase();
  }

  private assessResponseQuality(response: string, question: CurriculumQuestion): number {
    let score = 0.5; // Base score
    
    // Length appropriateness
    if (response.length > 50 && response.length < 1000) score += 0.1;
    
    // Contains Arabic text for Arabic questions
    if (question.questionAR && /[\u0600-\u06FF]/.test(response)) score += 0.1;
    
    // Educational tone indicators
    const educationalPhrases = ['يمكن', 'هذا', 'هي', 'هو', 'مثل', 'أو', 'كما'];
    const foundPhrases = educationalPhrases.filter(phrase => response.includes(phrase));
    score += (foundPhrases.length / educationalPhrases.length) * 0.2;
    
    // Question type specific assessment
    switch (question.questionType) {
      case 'definition':
        if (response.includes('هو') || response.includes('هي')) score += 0.1;
        break;
      case 'explanation': 
        if (response.includes('لأن') || response.includes('بسبب')) score += 0.1;
        break;
      case 'problem_solving':
        if (/\d/.test(response)) score += 0.1; // Contains numbers
        break;
    }
    
    return Math.min(score, 1.0);
  }

  private generateFeedback(conceptScore: number, qualityScore: number, foundConcepts: string[], question: CurriculumQuestion): string {
    const missing = question.expectedConcepts.filter(c => !foundConcepts.includes(c));
    
    let feedback = '';
    if (conceptScore < 0.3) {
      feedback += `Missing key concepts: ${missing.join(', ')}. `;
    }
    if (qualityScore < 0.5) {
      feedback += 'Response quality could be improved. ';
    }
    if (conceptScore >= 0.7 && qualityScore >= 0.8) {
      feedback += 'Excellent comprehensive response! ';
    }
    
    return feedback || 'Good response overall.';
  }

  private createFailedResult(question: CurriculumQuestion, error: string, responseTime: number): TestResult {
    console.log(`❌ ${error}`);
    return {
      question,
      response: '',
      responseTime,
      foundConcepts: [],
      conceptScore: 0,
      qualityScore: 0,
      passed: false,
      feedback: error
    };
  }

  private async generateDetailedReport(): Promise<void> {
    const total = this.results.length;
    const passed = this.results.filter(r => r.passed).length;
    const passRate = (passed / total) * 100;

    console.log('\n📊 COMPREHENSIVE CURRICULUM TEST REPORT');
    console.log('=' .repeat(60));
    console.log(`📈 Overall Results: ${passed}/${total} (${passRate.toFixed(1)}%)`);
    
    // Grade-level analysis
    const gradeStats = new Map();
    this.results.forEach(r => {
      const grade = r.question.grade;
      const current = gradeStats.get(grade) || { passed: 0, total: 0, avgConcept: 0, avgQuality: 0 };
      current.total++;
      current.avgConcept += r.conceptScore;
      current.avgQuality += r.qualityScore;
      if (r.passed) current.passed++;
      gradeStats.set(grade, current);
    });

    console.log('\n📚 Performance by Grade:');
    Array.from(gradeStats.entries()).sort().forEach(([grade, stats]) => {
      const passRate = (stats.passed / stats.total * 100).toFixed(1);
      const avgConcept = (stats.avgConcept / stats.total * 100).toFixed(1);
      const avgQuality = (stats.avgQuality / stats.total * 100).toFixed(1);
      console.log(`Grade ${grade}: ${stats.passed}/${stats.total} (${passRate}%) | Concepts: ${avgConcept}% | Quality: ${avgQuality}%`);
    });

    // Subject analysis
    const subjectStats = new Map();
    this.results.forEach(r => {
      const subject = r.question.subject;
      const current = subjectStats.get(subject) || { passed: 0, total: 0, avgScore: 0 };
      current.total++;
      current.avgScore += (r.conceptScore + r.qualityScore) / 2;
      if (r.passed) current.passed++;
      subjectStats.set(subject, current);
    });

    console.log('\n🎓 Performance by Subject:');
    Array.from(subjectStats.entries()).forEach(([subject, stats]) => {
      const passRate = (stats.passed / stats.total * 100).toFixed(1);
      const avgScore = (stats.avgScore / stats.total * 100).toFixed(1);
      console.log(`${subject}: ${stats.passed}/${stats.total} (${passRate}%) | Avg Score: ${avgScore}%`);
    });

    // Difficulty analysis
    const difficultyStats = new Map();
    this.results.forEach(r => {
      const diff = r.question.difficulty;
      const current = difficultyStats.get(diff) || { passed: 0, total: 0 };
      current.total++;
      if (r.passed) current.passed++;
      difficultyStats.set(diff, current);
    });

    console.log('\n⚡ Performance by Difficulty:');
    ['basic', 'intermediate', 'advanced'].forEach(diff => {
      const stats = difficultyStats.get(diff);
      if (stats) {
        const passRate = (stats.passed / stats.total * 100).toFixed(1);
        console.log(`${diff}: ${stats.passed}/${stats.total} (${passRate}%)`);
      }
    });

    // Failed questions analysis
    const failed = this.results.filter(r => !r.passed);
    if (failed.length > 0) {
      console.log('\n❌ Failed Questions Analysis:');
      failed.forEach(r => {
        console.log(`- Grade ${r.question.grade} ${r.question.subject}: ${r.feedback}`);
      });
    }

    // Top performers
    const top5 = this.results
      .sort((a, b) => (b.conceptScore + b.qualityScore) - (a.conceptScore + a.qualityScore))
      .slice(0, 5);
    
    console.log('\n🏆 Top 5 Best Responses:');
    top5.forEach((r, i) => {
      const totalScore = ((r.conceptScore + r.qualityScore) / 2 * 100).toFixed(1);
      console.log(`${i+1}. Grade ${r.question.grade} ${r.question.subject} - ${totalScore}%`);
    });

    // Save detailed results
    const reportData = {
      timestamp: new Date().toISOString(),
      summary: { total, passed, passRate },
      gradeStats: Object.fromEntries(gradeStats),
      subjectStats: Object.fromEntries(subjectStats),
      difficultyStats: Object.fromEntries(difficultyStats),
      detailedResults: this.results
    };

    await fs.writeFile(
      `/Users/stanhus/Documents/work/incept_service-ragbot/curriculum_test_${Date.now()}.json`,
      JSON.stringify(reportData, null, 2)
    );

    console.log('\n💾 Detailed results saved to curriculum_test_[timestamp].json');
  }

  async runComprehensiveTest(): Promise<void> {
    const questions = this.getAllQuestions();
    
    console.log('🚀 Starting Comprehensive Curriculum Testing');
    console.log(`📋 Testing ${questions.length} questions across grades 1-12`);
    console.log('=' .repeat(60));

    for (const question of questions) {
      const result = await this.testQuestion(question);
      this.results.push(result);
      
      // Brief delay between questions
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    await this.generateDetailedReport();
  }

  async runContinuousTest(iterations: number = 3): Promise<void> {
    console.log(`🔄 Starting ${iterations} iterations of comprehensive testing`);
    
    for (let i = 1; i <= iterations; i++) {
      console.log(`\n🔄 Starting iteration ${i}/${iterations}`);
      this.results = []; // Reset for each iteration
      await this.runComprehensiveTest();
      
      if (i < iterations) {
        console.log('\n⏸️  Waiting 30 seconds before next iteration...');
        await new Promise(resolve => setTimeout(resolve, 30000));
      }
    }
    
    console.log(`\n✅ Completed ${iterations} testing iterations!`);
  }
}

// Run the comprehensive testing
async function main() {
  const tester = new CurriculumTester();
  
  try {
    // Run comprehensive test
    await tester.runComprehensiveTest();
    
  } catch (error) {
    console.error('Testing failed:', error);
  }
}

main().catch(console.error);
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

interface TestQuestion {
  grade: number;
  subject: string;
  question: string;
  keywords: string[];
  expectedSubjects: string[];
}

const testQuestions: TestQuestion[] = [
  {
    grade: 1,
    subject: "اللغة العربية",
    question: "ما هي الحروف الأبجدية العربية؟",
    keywords: ["حروف", "أبجدية", "ألف", "باء", "تاء", "ثاء"],
    expectedSubjects: ["arabic", "language", "letters"]
  },
  {
    grade: 1,
    subject: "الرياضيات",
    question: "كيف نعد الأرقام من 1 إلى 10؟",
    keywords: ["أرقام", "عد", "واحد", "اثنان", "ثلاثة", "أربعة"],
    expectedSubjects: ["math", "numbers", "counting"]
  },
  {
    grade: 2,
    subject: "التربية الإسلامية",
    question: "ما هي أركان الإسلام؟",
    keywords: ["أركان", "الإسلام", "شهادة", "صلاة", "زكاة", "صوم", "حج"],
    expectedSubjects: ["islamic", "religion", "pillars"]
  },
  {
    grade: 5,
    subject: "الدراسات الاجتماعية",
    question: "ما هي دول الخليج العربي؟",
    keywords: ["الكويت", "السعودية", "الإمارات", "قطر", "البحرين", "عمان", "خليج"],
    expectedSubjects: ["social", "geography", "gulf", "countries"]
  },
  {
    grade: 10,
    subject: "اللغة الإنجليزية",
    question: "What are the basic tenses in English?",
    keywords: ["present", "past", "future", "tense", "grammar", "english"],
    expectedSubjects: ["english", "grammar", "language"]
  },
  {
    grade: 8,
    subject: "العلوم",
    question: "ما هي أجزاء الخلية؟",
    keywords: ["خلية", "نواة", "سيتوبلازم", "غشاء", "علوم"],
    expectedSubjects: ["science", "biology", "cell"]
  }
];

async function testContentAvailability() {
  console.log('🔍 Testing curriculum content availability in database...');
  console.log('=' .repeat(60));
  
  const client = new MongoClient(process.env.MONGODB_URI!);
  
  try {
    await client.connect();
    const db = client.db('chatter');
    const dataCollection = db.collection('training_data');
    
    const totalDocs = await dataCollection.countDocuments();
    console.log(`📚 Total chunks available: ${totalDocs}\n`);
    
    let foundContent = 0;
    let totalTests = 0;
    
    for (const test of testQuestions) {
      console.log(`🎓 Grade ${test.grade} - ${test.subject}`);
      console.log(`❓ Testing: ${test.question}`);
      
      let keywordMatches = 0;
      let relevantChunks = 0;
      
      // Test each keyword
      for (const keyword of test.keywords) {
        totalTests++;
        
        const chunks = await dataCollection.find({
          text: { $regex: keyword, $options: 'i' }
        }).limit(5).toArray();
        
        if (chunks.length > 0) {
          keywordMatches++;
          relevantChunks += chunks.length;
          foundContent++;
          
          console.log(`  ✅ "${keyword}": Found ${chunks.length} chunks`);
          
          // Show a sample of found content
          if (chunks[0] && chunks[0].text) {
            const preview = chunks[0].text.substring(0, 100).replace(/\n/g, ' ');
            console.log(`     Sample: "${preview}..."`);
            console.log(`     Source: ${chunks[0].source || 'unknown'}`);
          }
        } else {
          console.log(`  ❌ "${keyword}": No content found`);
        }
      }
      
      const successRate = (keywordMatches / test.keywords.length) * 100;
      console.log(`  📊 Coverage: ${keywordMatches}/${test.keywords.length} keywords (${successRate.toFixed(1)}%)`);
      console.log(`  📝 Total relevant chunks: ${relevantChunks}`);
      
      if (successRate >= 50) {
        console.log('  🎯 GOOD coverage for this topic');
      } else if (successRate >= 25) {
        console.log('  ⚠️  PARTIAL coverage for this topic');
      } else {
        console.log('  🔴 LOW coverage for this topic');
      }
      
      console.log('');
    }
    
    const overallSuccess = (foundContent / totalTests) * 100;
    
    console.log('\n📈 SUMMARY RESULTS');
    console.log('=' .repeat(40));
    console.log(`Total keyword searches: ${totalTests}`);
    console.log(`Successful matches: ${foundContent}`);
    console.log(`Overall coverage: ${overallSuccess.toFixed(1)}%`);
    
    if (overallSuccess >= 70) {
      console.log('🎉 EXCELLENT - Strong curriculum coverage!');
    } else if (overallSuccess >= 50) {
      console.log('👍 GOOD - Decent curriculum coverage');
    } else if (overallSuccess >= 30) {
      console.log('⚠️  FAIR - Needs more content');
    } else {
      console.log('🔴 POOR - Insufficient curriculum coverage');
    }
    
    // Test subject-specific content availability
    console.log('\n📚 Subject-based content analysis:');
    const subjectKeywords = {
      'Arabic Language': ['حروف', 'كلمة', 'جملة', 'نحو', 'صرف', 'أدب'],
      'Mathematics': ['رياضيات', 'جمع', 'طرح', 'ضرب', 'قسمة', 'هندسة'],
      'Science': ['علوم', 'تجربة', 'نبات', 'حيوان', 'خلية', 'ذرة'],
      'Islamic Studies': ['إسلام', 'قرآن', 'حديث', 'صلاة', 'زكاة', 'حج'],
      'English': ['english', 'grammar', 'vocabulary', 'reading', 'writing']
    };
    
    for (const [subject, keywords] of Object.entries(subjectKeywords)) {
      let subjectTotal = 0;
      for (const keyword of keywords) {
        const count = await dataCollection.countDocuments({
          text: { $regex: keyword, $options: 'i' }
        });
        subjectTotal += count;
      }
      console.log(`${subject}: ${subjectTotal} total chunks`);
    }
    
  } catch (error) {
    console.error('❌ Content test failed:', error);
  } finally {
    await client.close();
  }
}

testContentAvailability().catch(console.error);
import fetch from 'node-fetch';

interface TestQuestion {
  grade: number;
  subject: string;
  question: string;
  expectedKeywords: string[];
}

const testQuestions: TestQuestion[] = [
  // Elementary Tests
  {
    grade: 1,
    subject: "اللغة العربية",
    question: "ما هي الحروف الأبجدية العربية الأولى؟",
    expectedKeywords: ["ألف", "باء", "تاء", "حروف", "أبجدية"]
  },
  {
    grade: 2,
    subject: "الرياضيات", 
    question: "كيف نجمع الأرقام؟",
    expectedKeywords: ["جمع", "أرقام", "حساب", "رياضيات"]
  },
  {
    grade: 3,
    subject: "العلوم",
    question: "ما هي أجزاء النبات؟",
    expectedKeywords: ["نبات", "جذور", "ساق", "أوراق", "زهرة"]
  },
  
  // Middle School Tests
  {
    grade: 7,
    subject: "الأحياء",
    question: "ما هي أجزاء الخلية؟",
    expectedKeywords: ["خلية", "نواة", "سيتوبلازم", "غشاء"]
  },
  {
    grade: 8,
    subject: "الفيزياء",
    question: "ما هو قانون نيوتن؟",
    expectedKeywords: ["نيوتن", "قوة", "حركة", "قانون"]
  },
  {
    grade: 9,
    subject: "الكيمياء",
    question: "ما هي العناصر الكيميائية؟",
    expectedKeywords: ["عناصر", "ذرة", "جدول", "هيدروجين", "أكسجين"]
  },

  // High School Tests  
  {
    grade: 10,
    subject: "التربية الإسلامية",
    question: "ما هي أركان الإسلام؟",
    expectedKeywords: ["شهادة", "صلاة", "زكاة", "صوم", "حج"]
  },
  {
    grade: 11,
    subject: "التاريخ الإسلامي",
    question: "من هم الخلفاء الراشدون؟",
    expectedKeywords: ["أبو بكر", "عمر", "عثمان", "علي", "خلفاء"]
  },
  {
    grade: 12,
    subject: "الجغرافيا",
    question: "ما هي دول الخليج العربي؟",
    expectedKeywords: ["الكويت", "السعودية", "الإمارات", "قطر", "البحرين", "عمان"]
  },

  // Specialized Subjects
  {
    grade: 6,
    subject: "القرآن الكريم",
    question: "ما هي سورة الفاتحة؟",
    expectedKeywords: ["فاتحة", "الحمد", "رب العالمين", "قرآن"]
  }
];

async function testRAGQuestion(question: TestQuestion): Promise<void> {
  console.log(`\n🔍 Testing Grade ${question.grade} - ${question.subject}`);
  console.log(`❓ Question: ${question.question}`);
  
  try {
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: question.question
          }
        ]
      })
    });

    if (!response.ok) {
      console.log(`❌ HTTP Error: ${response.status}`);
      return;
    }

    const responseText = await response.text();
    console.log(`📝 Response: ${responseText.substring(0, 200)}...`);
    
    // Check for expected keywords
    const foundKeywords = question.expectedKeywords.filter(keyword => 
      responseText.toLowerCase().includes(keyword.toLowerCase())
    );
    
    const score = (foundKeywords.length / question.expectedKeywords.length) * 100;
    
    console.log(`🎯 Found keywords: ${foundKeywords.join(', ')}`);
    console.log(`⭐ Score: ${score.toFixed(1)}% (${foundKeywords.length}/${question.expectedKeywords.length})`);
    
    if (score >= 30) {
      console.log('✅ PASSED');
    } else {
      console.log('❌ FAILED - Low keyword match');
    }

  } catch (error) {
    console.log(`❌ Error: ${error}`);
  }
}

async function runRAGTests(): Promise<void> {
  console.log('🚀 Starting Simple RAG Tests');
  console.log('=' .repeat(50));
  
  for (const question of testQuestions) {
    await testRAGQuestion(question);
    
    // Add delay between requests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('\n✅ RAG Testing Complete!');
}

runRAGTests().catch(console.error);
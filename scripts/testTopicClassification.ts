import { classifyTopic } from '@/utils/topicClassifier';
import { selectPrompt } from '@/utils/prompts';

function testTopicClassification() {
  console.log('🎯 Topic Classification Test');
  console.log('=' .repeat(50));
  
  const testQueries = [
    'ما هي قواعد القسمة؟', // Mathematics in Arabic
    'What is Newton\'s first law of motion?', // Physics in English
    'كيف نحسب مساحة المثلث؟', // Mathematics in Arabic 
    'Explain photosynthesis process', // Biology in English
    'What is the periodic table?', // Chemistry in English
    'قراءة النصوص العربية', // Language in Arabic
    'UAE history and culture', // Social Studies in English
    'أحكام الصلاة', // Islamic Education in Arabic
    'General question about studying' // General
  ];
  
  testQueries.forEach((query, index) => {
    console.log(`\n📝 Test ${index + 1}: "${query}"`);
    
    const classification = classifyTopic(query);
    const selectedPrompt = selectPrompt(classification.type);
    
    console.log(`   🏷️ Type: ${classification.type}`);
    console.log(`   📊 Confidence: ${Math.round(classification.confidence * 100)}%`);
    console.log(`   🔍 Keywords: ${classification.keywords.join(', ') || 'none'}`);
    console.log(`   📋 Prompt: ${selectedPrompt.includes('MATHEMATICS') ? 'Mathematics Specialized' : 
                                selectedPrompt.includes('PHYSICS') ? 'Physics Specialized' : 
                                'General Educational'}`);
  });
  
  console.log(`\n✅ Topic Classification Test Complete`);
  console.log(`📈 Tested ${testQueries.length} different question types`);
  console.log(`🎯 Classification system operational`);
}

testTopicClassification();
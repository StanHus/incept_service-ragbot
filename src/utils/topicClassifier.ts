// Topic classifier to determine question type and select appropriate prompt
export interface TopicClassification {
  type: 'mathematics' | 'physics' | 'chemistry' | 'biology' | 'language' | 'social_studies' | 'islamic_education' | 'general';
  confidence: number;
  keywords: string[];
}

export function classifyTopic(question: string): TopicClassification {
  const lowerQuestion = question.toLowerCase();
  
  // Mathematics keywords (Arabic and English)
  const mathKeywords = [
    // Arabic math terms
    'رياضيات', 'حساب', 'جمع', 'طرح', 'ضرب', 'قسمة', 'كسور', 'هندسة', 'مساحة', 'محيط', 'حجم',
    'معادلة', 'جبر', 'إحصاء', 'احتمال', 'رقم', 'عدد', 'مثلث', 'مربع', 'مستطيل', 'دائرة',
    'قواعد الضرب', 'قواعد القسمة', 'قواعد الجمع', 'جدول الضرب', 'العمليات الحسابية',
    
    // English math terms
    'mathematics', 'math', 'calculate', 'addition', 'subtraction', 'multiplication', 'division',
    'fractions', 'geometry', 'area', 'perimeter', 'volume', 'equation', 'algebra', 'statistics',
    'probability', 'number', 'triangle', 'square', 'rectangle', 'circle', 'formula'
  ];
  
  // Physics keywords (Arabic and English)
  const physicsKeywords = [
    // Arabic physics terms
    'فيزياء', 'قانون نيوتن', 'الحركة', 'السرعة', 'التسارع', 'القوة', 'الطاقة', 'الضوء', 'الصوت',
    'الكهرباء', 'المغناطيس', 'الموجات', 'الجاذبية', 'الضغط', 'الحرارة', 'الكتلة', 'الوزن',
    'الاحتكاك', 'المقاومة', 'التيار', 'الجهد', 'القدرة', 'العزم', 'الزمن', 'المسافة',
    
    // English physics terms
    'physics', 'newton', 'motion', 'velocity', 'acceleration', 'force', 'energy', 'light', 'sound',
    'electricity', 'magnetism', 'waves', 'gravity', 'pressure', 'heat', 'mass', 'weight',
    'friction', 'resistance', 'current', 'voltage', 'power', 'torque', 'time', 'distance'
  ];
  
  // Chemistry keywords (Arabic and English)
  const chemistryKeywords = [
    // Arabic chemistry terms
    'كيمياء', 'العناصر', 'المركبات', 'التفاعل الكيميائي', 'الذرة', 'الجزيء', 'الأيون',
    'الجدول الدوري', 'الأحماض', 'القواعد', 'الأملاح', 'الأكسدة', 'الاختزال', 'المحلول',
    'التركيز', 'المولارية', 'الرقم الهيدروجيني', 'التفاعل', 'المعادلة الكيميائية',
    
    // English chemistry terms
    'chemistry', 'elements', 'compounds', 'chemical reaction', 'atom', 'molecule', 'ion',
    'periodic table', 'acids', 'bases', 'salts', 'oxidation', 'reduction', 'solution',
    'concentration', 'molarity', 'ph', 'reaction', 'chemical equation'
  ];
  
  // Biology keywords (Arabic and English)
  const biologyKeywords = [
    // Arabic biology terms
    'أحياء', 'النبات', 'الحيوان', 'الخلية', 'التمثيل الضوئي', 'التنفس', 'الهضم', 'الدورة الدموية',
    'الجهاز العصبي', 'الوراثة', 'الحمض النووي', 'البروتين', 'الكروموسومات', 'التطور',
    'البيئة', 'النظام البيئي', 'التلوث', 'التنوع الحيوي', 'التكاثر', 'النمو',
    
    // English biology terms
    'biology', 'plant', 'animal', 'cell', 'photosynthesis', 'respiration', 'digestion', 'circulation',
    'nervous system', 'genetics', 'dna', 'protein', 'chromosomes', 'evolution',
    'environment', 'ecosystem', 'pollution', 'biodiversity', 'reproduction', 'growth'
  ];
  
  // Language keywords (Arabic and English)
  const languageKeywords = [
    // Arabic language terms
    'لغة', 'عربية', 'إنجليزية', 'قراءة', 'كتابة', 'نحو', 'صرف', 'بلاغة', 'شعر', 'نثر',
    'قصة', 'رواية', 'مفردات', 'تعبير', 'إملاء',
    
    // English language terms
    'language', 'english', 'arabic', 'reading', 'writing', 'grammar', 'vocabulary', 'story',
    'poem', 'literature', 'composition', 'spelling'
  ];
  
  // Islamic Education keywords
  const islamicKeywords = [
    'إسلام', 'دين', 'قرآن', 'حديث', 'صلاة', 'صيام', 'زكاة', 'حج', 'وضوء', 'أركان الإسلام',
    'إيمان', 'عبادة', 'أخلاق', 'سيرة', 'فقه', 'تفسير'
  ];
  
  // Social Studies keywords
  const socialKeywords = [
    'تاريخ', 'جغرافيا', 'مجتمع', 'ثقافة', 'حضارة', 'دولة', 'حكومة', 'اقتصاد', 'سياسة',
    'الإمارات', 'العالم العربي', 'تراث', 'عادات'
  ];
  
  // Count matches for each category
  const mathMatches = mathKeywords.filter(keyword => lowerQuestion.includes(keyword));
  const physicsMatches = physicsKeywords.filter(keyword => lowerQuestion.includes(keyword));
  const chemistryMatches = chemistryKeywords.filter(keyword => lowerQuestion.includes(keyword));
  const biologyMatches = biologyKeywords.filter(keyword => lowerQuestion.includes(keyword));
  const languageMatches = languageKeywords.filter(keyword => lowerQuestion.includes(keyword));
  const islamicMatches = islamicKeywords.filter(keyword => lowerQuestion.includes(keyword));
  const socialMatches = socialKeywords.filter(keyword => lowerQuestion.includes(keyword));
  
  // Determine the category with highest matches
  const categories = [
    { type: 'mathematics' as const, matches: mathMatches, score: mathMatches.length },
    { type: 'physics' as const, matches: physicsMatches, score: physicsMatches.length },
    { type: 'chemistry' as const, matches: chemistryMatches, score: chemistryMatches.length },
    { type: 'biology' as const, matches: biologyMatches, score: biologyMatches.length },
    { type: 'language' as const, matches: languageMatches, score: languageMatches.length },
    { type: 'islamic_education' as const, matches: islamicMatches, score: islamicMatches.length },
    { type: 'social_studies' as const, matches: socialMatches, score: socialMatches.length }
  ];
  
  // Find category with highest score
  const topCategory = categories.reduce((prev, current) => 
    current.score > prev.score ? current : prev
  );
  
  // If no clear category, classify as general
  if (topCategory.score === 0) {
    return {
      type: 'general',
      confidence: 0.5,
      keywords: []
    };
  }
  
  // Calculate confidence based on keyword density
  const wordCount = question.split(/\s+/).length;
  const confidence = Math.min(0.9, 0.5 + (topCategory.score / wordCount));
  
  return {
    type: topCategory.type,
    confidence,
    keywords: topCategory.matches
  };
}
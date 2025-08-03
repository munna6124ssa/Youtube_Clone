const { Translate } = require('@google-cloud/translate').v2;

// Initialize Google Translate client
let translate;
try {
  if (process.env.GOOGLE_TRANSLATE_API_KEY) {
    translate = new Translate({
      key: process.env.GOOGLE_TRANSLATE_API_KEY,
      projectId: 'youtube-clone' // You can change this to your project ID
    });
    console.log('✅ Google Translate API initialized');
  } else {
    console.warn('⚠️ Google Translate API key not found');
  }
} catch (error) {
  console.error('❌ Failed to initialize Google Translate:', error.message);
}

// Detect language of text
const detectLanguage = async (text) => {
  try {
    if (!translate) {
      throw new Error('Google Translate not initialized');
    }

    const [detection] = await translate.detect(text);
    return {
      language: detection.language,
      confidence: detection.confidence
    };
  } catch (error) {
    console.error('Language detection error:', error.message);
    return { language: 'en', confidence: 0 };
  }
};

// Translate text to target language
const translateText = async (text, targetLanguage, sourceLanguage = null) => {
  try {
    if (!translate) {
      throw new Error('Google Translate not initialized');
    }

    const options = {
      to: targetLanguage
    };

    if (sourceLanguage) {
      options.from = sourceLanguage;
    }

    const [translation] = await translate.translate(text, options);
    return {
      translatedText: translation,
      originalText: text,
      sourceLanguage: sourceLanguage,
      targetLanguage: targetLanguage
    };
  } catch (error) {
    console.error('Translation error:', error.message);
    throw error;
  }
};

// Get supported languages
const getSupportedLanguages = async () => {
  try {
    if (!translate) {
      return getDefaultLanguages();
    }

    const [languages] = await translate.getLanguages();
    return languages.map(lang => ({
      code: lang.code,
      name: lang.name
    }));
  } catch (error) {
    console.error('Get languages error:', error.message);
    return getDefaultLanguages();
  }
};

// Default languages if API fails
const getDefaultLanguages = () => {
  return [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'Hindi' },
    { code: 'ta', name: 'Tamil' },
    { code: 'te', name: 'Telugu' },
    { code: 'kn', name: 'Kannada' },
    { code: 'ml', name: 'Malayalam' },
    { code: 'bn', name: 'Bengali' },
    { code: 'gu', name: 'Gujarati' },
    { code: 'mr', name: 'Marathi' },
    { code: 'pa', name: 'Punjabi' },
    { code: 'ur', name: 'Urdu' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'zh', name: 'Chinese' },
    { code: 'ar', name: 'Arabic' },
    { code: 'ru', name: 'Russian' },
    { code: 'pt', name: 'Portuguese' }
  ];
};

module.exports = {
  detectLanguage,
  translateText,
  getSupportedLanguages,
  isAvailable: !!translate
};
